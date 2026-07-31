package handler

import (
	"net/http"

	"github.com/arenergyusa/musica/backend/internal/domain"
	"github.com/arenergyusa/musica/backend/internal/service"
	"github.com/arenergyusa/musica/backend/pkg/response"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type InvestmentHandler struct {
	invService   service.InvestmentService
	adminService service.AdminService
}

func NewInvestmentHandler(invService service.InvestmentService, adminService service.AdminService) *InvestmentHandler {
	return &InvestmentHandler{invService: invService, adminService: adminService}
}

func (h *InvestmentHandler) GetPlans(c *gin.Context) {
	plans, err := h.invService.GetPlans(c.Request.Context())
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Failed to get plans", err)
		return
	}
	response.Success(c, http.StatusOK, "Plans retrieved successfully", plans)
}

func (h *InvestmentHandler) ConfirmDeposit(c *gin.Context) {
	userID, err := GetUserID(c)
	if err != nil { response.Error(c, http.StatusUnauthorized, "Invalid user token", nil); return }
	invID, err := uuid.Parse(c.Param("id"))
	if err != nil { response.Error(c, http.StatusBadRequest, "Invalid investment ID", nil); return }
	var req domain.ConfirmDepositRequest
	if err := c.ShouldBindJSON(&req); err != nil { response.Error(c, http.StatusBadRequest, "Transaction hash is required", err); return }
	if err := h.adminService.ConfirmDeposit(c.Request.Context(), userID, invID, req.TxHash); err != nil {
		response.Error(c, http.StatusBadRequest, "Deposit confirmation failed", err); return
	}
	response.Success(c, http.StatusOK, "Deposit verified; investment is now active and referral rewards were distributed", nil)
}

func (h *InvestmentHandler) CreateInvestment(c *gin.Context) {
	userID, err := GetUserID(c)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, "Invalid user token", nil)
		return
	}

	var req domain.InvestRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid request payload", err)
		return
	}

	inv, err := h.invService.CreateInvestment(c.Request.Context(), userID, &req)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Failed to create investment", err)
		return
	}

	response.Success(c, http.StatusCreated, "Investment created; send the exact USDT amount and confirm with the BSC transaction hash", inv)
}

func (h *InvestmentHandler) GetMyInvestments(c *gin.Context) {
	userID, err := GetUserID(c)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, "Invalid user token", nil)
		return
	}

	invs, err := h.invService.GetMyInvestments(c.Request.Context(), userID)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Failed to get investments", err)
		return
	}
	response.Success(c, http.StatusOK, "Investments retrieved successfully", invs)
}
