package cron

import (
	"context"
	"errors"
	"fmt"
	"log"
	"math"
	"sync"
	"time"

	"github.com/arenergyusa/musica/backend/internal/domain"
	"github.com/arenergyusa/musica/backend/internal/repository"
	"github.com/arenergyusa/musica/backend/internal/service"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/robfig/cron/v3"
)

// dailyRewardLockKey is a fixed Postgres advisory lock id that serializes the
// daily reward job across the startup catch-up goroutine, the scheduled cron
// and any additional backend replicas.
const dailyRewardLockKey int64 = 738572190

// istLoc is the fixed India Standard Time zone used to derive the daily reward
// day. The reward day MUST be computed and stored consistently (in IST) in the
// pre-check, the daily_reward_log/level_income_log inserts and the description,
// otherwise the idempotency gate and the credit can disagree across the
// midnight boundary and double-credit (or skip) a day.
var istLoc = time.FixedZone("IST", 5*60*60+30*60)

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
	dbPool       *pgxpool.Pool
	invRepo      repository.InvestmentRepository
	mlmRepo      repository.MLMRepository
	walletRepo   repository.WalletRepository
	settingsRepo repository.SettingsRepository
	salaryRepo   repository.SalaryRepository
	wdSvc        service.WithdrawalService
	startupWG    sync.WaitGroup
}

func NewJobRunner(
	dbPool *pgxpool.Pool,
	invRepo repository.InvestmentRepository,
	mlmRepo repository.MLMRepository,
	walletRepo repository.WalletRepository,
	settingsRepo repository.SettingsRepository,
	salaryRepo repository.SalaryRepository,
	wdSvc service.WithdrawalService,
) *JobRunner {
	c := cron.New(cron.WithParser(cron.NewParser(
		cron.Second | cron.Minute | cron.Hour | cron.Dom | cron.Month | cron.Dow,
	)))
	return &JobRunner{
		cron:         c,
		dbPool:       dbPool,
		invRepo:      invRepo,
		mlmRepo:      mlmRepo,
		walletRepo:   walletRepo,
		settingsRepo: settingsRepo,
		salaryRepo:   salaryRepo,
		wdSvc:        wdSvc,
	}
}

func (j *JobRunner) Start() {
	// 1. Run catchup check asynchronously on startup so container restarts/rebuilds never miss any past or current day's ROI.
	//    Track it in startupWG so graceful shutdown (H14) waits for the credit to finish instead of dying mid-transaction.
	j.startupWG.Add(1)
	go func() {
		defer j.startupWG.Done()
		log.Println("Running startup catch-up check for daily rewards...")
		j.distributeDailyRewardAndLevelIncome()
	}()

	// 2. Scheduled Daily Reward + Level Income at 00:00:00 IST (18:30:00 UTC)
	_, err := j.cron.AddFunc("0 30 18 * * *", func() {
		j.distributeDailyRewardAndLevelIncome()
	})
	if err != nil {
		log.Printf("ERROR: Failed to schedule daily reward cron job: %v", err)
	}

	// 3. Withdrawal reconciliation every 5 minutes: finalize PROCESSING rows by
	//    checking their tx on-chain and refund confirmed-absent payouts.
	if j.wdSvc != nil {
		_, err = j.cron.AddFunc("0 */5 * * * *", func() {
			log.Println("Running withdrawal reconciliation...")
			if rerr := j.wdSvc.ReconcilePendingWithdrawals(context.Background()); rerr != nil {
				log.Printf("CRON ERROR: withdrawal reconciliation failed: %v", rerr)
			}
		})
		if err != nil {
			log.Printf("ERROR: Failed to schedule withdrawal reconciliation cron job: %v", err)
		}
	}

	// 4. Monthly salary payout on the 1st of each month at 00:05 UTC (M11).
	//    Payouts are idempotent per (user, cycle_month) so an overlapping manual
	//    admin trigger can never double-pay.
	if j.salaryRepo != nil {
		_, err = j.cron.AddFunc("0 5 0 1 * *", func() {
			log.Println("Running monthly salary payout job...")
			count, total, serr := j.salaryRepo.ProcessMonthlySalaryPayouts(context.Background())
			if serr != nil {
				log.Printf("CRON ERROR: monthly salary payout failed: %v", serr)
				return
			}
			log.Printf("Monthly salary payout done: %d payouts, total $%.2f", count, total)
		})
		if err != nil {
			log.Printf("ERROR: Failed to schedule salary payout cron job: %v", err)
		}
	}

	j.cron.Start()
	log.Println("Cron JobRunner started. Daily Reward scheduled for 00:00 IST (18:30 UTC); withdrawal reconciliation every 5 min; salary payout 1st of month.")
}

