package handler

import (
	"log"
	"net/http"
	"strings"

	"github.com/arenergyusa/musica/backend/internal/domain"
	"github.com/arenergyusa/musica/backend/internal/service"
	"github.com/arenergyusa/musica/backend/pkg/response"
	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	authService service.AuthService
}

func NewAuthHandler(authService service.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req domain.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	user, err := h.authService.Register(c.Request.Context(), &req)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Registration failed", err)
		return
	}

	response.Success(c, http.StatusCreated, "OTP sent to email", gin.H{"email": user.Email})
}

func (h *AuthHandler) VerifyRegister(c *gin.Context) {
	var req domain.VerifyOTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	if err := h.authService.VerifyRegisterOTP(c.Request.Context(), req.Email, req.OTP); err != nil {
		response.Error(c, http.StatusBadRequest, "OTP verification failed", err)
		return
	}

	response.Success(c, http.StatusOK, "Email verified successfully", nil)
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req domain.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	user, token, err := h.authService.Login(c.Request.Context(), req.Email, req.Password, req.RememberMe)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, "Login failed", err)
		return
	}

	maxAge := 3600 * 24
	if req.RememberMe {
		maxAge = 3600 * 24 * 30
	}

	secure := c.Request.TLS != nil || c.GetHeader("X-Forwarded-Proto") == "https"
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie("token", token, maxAge, "/", "", secure, true)

	response.Success(c, http.StatusOK, "Login successful", gin.H{
		"token": token,
		"user": gin.H{
			"id":       user.ID,
			"name":     user.Name,
			"email":    user.Email,
			"username": user.Username,
			"role":     user.Role,
			"status":   user.Status,
		},
	})
}

func (h *AuthHandler) ForgotPassword(c *gin.Context) {
	var req domain.ForgotPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	if err := h.authService.ForgotPassword(c.Request.Context(), req.Email); err != nil {
		response.Error(c, http.StatusInternalServerError, "Failed to process request", err)
		return
	}

	response.Success(c, http.StatusOK, "If email exists, an OTP has been sent", nil)
}

func (h *AuthHandler) VerifyForgotPasswordOTP(c *gin.Context) {
	var req struct {
		Email string `json:"email" binding:"required,email"`
		OTP   string `json:"otp" binding:"required,len=6"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	if err := h.authService.VerifyForgotPasswordOTP(c.Request.Context(), req.Email, req.OTP); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error(), err)
		return
	}

	response.Success(c, http.StatusOK, "OTP verified successfully", nil)
}

func (h *AuthHandler) ResetPassword(c *gin.Context) {
	var req domain.ResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	if err := h.authService.ResetPassword(c.Request.Context(), &req); err != nil {
		response.Error(c, http.StatusBadRequest, "Password reset failed", err)
		return
	}

	response.Success(c, http.StatusOK, "Password reset successfully", nil)
}

func (h *AuthHandler) Logout(c *gin.Context) {
	// Extract the token so it can be blacklisted server-side (H2).
	tokenString := c.GetHeader("Authorization")
	if strings.HasPrefix(tokenString, "Bearer ") {
		tokenString = strings.TrimPrefix(tokenString, "Bearer ")
	} else {
		tokenString, _ = c.Cookie("token")
	}
	if err := h.authService.Logout(c.Request.Context(), tokenString); err != nil {
		// Even if the token could not be blacklisted, the cookie is cleared.
		log.Printf("Logout: failed to blacklist token: %v", err)
	}

	secure := c.Request.TLS != nil || c.GetHeader("X-Forwarded-Proto") == "https"
	c.SetSameSite(http.SameSiteLaxMode)
	// Clear the cookie by setting max age to -1
	c.SetCookie("token", "", -1, "/", "", secure, true)

	response.Success(c, http.StatusOK, "Logged out successfully", nil)
}
