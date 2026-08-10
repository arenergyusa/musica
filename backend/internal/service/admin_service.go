package service

import (
	"context"
	"errors"
	"fmt"
	"log"
	"math"
	"strings"
	"time"

	"github.com/arenergyusa/musica/backend/internal/domain"
	"github.com/arenergyusa/musica/backend/internal/repository"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type AdminService interface {
	ActivateInvestment(ctx context.Context, invID uuid.UUID) error
	ConfirmDeposit(ctx context.Context, userID, invID uuid.UUID, txHash string) error
	ChangeInvestmentStatus(ctx context.Context, invID uuid.UUID, status string) error
	GetInvestments(ctx context.Context, limit, offset int, status, search string) ([]*domain.Sponsorship, error)
	GetMasterWalletBalance(ctx context.Context) (*MasterWalletBalance, error)
	ApproveWithdrawal(ctx context.Context, wdID uuid.UUID, adminNote string) error
	RejectWithdrawal(ctx context.Context, wdID uuid.UUID, adminNote string) error
	BlockUser(ctx context.Context, userID uuid.UUID) error
	UnblockUser(ctx context.Context, userID uuid.UUID) error
	ChangeUserRole(ctx context.Context, userID uuid.UUID, role string) error
	GetDashboardStats(ctx context.Context) (map[string]interface{}, error)
	GetUsers(ctx context.Context, limit, offset int, search, status string) ([]*domain.User, error)
	GetAllWithdrawals(ctx context.Context, limit, offset int) ([]*domain.Withdrawal, error)
	GetSettings(ctx context.Context) (*domain.PlatformSettings, error)
	UpdateSettings(ctx context.Context, settings *domain.PlatformSettings) error
	GetUserSummary(ctx context.Context, userID uuid.UUID) (map[string]interface{}, error)
	GetAnalytics(ctx context.Context) (map[string]interface{}, error)
	CreateManualInvestment(ctx context.Context, email string, amount float64) (*domain.Sponsorship, error)
	GetAllTransactions(ctx context.Context, limit, offset int, userID *uuid.UUID, source, txType string) ([]*TransactionWithUser, error)
	GetSalaryQualifications(ctx context.Context, limit, offset int) ([]*SalaryQualificationView, error)
	GetSalaryPayoutLogs(ctx context.Context, limit, offset int) ([]*SalaryPayoutLogView, error)
	GetAuditLogs(ctx context.Context, limit, offset int) ([]*domain.TransactionAuditLog, error)
}

type adminService struct {
	dbPool       *pgxpool.Pool
	invRepo      repository.InvestmentRepository
	wdRepo       repository.WithdrawalRepository
	userRepo     repository.UserRepository
	walletRepo   repository.WalletRepository
	settingsRepo repository.SettingsRepository
	mlmRepo      repository.MLMRepository
	usdtService  USDTService
}

func NewAdminService(dbPool *pgxpool.Pool, invRepo repository.InvestmentRepository, wdRepo repository.WithdrawalRepository, userRepo repository.UserRepository, walletRepo repository.WalletRepository, settingsRepo repository.SettingsRepository, mlmRepo repository.MLMRepository, usdtService USDTService) AdminService {
	return &adminService{
		dbPool:       dbPool,
		invRepo:      invRepo,
		wdRepo:       wdRepo,
		userRepo:     userRepo,
		walletRepo:   walletRepo,
		settingsRepo: settingsRepo,
		mlmRepo:      mlmRepo,
		usdtService:  usdtService,
	}
}

func (s *adminService) ChangeInvestmentStatus(ctx context.Context, invID uuid.UUID, status string) error {
	switch status {
	case "ACTIVE":
		return s.ActivateInvestment(ctx, invID)
	case "CLOSED":
		rows, err := s.invRepo.UpdateInvestmentStatusAtomic(ctx, invID, "PENDING", "CLOSED")
		if err != nil { return err }
		if rows != 1 { return errors.New("investment is not pending approval") }
		return nil
	default:
		return errors.New("invalid investment status")
	}
}

func (s *adminService) GetInvestments(ctx context.Context, limit, offset int, status, search string) ([]*domain.Sponsorship, error) {
	return s.invRepo.GetAllWithFilters(ctx, limit, offset, status, search)
}

func (s *adminService) GetMasterWalletBalance(ctx context.Context) (*MasterWalletBalance, error) {
	return s.usdtService.GetMasterWalletBalance(ctx)
}

// referralRewardPct is the one-time percentage paid to each upline level on investment activation.
var referralRewardPct = map[int]float64{
	1: 4.0, // L1 direct sponsor gets 4% of downline investment
	2: 1.0, // L2 gets 1%
	3: 1.0, // L3 gets 1%
}

// ActivateInvestment marks an investment ACTIVE and triggers one-time referral income (B3 fix).
func (s *adminService) ActivateInvestment(ctx context.Context, invID uuid.UUID) error {
	targetInv, err := s.invRepo.GetByID(ctx, invID)
	if err != nil {
		return err
	}
	if targetInv == nil {
		return errors.New("investment not found")
	}
	if targetInv.Status != "PENDING" {
		return errors.New("investment is not pending approval")
	}

	rows, err := s.invRepo.UpdateInvestmentStatusAtomic(ctx, invID, "PENDING", "ACTIVE")
	if err != nil {
		return err
	}
	if rows != 1 {
		return errors.New("investment is not pending approval")
	}

	s.recomputeWorkingCap(ctx, targetInv)
	return s.payReferralIncome(ctx, targetInv)
}

func (s *adminService) ConfirmDeposit(ctx context.Context, userID, invID uuid.UUID, txHash string) error {
	inv, err := s.invRepo.GetByID(ctx, invID)
	if err != nil { return err }
	if inv == nil || inv.UserID != userID { return errors.New("investment not found") }
	if inv.Status != "PENDING" { return errors.New("investment is not pending confirmation") }
	if err := s.usdtService.VerifyDeposit(ctx, userID, txHash, inv.Amount); err != nil { return err }
	rows, err := s.invRepo.ConfirmDepositAtomic(ctx, invID, userID, txHash)
	if err != nil { return err }
	if rows != 1 { return errors.New("investment was already confirmed") }
	inv.Status = "ACTIVE"
	s.recomputeWorkingCap(ctx, inv)
	return s.payReferralIncome(ctx, inv)
}

// recomputeWorkingCap re-evaluates the sponsorship owner's WORKING status now
// that the sponsorship is ACTIVE. At creation the owner's own PENDING
// sponsorship was invisible to HasActiveInvestment, so a user who already
// qualified as WORKING via their downline would have been locked into the
// non-working (lower) cap multiplier forever (M7). Once proven, the cap is
// upgraded to the working multiplier.
func (s *adminService) recomputeWorkingCap(ctx context.Context, inv *domain.Sponsorship) {
	if inv == nil {
		return
	}
	settings, err := s.settingsRepo.GetSettings(ctx)
	if err != nil {
		return
	}
	status, err := GetUserStatus(ctx, s.invRepo, s.mlmRepo, inv.UserID, settings)
	if err != nil {
		return
	}
	if status != UserStatusWorking {
		return
	}
	workingCap := inv.Amount * GetIncomeCap(true, settings)
	if workingCap <= inv.CapLimit {
		return
	}
	if _, err := s.invRepo.UpdateInvestmentCap(ctx, inv.ID, workingCap, true); err != nil {
		log.Printf("ADMIN: failed to upgrade cap for inv %s: %v", inv.ID, err)
	}
	inv.CapLimit = workingCap
	inv.WorkingCapAtCreation = true
}

// payReferralIncome distributes one-time invite bonuses when a sponsorship is activated.
// It fails closed (H5): if platform settings cannot be loaded, no bonus is paid and the
// error is returned to the caller instead of silently falling back to hardcoded rates.
func (s *adminService) payReferralIncome(ctx context.Context, inv *domain.Sponsorship) error {
	settings, err := s.settingsRepo.GetSettings(ctx)
	if err != nil {
		return errors.New("failed to load platform settings for invite reward")
	}

	// Fall back to platform defaults only when a percentage is unset (0), never
	// when the settings read itself failed.
	refPcts := map[int]float64{1: 4.0, 2: 1.0, 3: 1.0}
	if settings != nil {
		if settings.InviteRewardL1Pct > 0 {
			refPcts[1] = settings.InviteRewardL1Pct
		}
		if settings.InviteRewardL2Pct > 0 {
			refPcts[2] = settings.InviteRewardL2Pct
		}
		if settings.InviteRewardL3Pct > 0 {
			refPcts[3] = settings.InviteRewardL3Pct
		}
	}

	for level := 1; level <= 3; level++ {
		uplineID, err := s.mlmRepo.GetAncestorAtLevel(ctx, inv.UserID, level)
		if err != nil || uplineID == nil {
			continue // No ancestor at this level
		}

		// Check upline is active
		upline, err := s.userRepo.GetByID(ctx, *uplineID)
		if err != nil || upline == nil || upline.Status != "ACTIVE" {
			continue
		}

		pct, ok := refPcts[level]
		if !ok || pct <= 0 {
			continue
		}

		rewardAmt := math.Round(inv.Amount*(pct/100.0)*100) / 100
		if rewardAmt <= 0 {
			continue
		}

		// Perform invite cap reservation and wallet crediting inside a single DB transaction
		tx, err := s.dbPool.Begin(ctx)
		if err != nil {
			log.Printf("ADMIN: failed to begin transaction for invite reward distribution: %v", err)
			continue
		}

		// Idempotency key: retries cannot pay the same sponsor/level twice.
		var rewardLogID uuid.UUID
		err = tx.QueryRow(ctx, `
			INSERT INTO invite_reward_log (from_sponsorship_id, to_user_id, level, amount)
			VALUES ($1, $2, $3, $4)
			ON CONFLICT (from_sponsorship_id, to_user_id, level) DO NOTHING
			RETURNING id`, inv.ID, *uplineID, level, rewardAmt).Scan(&rewardLogID)
		if err != nil {
			if err == pgx.ErrNoRows { _ = tx.Rollback(ctx); continue }
			_ = tx.Rollback(ctx)
			continue
		}

		// Lock upline's active sponsorships for update inside transaction
		rows, err := tx.Query(ctx, `
			SELECT id, amount, daily_rate_pct, cap_limit, total_reward_earned, status, created_at, working_cap_at_creation 
			FROM sponsorships 
			WHERE user_id = $1 AND status = 'ACTIVE' 
			ORDER BY created_at ASC 
			FOR UPDATE
		`, *uplineID)
		if err != nil {
			tx.Rollback(ctx)
			continue
		}

		var activeInvs []*domain.Sponsorship
		for rows.Next() {
			var ai domain.Sponsorship
			if err := rows.Scan(&ai.ID, &ai.Amount, &ai.DailyRatePct, &ai.CapLimit, &ai.TotalRewardEarned, &ai.Status, &ai.CreatedAt, &ai.WorkingCapAtCreation); err == nil {
				activeInvs = append(activeInvs, &ai)
			}
		}
		rows.Close()

		if len(activeInvs) == 0 {
			tx.Rollback(ctx)
			continue
		}

		var availableCap float64
		for _, activeInv := range activeInvs {
			rem := activeInv.CapLimit - activeInv.TotalRewardEarned
			if rem > 0 {
				availableCap += rem
			}
		}
		if availableCap <= 0 {
			tx.Rollback(ctx)
			continue
		}

		boundedReward := rewardAmt
		if boundedReward > availableCap {
			boundedReward = math.Round(availableCap*100) / 100
		}
		if boundedReward <= 0 {
			tx.Rollback(ctx)
			continue
		}

		// 1. Reserve cap capacity in tx. ConsumeCapInTx keeps BOTH the tracker
		//    and sponsorship totals in sync, bounds at cap_limit, sets
		//    is_capped/capped_at and CLOSES the investment at the cap (previously
		//    only sponsorships was updated here, desyncing the tracker).
		remainingToDeduct := boundedReward
		txFailed := false
		for _, activeInv := range activeInvs {
			if remainingToDeduct <= 0 {
				break
			}
			available := activeInv.CapLimit - activeInv.TotalRewardEarned
			if available <= 0 {
				continue
			}
			deduct := remainingToDeduct
			if deduct > available {
				deduct = available
			}
			if err := repository.ConsumeCapInTx(ctx, tx, activeInv.ID, deduct); err != nil {
				txFailed = true
				break
			}
			remainingToDeduct -= deduct
		}

		if txFailed || remainingToDeduct > 0 {
			tx.Rollback(ctx)
			continue
		}

		// 2. Credit wallet and create transaction in tx
		desc := fmt.Sprintf("Level %d invite bonus of ₹%.0f", level, inv.Amount)
		cmdTag, err := tx.Exec(ctx, `UPDATE reward_wallet SET balance = balance + $1, total_credited = total_credited + $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2`, boundedReward, *uplineID)
		if err != nil || cmdTag.RowsAffected() != 1 {
			tx.Rollback(ctx)
			log.Printf("ADMIN: invite wallet update failed or wallet row missing for user %s (err: %v)", *uplineID, err)
			continue
		}

		_, err = tx.Exec(ctx, `INSERT INTO transactions (user_id, type, amount, source, reference_id, description) VALUES ($1, 'CREDIT', $2, 'INVITE', $3, $4)`, *uplineID, boundedReward, inv.ID.String(), desc)
		if err != nil {
			tx.Rollback(ctx)
			log.Printf("ADMIN: invite transaction insert failed: %v", err)
			continue
		}

		if err := tx.Commit(ctx); err != nil {
			log.Printf("ADMIN: invite transaction commit failed: %v", err)
			continue
		}
	}

	return nil
}

// applyIncomeToCap adds income to upline's oldest active investment for cap tracking.
func (s *adminService) applyIncomeToCap(ctx context.Context, userID uuid.UUID, amount float64) {
	activeInvs, err := s.invRepo.GetActiveInvestmentsByUserID(ctx, userID)
	if err != nil || len(activeInvs) == 0 {
		return
	}
	remaining := amount
	for _, inv := range activeInvs {
		if remaining <= 0 {
			break
		}
		available := inv.CapLimit - inv.TotalRewardEarned
		if available <= 0 {
			continue
		}
		toApply := remaining
		if toApply > available {
			toApply = available
		}
		if err := s.invRepo.UpdateCapTracker(ctx, inv.ID, toApply); err != nil {
			log.Printf("ADMIN ERROR: Failed to update cap tracker for inv %s (user %s): %v", inv.ID, userID, err)
		}
		remaining -= toApply
	}
}

func (s *adminService) ApproveWithdrawal(ctx context.Context, wdID uuid.UUID, adminNote string) error {
	// Status transition to PROCESSED
	return s.wdRepo.UpdateRequestStatus(ctx, wdID, "PROCESSED", adminNote)
}

func (s *adminService) RejectWithdrawal(ctx context.Context, wdID uuid.UUID, adminNote string) error {
	tx, err := s.dbPool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	var userID uuid.UUID
	var amountRequested float64
	var status string
	err = tx.QueryRow(ctx, "SELECT user_id, amount_requested, status FROM withdrawals WHERE id = $1 FOR UPDATE", wdID).Scan(&userID, &amountRequested, &status)
	if err != nil {
		return err
	}
	if status != "PENDING" {
		return errors.New("only pending withdrawals can be rejected")
	}

	// Update withdrawal status
	_, err = tx.Exec(ctx, "UPDATE withdrawals SET status = 'REJECTED', admin_note = $1, processed_at = CURRENT_TIMESTAMP WHERE id = $2", adminNote, wdID)
	if err != nil {
		return err
	}

	// Credit wallet
	walletQuery := `
		UPDATE reward_wallet 
		SET balance = balance + $1, total_credited = total_credited + $1, updated_at = CURRENT_TIMESTAMP
		WHERE user_id = $2
	`
	res, err := tx.Exec(ctx, walletQuery, amountRequested, userID)
	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		return errors.New("wallet not found")
	}

	txQuery := `
		INSERT INTO transactions (user_id, type, amount, source, reference_id, description)
		VALUES ($1, 'CREDIT', $2, 'WITHDRAWAL_REFUND', $3, $4)
	`
	desc := "Withdrawal rejected: " + adminNote
	_, err = tx.Exec(ctx, txQuery, userID, amountRequested, wdID.String(), desc)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func (s *adminService) BlockUser(ctx context.Context, userID uuid.UUID) error {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return err
	}
	if user == nil {
		return errors.New("user not found")
	}
	user.Status = "BLOCKED"
	return s.userRepo.Update(ctx, user)
}

