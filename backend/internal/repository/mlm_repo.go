package repository

import (
	"context"
	"errors"

	"github.com/arenergyusa/musica/backend/internal/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type mlmRepository struct {
	db *pgxpool.Pool
}

func NewMLMRepository(db *pgxpool.Pool) MLMRepository {
	return &mlmRepository{db: db}
}

// InsertNode inserts a user into the invite tree.
// The uplineID must already exist in the tree. The root node has no upline.
func (r *mlmRepository) InsertNode(ctx context.Context, userID uuid.UUID, uplineID uuid.UUID) error {
	query := `
		INSERT INTO invite_tree (user_id, upline_id, level, path)
		SELECT 
			$1::uuid, 
			$2::uuid, 
			level + 1, 
			path || text2ltree(replace(($1::uuid)::text, '-', '_'))
		FROM invite_tree 
		WHERE user_id = $2::uuid
	`
	// Handle root node if upline is zero UUID
	if uplineID == uuid.Nil {
		query = `
			INSERT INTO invite_tree (user_id, upline_id, level, path)
			VALUES ($1::uuid, NULL, 1, text2ltree(replace(($1::uuid)::text, '-', '_')))
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
		SELECT u.id, u.name, u.email, u.phone, u.invite_code, u.status, u.created_at
		FROM users u
		JOIN invite_tree t ON u.id = t.user_id
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
		if err := rows.Scan(&u.ID, &u.Name, &u.Email, &u.Phone, &u.InviteCode, &u.Status, &u.CreatedAt); err != nil {
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
			FROM invite_tree 
			WHERE path <@ (
				SELECT path FROM invite_tree WHERE user_id = $1
			) AND user_id != $1
		)
		SELECT COALESCE(SUM(amount), 0)
		FROM sponsorships
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
			FROM invite_tree t
			JOIN sponsorships i ON t.user_id = i.user_id
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
		JOIN invite_tree t ON u.id = t.user_id
		JOIN sponsorships i ON u.id = i.user_id
		WHERE t.upline_id = $1 AND i.status = 'ACTIVE'
	`
	var volume float64
	var count int
	err := r.db.QueryRow(ctx, query, userID).Scan(&volume, &count)
	return volume, count, err
}

// GetUplineChain returns the chain of upline user IDs from level 1 (direct upline) up to maxLevels.
// Uses ltree path to walk up the tree efficiently.
func (r *mlmRepository) GetUplineChain(ctx context.Context, userID uuid.UUID, maxLevels int) ([]uuid.UUID, error) {
	// We get the path of the current user, then find all ancestors in order
	query := `
		WITH my_node AS (
			SELECT path, level FROM invite_tree WHERE user_id = $1
		),
		ancestors AS (
			SELECT rt.user_id, rt.level, my_node.level - rt.level AS depth
			FROM invite_tree rt, my_node
			WHERE rt.path @> my_node.path  -- ancestor path contains my path
			  AND rt.user_id != $1
			  AND (my_node.level - rt.level) BETWEEN 1 AND $2
		)
		SELECT user_id FROM ancestors ORDER BY depth ASC
	`
	rows, err := r.db.Query(ctx, query, userID, maxLevels)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var chain []uuid.UUID
	for rows.Next() {
		var id uuid.UUID
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		chain = append(chain, id)
	}
	return chain, rows.Err()
}

// GetAncestorAtLevel returns the ancestor at exactly `level` positions above in the tree.
func (r *mlmRepository) GetAncestorAtLevel(ctx context.Context, userID uuid.UUID, level int) (*uuid.UUID, error) {
	query := `
		WITH my_node AS (
			SELECT path, level AS my_level FROM invite_tree WHERE user_id = $1
		)
		SELECT rt.user_id
		FROM invite_tree rt, my_node
		WHERE rt.path @> my_node.path
		  AND rt.user_id != $1
		  AND (my_node.my_level - rt.level) = $2
		LIMIT 1
	`
	var id uuid.UUID
	err := r.db.QueryRow(ctx, query, userID, level).Scan(&id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil // not found = no ancestor at that level
		}
		return nil, err
	}
	return &id, nil
}
