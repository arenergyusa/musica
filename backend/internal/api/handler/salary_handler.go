package handler

import (
	"net/http"

	"github.com/arenergyusa/musica/backend/internal/domain"
	"github.com/arenergyusa/musica/backend/internal/repository"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type SalaryHandler struct {
	salaryRepo repository.SalaryRepository
}

func NewSalaryHandler(salaryRepo repository.SalaryRepository) *SalaryHandler {
	return &SalaryHandler{salaryRepo: salaryRepo}
}

// GetUserSalaryProgress returns live progress, remaining volume ("kitna baki hai"), 60:40 balance meter & 25% monthly increment for authenticated user

// DivideDownlines assign left/right leg positions for a user's downline IDs in alternating order (1-left,2-right,3-left,...)
// Legs are locked once a downline has active business (ACTIVE sponsorship or salary qualification).
func (h *SalaryHandler) DivideDownlines(c *gin.Context) {
    userID, err := GetUserID(c)
    if err != nil {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized", "details": err.Error()})
        return
    }
    var payload struct {
        DownlineIDs []string `json:"downline_ids"`
    }
    if err := c.ShouldBindJSON(&payload); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payload", "details": err.Error()})
        return
    }
    // Assign legs alternating left/right
    assigned := 0
    locked := 0
    for i, idStr := range payload.DownlineIDs {
        downID, parseErr := uuid.Parse(idStr)
        if parseErr != nil {
            continue // skip invalid IDs
        }
        leg := "LEFT"
        if i%2 == 1 {
            leg = "RIGHT"
        }
        // Update in repository
        if updErr := h.salaryRepo.SetDownlineLeg(c.Request.Context(), userID, downID, leg); updErr != nil {
            locked++
        } else {
            assigned++
        }
    }
    c.JSON(http.StatusOK, gin.H{"message": "Downlines assigned", "assigned": assigned, "locked": locked})
}

// GetUserSalaryProgress returns live progress, remaining volume ("kitna baki hai"), 60:40 balance meter & 25% monthly increment for authenticated user
func (h *SalaryHandler) GetUserSalaryProgress(c *gin.Context) {
	userID, err := GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized", "details": err.Error()})
		return
	}

	progress, err := h.salaryRepo.GetSalaryProgress(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to calculate salary progress", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": progress})
}

// GetSalaryTiers returns all dynamic database-driven salary tiers
func (h *SalaryHandler) GetSalaryTiers(c *gin.Context) {
	tiers, err := h.salaryRepo.GetSalaryTiers(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load salary tiers", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": tiers})
}

// UpdateSalaryTier allows Admin to dynamically update any salary tier
func (h *SalaryHandler) UpdateSalaryTier(c *gin.Context) {
	var input domain.SalaryTier
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input payload", "details": err.Error()})
		return
	}

	if input.Tier < 1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Tier must be 1 or greater"})
		return
	}

	err := h.salaryRepo.UpdateSalaryTier(c.Request.Context(), &input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update salary tier", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Salary tier updated successfully", "data": input})
}

// TriggerSalaryPayout allows Admin to execute or test monthly salary distribution
func (h *SalaryHandler) TriggerSalaryPayout(c *gin.Context) {
	payoutCount, totalAmount, err := h.salaryRepo.ProcessMonthlySalaryPayouts(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process salary payouts", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":      "Monthly salary payout completed",
		"payout_count": payoutCount,
		"total_amount": totalAmount,
	})
}
