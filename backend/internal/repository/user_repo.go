package repository

import (
	"context"
	"errors"

	"github.com/arenergyusa/musica/backend/internal/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type userRepository struct {
	db *pgxpool.Pool
}

func NewUserRepository(db *pgxpool.Pool) UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) Create(ctx context.Context, user *domain.User) error {
	query := `
		INSERT INTO users (name, email, phone, password_hash, referral_code, referred_by, role, document_url)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, status, kyc_status::text, created_at, updated_at
	`
	err := r.db.QueryRow(ctx, query,
		user.Name, user.Email, user.Phone, user.PasswordHash, user.ReferralCode, user.ReferredBy, user.Role, user.DocumentURL,
	).Scan(&user.ID, &user.Status, &user.KycStatus, &user.CreatedAt, &user.UpdatedAt)
	return err
}

func (r *userRepository) GetByID(ctx context.Context, id uuid.UUID) (*domain.User, error) {
	query := `
		SELECT id, name, email, phone, password_hash, referral_code, referred_by, COALESCE(kyc_status::text, 'PENDING'), COALESCE(bank_account, ''), COALESCE(ifsc, ''), COALESCE(pan, ''), COALESCE(aadhaar, ''), status, COALESCE(role, 'user'), COALESCE(document_url, ''), created_at, updated_at
		FROM users WHERE id = $1
	`
	var u domain.User
	err := r.db.QueryRow(ctx, query, id).Scan(
		&u.ID, &u.Name, &u.Email, &u.Phone, &u.PasswordHash, &u.ReferralCode, &u.ReferredBy,
		&u.KycStatus, &u.BankAccount, &u.IFSC, &u.PAN, &u.Aadhaar, &u.Status, &u.Role, &u.DocumentURL, &u.CreatedAt, &u.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	return &u, err
}

func (r *userRepository) GetByEmail(ctx context.Context, email string) (*domain.User, error) {
	query := `
		SELECT id, name, email, phone, password_hash, referral_code, referred_by, COALESCE(kyc_status::text, 'PENDING'), COALESCE(bank_account, ''), COALESCE(ifsc, ''), COALESCE(pan, ''), COALESCE(aadhaar, ''), status, COALESCE(role, 'user'), COALESCE(document_url, ''), created_at, updated_at
		FROM users WHERE email = $1
	`
	var u domain.User
	err := r.db.QueryRow(ctx, query, email).Scan(
		&u.ID, &u.Name, &u.Email, &u.Phone, &u.PasswordHash, &u.ReferralCode, &u.ReferredBy,
		&u.KycStatus, &u.BankAccount, &u.IFSC, &u.PAN, &u.Aadhaar, &u.Status, &u.Role, &u.DocumentURL, &u.CreatedAt, &u.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	return &u, err
}

func (r *userRepository) GetByReferralCode(ctx context.Context, code string) (*domain.User, error) {
	query := `
		SELECT id, name, email, phone, password_hash, referral_code, referred_by, COALESCE(kyc_status::text, 'PENDING'), COALESCE(bank_account, ''), COALESCE(ifsc, ''), COALESCE(pan, ''), COALESCE(aadhaar, ''), status, COALESCE(role, 'user'), COALESCE(document_url, ''), created_at, updated_at
		FROM users WHERE referral_code = $1
	`
	var u domain.User
	err := r.db.QueryRow(ctx, query, code).Scan(
		&u.ID, &u.Name, &u.Email, &u.Phone, &u.PasswordHash, &u.ReferralCode, &u.ReferredBy,
		&u.KycStatus, &u.BankAccount, &u.IFSC, &u.PAN, &u.Aadhaar, &u.Status, &u.Role, &u.DocumentURL, &u.CreatedAt, &u.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	return &u, err
}

func (r *userRepository) Update(ctx context.Context, user *domain.User) error {
	query := `
		UPDATE users
		SET name = $1, phone = $2, kyc_status = $3, bank_account = $4, ifsc = $5, pan = $6, aadhaar = $7, status = $8, document_url = $9, role = $10, updated_at = CURRENT_TIMESTAMP
		WHERE id = $11
		RETURNING updated_at
	`
	err := r.db.QueryRow(ctx, query,
		user.Name, user.Phone, user.KycStatus, user.BankAccount, user.IFSC, user.PAN, user.Aadhaar, user.Status, user.DocumentURL, user.Role, user.ID,
	).Scan(&user.UpdatedAt)
	return err
}

func (r *userRepository) GetTotalCount(ctx context.Context) (int, error) {
	var count int
	err := r.db.QueryRow(ctx, "SELECT COUNT(*) FROM users").Scan(&count)
	return count, err
}

func (r *userRepository) GetPendingKYCCount(ctx context.Context) (int, error) {
	var count int
	err := r.db.QueryRow(ctx, "SELECT COUNT(*) FROM users WHERE kyc_status = 'PENDING'").Scan(&count)
	return count, err
}

func (r *userRepository) GetAll(ctx context.Context, limit, offset int) ([]*domain.User, error) {
	query := "SELECT id, name, email, phone, referral_code, referred_by, kyc_status, status, created_at FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2"
	rows, err := r.db.Query(ctx, query, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []*domain.User
	for rows.Next() {
		u := &domain.User{}
		err := rows.Scan(&u.ID, &u.Name, &u.Email, &u.Phone, &u.ReferralCode, &u.ReferredBy, &u.KycStatus, &u.Status, &u.CreatedAt)
		if err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return users, nil
}

func (r *userRepository) GetPendingKYC(ctx context.Context, limit, offset int) ([]*domain.User, error) {
	query := "SELECT id, name, email, phone, kyc_status, created_at FROM users WHERE kyc_status = 'PENDING' ORDER BY created_at ASC LIMIT $1 OFFSET $2"
	rows, err := r.db.Query(ctx, query, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []*domain.User
	for rows.Next() {
		u := &domain.User{}
		err := rows.Scan(&u.ID, &u.Name, &u.Email, &u.Phone, &u.KycStatus, &u.CreatedAt)
		if err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return users, nil
}
