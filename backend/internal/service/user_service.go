package service

import (
	"context"
	"errors"
	"strings"

	"github.com/arenergyusa/musica/backend/internal/domain"
	"github.com/arenergyusa/musica/backend/internal/repository"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgconn"
	"golang.org/x/crypto/bcrypt"
)

type UserService interface {
	GetProfile(ctx context.Context, userID uuid.UUID) (*domain.User, error)
	UpdateProfile(ctx context.Context, userID uuid.UUID, req *domain.UpdateProfileRequest) (*domain.User, error)
	SubmitKYC(ctx context.Context, userID uuid.UUID, documentURL string) error
	CompleteAutomatedKYC(ctx context.Context, userID uuid.UUID, documentURL, aadhaar, pan string) error
	RejectAutomatedKYC(ctx context.Context, userID uuid.UUID, documentURL string) error
	GetKYCStatus(ctx context.Context, userID uuid.UUID) (string, string, error)
	GetDashboard(ctx context.Context, userID uuid.UUID) (map[string]interface{}, error)
	ChangePassword(ctx context.Context, userID uuid.UUID, oldPassword, newPassword string) error
}

type userService struct {
	userRepo     repository.UserRepository
	walletRepo   repository.WalletRepository
	invRepo      repository.InvestmentRepository
	mlmRepo      repository.MLMRepository
	settingsRepo repository.SettingsRepository
}

func NewUserService(userRepo repository.UserRepository, walletRepo repository.WalletRepository, invRepo repository.InvestmentRepository, mlmRepo repository.MLMRepository, settingsRepo repository.SettingsRepository) UserService {
	return &userService{
		userRepo:     userRepo,
		walletRepo:   walletRepo,
		invRepo:      invRepo,
		mlmRepo:      mlmRepo,
		settingsRepo: settingsRepo,
	}
}

func (s *userService) GetProfile(ctx context.Context, userID uuid.UUID) (*domain.User, error) {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if user != nil && user.KycStatus == "PENDING" && user.DocumentURL == "" {
		user.KycStatus = "UNINITIALIZED"
	}
	return user, nil
}

func (s *userService) UpdateProfile(ctx context.Context, userID uuid.UUID, req *domain.UpdateProfileRequest) (*domain.User, error) {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, errors.New("user not found")
	}

	if req.Name != "" {
		user.Name = req.Name
	}
	if req.Phone != "" && req.Phone != user.Phone {
		existingPhone, err := s.userRepo.GetByPhone(ctx, req.Phone)
		if err != nil {
			return nil, err
		}
		if existingPhone != nil && existingPhone.ID != userID {
			return nil, errors.New("this mobile number is already registered with another account")
		}
		user.Phone = req.Phone
	}
	if req.BankAccount != "" {
		// Anti-fraud check: Ensure bank account is not already registered with another user
		existingUser, err := s.userRepo.GetByBankAccount(ctx, req.BankAccount)
		if err != nil {
			return nil, err
		}
		if existingUser != nil && existingUser.ID != userID {
			return nil, errors.New("this bank account is already registered with another user account")
		}
		user.BankAccount = req.BankAccount
	}
	if req.IFSC != "" {
		user.IFSC = req.IFSC
	}

	if err := s.userRepo.Update(ctx, user); err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.ConstraintName == "idx_users_bank_account_hash" {
			return nil, errors.New("this bank account is already registered with another user account")
		}
		if strings.Contains(err.Error(), "idx_users_bank_account_hash") {
			return nil, errors.New("this bank account is already registered with another user account")
		}
		return nil, err
	}

	return user, nil
}

func (s *userService) SubmitKYC(ctx context.Context, userID uuid.UUID, documentURL string) error {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return err
	}
	if user == nil {
		return errors.New("user not found")
	}

	user.KycStatus = "PENDING"
	user.DocumentURL = documentURL

	return s.userRepo.Update(ctx, user)
}

func (s *userService) CompleteAutomatedKYC(ctx context.Context, userID uuid.UUID, documentURL, aadhaar, pan string) error {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil { return err }
	if user == nil { return errors.New("user not found") }
	user.Aadhaar = aadhaar
	user.PAN = pan
	user.DocumentURL = documentURL
	user.KycStatus = "APPROVED"
	user.KycRejectionReason = ""
	return s.userRepo.Update(ctx, user)
}

