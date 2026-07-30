package cron

import (
	"context"
	"fmt"
	"log"
	"math"
	"time"

	"github.com/arenergyusa/musica/backend/internal/domain"
	"github.com/arenergyusa/musica/backend/internal/repository"
	"github.com/arenergyusa/musica/backend/internal/service"
	"github.com/google/uuid"
	"github.com/robfig/cron/v3"
)

// getLevelIncomePct returns the percentage for the given level from PlatformSettings.
func getLevelIncomePct(level int, s *domain.PlatformSettings) float64 {
	if s == nil {
		return 0
	}
	switch {
	case level == 1:
		return s.LevelIncomeL1Pct
	case level == 2:
		return s.LevelIncomeL2Pct
	case level == 3:
		return s.LevelIncomeL3Pct
	case level >= 4 && level <= 10:
		return s.LevelIncomeL4ToL10Pct
	case level >= 11 && level <= 15:
		return s.LevelIncomeL11ToL15Pct
	default:
		return 0
	}
}

type JobRunner struct {
	cron         *cron.Cron
	invRepo      repository.InvestmentRepository
	mlmRepo      repository.MLMRepository
	walletRepo   repository.WalletRepository
	settingsRepo repository.SettingsRepository
}

func NewJobRunner(
	invRepo repository.InvestmentRepository,
	mlmRepo repository.MLMRepository,
	walletRepo repository.WalletRepository,
	settingsRepo repository.SettingsRepository,
) *JobRunner {
	c := cron.New(cron.WithParser(cron.NewParser(
		cron.Second | cron.Minute | cron.Hour | cron.Dom | cron.Month | cron.Dow,
	)))
	return &JobRunner{
		cron:         c,
		invRepo:      invRepo,
		mlmRepo:      mlmRepo,
		walletRepo:   walletRepo,
		settingsRepo: settingsRepo,
	}
}

func (j *JobRunner) Start() {
	// Daily Reward + Level Income at 00:00:00 IST (18:30:00 UTC)
	_, err := j.cron.AddFunc("0 30 18 * * *", func() {
		j.distributeDailyRewardAndLevelIncome()
	})
	if err != nil {
		log.Printf("ERROR: Failed to schedule daily reward cron job: %v", err)
	}

	j.cron.Start()
	log.Println("Cron JobRunner started. Daily Reward scheduled for 00:00 IST (18:30 UTC).")
}

func (j *JobRunner) Stop() {
	j.cron.Stop()
}

// distributeDailyRewardAndLevelIncome is the main daily cron job that:
//  1. Credits Daily Reward to each active sponsorship owner
//  2. Checks & applies cap (CAPPED status) if limit is reached
//  3. Distributes Level Income to each unlocked upline level
//  4. Applies cap to each upline's sponsorship(s)
func (j *JobRunner) distributeDailyRewardAndLevelIncome() {
	log.Println("=== Starting Daily Reward + Level Income Distribution Job ===")
	ctx := context.Background()

	// Load platform settings once for level income percentages and unlock thresholds
	settings, err := j.settingsRepo.GetSettings(ctx)
	if err != nil {
		log.Printf("CRON ERROR: Failed to load platform settings: %v", err)
		return
	}

	// 1. Fetch all active sponsorships
	investments, err := j.invRepo.GetActiveInvestments(ctx)
	if err != nil {
		log.Printf("CRON ERROR: Failed to get active sponsorships: %v", err)
		return
	}

	now := time.Now()
	today := now.Format("2006-01-02")
	daysInCurrentMonth := time.Date(now.Year(), now.Month()+1, 0, 0, 0, 0, 0, time.UTC).Day()
	var roiProcessed, levelIncomeDistributed int

	for _, inv := range investments {
		// Refresh sponsorship cap-tracking data immediately before calculating remaining allowance
		freshInv, err := j.invRepo.GetByID(ctx, inv.ID)
		if err != nil || freshInv == nil || freshInv.Status != "ACTIVE" {
			continue
		}

		// --- Step 1: Calculate & credit Daily Reward to sponsorship owner ---
		// Dynamic monthly division ensures exact 10% monthly return regardless of month length (28, 30, 31 days)
		monthlyPct := settings.MonthlyRewardPct
		if monthlyPct <= 0 {
			monthlyPct = 10.0
		}
		firstDayOfMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
		isFullMonth := freshInv.CreatedAt.Before(firstDayOfMonth) || freshInv.CreatedAt.Day() == 1
		isFinalDay := now.Day() == daysInCurrentMonth && isFullMonth

		roiAmount := service.CalculateDailyRewardForMonth(freshInv.Amount, monthlyPct, daysInCurrentMonth, isFinalDay)
		if roiAmount <= 0 {
			continue
		}

		// Cap the reward to remaining allowance using refreshed cap tracking data
		remaining := freshInv.CapLimit - freshInv.TotalRewardEarned
		if remaining <= 0 {
			continue
		}
		if roiAmount > remaining {
			roiAmount = remaining
		}

		roiDesc := fmt.Sprintf("Daily promotional reward for %s", today)
		err = j.walletRepo.CreditReward(
			ctx, freshInv.UserID, roiAmount,
			"CREDIT", "DAILY_REWARD", freshInv.ID.String(), roiDesc,
		)
		if err != nil {
			log.Printf("CRON ERROR: Failed to credit ROI for inv %s: %v", freshInv.ID, err)
			continue
		}

		// Update cap tracker (also auto-marks CAPPED/CLOSED if cap reached)
		if err = j.invRepo.UpdateCapTracker(ctx, freshInv.ID, roiAmount); err != nil {
			log.Printf("CRON ERROR: Failed to update cap tracker for inv %s: %v", freshInv.ID, err)
		}

		freshInv.TotalRewardEarned += roiAmount
		roiProcessed++

		// --- Step 2: Distribute Level Income to upline chain ---
		levelCount := j.distributeLevelIncome(ctx, freshInv.UserID, freshInv.ID, roiAmount, settings)
		levelIncomeDistributed += levelCount
	}

	log.Printf("=== Daily ROI Job Done: %d ROI credits, %d level income payouts ===",
		roiProcessed, levelIncomeDistributed)
}

