package handler

import (
	"net/http"
	"strings"

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


