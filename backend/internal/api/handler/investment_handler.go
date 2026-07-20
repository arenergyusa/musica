package handler

import (
	"net/http"

	"github.com/arenergyusa/musica/backend/internal/domain"
	"github.com/arenergyusa/musica/backend/internal/service"
	"github.com/arenergyusa/musica/backend/pkg/response"
	"github.com/gin-gonic/gin"

)

type InvestmentHandler struct {
	invService service.InvestmentService
}

func NewInvestmentHandler(invService service.InvestmentService) *InvestmentHandler {
	return &InvestmentHandler{invService: invService}
}

func (h *InvestmentHandler) GetPlans(c *gin.Context) {
	plans, err := h.invService.GetPlans(c.Request.Context())
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Failed to get plans", err.Error())
		return
	}
	response.Success(c, http.StatusOK, "Plans retrieved successfully", plans)
}

func (h *InvestmentHandler) CreateInvestment(c *gin.Context) {
	userID, err := GetUserID(c)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, "Invalid user token", nil)
		return
	}

	var req domain.InvestRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid request payload", err.Error())
		return
	}

	inv, err := h.invService.CreateInvestment(c.Request.Context(), userID, &req)
	if err != nil {
		response.Error(c, http.StatusBadRequest, err.Error(), nil)
		return
	}

	response.Success(c, http.StatusCreated, "Investment created and pending admin approval", inv)
}

func (h *InvestmentHandler) GetMyInvestments(c *gin.Context) {
	userID, err := GetUserID(c)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, "Invalid user token", nil)
		return
	}

	invs, err := h.invService.GetMyInvestments(c.Request.Context(), userID)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Failed to get investments", err.Error())
		return
	}
	response.Success(c, http.StatusOK, "Investments retrieved successfully", invs)
}