func (j *JobRunner) Stop() {
	j.cron.Stop()
	// Wait for any in-flight startup catch-up credit to land (H14).
	j.startupWG.Wait()
}

// distributeDailyRewardAndLevelIncome is the main daily cron job that:
//  1. Credits Daily Reward to each active sponsorship owner
//  2. Checks & applies cap (CAPPED status) if limit is reached
//  3. Distributes Level Income to each unlocked upline level
//  4. Applies cap to each upline's sponsorship(s)
func (j *JobRunner) distributeDailyRewardAndLevelIncome() {
	log.Println("=== Starting Daily Reward + Level Income Distribution Job ===")
	ctx := context.Background()

	// Serialize across concurrent runners (startup catch-up + scheduled cron +
	// multiple replicas). Advisory locks are session-scoped, so hold a single
	// pooled connection for both lock and unlock.
	conn, err := j.dbPool.Acquire(ctx)
	if err != nil {
		log.Printf("CRON ERROR: failed to acquire db connection for job lock: %v", err)
		return
	}
	defer conn.Release()

	var gotLock bool
	if err := conn.QueryRow(ctx, `SELECT pg_try_advisory_lock($1)`, dailyRewardLockKey).Scan(&gotLock); err != nil {
		log.Printf("CRON ERROR: failed to acquire advisory lock: %v", err)
		return
	}
	if !gotLock {
		log.Println("=== Daily ROI Job SKIPPED: another run already in progress ===")
		return
	}
	defer func() {
		_, _ = conn.Exec(context.Background(), `SELECT pg_advisory_unlock($1)`, dailyRewardLockKey)
	}()

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

	// Daily rewards are scheduled at 00:00 IST, so derive all calendar boundaries
	// (today, days-in-month, first day of month) in IST and compare the
	// investment's creation time in the same zone to avoid mixing local and UTC
	// boundaries in the full-month calculation.
	loc := istLoc
	now := time.Now().In(loc)
	today := now.Format("2006-01-02")
	daysInCurrentMonth := time.Date(now.Year(), now.Month()+1, 0, 0, 0, 0, 0, loc).Day()
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
		firstDayOfMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, loc)
		isFullMonth := !freshInv.CreatedAt.In(loc).After(firstDayOfMonth)
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

		// Idempotency check: Skip if daily reward for today was already processed for this investment
		processed, err := j.walletRepo.HasDailyRewardBeenProcessed(ctx, freshInv.ID, today)
		if err == nil && processed {
			continue
		}

		roiDesc := fmt.Sprintf("Daily income for %s", today)
		err = j.walletRepo.CreditReward(
			ctx, freshInv.UserID, roiAmount,
			"CREDIT", "DAILY_REWARD", freshInv.ID.String(), today, roiDesc,
		)
		if err != nil {
			if errors.Is(err, repository.ErrAlreadyProcessed) {
				// Another concurrent run already credited this investment+day.
				continue
			}
			log.Printf("CRON ERROR: Failed to credit ROI for inv %s: %v", freshInv.ID, err)
			continue
		}

		// Cap accounting for this reward is done atomically inside
		// CreditReward's transaction (C4): the daily_reward_log gate ensures
		// this credit runs exactly once, and the same tx consumes the
		// investment's cap with a row lock and flips it to CLOSED when reached.
		freshInv.TotalRewardEarned += roiAmount
		roiProcessed++

		// --- Step 2: Distribute Level Income to upline chain ---
		levelCount := j.distributeLevelIncome(ctx, freshInv.UserID, freshInv.ID, roiAmount, settings, today)
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
	today string,
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

		desc := fmt.Sprintf("Level %d income for %s", levelNum, today)

		// Credit bounded reward to upline's wallet. The level_income_log unique
		// index gates this so a duplicate run never double-credits (C5); on
		// ErrAlreadyProcessed we skip BOTH the credit and the cap consumption.
		err = j.walletRepo.CreditLevelIncomeWithLog(
			ctx, uplineUserID, downlineUserID, sourceInvID, levelNum, levelIncomeAmt, today, desc,
		)
		if err != nil {
			if errors.Is(err, repository.ErrAlreadyProcessed) {
				continue
			}
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
