package handler

import (
	"net/http"

	"github.com/arenergyusa/musica/backend/internal/service"
	"github.com/arenergyusa/musica/backend/pkg/response"
	"github.com/gin-gonic/gin"

)

type TeamHandler struct {
	teamService service.TeamService
}

func NewTeamHandler(teamService service.TeamService) *TeamHandler {
	return &TeamHandler{teamService: teamService}
}

func (h *TeamHandler) GetDirectReferrals(c *gin.Context) {
	userID, err := GetUserID(c)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, "Invalid user token", nil)
		return
	}

	users, err := h.teamService.GetDirectReferrals(c.Request.Context(), userID)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Failed to get referrals", err.Error())
		return
	}

	response.Success(c, http.StatusOK, "Direct referrals retrieved successfully", users)
}

func (h *TeamHandler) GetTeamStats(c *gin.Context) {
	userID, err := GetUserID(c)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, "Invalid user token", nil)
		return
	}

	stats, err := h.teamService.GetTeamStats(c.Request.Context(), userID)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Failed to get team stats", err.Error())
		return
	}

	response.Success(c, http.StatusOK, "Team stats retrieved successfully", stats)
}

func (h *TeamHandler) GetTree(c *gin.Context) {
	userID, err := GetUserID(c)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, "Invalid user token", nil)
		return
	}

	tree, err := h.teamService.GetTree(c.Request.Context(), userID)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Failed to get team tree", err.Error())
		return
	}

	response.Success(c, http.StatusOK, "Team tree retrieved successfully", tree)
}
