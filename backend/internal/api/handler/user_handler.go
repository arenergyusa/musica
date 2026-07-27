package handler

import (
	"fmt"
	"io"
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
	kycVerificationService service.KYCVerificationService
}

func NewUserHandler(userService service.UserService, kycVerificationService service.KYCVerificationService) *UserHandler {
	return &UserHandler{userService: userService, kycVerificationService: kycVerificationService}
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

	form, err := c.MultipartForm()
	if err != nil || form == nil {
		response.Error(c, http.StatusBadRequest, "Camera scans are required for KYC", nil)
		return
	}

	timestamp := time.Now().Unix()
	fileFields := []string{"aadhaar_front", "aadhaar_back", "pan_front", "selfie_front", "selfie_left", "selfie_right", "selfie_up"}
	verificationFiles := make([]service.KYCFile, 0, len(fileFields))
	savedFiles := make([]string, 0, len(fileFields))
	for _, field := range fileFields {
		files := form.File[field]
		if len(files) != 1 || files[0].Size <= 0 || files[0].Size > 5*1024*1024 {
			response.Error(c, http.StatusBadRequest, "Each required camera scan must be an image up to 5MB", nil)
			return
		}
		file := files[0]
		contentType := file.Header.Get("Content-Type")
		if contentType != "image/jpeg" && contentType != "image/png" {
			response.Error(c, http.StatusBadRequest, "Only JPEG or PNG camera scans are accepted", nil)
			return
		}
		opened, err := file.Open()
		if err != nil { response.Error(c, http.StatusBadRequest, "Unable to read camera scan", nil); return }
		data, readErr := io.ReadAll(io.LimitReader(opened, 5*1024*1024+1))
		opened.Close()
		if readErr != nil || len(data) == 0 || len(data) > 5*1024*1024 { response.Error(c, http.StatusBadRequest, "Invalid camera scan", nil); return }
		verificationFiles = append(verificationFiles, service.KYCFile{Field: field, Filename: field + ".jpg", ContentType: contentType, Data: data})

		newFilename := fmt.Sprintf("kyc_%s_%s_%d.jpg", userID.String(), field, timestamp)
		if err := os.WriteFile(filepath.Join(uploadDir, newFilename), data, 0600); err != nil {
			response.Error(c, http.StatusInternalServerError, "Failed to securely save KYC scan", err)
			return
		}
		savedFiles = append(savedFiles, "/uploads/kyc/"+newFilename)
	}

	result, err := h.kycVerificationService.Verify(c.Request.Context(), verificationFiles)
	if err != nil {
		response.Error(c, http.StatusUnprocessableEntity, "Automated KYC verification could not be completed", err.Error())
		return
	}
	if err := service.ValidateKYCResult(result); err != nil {
		_ = h.userService.RejectAutomatedKYC(c.Request.Context(), userID, strings.Join(savedFiles, ","))
		response.Error(c, http.StatusUnprocessableEntity, "KYC verification failed", err.Error())
		return
	}

	if err := h.userService.CompleteAutomatedKYC(c.Request.Context(), userID, strings.Join(savedFiles, ","), result.AadhaarNumber, strings.ToUpper(result.PANNumber)); err != nil {
		response.Error(c, http.StatusInternalServerError, "Failed to submit KYC", err)
		return
	}

	response.Success(c, http.StatusOK, "KYC verified and approved", gin.H{
		"status": "APPROVED",
		"aadhaar_number": "********" + result.AadhaarNumber[8:],
		"pan_number": result.PANNumber[:5] + "****" + result.PANNumber[9:],
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
