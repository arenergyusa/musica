package handler

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/arenergyusa/musica/backend/internal/service"
	"github.com/arenergyusa/musica/backend/pkg/response"
	"github.com/gin-gonic/gin"
)

type USDTHandler struct {
	usdtService  service.USDTService
	auditService service.AuditService
}

func NewUSDTHandler(usdtService service.USDTService, auditService service.AuditService) *USDTHandler {
	return &USDTHandler{
		usdtService:  usdtService,
		auditService: auditService,
	}
}

func (h *USDTHandler) GetDepositAddress(c *gin.Context) {
	addr, err := h.usdtService.GetDepositAddress(c.Request.Context())
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Failed to get deposit address", err)
		return
	}

	response.Success(c, http.StatusOK, "Deposit address retrieved", gin.H{"address": addr})
}

func (h *USDTHandler) CheckDepositReadiness(c *gin.Context) {
	wallet := strings.TrimSpace(c.Query("wallet"))
	if wallet == "" {
		response.Error(c, http.StatusBadRequest, "Wallet address is required", nil)
		return
	}
	amount, err := strconv.ParseFloat(c.DefaultQuery("amount", "0"), 64)
	if err != nil || amount <= 0 {
		response.Error(c, http.StatusBadRequest, "Invalid amount", nil)
		return
	}

	check, err := h.usdtService.CheckDepositReadiness(c.Request.Context(), wallet, amount)
	if err != nil {
		response.Error(c, http.StatusBadGateway, "Failed to check deposit readiness", err)
		return
	}

	response.Success(c, http.StatusOK, "Deposit readiness checked", check)
}

func (h *USDTHandler) GetAuditLogs(c *gin.Context) {
	userID, err := GetUserID(c)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, "Invalid user token", nil)
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	logs, err := h.auditService.GetLogsForUser(c.Request.Context(), userID, limit, offset)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Failed to fetch audit logs", err)
		return
	}

	response.Success(c, http.StatusOK, "Audit logs retrieved", logs)
}
