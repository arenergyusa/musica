package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/arenergyusa/musica/backend/internal/domain"
	"github.com/arenergyusa/musica/backend/internal/pkg/crypto"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type OTPRepository interface {
	SaveOTP(ctx context.Context, otp *domain.OTP) error
	ConsumeOTP(ctx context.Context, email, otp, purpose string) error
	VerifyOTP(ctx context.Context, email, otp, purpose string) error
}

type otpRepository struct {
	db *pgxpool.Pool
}

func NewOTPRepository(db *pgxpool.Pool) OTPRepository {
	return &otpRepository{db: db}
}

func (r *otpRepository) SaveOTP(ctx context.Context, otp *domain.OTP) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// Acquire a transaction-scoped advisory lock for this email + purpose to prevent concurrent active OTPs
	_, err = tx.Exec(ctx, `SELECT pg_advisory_xact_lock(hashtext($1), hashtext($2))`, otp.Email, otp.Purpose)
	if err != nil {
		return err
	}

	// Invalidate any existing unused OTPs for the same email and purpose
	_, err = tx.Exec(ctx, `UPDATE otps SET used_at = NOW() WHERE email = $1 AND purpose = $2 AND used_at IS NULL`, otp.Email, otp.Purpose)
	if err != nil {
		return err
	}

	hashedOTP, err := crypto.Hash(otp.OTP)
	if err != nil {
		return fmt.Errorf("failed to hash OTP: %w", err)
	}

	query := `INSERT INTO otps (email, otp, purpose, expires_at) VALUES ($1, $2, $3, $4) RETURNING id, created_at`
	err = tx.QueryRow(ctx, query, otp.Email, hashedOTP, otp.Purpose, otp.ExpiresAt).Scan(&otp.ID, &otp.CreatedAt)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func (r *otpRepository) VerifyOTP(ctx context.Context, email, otp, purpose string) error {
	hashedOTP, err := crypto.Hash(otp)
	if err != nil {
		return fmt.Errorf("failed to hash OTP: %w", err)
	}
	query := `SELECT id FROM otps 
	          WHERE email = $1 AND otp = $2 AND purpose = $3 AND used_at IS NULL AND expires_at > NOW()`
	var id string
	err = r.db.QueryRow(ctx, query, email, hashedOTP, purpose).Scan(&id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return errors.New("invalid or expired OTP")
		}
		return fmt.Errorf("database error verifying OTP: %w", err)
	}
	return nil
}

func (r *otpRepository) ConsumeOTP(ctx context.Context, email, otp, purpose string) error {
	hashedOTP, err := crypto.Hash(otp)
	if err != nil {
		return fmt.Errorf("failed to hash OTP: %w", err)
	}
	query := `UPDATE otps SET used_at = NOW() 
	          WHERE email = $1 AND otp = $2 AND purpose = $3 AND used_at IS NULL AND expires_at > NOW()
	          RETURNING id`
	var id string
	err = r.db.QueryRow(ctx, query, email, hashedOTP, purpose).Scan(&id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return errors.New("invalid or expired OTP")
		}
		return fmt.Errorf("database error consuming OTP: %w", err)
	}
	return nil
}
