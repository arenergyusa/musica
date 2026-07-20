package service

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"

	"github.com/arenergyusa/musica/backend/internal/domain"
	"github.com/arenergyusa/musica/backend/internal/repository"
	"github.com/google/uuid"
)

type WalletService interface {
	GetBalance(ctx context.Context, userID uuid.UUID) (*domain.RewardWallet, error)
	GetTransactions(ctx context.Context, userID uuid.UUID, limit, offset int) ([]*domain.Transaction, error)
}

type walletService struct {
	walletRepo repository.WalletRepository
}

func NewWalletService(walletRepo repository.WalletRepository) WalletService {
	return &walletService{
		walletRepo: walletRepo,
	}
}

func (s *walletService) GetBalance(ctx context.Context, userID uuid.UUID) (*domain.RewardWallet, error) {
	wallet, err := s.walletRepo.GetBalance(ctx, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return &domain.RewardWallet{
				UserID: userID,
				Balance: 0,
				TotalCredited: 0,
				TotalWithdrawn: 0,
			}, nil
		}
		return nil, err
	}
	return wallet, nil
}

func (s *walletService) GetTransactions(ctx context.Context, userID uuid.UUID, limit, offset int) ([]*domain.Transaction, error) {
	return s.walletRepo.GetTransactions(ctx, userID, limit, offset)
}
