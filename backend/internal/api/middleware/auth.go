package middleware

import (
	"context"
	"errors"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/arenergyusa/musica/backend/pkg/response"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

// AuthMiddleware verifies the JWT and then re-checks the user against the DB on
// every request so that:
//   - blocked users are rejected immediately even while their token is still
//     valid (H1),
//   - tokens blacklisted at logout are rejected (H2),
//   - the role is always re-derived from the DB instead of trusting the token
//     claim, so role changes take effect immediately (H4).
func AuthMiddleware(db *pgxpool.Pool, rdb *redis.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		var tokenString string

		if authHeader != "" {
			parts := strings.Split(authHeader, " ")
			if len(parts) == 2 && parts[0] == "Bearer" {
				tokenString = parts[1]
			}
		}

		// Fallback to cookie
		if tokenString == "" {
			cookie, err := c.Cookie("token")
			if err == nil && cookie != "" {
				tokenString = cookie
			}
		}

		if tokenString == "" {
			response.Error(c, http.StatusUnauthorized, "Authorization token is missing", nil)
			c.Abort()
			return
		}

		secretStr := os.Getenv("JWT_SECRET")
		if secretStr == "" {
			response.Error(c, http.StatusInternalServerError, "JWT authentication secret is not configured", nil)
			c.Abort()
			return
		}
		secret := []byte(secretStr)

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return secret, nil
		})

		if err != nil || !token.Valid {
			response.Error(c, http.StatusUnauthorized, "Invalid or expired token", nil)
			c.Abort()
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			response.Error(c, http.StatusUnauthorized, "Invalid token claims", nil)
			c.Abort()
			return
		}

		// Reject tokens that were blacklisted at logout (H2). A Redis failure is
		// tolerated here (token still expires on its own) to avoid locking all
		// users out when the cache is down.
		if rdb != nil {
			if jti, ok := claims["jti"].(string); ok && jti != "" {
				ctx, cancel := context.WithTimeout(c.Request.Context(), 500*time.Millisecond)
				exists, _ := rdb.Exists(ctx, "token:blacklist:"+jti).Result()
				cancel()
				if exists == 1 {
					response.Error(c, http.StatusUnauthorized, "Session has been logged out", nil)
					c.Abort()
					return
				}
			}
		}

		// Load the user and re-derive role/status from the DB (H1/H4).
		userIDStr, ok := claims["user_id"].(string)
		if !ok {
			response.Error(c, http.StatusUnauthorized, "Invalid token claims", nil)
			c.Abort()
			return
		}
		userID, err := uuid.Parse(userIDStr)
		if err != nil {
			response.Error(c, http.StatusUnauthorized, "Invalid token claims", nil)
			c.Abort()
			return
		}

		var role, status string
		err = db.QueryRow(c.Request.Context(),
			`SELECT role, status FROM users WHERE id = $1`, userID,
		).Scan(&role, &status)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				response.Error(c, http.StatusUnauthorized, "Account no longer exists", nil)
			} else {
				response.Error(c, http.StatusInternalServerError, "Authentication is temporarily unavailable", nil)
			}
			c.Abort()
			return
		}
		if status == "BLOCKED" {
			response.Error(c, http.StatusForbidden, "Account is blocked", nil)
			c.Abort()
			return
		}

		c.Set("user_id", userID.String())
		c.Set("role", role)
		c.Set("user_status", status)
		c.Next()
	}
}

func AdminMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("role")
		if !exists || (role != "admin" && role != "super_admin") {
			response.Error(c, http.StatusForbidden, "Admin access required", nil)
			c.Abort()
			return
		}
		c.Next()
	}
}
