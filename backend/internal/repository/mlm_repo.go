package repository

import (
	"context"
	"errors"

	"github.com/arenergyusa/musica/backend/internal/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type mlmRepository struct {
	db *pgxpool.Pool
}

func NewMLMRepository(db *pgxpool.Pool) MLMRepository {
	return &mlmRepository{db: db}
}

// InsertNode inserts a user into the referral tree.
// The uplineID must already exist in the tree. The root node has no upline.
func (r *mlmRepository) InsertNode(ctx context.Context, userID uuid.UUID, uplineID uuid.UUID) error {
	query := `
		INSERT INTO referral_tree (user_id, upline_id, level, path)
		SELECT 
			$1, 
			$2, 
			level + 1, 
			path || text2ltree(replace($1::text, '-', '_'))
		FROM referral_tree 
		WHERE user_id = $2
	`
	// Handle root node if upline is zero UUID
	if uplineID == uuid.Nil {
		query = `
			INSERT INTO referral_tree (user_id, upline_id, level, path)
			VALUES ($1, NULL, 1, text2ltree(replace($1::text, '-', '_')))
		`
		_, err := r.db.Exec(ctx, query, userID)
		return err
	}

	res, err := r.db.Exec(ctx, query, userID, uplineID)
	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		return errors.New("upline not found")
	}
	return nil
}

func (r *mlmRepository) GetDirectReferrals(ctx context.Context, userID uuid.UUID) ([]*domain.User, error) {
	query := `
		SELECT u.id, u.name, u.email, u.phone, u.referral_code, u.status, u.created_at
		FROM users u
		JOIN referral_tree t ON u.id = t.user_id
		WHERE t.upline_id = $1
	`
	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []*domain.User
	for rows.Next() {
		u := &domain.User{}
		if err := rows.Scan(&u.ID, &u.Name, &u.Email, &u.Phone, &u.ReferralCode, &u.Status, &u.CreatedAt); err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return users, nil
}

func (r *mlmRepository) GetDownlineVolume(ctx context.Context, userID uuid.UUID) (float64, error) {
	query := `
		WITH downline AS (
			SELECT user_id 
			FROM referral_tree 
			WHERE path <@ (
				SELECT path FROM referral_tree WHERE user_id = $1
			) AND user_id != $1
		)
		SELECT COALESCE(SUM(amount), 0)
		FROM investments
		WHERE user_id IN (SELECT user_id FROM downline)
		  AND status = 'ACTIVE'
	`
	var volume float64
	err := r.db.QueryRow(ctx, query, userID).Scan(&volume)
	return volume, err
}


func (r *mlmRepository) HasActiveDirectReferral(ctx context.Context, userID uuid.UUID) (bool, error) {
	query := `
		SELECT EXISTS (
			SELECT 1 
			FROM referral_tree t
			JOIN investments i ON t.user_id = i.user_id
			WHERE t.upline_id = $1 AND i.status = 'ACTIVE'
		)
	`
	var hasActive bool
	err := r.db.QueryRow(ctx, query, userID).Scan(&hasActive)
	return hasActive, err
}

func (r *mlmRepository) GetDirectVolumeAndCount(ctx context.Context, userID uuid.UUID) (float64, int, error) {
	query := `
		SELECT 
			COALESCE(SUM(i.amount), 0) as total_volume,
			COUNT(DISTINCT u.id) as active_directs
		FROM users u
		JOIN referral_tree t ON u.id = t.user_id
		JOIN investments i ON u.id = i.user_id
		WHERE t.upline_id = $1 AND i.status = 'ACTIVE'
	`
	var volume float64
	var count int
	err := r.db.QueryRow(ctx, query, userID).Scan(&volume, &count)
	return volume, count, err
}
