package response

import (
	"fmt"
	"github.com/gin-gonic/gin"
)

type APIResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
	Error   interface{} `json:"error,omitempty"`
}

func Success(c *gin.Context, statusCode int, message string, data interface{}) {
	c.JSON(statusCode, APIResponse{
		Success: true,
		Message: message,
		Data:    data,
	})
}

func Error(c *gin.Context, statusCode int, message string, err interface{}) {
	if err != nil {
		c.Error(fmt.Errorf("[ERROR] %s: %v", message, err))
	}
	c.JSON(statusCode, APIResponse{
		Success: false,
		Message: message,
		Error:   "ERR_API_FAILURE",
	})
}