func (s *adminService) UnblockUser(ctx context.Context, userID uuid.UUID) error {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return err
	}
	if user == nil {
		return errors.New("user not found")
	}
	if user.Status == "BLOCKED" {
		user.Status = "ACTIVE"
	}
	return s.userRepo.Update(ctx, user)
}

// ChangeUserRole promotes/demotes a user's role. Only "user", "admin" and
// "super_admin" are allowed; super_admin is a reserved escalation that the
// frontend hides unless the actor is already a super_admin.
func (s *adminService) ChangeUserRole(ctx context.Context, userID uuid.UUID, role string) error {
	switch role {
	case "user", "admin", "super_admin":
	default:
		return errors.New("invalid role")
	}
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return err
	}
	if user == nil {
		return errors.New("user not found")
	}
	user.Role = role
	return s.userRepo.Update(ctx, user)
}

// TransactionWithUser joins a wallet transaction with the owner's identity.
type TransactionWithUser struct {
	ID          uuid.UUID `json:"id"`
	UserID      uuid.UUID `json:"user_id"`
	UserName    string    `json:"user_name,omitempty"`
	UserEmail   string    `json:"user_email,omitempty"`
	Type        string    `json:"type"`
	Amount      float64   `json:"amount"`
	Source      string    `json:"source"`
	ReferenceID string    `json:"reference_id,omitempty"`
	Description string    `json:"description,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
}

func (s *adminService) GetAllTransactions(ctx context.Context, limit, offset int, userID *uuid.UUID, source, txType string) ([]*TransactionWithUser, error) {
	var userIDStr string
	if userID != nil {
		userIDStr = userID.String()
	}
	query := `
		SELECT t.id, t.user_id, COALESCE(u.name, ''), COALESCE(u.email, ''),
		       t.type, t.amount, t.source, COALESCE(t.reference_id, '')::text, COALESCE(t.description, ''), t.created_at
		FROM transactions t
		LEFT JOIN users u ON u.id = t.user_id
		WHERE ($1 = '' OR t.user_id = NULLIF($1, '')::uuid)
		  AND ($2 = '' OR t.source = $2)
		  AND ($3 = '' OR t.type = $3)
		ORDER BY t.created_at DESC
		LIMIT $4 OFFSET $5
	`
	rows, err := s.dbPool.Query(ctx, query, userIDStr, source, txType, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []*TransactionWithUser
	for rows.Next() {
		t := &TransactionWithUser{}
		if err := rows.Scan(&t.ID, &t.UserID, &t.UserName, &t.UserEmail, &t.Type, &t.Amount, &t.Source, &t.ReferenceID, &t.Description, &t.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, t)
	}
	return out, rows.Err()
}

// SalaryQualificationView joins a salary qualification with member identity.
type SalaryQualificationView struct {
	UserID         uuid.UUID  `json:"user_id"`
	UserName       string     `json:"user_name,omitempty"`
	UserEmail      string     `json:"user_email,omitempty"`
	Tier           int        `json:"tier"`
	LeftLegVolume  float64    `json:"left_leg_volume"`
	RightLegVolume float64    `json:"right_leg_volume"`
	TotalVolume    float64    `json:"total_volume"`
	Status         string     `json:"status"`
	LastPayoutAt   *time.Time `json:"last_payout_at,omitempty"`
	UpdatedAt      time.Time  `json:"updated_at"`
}

func (s *adminService) GetSalaryQualifications(ctx context.Context, limit, offset int) ([]*SalaryQualificationView, error) {
	query := `
		SELECT sq.user_id, COALESCE(u.name, ''), COALESCE(u.email, ''),
		       sq.tier, sq.left_leg_volume, sq.right_leg_volume, sq.total_volume,
		       sq.status, sq.last_payout_at, sq.updated_at
		FROM salary_qualifications sq
		LEFT JOIN users u ON u.id = sq.user_id
		ORDER BY sq.total_volume DESC
		LIMIT $1 OFFSET $2
	`
	rows, err := s.dbPool.Query(ctx, query, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []*SalaryQualificationView
	for rows.Next() {
		q := &SalaryQualificationView{}
		if err := rows.Scan(&q.UserID, &q.UserName, &q.UserEmail, &q.Tier, &q.LeftLegVolume, &q.RightLegVolume, &q.TotalVolume, &q.Status, &q.LastPayoutAt, &q.UpdatedAt); err != nil {
			return nil, err
		}
		out = append(out, q)
	}
	return out, rows.Err()
}

// SalaryPayoutLogView joins a salary payout log with member identity.
type SalaryPayoutLogView struct {
	UserID       uuid.UUID `json:"user_id"`
	UserName     string    `json:"user_name,omitempty"`
	UserEmail    string    `json:"user_email,omitempty"`
	Tier         int       `json:"tier"`
	AmountUSD    float64   `json:"amount_usd"`
	TotalVolume  float64   `json:"total_volume"`
	CycleMonth   string    `json:"cycle_month,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
}

