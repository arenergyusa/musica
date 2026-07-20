package handler

import (
	"net/http"
	"strings"

	"github.com/arenergyusa/musica/backend/internal/domain"
	"github.com/arenergyusa/musica/backend/internal/service"
	"github.com/arenergyusa/musica/backend/pkg/response"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type AdminHandler struct {
	adminService service.AdminService
}

func NewAdminHandler(adminService service.AdminService) *AdminHandler {
	return &AdminHandler{adminService: adminService}
}

func handleServiceError(c *gin.Context, err error, defaultMsg string) {
	msg := err.Error()
	if strings.Contains(msg, "not found") {
		response.Error(c, http.StatusNotFound, defaultMsg, err)
	} else if strings.Contains(msg, "invalid") || strings.Contains(msg, "insufficient") || strings.Contains(msg, "cannot") || strings.Contains(msg, "already") {
		response.Error(c, http.StatusBadRequest, defaultMsg, err)
	} else {
		response.Error(c, http.StatusInternalServerError, defaultMsg, err)
	}
}

func (h *AdminHandler) ActivateInvestment(c *gin.Context) {
	invIDStr := c.Param("id")
	invID, err := uuid.Parse(invIDStr)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid investment ID", nil)
		return
	}

	if err := h.adminService.ActivateInvestment(c.Request.Context(), invID); err != nil {
		handleServiceError(c, err, "Failed to activate investment")
		return
	}
	response.Success(c, http.StatusOK, "Investment activated successfully", nil)
}

func (h *AdminHandler) ApproveWithdrawal(c *gin.Context) {
	wdIDStr := c.Param("id")
	wdID, err := uuid.Parse(wdIDStr)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid withdrawal ID", nil)
		return
	}

	var req struct {
		AdminNote string `json:"admin_note"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid request payload", err.Error())
		return
	}

	if err := h.adminService.ApproveWithdrawal(c.Request.Context(), wdID, req.AdminNote); err != nil {
		handleServiceError(c, err, "Failed to approve withdrawal")
		return
	}
	response.Success(c, http.StatusOK, "Withdrawal approved successfully", nil)
}

func (h *AdminHandler) RejectWithdrawal(c *gin.Context) {
	wdIDStr := c.Param("id")
	wdID, err := uuid.Parse(wdIDStr)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid withdrawal ID", nil)
		return
	}

	var req struct {
		AdminNote string `json:"admin_note"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid request payload", err.Error())
		return
	}

	if err := h.adminService.RejectWithdrawal(c.Request.Context(), wdID, req.AdminNote); err != nil {
		handleServiceError(c, err, "Failed to reject withdrawal")
		return
	}
	response.Success(c, http.StatusOK, "Withdrawal rejected successfully", nil)
}

func (h *AdminHandler) GetDashboard(c *gin.Context) {
	stats, err := h.adminService.GetDashboardStats(c.Request.Context())
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Failed to get dashboard stats", err.Error())
		return
	}
	response.Success(c, http.StatusOK, "Admin dashboard stats retrieved", stats)
}

func (h *AdminHandler) GetUsers(c *gin.Context) {
	limit, offset := ParsePagination(c)
	users, err := h.adminService.GetUsers(c.Request.Context(), limit, offset)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Failed to get users", err.Error())
		return
	}
	response.Success(c, http.StatusOK, "Users retrieved", users)
}

func (h *AdminHandler) GetPendingKYC(c *gin.Context) {
	limit, offset := ParsePagination(c)
	users, err := h.adminService.GetPendingKYC(c.Request.Context(), limit, offset)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Failed to get KYC requests", err.Error())
		return
	}
	response.Success(c, http.StatusOK, "Pending KYC retrieved", users)
}

func (h *AdminHandler) ApproveKYC(c *gin.Context) {
	userIDStr := c.Param("id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid user ID", nil)
		return
	}

	if err := h.adminService.ApproveKYC(c.Request.Context(), userID); err != nil {
		handleServiceError(c, err, "Failed to approve KYC")
		return
	}
	response.Success(c, http.StatusOK, "KYC approved successfully", nil)
}

