package service

import (
	"context"
	"errors"
	"math"
	"strconv"

	"github.com/arenergyusa/musica/backend/internal/domain"
	"github.com/arenergyusa/musica/backend/internal/repository"
)

// MLM & Investment Core Logic as specified in the plan

func CalculateNetWithdrawal(amount float64, s *domain.PlatformSettings) (float64, float64, error) {
	if amount < s.WithdrawalMinAmount {
		return 0, 0, errors.New("minimum withdrawal amount is ₹" + strconv.FormatFloat(s.WithdrawalMinAmount, 'f', 2, 64))
	}
	tdsAmount := amount * (s.WithdrawalFeePct / 100.0)
	netAmount := amount - tdsAmount
	return math.Round(tdsAmount*100)/100, math.Round(netAmount*100)/100, nil
}

func GetIncomeCap(isWorking bool, s *domain.PlatformSettings) float64 {
	if isWorking {
		return s.WorkingCapMultiplier
	}
	return s.NonWorkingCapMultiplier
}

func CalculateDailyROI(investedAmount float64, ratePct float64) float64 {
	roi := investedAmount * (ratePct / 100.0)
	return math.Round(roi*100) / 100
}

func GetReferralRewardPercentage(level int, s *domain.PlatformSettings) float64 {
	switch level {
	case 1:
		return s.RefRewardL1Pct
	case 2:
		return s.RefRewardL2Pct
	case 3:
		return s.RefRewardL3Pct
	default:
		return 0.0
	}
}

func GetLevelIncomePercentage(level int, s *domain.PlatformSettings) float64 {
	if level == 1 {
		return s.LevelIncomeL1Pct
	}
	if level == 2 {
		return s.LevelIncomeL2Pct
	}
	if level == 3 {
		return s.LevelIncomeL3Pct
	}
	if level >= 4 && level <= 10 {
		return s.LevelIncomeL4ToL10Pct
	}
	if level >= 11 && level <= 15 {
		return s.LevelIncomeL11ToL15Pct
	}
	return 0.0
}

func GetUnlockedLevels(directsCount int, directBusiness float64, s *domain.PlatformSettings) int {
	if directsCount >= s.Level1To15Directs && directBusiness >= s.Level1To15Business {
		return 15
	} else if directsCount >= s.Level1To10Directs && directBusiness >= s.Level1To10Business {
		return 10
	} else if directsCount >= s.Level1To5Directs && directBusiness >= s.Level1To5Business {
		return 5
	}
	return 0
}

func EvaluateCapStatus(ctx context.Context, invRepo repository.InvestmentRepository, investment *domain.Investment) bool {
	if investment.TotalRewardEarned >= investment.CapLimit {
		investment.Status = "CAPPED"
		_ = invRepo.UpdateInvestmentStatus(ctx, investment.ID, "CAPPED")
		return true
	}
	return false
}
