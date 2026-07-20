package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/arenergyusa/musica/backend/pkg/response"
	"github.com/gin-gonic/gin"
)

type rateLimiter struct {
	mu      sync.Mutex
	clients map[string]*clientData
}

type clientData struct {
	tokens     int
	lastRefill time.Time
}

func RateLimiter() gin.HandlerFunc {
	const maxTokens = 100
	const refillRate = 2 // tokens per second
	
	limiter := &rateLimiter{
		clients: make(map[string]*clientData),
	}

	return func(c *gin.Context) {
		ip := c.ClientIP()
		
		limiter.mu.Lock()
		client, exists := limiter.clients[ip]
		now := time.Now()
		
		if !exists {
			client = &clientData{
				tokens:     maxTokens - 1,
				lastRefill: now,
			}
			limiter.clients[ip] = client
			limiter.mu.Unlock()
			c.Next()
			return
		}
		
		elapsed := now.Sub(client.lastRefill).Seconds()
		if elapsed > 0 {
			refill := int(elapsed * refillRate)
			if refill > 0 {
				client.tokens += refill
				if client.tokens > maxTokens {
					client.tokens = maxTokens
				}
				client.lastRefill = now
			}
		}

		if client.tokens <= 0 {
			limiter.mu.Unlock()
			response.Error(c, http.StatusTooManyRequests, "Too many requests", nil)
			c.Abort()
			return
		}
		
		client.tokens--
		limiter.mu.Unlock()
		
		c.Next()
	}
}
