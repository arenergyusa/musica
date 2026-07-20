package service

import (
	"context"

	"github.com/arenergyusa/musica/backend/internal/domain"
	"github.com/arenergyusa/musica/backend/internal/repository"
	"github.com/google/uuid"
)

type TeamService interface {
	GetDirectReferrals(ctx context.Context, userID uuid.UUID) ([]*domain.User, error)
	GetTeamStats(ctx context.Context, userID uuid.UUID) (map[string]interface{}, error)
	GetTree(ctx context.Context, userID uuid.UUID) (map[string]interface{}, error)
}

type teamService struct {
	mlmRepo repository.MLMRepository
}

func NewTeamService(mlmRepo repository.MLMRepository) TeamService {
	return &teamService{
		mlmRepo: mlmRepo,
	}
}

func (s *teamService) GetDirectReferrals(ctx context.Context, userID uuid.UUID) ([]*domain.User, error) {
	return s.mlmRepo.GetDirectReferrals(ctx, userID)
}

func (s *teamService) GetTeamStats(ctx context.Context, userID uuid.UUID) (map[string]interface{}, error) {
	volume, err := s.mlmRepo.GetDownlineVolume(ctx, userID)
	if err != nil {
		return nil, err
	}

	levels, err := s.mlmRepo.CalculateLevelsUnlocked(ctx, userID)
	if err != nil {
		return nil, err
	}

	hasActiveDirect, err := s.mlmRepo.HasActiveDirectReferral(ctx, userID)
	if err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"active_volume": volume,
		"levels_unlocked": levels,
		"is_working": hasActiveDirect,
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