func (s *adminService) GetSalaryPayoutLogs(ctx context.Context, limit, offset int) ([]*SalaryPayoutLogView, error) {
	query := `
		SELECT spl.user_id, COALESCE(u.name, ''), COALESCE(u.email, ''),
		       spl.tier, spl.amount_usd, spl.total_volume,
		       TO_CHAR(spl.cycle_month, 'YYYY-MM'), spl.created_at
		FROM salary_payout_logs spl
		LEFT JOIN users u ON u.id = spl.user_id
		ORDER BY spl.created_at DESC
		LIMIT $1 OFFSET $2
	`
	rows, err := s.dbPool.Query(ctx, query, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []*SalaryPayoutLogView
	for rows.Next() {
		l := &SalaryPayoutLogView{}
		if err := rows.Scan(&l.UserID, &l.UserName, &l.UserEmail, &l.Tier, &l.AmountUSD, &l.TotalVolume, &l.CycleMonth, &l.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, l)
	}
	return out, rows.Err()
}

func (s *adminService) GetAuditLogs(ctx context.Context, limit, offset int) ([]*domain.TransactionAuditLog, error) {
	query := `
		SELECT id, user_id, action, amount_usd, usdt_amount, tx_hash, status, details, created_at
		FROM transaction_audit_logs
		ORDER BY created_at DESC
		LIMIT $1 OFFSET $2
	`
	rows, err := s.dbPool.Query(ctx, query, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []*domain.TransactionAuditLog
	for rows.Next() {
		a := &domain.TransactionAuditLog{}
		if err := rows.Scan(&a.ID, &a.UserID, &a.Action, &a.AmountUSD, &a.UsdtAmount, &a.TxHash, &a.Status, &a.Details, &a.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, a)
	}
	return out, rows.Err()
}

func (s *adminService) GetDashboardStats(ctx context.Context) (map[string]interface{}, error) {
	var totalUsers, activeInvestments, pendingWithdrawals, pendingInvestments int
	var totalInvested, totalPaid float64

	totalUsers, _ = s.userRepo.GetTotalCount(ctx)
	activeInvestments, _ = s.invRepo.GetActiveCount(ctx)
	pendingInvestments, _ = s.invRepo.GetPendingCount(ctx)
	totalInvested, _ = s.invRepo.GetTotalActiveInvested(ctx)
	totalPaid, _ = s.walletRepo.GetTotalPaid(ctx)
	pendingWithdrawals, _ = s.wdRepo.GetPendingCount(ctx)

	return map[string]interface{}{
		"totalUsers":         totalUsers,
		"activeInvestments":  activeInvestments,
		"pendingInvestments": pendingInvestments,
		"totalInvested":      totalInvested,
		"totalPaid":          totalPaid,
		"pendingWithdrawals": pendingWithdrawals,
	}, nil
}

func (s *adminService) GetUsers(ctx context.Context, limit, offset int, search, status string) ([]*domain.User, error) {
	return s.userRepo.SearchUsers(ctx, limit, offset, search, status)
}

func (s *adminService) GetAllWithdrawals(ctx context.Context, limit, offset int) ([]*domain.Withdrawal, error) {
	return s.wdRepo.GetAll(ctx, limit, offset)
}

func (s *adminService) GetSettings(ctx context.Context) (*domain.PlatformSettings, error) {
	return s.settingsRepo.GetSettings(ctx)
}

func (s *adminService) UpdateSettings(ctx context.Context, settings *domain.PlatformSettings) error {
	return s.settingsRepo.UpdateSettings(ctx, settings)
}

// GetUserSummary returns a complete financial overview of a user for admin review.
func (s *adminService) GetUserSummary(ctx context.Context, userID uuid.UUID) (map[string]interface{}, error) {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil || user == nil {
		return nil, errors.New("user not found")
	}

	wallet, _ := s.walletRepo.GetBalance(ctx, userID)
	investments, _ := s.invRepo.GetInvestmentsByUserID(ctx, userID)
	withdrawals, _ := s.wdRepo.GetByUserID(ctx, userID)

	settings, _ := s.settingsRepo.GetSettings(ctx)
	status := UserStatusInactive
	if settings != nil {
		if st, err := GetUserStatus(ctx, s.invRepo, s.mlmRepo, userID, settings); err == nil {
			status = st
		}
	}

	// Scrub sensitive data
	user.PasswordHash = ""

	return map[string]interface{}{
		"user":        user,
		"wallet":      wallet,
		"investments": investments,
		"withdrawals": withdrawals,
		"status":      status,
	}, nil
}

// GetAnalytics returns 30-day time-series data for admin charts.
func (s *adminService) GetAnalytics(ctx context.Context) (map[string]interface{}, error) {
	dailySignups, _ := s.userRepo.GetDailySignups(ctx, 30)
	dailyROIPaid, _ := s.walletRepo.GetDailyIncomeBySource(ctx, "DAILY_REWARD", 30)
	dailyLevelIncome, _ := s.walletRepo.GetDailyIncomeBySource(ctx, "LEVEL_INCOME", 30)
	dailyReferralIncome, _ := s.walletRepo.GetDailyIncomeBySource(ctx, "INVITE", 30)

	return map[string]interface{}{
		"daily_signups":        dailySignups,
		"daily_roi_paid":       dailyROIPaid,
		"daily_level_income":   dailyLevelIncome,
		"daily_referral_income": dailyReferralIncome,
	}, nil
}

// CreateManualInvestment allows admins to directly invest on behalf of a user using their email.
// It activates the investment immediately and distributes L1, L2, L3 invite rewards to active uplines.
func (s *adminService) CreateManualInvestment(ctx context.Context, email string, amount float64) (*domain.Sponsorship, error) {
	trimmedEmail := strings.TrimSpace(email)
	if trimmedEmail == "" {
		return nil, errors.New("valid email address is required")
	}
	if amount < 100 || math.Mod(amount, 100) != 0 {
		return nil, errors.New("investment amount must be a multiple of $100 USD (e.g., $100, $200, $300...)")
	}

	user, err := s.userRepo.GetByEmail(ctx, trimmedEmail)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, fmt.Errorf("user with email '%s' not found", trimmedEmail)
	}
	if user.Status == "BLOCKED" {
		return nil, errors.New("cannot create investment for a blocked user")
	}

	settings, err := s.settingsRepo.GetSettings(ctx)
	if err != nil {
		return nil, err
	}

	status, err := GetUserStatus(ctx, s.invRepo, s.mlmRepo, user.ID, settings)
	if err != nil {
		return nil, err
	}
	isWorking := status == UserStatusWorking

	capMultiplier := GetIncomeCap(isWorking, settings)
	capLimit := amount * capMultiplier
	dailyRate := settings.MonthlyRewardPct / 30.0

	inv := &domain.Sponsorship{
		UserID:               user.ID,
		Amount:               amount,
		DailyRatePct:         dailyRate,
		Status:               "ACTIVE",
		CapLimit:             capLimit,
		WorkingCapAtCreation: isWorking,
	}

	if err := s.invRepo.CreateInvestment(ctx, inv); err != nil {
		return nil, err
	}

	if user.Status != "ACTIVE" {
		user.Status = "ACTIVE"
		_ = s.userRepo.Update(ctx, user)
	}

	// Trigger automatic distribution of invite rewards (L1, L2, L3) to active uplines
	s.payReferralIncome(ctx, inv)

	return inv, nil
}

