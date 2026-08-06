package service

import (
	"context"
	"fmt"

	"github.com/arenergyusa/musica/backend/internal/domain"
	"github.com/arenergyusa/musica/backend/internal/repository"
	"github.com/google/uuid"
)

type TeamService interface {
	GetDirectReferrals(ctx context.Context, userID uuid.UUID) ([]*domain.User, error)
	GetTeamStats(ctx context.Context, userID uuid.UUID) (map[string]interface{}, error)
	GetTree(ctx context.Context, userID uuid.UUID) (map[string]interface{}, error)
	GetTeamBreakdown(ctx context.Context, userID uuid.UUID, level int, status string) (*domain.TeamBreakdown, error)
}

func (s *teamService) GetTeamBreakdown(ctx context.Context, userID uuid.UUID, level int, status string) (*domain.TeamBreakdown, error) {
	if level < 0 || level > 15 {
		return nil, fmt.Errorf("level must be between 1 and 15")
	}
	if status != "" && status != "ALL" && status != "INACTIVE" && status != "ACTIVE" && status != "WORKING" {
		return nil, fmt.Errorf("invalid team status")
	}
	breakdown, err := s.mlmRepo.GetTeamBreakdown(ctx, userID, 15)
	if err != nil { return nil, err }
	if level == 0 && (status == "" || status == "ALL") { return breakdown, nil }
	filtered := make([]*domain.TeamMemberDetail, 0)
	for _, member := range breakdown.Members {
		if level > 0 && member.Level != level { continue }
		if status != "" && status != "ALL" && member.Status != status { continue }
		filtered = append(filtered, member)
	}
	breakdown.Members = filtered

	// Recompute the level summaries from the filtered member set so the counts
	// and volumes match what is actually shown (M8).
	breakdown.Levels = make([]*domain.TeamLevelSummary, 15)
	for i := 0; i < 15; i++ {
		breakdown.Levels[i] = &domain.TeamLevelSummary{Level: i + 1}
	}
	for _, member := range breakdown.Members {
		summary := breakdown.Levels[member.Level-1]
		summary.TotalMembers++
		summary.TotalInvestment += member.TotalInvestment
		summary.LifetimeIncome += member.LifetimeIncome
		switch member.Status {
		case "INACTIVE":
			summary.InactiveCount++
		case "ACTIVE":
			summary.NonWorkingCount++
		case "WORKING":
			summary.WorkingCount++
		}
	}
	return breakdown, nil
}

type teamService struct {
	mlmRepo      repository.MLMRepository
	invRepo      repository.InvestmentRepository
	settingsRepo repository.SettingsRepository
	walletRepo   repository.WalletRepository
}

func NewTeamService(invRepo repository.InvestmentRepository, mlmRepo repository.MLMRepository, settingsRepo repository.SettingsRepository, walletRepo repository.WalletRepository) TeamService {
	return &teamService{
		mlmRepo:      mlmRepo,
		invRepo:      invRepo,
		settingsRepo: settingsRepo,
		walletRepo:   walletRepo,
	}
}

func (s *teamService) GetDirectReferrals(ctx context.Context, userID uuid.UUID) ([]*domain.User, error) {
	return s.mlmRepo.GetDirectReferrals(ctx, userID)
}

func (s *teamService) GetTeamStats(ctx context.Context, userID uuid.UUID) (map[string]interface{}, error) {
	// active_volume counts only currently-ACTIVE downline sponsorship value;
	// team_value is the lifetime team business (including CLOSED/capped), so the
	// two metrics no longer disagree (M9).
	activeVolume, err := s.mlmRepo.GetDownlineVolume(ctx, userID)
	if err != nil {
		return nil, err
	}
	teamValue, err := s.mlmRepo.GetDownlineTotalInvestment(ctx, userID)
	if err != nil {
		return nil, err
	}

	directVolume, directCount, err := s.mlmRepo.GetDirectVolumeAndCount(ctx, userID)
	if err != nil {
		return nil, err
	}

	settings, err := s.settingsRepo.GetSettings(ctx)
	if err != nil {
		return nil, err
	}

	levels := GetUnlockedLevels(directCount, directVolume, settings)

	status := UserStatusInactive
	if settings != nil {
		if st, err := GetUserStatus(ctx, s.invRepo, s.mlmRepo, userID, settings); err == nil {
			status = st
		}
	}

	hasActiveDirect, err := s.mlmRepo.HasActiveDirectReferral(ctx, userID)
	if err != nil {
		return nil, err
	}
	inviteIncome, err := s.walletRepo.GetLifetimeIncomeBySource(ctx, userID, "INVITE")
	if err != nil { return nil, err }

	levelIncome, err := s.walletRepo.GetLifetimeIncomeBySource(ctx, userID, "LEVEL")
	if err != nil { return nil, err }

	return map[string]interface{}{
		"active_volume": activeVolume,
		"team_value": teamValue,
		"invite_income": inviteIncome,
		"level_income": levelIncome,
		"levels_unlocked": levels,
		"is_working": hasActiveDirect,
		"status": status,
	}, nil
}

func (s *teamService) GetTree(ctx context.Context, userID uuid.UUID) (map[string]interface{}, error) {
	// For MVP, just returning downlines might be enough, but ideally this constructs a nested JSON.
	// We'll rely on a repo method like GetDownlines up to 3 levels for tree view
	
	// Assuming a simple flat list for now or we just get direct referrals recursively
	// Since ltree makes it easy to fetch all children:
	// A proper tree builder is needed. We'll leave the exact nested building for frontend parsing,
	// and just send the raw array of nodes with their path.
	
	// Since mlmRepo doesn't have GetAllDownlines exposed in the interface, we'll return a mock or direct referrals for now.
	// Adding GetTree as a placeholder that just returns direct for now.
	directs, err := s.mlmRepo.GetDirectReferrals(ctx, userID)
	if err != nil {
		return nil, err
	}
	
	return map[string]interface{}{
		"node_id": userID,
		"children": directs,
	}, nil
}
