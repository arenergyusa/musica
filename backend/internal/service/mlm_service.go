package service

import (
	"context"
	"errors"
	"math"
	"strconv"

	"github.com/arenergyusa/musica/backend/internal/domain"
	"github.com/arenergyusa/musica/backend/internal/repository"
	"github.com/google/uuid"
)

// Community Sponsorship & Reward Core Logic

// User statuses derived from investment activity and level unlocks.
const (
	UserStatusInactive = "INACTIVE"
	UserStatusActive   = "ACTIVE"
	UserStatusWorking  = "WORKING"
)

// GetUserStatus computes the combined account status for a user:
//   - INACTIVE: no ACTIVE sponsorship
//   - WORKING:  has an ACTIVE sponsorship and all 15 levels unlocked
//   - ACTIVE:   has an ACTIVE sponsorship but levels below 15
func GetUserStatus(ctx context.Context, invRepo repository.InvestmentRepository, mlmRepo repository.MLMRepository, userID uuid.UUID, s *domain.PlatformSettings) (string, error) {
	hasActive, err := invRepo.HasActiveInvestment(ctx, userID)
	if err != nil {
		return "", err
	}
	if !hasActive {
		return UserStatusInactive, nil
	}

	directVolume, directCount, err := mlmRepo.GetDirectVolumeAndCount(ctx, userID)
	if err != nil {
		return "", err
	}

	if GetUnlockedLevels(directCount, directVolume, s) >= 15 {
		return UserStatusWorking, nil
	}
	return UserStatusActive, nil
}

func CalculateNetWithdrawal(amount float64, s *domain.PlatformSettings) (float64, float64, error) {
	if amount < s.WithdrawalMinAmount {
		return 0, 0, errors.New("minimum withdrawal amount is $" + strconv.FormatFloat(s.WithdrawalMinAmount, 'f', 2, 64))
	}
	// 10% TDS under Income Tax Act (TAN RTKP11658D), 0% platform fee
	tdsAmount := amount * (s.WithdrawalFeePct / 100.0)
	netAmount := amount - tdsAmount
	return math.Round(tdsAmount*100) / 100, math.Round(netAmount*100) / 100, nil
}

func GetIncomeCap(isWorking bool, s *domain.PlatformSettings) float64 {
	if isWorking {
		return s.WorkingCapMultiplier
	}
	return s.NonWorkingCapMultiplier
}

func CalculateDailyReward(investedAmount float64, ratePct float64) float64 {
	reward := investedAmount * (ratePct / 100.0)
	return math.Round(reward*100) / 100
}

func CalculateDailyRewardForMonth(investedAmount float64, monthlyRatePct float64, daysInMonth int, isFinalDayOfFullMonth ...bool) float64 {
	if daysInMonth <= 0 {
		daysInMonth = 30
	}
	totalMonthlyReturn := investedAmount * (monthlyRatePct / 100.0)
	standardDaily := math.Round((totalMonthlyReturn/float64(daysInMonth))*100) / 100

	if len(isFinalDayOfFullMonth) > 0 && isFinalDayOfFullMonth[0] {
		// Final day of a full active month: settle exact residual rounding difference
		accumulatedBeforeFinal := standardDaily * float64(daysInMonth-1)
		finalDayAmount := math.Round((totalMonthlyReturn-accumulatedBeforeFinal)*100) / 100
		if finalDayAmount < 0 {
			return 0
		}
		return finalDayAmount
	}

	return standardDaily
}

func GetUnlockedLevels(directsCount int, directBusiness float64, s *domain.PlatformSettings) int {
	if directsCount >= s.Level1To15Directs && directBusiness >= s.Level1To15Business {
		return 15
	} else if directsCount >= s.Level1To10Directs && directBusiness >= s.Level1To10Business {
		return 10
	} else if directsCount >= s.Level1To5Directs && directBusiness >= s.Level1To5Business {
		return 5
	}
	// L1 level income is available to every eligible upline by default.
	return 1
}

func EvaluateCapStatus(ctx context.Context, invRepo repository.InvestmentRepository, sponsorship *domain.Sponsorship) bool {
	if sponsorship.TotalRewardEarned >= sponsorship.CapLimit {
		sponsorship.Status = "CAPPED"
		_ = invRepo.UpdateInvestmentStatus(ctx, sponsorship.ID, "CAPPED")
		return true
	}
	return false
}
