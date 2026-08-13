package repository

import (
	"context"
	"crypto/rand"
	"encoding/binary"
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
	if user.InvitedBy == nil {
		return r.insertUser(ctx, user, "LEFT")
	}

	// L2: leg auto-assignment must be atomic. The previous COUNT-then-pick was
	// racy when two users registered under the same upline concurrently, which
	// could put both in the same leg. We serialize assignment per inviter with a
	// transaction-scoped advisory lock keyed off the upline's UUID.
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	lockKey := uuidToInt64(*user.InvitedBy)
	if _, err := tx.Exec(ctx, "SELECT pg_advisory_xact_lock($1)", lockKey); err != nil {
		return err
	}

	var count int
	if err := tx.QueryRow(ctx, "SELECT COUNT(*) FROM users WHERE invited_by = $1", *user.InvitedBy).Scan(&count); err != nil {
		return err
	}

	leg := "LEFT"
	if count%2 == 1 {
		leg = "RIGHT"
	}

	if err := insertUserTx(ctx, tx, user, leg); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

// uuidToInt64 derives a stable 64-bit advisory-lock key from a UUID.
func uuidToInt64(id uuid.UUID) int64 {
	var b [8]byte
	copy(b[:], id[:8])
	return int64(binary.BigEndian.Uint64(b[:]))
}

func (r *userRepository) insertUser(ctx context.Context, user *domain.User, leg string) error {
	user.Leg = leg

	query := `
		INSERT INTO users (name, email, phone, username, password_hash, invite_code, invited_by, leg, role, status)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING id, created_at, updated_at
	`
	return r.db.QueryRow(ctx, query,
		user.Name, user.Email, user.Phone, user.Username, user.PasswordHash, user.InviteCode, user.InvitedBy, user.Leg, user.Role, user.Status,
	).Scan(&user.ID, &user.CreatedAt, &user.UpdatedAt)
}

func insertUserTx(ctx context.Context, tx pgx.Tx, user *domain.User, leg string) error {
	user.Leg = leg

	query := `
		INSERT INTO users (name, email, phone, username, password_hash, invite_code, invited_by, leg, role, status)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING id, created_at, updated_at
	`
	return tx.QueryRow(ctx, query,
		user.Name, user.Email, user.Phone, user.Username, user.PasswordHash, user.InviteCode, user.InvitedBy, user.Leg, user.Role, user.Status,
	).Scan(&user.ID, &user.CreatedAt, &user.UpdatedAt)
}

// Delete removes a user row. Invite-tree rows cascade via ON DELETE CASCADE.
// Used to roll back a registration whose invite-tree node could not be created
// so the two are never left inconsistent (H6).
func (r *userRepository) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.Exec(ctx, `DELETE FROM users WHERE id = $1`, id)
	return err
}