func (h *AdminHandler) RejectKYC(c *gin.Context) {
	userIDStr := c.Param("id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid user ID", nil)
		return
	}

	var req struct {
		Reason string `json:"reason" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid request payload", err.Error())
		return
	}

	if err := h.adminService.RejectKYC(c.Request.Context(), userID, req.Reason); err != nil {
		handleServiceError(c, err, "Failed to reject KYC")
		return
	}
	response.Success(c, http.StatusOK, "KYC rejected successfully", nil)
}

func (h *AdminHandler) GetAllWithdrawals(c *gin.Context) {
	limit, offset := ParsePagination(c)
	wds, err := h.adminService.GetAllWithdrawals(c.Request.Context(), limit, offset)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Failed to get withdrawals", err.Error())
		return
	}
	response.Success(c, http.StatusOK, "Withdrawals retrieved", wds)
}

func (h *AdminHandler) BlockUser(c *gin.Context) {
	userIDStr := c.Param("id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid user ID", nil)
		return
	}

	if err := h.adminService.BlockUser(c.Request.Context(), userID); err != nil {
		handleServiceError(c, err, "Failed to block user")
		return
	}
	response.Success(c, http.StatusOK, "User blocked successfully", nil)
}

func (h *AdminHandler) GetSettings(c *gin.Context) {
	settings, err := h.adminService.GetSettings(c.Request.Context())
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Failed to get settings", err.Error())
		return
	}
	response.Success(c, http.StatusOK, "Settings retrieved", settings)
}

type UpdateSettingsRequest struct {
	DailyROIPct             *float64 `json:"daily_roi_pct" binding:"required,min=0,max=100"`
	WithdrawalFeePct        *float64 `json:"withdrawal_fee_pct" binding:"required,min=0,max=100"`
	WithdrawalMinAmount     *float64 `json:"withdrawal_min_amount" binding:"required,min=0"`
	Level1To5Directs        *int     `json:"level1_to_5_directs" binding:"required,min=0"`
	Level1To5Business       *float64 `json:"level1_to_5_business" binding:"required,min=0"`
	Level1To10Directs       *int     `json:"level1_to_10_directs" binding:"required,min=0"`
	Level1To10Business      *float64 `json:"level1_to_10_business" binding:"required,min=0"`
	Level1To15Directs       *int     `json:"level1_to_15_directs" binding:"required,min=0"`
	Level1To15Business      *float64 `json:"level1_to_15_business" binding:"required,min=0"`
	RefRewardL1Pct          *float64 `json:"ref_reward_l1_pct" binding:"required,min=0,max=100"`
	RefRewardL2Pct          *float64 `json:"ref_reward_l2_pct" binding:"required,min=0,max=100"`
	RefRewardL3Pct          *float64 `json:"ref_reward_l3_pct" binding:"required,min=0,max=100"`
	LevelIncomeL1Pct        *float64 `json:"level_income_l1_pct" binding:"required,min=0,max=100"`
	LevelIncomeL2Pct        *float64 `json:"level_income_l2_pct" binding:"required,min=0,max=100"`
	LevelIncomeL3Pct        *float64 `json:"level_income_l3_pct" binding:"required,min=0,max=100"`
	LevelIncomeL4ToL10Pct   *float64 `json:"level_income_l4_to_l10_pct" binding:"required,min=0,max=100"`
	LevelIncomeL11ToL15Pct  *float64 `json:"level_income_l11_to_l15_pct" binding:"required,min=0,max=100"`
	NonWorkingCapMultiplier *float64 `json:"non_working_cap_multiplier" binding:"required,min=1"`
	WorkingCapMultiplier    *float64 `json:"working_cap_multiplier" binding:"required,min=1"`
}

func (h *AdminHandler) UpdateSettings(c *gin.Context) {
	var req UpdateSettingsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid request payload or failed validation", err.Error())
		return
	}

	// Validate tier ordering
	if *req.Level1To10Directs < *req.Level1To5Directs || *req.Level1To15Directs < *req.Level1To10Directs {
		response.Error(c, http.StatusBadRequest, "Direct counts must be monotonically ordered (L5 <= L10 <= L15)", nil)
		return
	}
	if *req.Level1To10Business < *req.Level1To5Business || *req.Level1To15Business < *req.Level1To10Business {
		response.Error(c, http.StatusBadRequest, "Business thresholds must be monotonically ordered (L5 <= L10 <= L15)", nil)
		return
	}

	settings := &domain.PlatformSettings{
		DailyROIPct:             *req.DailyROIPct,
		WithdrawalFeePct:        *req.WithdrawalFeePct,
		WithdrawalMinAmount:     *req.WithdrawalMinAmount,
		Level1To5Directs:        *req.Level1To5Directs,
		Level1To5Business:       *req.Level1To5Business,
		Level1To10Directs:       *req.Level1To10Directs,
		Level1To10Business:      *req.Level1To10Business,
		Level1To15Directs:       *req.Level1To15Directs,
		Level1To15Business:      *req.Level1To15Business,
		RefRewardL1Pct:          *req.RefRewardL1Pct,
		RefRewardL2Pct:          *req.RefRewardL2Pct,
		RefRewardL3Pct:          *req.RefRewardL3Pct,
		LevelIncomeL1Pct:        *req.LevelIncomeL1Pct,
		LevelIncomeL2Pct:        *req.LevelIncomeL2Pct,
		LevelIncomeL3Pct:        *req.LevelIncomeL3Pct,
		LevelIncomeL4ToL10Pct:   *req.LevelIncomeL4ToL10Pct,
		LevelIncomeL11ToL15Pct:  *req.LevelIncomeL11ToL15Pct,
		NonWorkingCapMultiplier: *req.NonWorkingCapMultiplier,
		WorkingCapMultiplier:    *req.WorkingCapMultiplier,
	}

	if err := h.adminService.UpdateSettings(c.Request.Context(), settings); err != nil {
		handleServiceError(c, err, "Failed to update settings")
		return
	}
	response.Success(c, http.StatusOK, "Settings updated successfully", nil)
}
