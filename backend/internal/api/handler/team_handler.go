package handler

import (
	"net/http"
	"strconv"
	"strings"

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
		response.Error(c, http.StatusInternalServerError, "Failed to get referrals", err)
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
		response.Error(c, http.StatusInternalServerError, "Failed to get team stats", err)
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
		response.Error(c, http.StatusInternalServerError, "Failed to get team tree", err)
		return
	}

	response.Success(c, http.StatusOK, "Team tree retrieved successfully", tree)
}

func (h *TeamHandler) GetTeamBreakdown(c *gin.Context) {
	userID, err := GetUserID(c)
	if err != nil { response.Error(c, http.StatusUnauthorized, "Invalid user token", nil); return }
	level := 0
	if raw := c.Query("level"); raw != "" {
		level, err = strconv.Atoi(raw)
		if err != nil { response.Error(c, http.StatusBadRequest, "Invalid team level", nil); return }
	}
	status := strings.ToUpper(strings.TrimSpace(c.DefaultQuery("status", "ALL")))
	breakdown, err := h.teamService.GetTeamBreakdown(c.Request.Context(), userID, level, status)
	if err != nil { response.Error(c, http.StatusBadRequest, "Failed to get team breakdown", err); return }
	response.Success(c, http.StatusOK, "Team breakdown retrieved successfully", breakdown)
}
