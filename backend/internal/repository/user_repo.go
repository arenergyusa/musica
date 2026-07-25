package repository

import (
	"context"
	"errors"
	"fmt"
	"log"

	"github.com/arenergyusa/musica/backend/internal/domain"
	"github.com/arenergyusa/musica/backend/internal/pkg/crypto"
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
		INSERT INTO users (name, email, phone, password_hash, invite_code, invited_by, role, document_url, status)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id, kyc_status::text, created_at, updated_at
	`
	err := r.db.QueryRow(ctx, query,
		user.Name, user.Email, user.Phone, user.PasswordHash, user.InviteCode, user.InvitedBy, user.Role, user.DocumentURL, user.Status,
	).Scan(&user.ID, &user.KycStatus, &user.CreatedAt, &user.UpdatedAt)
	return err
}

func (r *userRepository) GetByID(ctx context.Context, id uuid.UUID) (*domain.User, error) {
	query := `
		SELECT id, name, email, phone, password_hash, invite_code, invited_by, COALESCE(kyc_status::text, 'PENDING'), COALESCE(bank_account, ''), COALESCE(ifsc, ''), COALESCE(pan, ''), COALESCE(aadhaar, ''), status, COALESCE(role, 'user'), COALESCE(document_url, ''), created_at, updated_at
		FROM users WHERE id = $1
	`
	var u domain.User
	err := r.db.QueryRow(ctx, query, id).Scan(
		&u.ID, &u.Name, &u.Email, &u.Phone, &u.PasswordHash, &u.InviteCode, &u.InvitedBy,
		&u.KycStatus, &u.BankAccount, &u.IFSC, &u.PAN, &u.Aadhaar, &u.Status, &u.Role, &u.DocumentURL, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	var decErr error
	if u.BankAccount, decErr = crypto.Decrypt(u.BankAccount); decErr != nil {
		return nil, decErr
	}
	if u.IFSC, decErr = crypto.Decrypt(u.IFSC); decErr != nil {
		return nil, decErr
	}
	if u.PAN, decErr = crypto.Decrypt(u.PAN); decErr != nil {
		return nil, decErr
	}
	if u.Aadhaar, decErr = crypto.Decrypt(u.Aadhaar); decErr != nil {
		return nil, decErr
	}
	return &u, nil
}

func (r *userRepository) GetByEmail(ctx context.Context, email string) (*domain.User, error) {
	query := `
		SELECT id, name, email, phone, password_hash, invite_code, invited_by, COALESCE(kyc_status::text, 'PENDING'), COALESCE(bank_account, ''), COALESCE(ifsc, ''), COALESCE(pan, ''), COALESCE(aadhaar, ''), status, COALESCE(role, 'user'), COALESCE(document_url, ''), created_at, updated_at
		FROM users WHERE email = $1
	`
	var u domain.User
	err := r.db.QueryRow(ctx, query, email).Scan(
		&u.ID, &u.Name, &u.Email, &u.Phone, &u.PasswordHash, &u.InviteCode, &u.InvitedBy,
		&u.KycStatus, &u.BankAccount, &u.IFSC, &u.PAN, &u.Aadhaar, &u.Status, &u.Role, &u.DocumentURL, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	var decErr error
	if u.BankAccount, decErr = crypto.Decrypt(u.BankAccount); decErr != nil {
		return nil, decErr
	}
	if u.IFSC, decErr = crypto.Decrypt(u.IFSC); decErr != nil {
		return nil, decErr
	}
	if u.PAN, decErr = crypto.Decrypt(u.PAN); decErr != nil {
		return nil, decErr
	}
	if u.Aadhaar, decErr = crypto.Decrypt(u.Aadhaar); decErr != nil {
		return nil, decErr
	}
	return &u, nil
}

func (r *userRepository) GetByPhone(ctx context.Context, phone string) (*domain.User, error) {
	query := `
		SELECT id, name, email, phone, password_hash, invite_code, invited_by, COALESCE(kyc_status::text, 'PENDING'), COALESCE(bank_account, ''), COALESCE(ifsc, ''), COALESCE(pan, ''), COALESCE(aadhaar, ''), status, COALESCE(role, 'user'), COALESCE(document_url, ''), created_at, updated_at
		FROM users WHERE phone = $1
	`
	var u domain.User
	err := r.db.QueryRow(ctx, query, phone).Scan(
		&u.ID, &u.Name, &u.Email, &u.Phone, &u.PasswordHash, &u.InviteCode, &u.InvitedBy,
		&u.KycStatus, &u.BankAccount, &u.IFSC, &u.PAN, &u.Aadhaar, &u.Status, &u.Role, &u.DocumentURL, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	var decErr error
	if u.BankAccount, decErr = crypto.Decrypt(u.BankAccount); decErr != nil {
		return nil, decErr
	}
	if u.IFSC, decErr = crypto.Decrypt(u.IFSC); decErr != nil {
		return nil, decErr
	}
	if u.PAN, decErr = crypto.Decrypt(u.PAN); decErr != nil {
		return nil, decErr
	}
	if u.Aadhaar, decErr = crypto.Decrypt(u.Aadhaar); decErr != nil {
		return nil, decErr
	}
	return &u, nil
}

func (r *userRepository) GetByInviteCode(ctx context.Context, code string) (*domain.User, error) {
	query := `
		SELECT id, name, email, phone, password_hash, invite_code, invited_by, COALESCE(kyc_status::text, 'PENDING'), COALESCE(bank_account, ''), COALESCE(ifsc, ''), COALESCE(pan, ''), COALESCE(aadhaar, ''), status, COALESCE(role, 'user'), COALESCE(document_url, ''), created_at, updated_at
		FROM users WHERE invite_code = $1
	`
	var u domain.User
	err := r.db.QueryRow(ctx, query, code).Scan(
		&u.ID, &u.Name, &u.Email, &u.Phone, &u.PasswordHash, &u.InviteCode, &u.InvitedBy,
		&u.KycStatus, &u.BankAccount, &u.IFSC, &u.PAN, &u.Aadhaar, &u.Status, &u.Role, &u.DocumentURL, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	var decErr error
	if u.BankAccount, decErr = crypto.Decrypt(u.BankAccount); decErr != nil {
		return nil, decErr
	}
	if u.IFSC, decErr = crypto.Decrypt(u.IFSC); decErr != nil {
		return nil, decErr
	}
	if u.PAN, decErr = crypto.Decrypt(u.PAN); decErr != nil {
		return nil, decErr
	}
	if u.Aadhaar, decErr = crypto.Decrypt(u.Aadhaar); decErr != nil {
		return nil, decErr
	}
	return &u, nil
}

func (r *userRepository) Update(ctx context.Context, user *domain.User) error {
	encBank, err := crypto.Encrypt(user.BankAccount)
	if err != nil {
		return err
	}
	var bankHash *string
	if user.BankAccount != "" {
		h, err := crypto.Hash(user.BankAccount)
		if err != nil {
			return err
		}
		bankHash = &h
		user.BankAccountHash = h
	} else {
		user.BankAccountHash = ""
	}

	encIFSC, err := crypto.Encrypt(user.IFSC)
	if err != nil {
		return err
	}
	encPAN, err := crypto.Encrypt(user.PAN)
	if err != nil {
		return err
	}
	encAadhaar, err := crypto.Encrypt(user.Aadhaar)
	if err != nil {
		return err
	}

	query := `
		UPDATE users
		SET name = $1, phone = $2, kyc_status = $3, bank_account = $4, bank_account_hash = $5, ifsc = $6, pan = $7, aadhaar = $8, status = $9, document_url = $10, role = $11, updated_at = CURRENT_TIMESTAMP
		WHERE id = $12
		RETURNING updated_at
	`
	err = r.db.QueryRow(ctx, query,
		user.Name, user.Phone, user.KycStatus, encBank, bankHash, encIFSC, encPAN, encAadhaar, user.Status, user.DocumentURL, user.Role, user.ID,
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
	query := "SELECT id, name, email, phone, invite_code, invited_by, kyc_status, status, created_at FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2"
	rows, err := r.db.Query(ctx, query, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []*domain.User
	for rows.Next() {
		var u domain.User
		if err := rows.Scan(&u.ID, &u.Name, &u.Email, &u.Phone, &u.InviteCode, &u.InvitedBy, &u.KycStatus, &u.Status, &u.CreatedAt); err != nil {
			return nil, err
		}
		users = append(users, &u)
	}
	return users, rows.Err()
}

func (r *userRepository) GetPendingKYC(ctx context.Context, limit, offset int) ([]*domain.User, error) {
	query := "SELECT id, name, email, phone, invite_code, invited_by, kyc_status, status, document_url, created_at FROM users WHERE kyc_status = 'PENDING' ORDER BY created_at DESC LIMIT $1 OFFSET $2"
	rows, err := r.db.Query(ctx, query, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []*domain.User
	for rows.Next() {
		var u domain.User
		if err := rows.Scan(&u.ID, &u.Name, &u.Email, &u.Phone, &u.InviteCode, &u.InvitedBy, &u.KycStatus, &u.Status, &u.DocumentURL, &u.CreatedAt); err != nil {
			return nil, err
		}
		users = append(users, &u)
	}
	return users, rows.Err()
}

// SearchUsers searches users by name/email and optionally filters by status/kyc_status.
func (r *userRepository) SearchUsers(ctx context.Context, limit, offset int, search, status string) ([]*domain.User, error) {
	query := `
		SELECT id, name, email, phone, invite_code, invited_by, kyc_status, status, created_at
		FROM users
		WHERE 
			($1 = '' OR name ILIKE '%' || $1 || '%' OR email ILIKE '%' || $1 || '%')
			AND ($2 = '' OR status::text = $2 OR kyc_status::text = $2)
		ORDER BY created_at DESC
		LIMIT $3 OFFSET $4
	`
	rows, err := r.db.Query(ctx, query, search, status, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []*domain.User
	for rows.Next() {
		u := &domain.User{}
		err := rows.Scan(&u.ID, &u.Name, &u.Email, &u.Phone, &u.InviteCode, &u.InvitedBy, &u.KycStatus, &u.Status, &u.CreatedAt)
		if err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, rows.Err()
}

// GetDailySignups returns the count of new users registered each day for the last N days.
func (r *userRepository) GetDailySignups(ctx context.Context, days int) ([]map[string]interface{}, error) {
	query := `
		WITH date_series AS (
			SELECT generate_series(
				((now() AT TIME ZONE 'Asia/Kolkata')::date - (INTERVAL '1 day' * ($1 - 1)))::date,
				(now() AT TIME ZONE 'Asia/Kolkata')::date,
				INTERVAL '1 day'
			)::date AS d
		)
		SELECT TO_CHAR(ds.d, 'Mon DD') AS date,
		       COALESCE(COUNT(u.id), 0) AS count
		FROM date_series ds
		LEFT JOIN users u ON DATE(u.created_at AT TIME ZONE 'Asia/Kolkata') = ds.d
		GROUP BY ds.d
		ORDER BY ds.d ASC
	`
	rows, err := r.db.Query(ctx, query, days)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var data []map[string]interface{}
	for rows.Next() {
		var date string
		var count int64
		if err := rows.Scan(&date, &count); err != nil {
			return nil, err
		}
		data = append(data, map[string]interface{}{"date": date, "count": count})
	}
	return data, rows.Err()
}

func (r *userRepository) GetRegistrationStats(ctx context.Context, days int) ([]map[string]interface{}, error) {
	query := `
		SELECT TO_CHAR(created_at, 'YYYY-MM-DD') as date, COUNT(*) as count
		FROM users
		WHERE created_at >= NOW() - INTERVAL '1 day' * $1
		GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
		ORDER BY date ASC
	`
	rows, err := r.db.Query(ctx, query, days)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var data []map[string]interface{}
	for rows.Next() {
		var date string
		var count int64
		if err := rows.Scan(&date, &count); err != nil {
			return nil, err
		}
		data = append(data, map[string]interface{}{"date": date, "count": count})
	}
	return data, rows.Err()
}

// GetByBankAccount finds a user with an exact bank account match.
func (r *userRepository) GetByBankAccount(ctx context.Context, bankAccount string) (*domain.User, error) {
	if bankAccount == "" {
		return nil, nil
	}
	bankHash, err := crypto.Hash(bankAccount)
	if err != nil {
		return nil, err
	}
	query := `
		SELECT id, name, email, phone, password_hash, invite_code, invited_by, COALESCE(kyc_status::text, 'PENDING'), COALESCE(bank_account, ''), COALESCE(ifsc, ''), COALESCE(pan, ''), COALESCE(aadhaar, ''), status, COALESCE(role, 'user'), COALESCE(document_url, ''), created_at, updated_at
		FROM users WHERE bank_account_hash = $1
	`
	var u domain.User
	err = r.db.QueryRow(ctx, query, bankHash).Scan(
		&u.ID, &u.Name, &u.Email, &u.Phone, &u.PasswordHash, &u.InviteCode, &u.InvitedBy,
		&u.KycStatus, &u.BankAccount, &u.IFSC, &u.PAN, &u.Aadhaar, &u.Status, &u.Role, &u.DocumentURL, &u.CreatedAt, &u.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		// Fallback for legacy rows without bank_account_hash populated yet
		fallbackQuery := `
			SELECT id, name, email, phone, password_hash, invite_code, invited_by, COALESCE(kyc_status::text, 'PENDING'), COALESCE(bank_account, ''), COALESCE(ifsc, ''), COALESCE(pan, ''), COALESCE(aadhaar, ''), status, COALESCE(role, 'user'), COALESCE(document_url, ''), created_at, updated_at
			FROM users WHERE bank_account_hash IS NULL AND bank_account IS NOT NULL AND bank_account != ''
		`
		rows, err := r.db.Query(ctx, fallbackQuery)
		if err != nil {
			return nil, err
		}
		defer rows.Close()

		for rows.Next() {
			var legacyUser domain.User
			if err := rows.Scan(
				&legacyUser.ID, &legacyUser.Name, &legacyUser.Email, &legacyUser.Phone, &legacyUser.PasswordHash, &legacyUser.InviteCode, &legacyUser.InvitedBy,
				&legacyUser.KycStatus, &legacyUser.BankAccount, &legacyUser.IFSC, &legacyUser.PAN, &legacyUser.Aadhaar, &legacyUser.Status, &legacyUser.Role, &legacyUser.DocumentURL, &legacyUser.CreatedAt, &legacyUser.UpdatedAt,
			); err != nil {
				return nil, err
			}
			decryptedBank, err := crypto.Decrypt(legacyUser.BankAccount)
			if err != nil {
				log.Printf("GetByBankAccount legacy scan decryption error for user %s: %v", legacyUser.ID, err)
				continue
			}
			if decryptedBank != "" && decryptedBank == bankAccount {
				legacyUser.BankAccount = decryptedBank
				if legacyUser.IFSC, err = crypto.Decrypt(legacyUser.IFSC); err != nil {
					log.Printf("GetByBankAccount legacy scan IFSC decryption error for user %s: %v", legacyUser.ID, err)
					continue
				}
				if legacyUser.PAN, err = crypto.Decrypt(legacyUser.PAN); err != nil {
					log.Printf("GetByBankAccount legacy scan PAN decryption error for user %s: %v", legacyUser.ID, err)
					continue
				}
				if legacyUser.Aadhaar, err = crypto.Decrypt(legacyUser.Aadhaar); err != nil {
					log.Printf("GetByBankAccount legacy scan Aadhaar decryption error for user %s: %v", legacyUser.ID, err)
					continue
				}
				return &legacyUser, nil
			}
		}
		return nil, rows.Err()
	}
	if err != nil {
		return nil, err
	}
	decryptedBank, err := crypto.Decrypt(u.BankAccount)
	if err != nil {
		return nil, fmt.Errorf("decryption error on bank account for user %s: %w", u.ID, err)
	}
	u.BankAccount = decryptedBank
	if u.IFSC, err = crypto.Decrypt(u.IFSC); err != nil {
		return nil, fmt.Errorf("decryption error on IFSC for user %s: %w", u.ID, err)
	}
	if u.PAN, err = crypto.Decrypt(u.PAN); err != nil {
		return nil, fmt.Errorf("decryption error on PAN for user %s: %w", u.ID, err)
	}
	if u.Aadhaar, err = crypto.Decrypt(u.Aadhaar); err != nil {
		return nil, fmt.Errorf("decryption error on Aadhaar for user %s: %w", u.ID, err)
	}
	return &u, nil
}
