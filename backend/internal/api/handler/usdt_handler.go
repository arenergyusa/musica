package handler

import (
	"net/http"
	"strconv"

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
