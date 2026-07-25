package middleware

import (
	"context"
	"log"
	"net/http"
	"time"

	"github.com/arenergyusa/musica/backend/pkg/response"
	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
)

func RateLimiter(rdb *redis.Client) gin.HandlerFunc {
	const maxTokens = 100
	const duration = time.Minute // 100 requests per minute

	return func(c *gin.Context) {
		ip := c.ClientIP()
		key := "rate_limit:" + ip

		// Wrap in bounded context
		ctx, cancel := context.WithTimeout(c.Request.Context(), 500*time.Millisecond)
		defer cancel()

		// Use Redis pipeline for atomic increment and expire
		pipe := rdb.TxPipeline()
		incr := pipe.Incr(ctx, key)
		// Set expiration on key for rate-limiting window
		pipe.Expire(ctx, key, duration)
		_, err := pipe.Exec(ctx)

		if err != nil {
			log.Printf("ERROR: Rate limiter Redis failure for IP %s: %v", ip, err)
			// If Redis fails, allow the request but log it (fail-open for availability)
			c.Next()
			return
		}

		if incr.Val() > int64(maxTokens) {
			response.Error(c, http.StatusTooManyRequests, "Too many requests", nil)
			c.Abort()
			return
		}

		c.Next()
	}
}
