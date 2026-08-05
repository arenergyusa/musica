package middleware

import (
	"net/http"
	"os"
	"strings"

	"github.com/arenergyusa/musica/backend/pkg/response"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func AuthMiddleware() gin.HandlerFunc {
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

		c.Set("user_id", claims["user_id"])
		c.Set("role", claims["role"])
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
