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
		response.Error(c, http.StatusInternalServerError, "Failed to get profile", err)
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
		response.Error(c, http.StatusBadRequest, "Invalid request payload", err)
		return
	}

	user, err := h.userService.UpdateProfile(c.Request.Context(), userID, &req)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Failed to update profile", err)
		return
	}
	response.Success(c, http.StatusOK, "Profile updated", user)
}

func (h *UserHandler) ChangePassword(c *gin.Context) {
	userID, err := GetUserID(c)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, "Invalid user token", nil)
		return
	}

	var req domain.ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid request payload", err)
		return
	}

	if err := h.userService.ChangePassword(c.Request.Context(), userID, req.CurrentPassword, req.NewPassword); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error(), nil)
		return
	}
	response.Success(c, http.StatusOK, "Password changed successfully", nil)
}

func (h *UserHandler) GetDashboard(c *gin.Context) {
	userID, err := GetUserID(c)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, "Invalid user token", nil)
		return
	}

	data, err := h.userService.GetDashboard(c.Request.Context(), userID)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Failed to get dashboard data", err)
		return
	}
	response.Success(c, http.StatusOK, "Dashboard data retrieved", data)
}