// distributeLevelIncome walks the upline chain and credits level income to each eligible ancestor.
// Returns the number of level income payouts made.
func (j *JobRunner) distributeLevelIncome(
	ctx context.Context,
	downlineUserID uuid.UUID,
	sourceInvID uuid.UUID,
	roiAmount float64,
	settings *domain.PlatformSettings,
) int {
	if settings == nil {
		return 0
	}

	// Get upline chain (up to 15 levels above the downline user)
	uplineChain, err := j.mlmRepo.GetUplineChain(ctx, downlineUserID, 15)
	if err != nil {
		log.Printf("CRON ERROR: level income: failed to get upline chain for %s: %v", downlineUserID, err)
		return 0
	}

	today := time.Now().Format("2006-01-02")
	payoutCount := 0

	for depthIdx, uplineUserID := range uplineChain {
		levelNum := depthIdx + 1 // depthIdx 0 = L1 upline

		pct := getLevelIncomePct(levelNum, settings)
		if pct <= 0 {
			if levelNum > 15 {
				break
			}
			continue
		}

		// Check if this upline has enough unlocked levels
		directVolume, directCount, err := j.mlmRepo.GetDirectVolumeAndCount(ctx, uplineUserID)
		if err != nil {
			log.Printf("CRON ERROR: level income: failed to get stats for upline %s: %v", uplineUserID, err)
			continue
		}

		unlockedLevels := service.GetUnlockedLevels(directCount, directVolume, settings)
		if levelNum > unlockedLevels {
			continue // Level not unlocked for this upline
		}

		// Calculate level income = downline's ROI * level%
		levelIncomeAmt := roiAmount * (pct / 100.0)
		levelIncomeAmt = math.Round(levelIncomeAmt*100) / 100
		if levelIncomeAmt <= 0 {
			continue
		}

		// Determine upline's available remaining cap first
		activeInvs, err := j.invRepo.GetActiveInvestmentsByUserID(ctx, uplineUserID)
		if err != nil || len(activeInvs) == 0 {
			continue // Upline has no active investments to receive level income
		}

		var availableCap float64
		for _, inv := range activeInvs {
			rem := inv.CapLimit - inv.TotalRewardEarned
			if rem > 0 {
				availableCap += rem
			}
		}
		if availableCap <= 0 {
			continue
		}

		if levelIncomeAmt > availableCap {
			levelIncomeAmt = math.Round(availableCap*100) / 100
		}
		if levelIncomeAmt <= 0 {
			continue
		}

		desc := fmt.Sprintf("Level %d income from network activity (%s)", levelNum, today)

		// Credit bounded reward to upline's wallet
		err = j.walletRepo.CreditReward(
			ctx, uplineUserID, levelIncomeAmt,
			"CREDIT", "LEVEL_INCOME", sourceInvID.String(), desc,
		)
		if err != nil {
			log.Printf("CRON ERROR: level income: failed to credit user %s: %v", uplineUserID, err)
			continue
		}

		// Also cap-track on upline's active investment(s) with bounded amount
		j.applyLevelIncomeToCap(ctx, uplineUserID, levelIncomeAmt)
		payoutCount++
	}

	return payoutCount
}

// applyLevelIncomeToCap applies level income earned by an upline to their oldest active investment's cap.
func (j *JobRunner) applyLevelIncomeToCap(ctx context.Context, userID uuid.UUID, amount float64) {
	activeInvs, err := j.invRepo.GetActiveInvestmentsByUserID(ctx, userID)
	if err != nil || len(activeInvs) == 0 {
		return
	}

	remaining := amount
	for _, inv := range activeInvs {
		if remaining <= 0 {
			break
		}

		availableCap := inv.CapLimit - inv.TotalRewardEarned
		if availableCap <= 0 {
			continue
		}

		toApply := remaining
		if toApply > availableCap {
			toApply = availableCap
		}

		if err := j.invRepo.UpdateCapTracker(ctx, inv.ID, toApply); err != nil {
			log.Printf("CRON ERROR: applyLevelIncomeToCap: failed for inv %s: %v", inv.ID, err)
		}
		remaining -= toApply
	}
}
