package middleware

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/arenergyusa/musica/backend/pkg/response"
	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
)

// AuthRateLimiter provides a dedicated, stricter rate limit for authentication
// endpoints (login, register, OTP, password reset). It keys on both the client
// IP and the email address from the request body so that neither an IP sweep
// nor a per-email lockout can trivially bypass it (H3).
//
// Unlike the global limiter this is FAIL-CLOSED: if Redis is unavailable the
// auth endpoints return 429 instead of silently allowing unlimited attempts.
func AuthRateLimiter(rdb *redis.Client) gin.HandlerFunc {
	const maxAttempts = 10
	const window = time.Minute

	return func(c *gin.Context) {
		var email string
		if c.Request.Body != nil {
			body, err := io.ReadAll(c.Request.Body)
			if err == nil {
				c.Request.Body = io.NopCloser(bytes.NewReader(body))
				var payload struct {
					Email string `json:"email"`
				}
				_ = json.Unmarshal(body, &payload)
				email = strings.ToLower(strings.TrimSpace(payload.Email))
			}
		}

		key := "auth_limit:ip:" + c.ClientIP()
		if email != "" {
			key += ":email:" + email
		}

		ctx, cancel := context.WithTimeout(c.Request.Context(), 500*time.Millisecond)
		defer cancel()

		pipe := rdb.TxPipeline()
		incr := pipe.Incr(ctx, key)
		pipe.Expire(ctx, key, window)
		if _, err := pipe.Exec(ctx); err != nil {
			// Fail closed: if we cannot count attempts we do not allow more.
			response.Error(c, http.StatusTooManyRequests, "Service temporarily unavailable. Please try again shortly.", nil)
			c.Abort()
			return
		}

		if incr.Val() > int64(maxAttempts) {
			response.Error(c, http.StatusTooManyRequests, "Too many attempts. Please wait a minute and try again.", nil)
			c.Abort()
			return
		}

		c.Next()
	}
}
