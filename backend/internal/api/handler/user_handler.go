package handler

import (
	"net/http"

	"github.com/arenergyusa/musica/backend/internal/domain"
	"github.com/arenergyusa/musica/backend/internal/service"
	"github.com/arenergyusa/musica/backend/pkg/response"
	"github.com/gin-gonic/gin"

)

type UserHandler struct {
	userService service.UserService
}

func NewUserHandler(userService service.UserService) *UserHandler {
	return &UserHandler{userService: userService}
}

func (h *UserHandler) GetProfile(c *gin.Context) {
	userID, err := GetUserID(c)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, "Invalid user token", nil)
		return
	}

	user, err := h.userService.GetProfile(c.Request.Context(), userID)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Failed to get profile", err.Error())
		return
	}
	response.Success(c, http.StatusOK, "Profile retrieved", user)
}

func (h *UserHandler) UpdateProfile(c *gin.Context) {
	userID, err := GetUserID(c)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, "Invalid user token", nil)
		return
	}

	var req domain.UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid request payload", err.Error())
		return
	}

	user, err := h.userService.UpdateProfile(c.Request.Context(), userID, &req)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Failed to update profile", err.Error())
		return
	}
	response.Success(c, http.StatusOK, "Profile updated", user)
}

func (h *UserHandler) SubmitKYC(c *gin.Context) {
	userID, err := GetUserID(c)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, "Invalid user token", nil)
		return
	}

	var req struct {
		DocumentURL string `json:"document_url" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid request payload", err.Error())
		return
	}

	if err := h.userService.SubmitKYC(c.Request.Context(), userID, req.DocumentURL); err != nil {
		response.Error(c, http.StatusInternalServerError, "Failed to submit KYC", err.Error())
		return
	}
	response.Success(c, http.StatusOK, "KYC submitted successfully", nil)
}

func (h *UserHandler) GetKYCStatus(c *gin.Context) {
	userID, err := GetUserID(c)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, "Invalid user token", nil)
		return
	}

	status, reason, err := h.userService.GetKYCStatus(c.Request.Context(), userID)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Failed to get KYC status", err.Error())
		return
	}
	response.Success(c, http.StatusOK, "KYC status retrieved", gin.H{
		"status": status,
		"rejection_reason": reason,
	})
}

func (h *UserHandler) GetDashboard(c *gin.Context) {
	userID, err := GetUserID(c)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, "Invalid user token", nil)
		return
	}

	data, err := h.userService.GetDashboard(c.Request.Context(), userID)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Failed to get dashboard data", err.Error())
		return
	}
	response.Success(c, http.StatusOK, "Dashboard retrieved successfully", data)
}

