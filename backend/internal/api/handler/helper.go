package handler

import (
	"errors"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// GetUserID extracts and parses the user ID from the gin context.
func GetUserID(c *gin.Context) (uuid.UUID, error) {
	userIDStr := c.GetString("user_id")
	if userIDStr == "" {
		return uuid.Nil, errors.New("user_id not found in context")
	}
	return uuid.Parse(userIDStr)
}

func ParsePagination(c *gin.Context) (int, int) {
	limitStr := c.DefaultQuery("limit", "20")
	offsetStr := c.DefaultQuery("offset", "0")
	limit, errLimit := strconv.Atoi(limitStr)
	if errLimit != nil || limit <= 0 {
		limit = 20
	} else if limit > 100 {
		limit = 100
	}
	
	offset, errOffset := strconv.Atoi(offsetStr)
	if errOffset != nil || offset < 0 {
		offset = 0
	}
	return limit, offset
}