func (s *userService) RejectAutomatedKYC(ctx context.Context, userID uuid.UUID, documentURL string) error {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil { return err }
	if user == nil { return errors.New("user not found") }
	user.DocumentURL = documentURL
	user.KycStatus = "REJECTED"
	return s.userRepo.Update(ctx, user)
}

func (s *userService) GetKYCStatus(ctx context.Context, userID uuid.UUID) (string, string, error) {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return "", "", err
	}
	if user == nil {
		return "", "", errors.New("user not found")
	}

	status := user.KycStatus
	if status == "PENDING" && user.DocumentURL == "" {
		status = "UNINITIALIZED"
	}

	return status, user.KycRejectionReason, nil
}

func (s *userService) GetDashboard(ctx context.Context, userID uuid.UUID) (map[string]interface{}, error) {
	// Fetch User
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, errors.New("user not found")
	}

	// Fetch Wallet
	wallet, _ := s.walletRepo.GetBalance(ctx, userID)

	// Fetch Investments
	invs, _ := s.invRepo.GetInvestmentsByUserID(ctx, userID)
	var activeInvestments float64
	var activeCount int
	for _, inv := range invs {
		if inv.Status == "ACTIVE" {
			activeInvestments += inv.Amount
			activeCount++
		}
	}

	// Fetch Team Stats & Levels Unlocked
	volume, _ := s.mlmRepo.GetDownlineVolume(ctx, userID)
	directs, _ := s.mlmRepo.GetDirectReferrals(ctx, userID)
	isWorking, _ := s.mlmRepo.HasActiveDirectReferral(ctx, userID)
	settings, _ := s.settingsRepo.GetSettings(ctx)
	levelsUnlocked := 0
	if settings != nil {
		levelsUnlocked = GetUnlockedLevels(len(directs), volume, settings)
	}

	var bal, totalW, totalC float64
	if wallet != nil {
		bal = wallet.Balance
		totalW = wallet.TotalWithdrawn
		totalC = wallet.TotalCredited
	}

	// Fetch Recent Transactions
	recentTxs, _ := s.walletRepo.GetTransactions(ctx, userID, 5, 0)
	if recentTxs == nil {
		recentTxs = []*domain.Transaction{}
	}

	// Fetch Chart Data
	chartData, _ := s.walletRepo.GetIncomeChartData(ctx, userID, 30)
	if chartData == nil {
		chartData = []map[string]interface{}{}
	}

	kycStatus := user.KycStatus
	if kycStatus == "PENDING" && user.DocumentURL == "" {
		kycStatus = "UNINITIALIZED"
	}

	return map[string]interface{}{
		"user": map[string]interface{}{
			"name":        user.Name,
			"kyc_status":  kycStatus,
			"invite_code": user.InviteCode,
		},
		"wallet": map[string]interface{}{
			"balance":         bal,
			"total_withdrawn": totalW,
			"total_credited":  totalC,
		},
		"investments": map[string]interface{}{
			"active_amount": activeInvestments,
			"active_count":  activeCount,
			"total_plans":   len(invs),
		},
		"team": map[string]interface{}{
			"direct_count":    len(directs),
			"active_volume":   volume,
			"is_working":      isWorking,
			"levels_unlocked": levelsUnlocked,
		},
		"recent_transactions": recentTxs,
		"chart_data":          chartData,
	}, nil
}
// ChangePassword validates the old password and sets a new one.
func (s *userService) ChangePassword(ctx context.Context, userID uuid.UUID, oldPassword, newPassword string) error {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return err
	}
	if user == nil {
		return errors.New("user not found")
	}

	// Verify old password
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(oldPassword)); err != nil {
		return errors.New("current password is incorrect")
	}

	// Validate new password
	if len(newPassword) < 8 {
		return errors.New("new password must be at least 8 characters")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	user.PasswordHash = string(hash)
	return s.userRepo.Update(ctx, user)
}
