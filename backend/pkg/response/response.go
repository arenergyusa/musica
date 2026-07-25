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
	errMsg := message
	if err != nil {
		if e, ok := err.(error); ok && e != nil {
			errMsg = e.Error()
		} else if s, ok := err.(string); ok && s != "" {
			errMsg = s
		}
		c.Error(fmt.Errorf("[ERROR] %s: %v", message, err))
	}
	c.JSON(statusCode, APIResponse{
		Success: false,
		Message: errMsg,
		Error:   "ERR_API_FAILURE",
	})
}
