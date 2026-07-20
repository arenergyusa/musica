package handler

import (
	"net/http"

	"github.com/arenergyusa/musica/backend/internal/service"
	"github.com/arenergyusa/musica/backend/pkg/response"
	"github.com/gin-gonic/gin"

)

type WalletHandler struct {
	walletService service.WalletService
}

func NewWalletHandler(walletService service.WalletService) *WalletHandler {
	return &WalletHandler{walletService: walletService}
}

func (h *WalletHandler) GetBalance(c *gin.Context) {
	userID, err := GetUserID(c)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, "Invalid user token", nil)
		return
	}

	wallet, err := h.walletService.GetBalance(c.Request.Context(), userID)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Failed to fetch wallet balance", err.Error())
		return
	}

	response.Success(c, http.StatusOK, "Wallet balance retrieved successfully", wallet)
}

func (h *WalletHandler) GetTransactions(c *gin.Context) {
	userID, err := GetUserID(c)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, "Invalid user token", nil)
		return
	}
	limit, offset := ParsePagination(c)

	txs, err := h.walletService.GetTransactions(c.Request.Context(), userID, limit, offset)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Failed to fetch transactions", err.Error())
		return
	}

	response.Success(c, http.StatusOK, "Transactions retrieved successfully", txs)
}
