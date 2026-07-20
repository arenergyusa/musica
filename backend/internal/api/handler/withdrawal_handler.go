package handler

import (
	"net/http"

	"github.com/arenergyusa/musica/backend/internal/domain"
	"github.com/arenergyusa/musica/backend/internal/service"
	"github.com/arenergyusa/musica/backend/pkg/response"
	"github.com/gin-gonic/gin"

)

type WithdrawalHandler struct {
	wdService service.WithdrawalService
}

func NewWithdrawalHandler(wdService service.WithdrawalService) *WithdrawalHandler {
	return &WithdrawalHandler{wdService: wdService}
}

func (h *WithdrawalHandler) RequestWithdrawal(c *gin.Context) {
	userID, err := GetUserID(c)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, "Invalid user token", nil)
		return
	}

	var req domain.WithdrawRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid request payload", err.Error())
		return
	}

	wd, err := h.wdService.RequestWithdrawal(c.Request.Context(), userID, &req)
	if err != nil {
		response.Error(c, http.StatusBadRequest, err.Error(), nil)
		return
	}

	response.Success(c, http.StatusCreated, "Withdrawal request submitted successfully", wd)
}

func (h *WithdrawalHandler) GetHistory(c *gin.Context) {
	userID, err := GetUserID(c)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, "Invalid user token", nil)
		return
	}

	wds, err := h.wdService.GetMyWithdrawals(c.Request.Context(), userID)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Failed to get withdrawal history", err.Error())
		return
	}

	response.Success(c, http.StatusOK, "Withdrawals retrieved successfully", wds)
}

func (h *WithdrawalHandler) GetNextDates(c *gin.Context) {
	nextDate := h.wdService.GetNextWithdrawalDate()
	response.Success(c, http.StatusOK, "Next withdrawal date", gin.H{
		"next_date": nextDate.Format("2006-01-02"),
	})
}
