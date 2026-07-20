package service

import (
	"context"
	"errors"
	"math"

	"github.com/arenergyusa/musica/backend/internal/domain"
	"github.com/arenergyusa/musica/backend/internal/repository"
)

// MLM & Investment Core Logic as specified in the plan

func CalculateNetWithdrawal(amount float64) (float64, float64, error) {
	if amount < 1000 {
		return 0, 0, errors.New("minimum withdrawal amount is ₹1,000")
	}
	tdsAmount := amount * 0.10 // 10% TDS
	netAmount := amount - tdsAmount
	return math.Round(tdsAmount*100)/100, math.Round(netAmount*100)/100, nil
}

func GetIncomeCap(isWorking bool) float64 {
	// Non-Working -> 2x
	// Working -> 3x
	if isWorking {
		return 3.0
	}
	return 2.0
}

func CalculateDailyROI(investedAmount float64) float64 {
	// 0.3333% daily
	roi := investedAmount * (10.0 / 30.0 / 100.0)
	return math.Round(roi*100) / 100
}

func GetReferralRewardPercentage(level int) float64 {
	switch level {
	case 1:
		return 4.0
	case 2:
		return 1.0
	case 3:
		return 1.0
	default:
		return 0.0
	}
}

func GetLevelIncomePercentage(level int) float64 {
	if level == 1 {
		return 15.0
	}
	if level == 2 {
		return 10.0
	}
	if level == 3 {
		return 5.0
	}
	if level >= 4 && level <= 10 {
		return 2.5
	}
	if level >= 11 && level <= 15 {
		return 3.0
	}
	return 0.0
}

func GetUnlockedLevels(activeVolume float64) int {
	if activeVolume < 100000 {
		return 0 // No level income
	} else if activeVolume < 200000 {
		return 5 // L1 - L5
	} else if activeVolume < 300000 {
		return 10 // L1 - L10
	}
	return 15 // L1 - L15
}

func EvaluateCapStatus(ctx context.Context, invRepo repository.InvestmentRepository, investment *domain.Investment) bool {
	if investment.TotalRewardEarned >= investment.CapLimit {
		investment.Status = "CAPPED"
		_ = invRepo.UpdateInvestmentStatus(ctx, investment.ID, "CAPPED")
		return true
	}
	return false
}
