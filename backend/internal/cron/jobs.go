package cron

import (
	"context"
	"log"

	"github.com/arenergyusa/musica/backend/internal/repository"
	"github.com/arenergyusa/musica/backend/internal/service"
	"github.com/robfig/cron/v3"
)

type JobRunner struct {
	cron       *cron.Cron
	invRepo    repository.InvestmentRepository
	mlmRepo    repository.MLMRepository
	walletRepo repository.WalletRepository
}

func NewJobRunner(invRepo repository.InvestmentRepository, mlmRepo repository.MLMRepository, walletRepo repository.WalletRepository) *JobRunner {
	c := cron.New(cron.WithParser(cron.NewParser(
		cron.Second | cron.Minute | cron.Hour | cron.Dom | cron.Month | cron.Dow,
	)))
	return &JobRunner{
		cron:       c,
		invRepo:    invRepo,
		mlmRepo:    mlmRepo,
		walletRepo: walletRepo,
	}
}

func (j *JobRunner) Start() {
	// Schedule Daily ROI job (e.g., at 00:00:00 every day)
	_, err := j.cron.AddFunc("0 0 0 * * *", j.distributeDailyROI)
	if err != nil {
		log.Printf("Failed to schedule daily ROI job: %v", err)
		return
	}

	j.cron.Start()
	log.Println("Cron jobs started successfully")
}

func (j *JobRunner) Stop() {
	j.cron.Stop()
}

func (j *JobRunner) distributeDailyROI() {
	log.Println("Starting Daily ROI Distribution Job...")
	ctx := context.Background()

	// 1. Fetch all active investments
	investments, err := j.invRepo.GetActiveInvestments(ctx)
	if err != nil {
		log.Printf("Failed to get active investments: %v", err)
		return
	}

	var processed int
	for _, inv := range investments {
		roiAmount := service.CalculateDailyROI(inv.Amount, inv.DailyRatePct)
		if roiAmount <= 0 {
			continue
		}

		remaining := inv.CapLimit - inv.TotalRewardEarned
		if remaining <= 0 {
			continue
		}

		if roiAmount > remaining {
			roiAmount = remaining
		}

		err = j.walletRepo.CreditReward(ctx, inv.UserID, roiAmount, "CREDIT", "DAILY_ROI", inv.ID.String(), "Daily ROI")
		if err != nil {
			log.Printf("Failed to credit ROI for inv %s: %v", inv.ID, err)
			continue
		}

		err = j.invRepo.UpdateCapTracker(ctx, inv.ID, roiAmount)
		if err != nil {
			log.Printf("Failed to update cap tracker for inv %s: %v", inv.ID, err)
		}

		inv.TotalRewardEarned += roiAmount
		service.EvaluateCapStatus(ctx, j.invRepo, inv)

		processed++
	}

	if processed > 0 {
		log.Println("Daily ROI Distribution Job completed")
	}
}
