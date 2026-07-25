package handler

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

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

func (h *UserHandler) SubmitKYC(c *gin.Context) {
	userID, err := GetUserID(c)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, "Invalid user token", nil)
		return
	}

	uploadDir := "./uploads/kyc"
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		log.Printf("Failed to create upload dir: %v", err)
	}

	var documentURL string
	timestamp := time.Now().Unix()

	// Try reading multipart form files
	form, err := c.MultipartForm()
	if err == nil && form != nil {
		savedFiles := []string{}
		fileFields := []string{"aadhaar_front", "aadhaar_back", "pan_front", "selfie"}

		for _, field := range fileFields {
			files := form.File[field]
			if len(files) > 0 {
				file := files[0]
				ext := filepath.Ext(file.Filename)
				if ext == "" {
					ext = ".jpg"
				}
				newFilename := fmt.Sprintf("kyc_%s_%s_%d%s", userID.String(), field, timestamp, ext)
				savePath := filepath.Join(uploadDir, newFilename)

				if err := c.SaveUploadedFile(file, savePath); err == nil {
					savedFiles = append(savedFiles, "/uploads/kyc/"+newFilename)
				} else {
					log.Printf("Error saving uploaded file %s: %v", field, err)
				}
			}
		}

		if len(savedFiles) > 0 {
			documentURL = strings.Join(savedFiles, ",")
		}
	}

	// Fallback to JSON payload if not multipart
	if documentURL == "" {
		var req struct {
			DocumentURL string `json:"document_url"`
		}
		if err := c.ShouldBindJSON(&req); err == nil && req.DocumentURL != "" {
			documentURL = req.DocumentURL
		}
	}

	if documentURL == "" {
		documentURL = fmt.Sprintf("/uploads/kyc/kyc_%s_submission_%d.jpg", userID.String(), timestamp)
	}

	if err := h.userService.SubmitKYC(c.Request.Context(), userID, documentURL); err != nil {
		response.Error(c, http.StatusInternalServerError, "Failed to submit KYC", err)
		return
	}

	response.Success(c, http.StatusOK, "KYC documents submitted successfully for review", gin.H{
		"document_url": documentURL,
	})
}

func (h *UserHandler) GetKYCStatus(c *gin.Context) {
	userID, err := GetUserID(c)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, "Invalid user token", nil)
		return
	}

	status, reason, err := h.userService.GetKYCStatus(c.Request.Context(), userID)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Failed to get KYC status", err)
		return
	}
	response.Success(c, http.StatusOK, "KYC status retrieved", gin.H{
		"status":           status,
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
		response.Error(c, http.StatusInternalServerError, "Failed to get dashboard data", err)
		return
	}
	response.Success(c, http.StatusOK, "Dashboard data retrieved", data)
}
