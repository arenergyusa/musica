package service

import (
	"context"
	"errors"

	"github.com/arenergyusa/musica/backend/internal/domain"
	"github.com/arenergyusa/musica/backend/internal/repository"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type UserService interface {
	GetProfile(ctx context.Context, userID uuid.UUID) (*domain.User, error)
	UpdateProfile(ctx context.Context, userID uuid.UUID, req *domain.UpdateProfileRequest) (*domain.User, error)
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
	return s.userRepo.GetByID(ctx, userID)
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
	if req.UsdtAddress != "" {
		user.UsdtAddress = req.UsdtAddress
	}

	if err := s.userRepo.Update(ctx, user); err != nil {
		return nil, err
	}
	return user, nil
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
	settings, _ := s.settingsRepo.GetSettings(ctx)
	levelsUnlocked := 0
	if settings != nil {
		levelsUnlocked = GetUnlockedLevels(len(directs), volume, settings)
	}

	status := UserStatusInactive
	if settings != nil {
		if st, err := GetUserStatus(ctx, s.invRepo, s.mlmRepo, userID, settings); err == nil {
			status = st
		}
	}

	var bal, totalW, totalC, salaryInc float64
	if wallet != nil {
		bal = wallet.Balance
		totalW = wallet.TotalWithdrawn
		totalC = wallet.TotalCredited
		salaryInc = wallet.SalaryIncome
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

	return map[string]interface{}{
		"user": map[string]interface{}{
			"name":        user.Name,
			"invite_code": user.InviteCode,
		},
		"wallet": map[string]interface{}{
			"balance":         bal,
			"total_withdrawn": totalW,
			"total_credited":  totalC,
			"salary_income":   salaryInc,
		},
		"investments": map[string]interface{}{
			"active_amount": activeInvestments,
			"active_count":  activeCount,
			"total_plans":   len(invs),
		},
		"team": map[string]interface{}{
			"direct_count":    len(directs),
			"active_volume":   volume,
			"is_working":      status == UserStatusWorking,
			"status":          status,
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