func (r *userRepository) GetByID(ctx context.Context, id uuid.UUID) (*domain.User, error) {
	query := `
		SELECT id, name, email, phone, username, password_hash, invite_code, invited_by, COALESCE(usdt_address, ''), COALESCE(leg, 'LEFT'), status, COALESCE(role, 'user'), created_at, updated_at
		FROM users WHERE id = $1
	`
	var u domain.User
	err := r.db.QueryRow(ctx, query, id).Scan(
		&u.ID, &u.Name, &u.Email, &u.Phone, &u.Username, &u.PasswordHash, &u.InviteCode, &u.InvitedBy,
		&u.UsdtAddress, &u.Leg, &u.Status, &u.Role, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &u, nil
}

func (r *userRepository) GetByEmail(ctx context.Context, email string) (*domain.User, error) {
	query := `
		SELECT id, name, email, phone, username, password_hash, invite_code, invited_by, COALESCE(usdt_address, ''), COALESCE(leg, 'LEFT'), status, COALESCE(role, 'user'), created_at, updated_at
		FROM users WHERE email = $1
	`
	var u domain.User
	err := r.db.QueryRow(ctx, query, email).Scan(
		&u.ID, &u.Name, &u.Email, &u.Phone, &u.Username, &u.PasswordHash, &u.InviteCode, &u.InvitedBy,
		&u.UsdtAddress, &u.Leg, &u.Status, &u.Role, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &u, nil
}

func (r *userRepository) GetByPhone(ctx context.Context, phone string) (*domain.User, error) {
	query := `
		SELECT id, name, email, phone, username, password_hash, invite_code, invited_by, COALESCE(usdt_address, ''), COALESCE(leg, 'LEFT'), status, COALESCE(role, 'user'), created_at, updated_at
		FROM users WHERE phone = $1
	`
	var u domain.User
	err := r.db.QueryRow(ctx, query, phone).Scan(
		&u.ID, &u.Name, &u.Email, &u.Phone, &u.Username, &u.PasswordHash, &u.InviteCode, &u.InvitedBy,
		&u.UsdtAddress, &u.Leg, &u.Status, &u.Role, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &u, nil
}

func (r *userRepository) GetByInviteCode(ctx context.Context, code string) (*domain.User, error) {
	query := `
		SELECT id, name, email, phone, username, password_hash, invite_code, invited_by, COALESCE(usdt_address, ''), COALESCE(leg, 'LEFT'), status, COALESCE(role, 'user'), created_at, updated_at
		FROM users WHERE invite_code = $1
	`
	var u domain.User
	err := r.db.QueryRow(ctx, query, code).Scan(
		&u.ID, &u.Name, &u.Email, &u.Phone, &u.Username, &u.PasswordHash, &u.InviteCode, &u.InvitedBy,
		&u.UsdtAddress, &u.Leg, &u.Status, &u.Role, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &u, nil
}

func (r *userRepository) Update(ctx context.Context, user *domain.User) error {
	query := `
		UPDATE users
		SET name = $1, phone = $2, usdt_address = $3, status = $4, role = $5, password_hash = $6, updated_at = CURRENT_TIMESTAMP
		WHERE id = $7
		RETURNING updated_at
	`
	err := r.db.QueryRow(ctx, query,
		user.Name, user.Phone, user.UsdtAddress, user.Status, user.Role, user.PasswordHash, user.ID,
	).Scan(&user.UpdatedAt)
	return err
}

// UpdateAdminFields updates profile fields controlled by admins. The email
// uniqueness check must happen in the caller (transactionally if needed) so we
// can raise a targeted ErrEmailTaken instead of a generic unique violation.
func (r *userRepository) UpdateAdminFields(ctx context.Context, id uuid.UUID, name, phone, email, usdtAddress string) error {
	query := `
		UPDATE users
		SET name = $1, phone = $2, email = $3, usdt_address = $4, updated_at = CURRENT_TIMESTAMP
		WHERE id = $5
		RETURNING updated_at
	`
	_, err := r.db.Exec(ctx, query, name, phone, email, usdtAddress, id)
	return err
}

func (r *userRepository) GetTotalCount(ctx context.Context) (int, error) {
	var count int
	err := r.db.QueryRow(ctx, "SELECT COUNT(*) FROM users").Scan(&count)
	return count, err
}

func (r *userRepository) GetAll(ctx context.Context, limit, offset int) ([]*domain.User, error) {
	query := "SELECT id, name, email, phone, username, invite_code, invited_by, COALESCE(usdt_address, ''), status, created_at FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2"
	rows, err := r.db.Query(ctx, query, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []*domain.User
	for rows.Next() {
		var u domain.User
		if err := rows.Scan(&u.ID, &u.Name, &u.Email, &u.Phone, &u.Username, &u.InviteCode, &u.InvitedBy, &u.UsdtAddress, &u.Status, &u.CreatedAt); err != nil {
			return nil, err
		}
		users = append(users, &u)
	}
	return users, rows.Err()
}

// SearchUsers searches users by name/email and optionally filters by status.
func (r *userRepository) SearchUsers(ctx context.Context, limit, offset int, search, status string) ([]*domain.User, error) {
	query := `
		SELECT id, name, email, phone, username, invite_code, invited_by, COALESCE(usdt_address, ''), status, created_at
		FROM users
		WHERE 
			($1 = '' OR name ILIKE '%' || $1 || '%' OR email ILIKE '%' || $1 || '%')
			AND ($2 = '' OR status::text = $2)
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
		err := rows.Scan(&u.ID, &u.Name, &u.Email, &u.Phone, &u.Username, &u.InviteCode, &u.InvitedBy, &u.UsdtAddress, &u.Status, &u.CreatedAt)
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

// GetByIdentifier resolves a user by either their email address or their
// generated username, so login accepts both. Both columns are unique, so the
// OR lookup can never return more than one row.
func (r *userRepository) GetByIdentifier(ctx context.Context, identifier string) (*domain.User, error) {
	query := `
		SELECT id, name, email, phone, username, password_hash, invite_code, invited_by, COALESCE(usdt_address, ''), COALESCE(leg, 'LEFT'), status, COALESCE(role, 'user'), created_at, updated_at
		FROM users WHERE email = $1 OR username = $1
		ORDER BY created_at ASC
		LIMIT 1
	`
	var u domain.User
	err := r.db.QueryRow(ctx, query, identifier).Scan(
		&u.ID, &u.Name, &u.Email, &u.Phone, &u.Username, &u.PasswordHash, &u.InviteCode, &u.InvitedBy,
		&u.UsdtAddress, &u.Leg, &u.Status, &u.Role, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &u, nil
}

// GenerateUniqueUsername returns a free username of the form "MU" followed by
// 8 random digits. The partial unique index is the source of truth for
// uniqueness; a pre-check just avoids wasting an INSERT attempt on a collision.
func (r *userRepository) GenerateUniqueUsername(ctx context.Context) (string, error) {
	const charset = "0123456789"
	buf := make([]byte, 8)
	for i := 0; i < 20; i++ {
		if _, err := rand.Read(buf); err != nil {
			return "", err
		}
		for j := range buf {
			buf[j] = charset[int(buf[j])%len(charset)]
		}
		candidate := "MU" + string(buf)
		var exists bool
		if err := r.db.QueryRow(ctx, `SELECT EXISTS (SELECT 1 FROM users WHERE username = $1)`, candidate).Scan(&exists); err != nil {
			return "", err
		}
		if !exists {
			return candidate, nil
		}
	}
	return "", errors.New("could not generate a unique username")
}

// GetUsersMissingUsernameEmail lists ACTIVE users who have a username but have
// not yet received the email announcing it (used by the startup backfill).
func (r *userRepository) GetUsersMissingUsernameEmail(ctx context.Context) ([]*domain.User, error) {
	query := `
		SELECT id, name, email, phone, username
		FROM users
		WHERE status = 'ACTIVE'
		  AND username IS NOT NULL AND username <> ''
		  AND username_email_sent_at IS NULL
		ORDER BY created_at ASC
	`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []*domain.User
	for rows.Next() {
		u := &domain.User{}
		if err := rows.Scan(&u.ID, &u.Name, &u.Email, &u.Phone, &u.Username); err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, rows.Err()
}

// MarkUsernameEmailSent records that the username email was delivered for a user
// so the backfill never sends duplicates.
func (r *userRepository) MarkUsernameEmailSent(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.Exec(ctx, `UPDATE users SET username_email_sent_at = CURRENT_TIMESTAMP WHERE id = $1`, id)
	return err
}
