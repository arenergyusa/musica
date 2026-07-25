package service

import (
	"context"
	"errors"
	"fmt"
	"log"
	"math"

	"github.com/arenergyusa/musica/backend/internal/domain"
	"github.com/arenergyusa/musica/backend/internal/repository"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type AdminService interface {
	ActivateInvestment(ctx context.Context, invID uuid.UUID) error
	ApproveWithdrawal(ctx context.Context, wdID uuid.UUID, adminNote string) error
	RejectWithdrawal(ctx context.Context, wdID uuid.UUID, adminNote string) error
	BlockUser(ctx context.Context, userID uuid.UUID) error
	UnblockUser(ctx context.Context, userID uuid.UUID) error
	GetDashboardStats(ctx context.Context) (map[string]interface{}, error)
	GetUsers(ctx context.Context, limit, offset int, search, status string) ([]*domain.User, error)
	GetPendingKYC(ctx context.Context, limit, offset int) ([]*domain.User, error)
	ApproveKYC(ctx context.Context, userID uuid.UUID) error
	RejectKYC(ctx context.Context, userID uuid.UUID, reason string) error
	GetAllWithdrawals(ctx context.Context, limit, offset int) ([]*domain.Withdrawal, error)
	GetSettings(ctx context.Context) (*domain.PlatformSettings, error)
	UpdateSettings(ctx context.Context, settings *domain.PlatformSettings) error
	GetUserSummary(ctx context.Context, userID uuid.UUID) (map[string]interface{}, error)
	GetAnalytics(ctx context.Context) (map[string]interface{}, error)
}

type adminService struct {
	dbPool       *pgxpool.Pool
	invRepo      repository.InvestmentRepository
	wdRepo       repository.WithdrawalRepository
	userRepo     repository.UserRepository
	walletRepo   repository.WalletRepository
	settingsRepo repository.SettingsRepository
	mlmRepo      repository.MLMRepository
}

func NewAdminService(dbPool *pgxpool.Pool, invRepo repository.InvestmentRepository, wdRepo repository.WithdrawalRepository, userRepo repository.UserRepository, walletRepo repository.WalletRepository, settingsRepo repository.SettingsRepository, mlmRepo repository.MLMRepository) AdminService {
	return &adminService{
		dbPool:       dbPool,
		invRepo:      invRepo,
		wdRepo:       wdRepo,
		userRepo:     userRepo,
		walletRepo:   walletRepo,
		settingsRepo: settingsRepo,
		mlmRepo:      mlmRepo,
	}
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

	s.payReferralIncome(ctx, targetInv)
	return nil
}

// payReferralIncome distributes one-time invite bonuses when a sponsorship is activated.
func (s *adminService) payReferralIncome(ctx context.Context, inv *domain.Sponsorship) {
	settings, _ := s.settingsRepo.GetSettings(ctx)
	refPcts := map[int]float64{
		1: 4.0,
		2: 1.0,
		3: 1.0,
	}
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

		rewardAmt := inv.Amount * (pct / 100.0)
		if rewardAmt <= 0 {
			continue
		}

		// Perform invite cap reservation and wallet crediting inside a single DB transaction
		tx, err := s.dbPool.Begin(ctx)
		if err != nil {
			log.Printf("ADMIN: failed to begin transaction for invite reward distribution: %v", err)
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

		// 1. Reserve cap capacity by updating sponsorships / cap tracker in tx
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
			newTotal := activeInv.TotalRewardEarned + deduct
			if newTotal >= activeInv.CapLimit {
				_, err = tx.Exec(ctx, `UPDATE sponsorships SET total_reward_earned = cap_limit, status = 'CLOSED', closed_at = CURRENT_TIMESTAMP WHERE id = $1`, activeInv.ID)
				if err != nil {
					txFailed = true
					break
				}
				_, err = tx.Exec(ctx, `UPDATE income_cap_tracker SET is_capped = TRUE, capped_at = CURRENT_TIMESTAMP WHERE sponsorship_id = $1`, activeInv.ID)
				if err != nil {
					txFailed = true
					break
				}
			} else {
				_, err = tx.Exec(ctx, `UPDATE sponsorships SET total_reward_earned = total_reward_earned + $1 WHERE id = $2`, deduct, activeInv.ID)
				if err != nil {
					txFailed = true
					break
				}
			}
			remainingToDeduct -= deduct
		}

		if txFailed || remainingToDeduct > 0 {
			tx.Rollback(ctx)
			continue
		}

		// 2. Credit wallet and create transaction in tx
		desc := fmt.Sprintf("L%d invite bonus — community reward (%.1f%% of ₹%.0f)", level, pct, inv.Amount)
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

func (s *adminService) GetDashboardStats(ctx context.Context) (map[string]interface{}, error) {
	var totalUsers, activeInvestments, pendingKyc, pendingWithdrawals, pendingInvestments int
	var totalInvested, totalPaid float64

	totalUsers, _ = s.userRepo.GetTotalCount(ctx)
	pendingKyc, _ = s.userRepo.GetPendingKYCCount(ctx)
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
		"pendingKyc":         pendingKyc,
		"pendingWithdrawals": pendingWithdrawals,
	}, nil
}

func (s *adminService) GetUsers(ctx context.Context, limit, offset int, search, status string) ([]*domain.User, error) {
	return s.userRepo.SearchUsers(ctx, limit, offset, search, status)
}

func (s *adminService) GetPendingKYC(ctx context.Context, limit, offset int) ([]*domain.User, error) {
	return s.userRepo.GetPendingKYC(ctx, limit, offset)
}

func (s *adminService) ApproveKYC(ctx context.Context, userID uuid.UUID) error {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return err
	}
	user.KycStatus = "APPROVED"
	user.KycRejectionReason = "" // Clear reason on approval
	return s.userRepo.Update(ctx, user)
}

func (s *adminService) RejectKYC(ctx context.Context, userID uuid.UUID, reason string) error {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return err
	}
	user.KycStatus = "REJECTED"
	user.KycRejectionReason = reason
	return s.userRepo.Update(ctx, user)
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

	// Scrub sensitive data
	user.PasswordHash = ""
	user.BankAccount = "***"
	user.IFSC = "***"

	return map[string]interface{}{
		"user":        user,
		"wallet":      wallet,
		"investments": investments,
		"withdrawals": withdrawals,
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
