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
	leg := "LEFT"
	if user.InvitedBy != nil {
		var count int
		_ = r.db.QueryRow(ctx, "SELECT COUNT(*) FROM users WHERE invited_by = $1", *user.InvitedBy).Scan(&count)
		if count%2 == 1 {
			leg = "RIGHT"
		}
	}
	user.Leg = leg

	query := `
		INSERT INTO users (name, email, phone, password_hash, invite_code, invited_by, leg, role, status)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id, created_at, updated_at
	`
	err := r.db.QueryRow(ctx, query,
		user.Name, user.Email, user.Phone, user.PasswordHash, user.InviteCode, user.InvitedBy, user.Leg, user.Role, user.Status,
	).Scan(&user.ID, &user.CreatedAt, &user.UpdatedAt)
	return err
}

func (r *userRepository) GetByID(ctx context.Context, id uuid.UUID) (*domain.User, error) {
	query := `
		SELECT id, name, email, phone, password_hash, invite_code, invited_by, COALESCE(usdt_address, ''), COALESCE(leg, 'LEFT'), status, COALESCE(role, 'user'), created_at, updated_at
		FROM users WHERE id = $1
	`
	var u domain.User
	err := r.db.QueryRow(ctx, query, id).Scan(
		&u.ID, &u.Name, &u.Email, &u.Phone, &u.PasswordHash, &u.InviteCode, &u.InvitedBy,
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
		SELECT id, name, email, phone, password_hash, invite_code, invited_by, COALESCE(usdt_address, ''), COALESCE(leg, 'LEFT'), status, COALESCE(role, 'user'), created_at, updated_at
		FROM users WHERE email = $1
	`
	var u domain.User
	err := r.db.QueryRow(ctx, query, email).Scan(
		&u.ID, &u.Name, &u.Email, &u.Phone, &u.PasswordHash, &u.InviteCode, &u.InvitedBy,
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
		SELECT id, name, email, phone, password_hash, invite_code, invited_by, COALESCE(usdt_address, ''), COALESCE(leg, 'LEFT'), status, COALESCE(role, 'user'), created_at, updated_at
		FROM users WHERE phone = $1
	`
	var u domain.User
	err := r.db.QueryRow(ctx, query, phone).Scan(
		&u.ID, &u.Name, &u.Email, &u.Phone, &u.PasswordHash, &u.InviteCode, &u.InvitedBy,
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
		SELECT id, name, email, phone, password_hash, invite_code, invited_by, COALESCE(usdt_address, ''), COALESCE(leg, 'LEFT'), status, COALESCE(role, 'user'), created_at, updated_at
		FROM users WHERE invite_code = $1
	`
	var u domain.User
	err := r.db.QueryRow(ctx, query, code).Scan(
		&u.ID, &u.Name, &u.Email, &u.Phone, &u.PasswordHash, &u.InviteCode, &u.InvitedBy,
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

func (r *userRepository) GetTotalCount(ctx context.Context) (int, error) {
	var count int
	err := r.db.QueryRow(ctx, "SELECT COUNT(*) FROM users").Scan(&count)
	return count, err
}

func (r *userRepository) GetAll(ctx context.Context, limit, offset int) ([]*domain.User, error) {
	query := "SELECT id, name, email, phone, invite_code, invited_by, COALESCE(usdt_address, ''), status, created_at FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2"
	rows, err := r.db.Query(ctx, query, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []*domain.User
	for rows.Next() {
		var u domain.User
		if err := rows.Scan(&u.ID, &u.Name, &u.Email, &u.Phone, &u.InviteCode, &u.InvitedBy, &u.UsdtAddress, &u.Status, &u.CreatedAt); err != nil {
			return nil, err
		}
		users = append(users, &u)
	}
	return users, rows.Err()
}

// SearchUsers searches users by name/email and optionally filters by status.
func (r *userRepository) SearchUsers(ctx context.Context, limit, offset int, search, status string) ([]*domain.User, error) {
	query := `
		SELECT id, name, email, phone, invite_code, invited_by, COALESCE(usdt_address, ''), status, created_at
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
		err := rows.Scan(&u.ID, &u.Name, &u.Email, &u.Phone, &u.InviteCode, &u.InvitedBy, &u.UsdtAddress, &u.Status, &u.CreatedAt)
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
