package domain

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID           uuid.UUID `json:"id" db:"id"`
	Name         string    `json:"name" db:"name"`
	Email        string    `json:"email" db:"email"`
	Phone        string    `json:"phone" db:"phone"`
	PasswordHash string    `json:"-" db:"password_hash"`
	ReferralCode string    `json:"referral_code" db:"referral_code"`
	ReferredBy   *uuid.UUID `json:"referred_by,omitempty" db:"referred_by"`
	KycStatus          string    `json:"kyc_status" db:"kyc_status"` // PENDING, APPROVED, REJECTED
	KycRejectionReason string    `json:"kyc_rejection_reason,omitempty" db:"kyc_rejection_reason"`
	BankAccount        string    `json:"-" db:"bank_account"`
	IFSC         string    `json:"-" db:"ifsc"`
	PAN          string    `json:"-" db:"pan"`
	Aadhaar      string    `json:"-" db:"aadhaar"`
	Status       string    `json:"status" db:"status"` // ACTIVE, BLOCKED
	Role         string    `json:"role" db:"role"`
	DocumentURL  string    `json:"document_url" db:"document_url"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time `json:"updated_at" db:"updated_at"`
}

type InvestmentPlan struct {
	ID                      uuid.UUID `json:"id" db:"id"`
	Name                    string    `json:"name" db:"name"`
	MinAmount               float64   `json:"min_amount" db:"min_amount"`
	DailyRatePct            float64   `json:"daily_rate_pct" db:"daily_rate_pct"`
	Description             string    `json:"description" db:"description"`
	IsActive                bool      `json:"is_active" db:"is_active"`
	NonWorkingCapMultiplier float64   `json:"non_working_cap_multiplier"`
	WorkingCapMultiplier    float64   `json:"working_cap_multiplier"`
}

type Investment struct {
	ID                   uuid.UUID  `json:"id" db:"id"`
	UserID               uuid.UUID  `json:"user_id" db:"user_id"`
	Amount               float64    `json:"amount" db:"amount"`
	DailyRatePct         float64    `json:"daily_rate_pct" db:"daily_rate_pct"`
	Status               string     `json:"status" db:"status"` // PENDING, ACTIVE, CLOSED, CAPPED
	TotalRewardEarned    float64    `json:"total_reward_earned" db:"total_reward_earned"`
	CapLimit             float64    `json:"cap_limit" db:"cap_limit"`
	WorkingCapAtCreation bool       `json:"working_cap_at_creation" db:"working_cap_at_creation"`
	CreatedAt            time.Time  `json:"created_at" db:"created_at"`
	ClosedAt             *time.Time `json:"closed_at,omitempty" db:"closed_at"`
}

type RewardWallet struct {
	ID             uuid.UUID `json:"id" db:"id"`
	UserID         uuid.UUID `json:"user_id" db:"user_id"`
	Balance        float64   `json:"balance" db:"balance"`
	TotalCredited  float64   `json:"total_credited" db:"total_credited"`
	TotalWithdrawn float64   `json:"total_withdrawn" db:"total_withdrawn"`
}

type Transaction struct {
	ID          uuid.UUID `json:"id" db:"id"`
	UserID      uuid.UUID `json:"user_id" db:"user_id"`
	Type        string    `json:"type" db:"type"`     // CREDIT, DEBIT
	Source      string    `json:"source" db:"source"` // DAILY_ROI, REFERRAL, LEVEL_INCOME, WITHDRAWAL
	Amount      float64   `json:"amount" db:"amount"`
	ReferenceID string    `json:"reference_id,omitempty" db:"reference_id"`
	Description string    `json:"description,omitempty" db:"description"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
}

type Withdrawal struct {
	ID              uuid.UUID  `json:"id" db:"id"`
	UserID          uuid.UUID  `json:"user_id" db:"user_id"`
	AmountRequested float64    `json:"amount_requested" db:"amount_requested"`
	TDSAmount       float64    `json:"tds_amount" db:"tds_amount"`
	NetAmount       float64    `json:"net_amount" db:"net_amount"`
	Status          string     `json:"status" db:"status"` // PENDING, APPROVED, PROCESSED, REJECTED
	PaymentRef      string     `json:"payment_ref,omitempty" db:"payment_ref"`
	ScheduledDate   time.Time  `json:"scheduled_date" db:"scheduled_date"`
	ProcessedAt     *time.Time `json:"processed_at,omitempty" db:"processed_at"`
	AdminNote       string     `json:"admin_note,omitempty" db:"admin_note"`
	CreatedAt       time.Time  `json:"created_at" db:"created_at"`
}

type PlatformSettings struct {
	ID                         int       `json:"id" db:"id"`
	DailyROIPct                float64   `json:"daily_roi_pct" db:"daily_roi_pct"`
	WithdrawalFeePct           float64   `json:"withdrawal_fee_pct" db:"withdrawal_fee_pct"`
	WithdrawalMinAmount        float64   `json:"withdrawal_min_amount" db:"withdrawal_min_amount"`
	Level1To5Directs           int       `json:"level1_to_5_directs" db:"level1_to_5_directs"`
	Level1To5Business          float64   `json:"level1_to_5_business" db:"level1_to_5_business"`
	Level1To10Directs          int       `json:"level1_to_10_directs" db:"level1_to_10_directs"`
	Level1To10Business         float64   `json:"level1_to_10_business" db:"level1_to_10_business"`
	Level1To15Directs          int       `json:"level1_to_15_directs" db:"level1_to_15_directs"`
	Level1To15Business         float64   `json:"level1_to_15_business" db:"level1_to_15_business"`
	RefRewardL1Pct             float64   `json:"ref_reward_l1_pct" db:"ref_reward_l1_pct"`
	RefRewardL2Pct             float64   `json:"ref_reward_l2_pct" db:"ref_reward_l2_pct"`
	RefRewardL3Pct             float64   `json:"ref_reward_l3_pct" db:"ref_reward_l3_pct"`
	LevelIncomeL1Pct           float64   `json:"level_income_l1_pct" db:"level_income_l1_pct"`
	LevelIncomeL2Pct           float64   `json:"level_income_l2_pct" db:"level_income_l2_pct"`
	LevelIncomeL3Pct           float64   `json:"level_income_l3_pct" db:"level_income_l3_pct"`
	LevelIncomeL4ToL10Pct      float64   `json:"level_income_l4_to_l10_pct" db:"level_income_l4_to_l10_pct"`
	LevelIncomeL11ToL15Pct     float64   `json:"level_income_l11_to_l15_pct" db:"level_income_l11_to_l15_pct"`
	NonWorkingCapMultiplier    float64   `json:"non_working_cap_multiplier" db:"non_working_cap_multiplier"`
	WorkingCapMultiplier       float64   `json:"working_cap_multiplier" db:"working_cap_multiplier"`
	UpdatedAt                  time.Time `json:"updated_at" db:"updated_at"`
}
