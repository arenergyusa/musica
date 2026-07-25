package domain

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID                 uuid.UUID  `json:"id" db:"id"`
	Name               string     `json:"name" db:"name"`
	Email              string     `json:"email" db:"email"`
	Phone              string     `json:"phone" db:"phone"`
	PasswordHash       string     `json:"-" db:"password_hash"`
	InviteCode         string     `json:"invite_code" db:"invite_code"`
	InvitedBy          *uuid.UUID `json:"invited_by,omitempty" db:"invited_by"`
	KycStatus          string     `json:"kyc_status" db:"kyc_status"` // PENDING, APPROVED, REJECTED
	KycRejectionReason string     `json:"kyc_rejection_reason,omitempty" db:"kyc_rejection_reason"`
	BankAccount        string     `json:"bank_account" db:"bank_account"`
	BankAccountHash    string     `json:"-" db:"bank_account_hash"`
	IFSC               string     `json:"ifsc" db:"ifsc"`
	PAN                string     `json:"-" db:"pan"`
	Aadhaar            string     `json:"-" db:"aadhaar"`
	Status             string     `json:"status" db:"status"` // ACTIVE, BLOCKED
	Role               string     `json:"role" db:"role"`
	DocumentURL        string     `json:"document_url" db:"document_url"`
	CreatedAt          time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt          time.Time  `json:"updated_at" db:"updated_at"`
}

type SponsorshipPlan struct {
	ID                      uuid.UUID `json:"id" db:"id"`
	Name                    string    `json:"name" db:"name"`
	MinAmount               float64   `json:"min_amount" db:"min_amount"`
	DailyRatePct            float64   `json:"daily_rate_pct" db:"daily_rate_pct"`
	Description             string    `json:"description" db:"description"`
	IsActive                bool      `json:"is_active" db:"is_active"`
	NonWorkingCapMultiplier float64   `json:"non_working_cap_multiplier"`
	WorkingCapMultiplier    float64   `json:"working_cap_multiplier"`
}

type Sponsorship struct {
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
	Source      string    `json:"source" db:"source"` // DAILY_REWARD, INVITE, LEVEL_INCOME, WITHDRAWAL
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
	DailyRewardPct             float64   `json:"daily_reward_pct" db:"daily_reward_pct"`
	WithdrawalFeePct           float64   `json:"withdrawal_fee_pct" db:"withdrawal_fee_pct"`
	WithdrawalMinAmount        float64   `json:"withdrawal_min_amount" db:"withdrawal_min_amount"`
	Level1To5Directs           int       `json:"level1_to_5_directs" db:"level1_to_5_directs"`
	Level1To5Business          float64   `json:"level1_to_5_business" db:"level1_to_5_business"`
	Level1To10Directs          int       `json:"level1_to_10_directs" db:"level1_to_10_directs"`
	Level1To10Business         float64   `json:"level1_to_10_business" db:"level1_to_10_business"`
	Level1To15Directs          int       `json:"level1_to_15_directs" db:"level1_to_15_directs"`
	Level1To15Business         float64   `json:"level1_to_15_business" db:"level1_to_15_business"`
	InviteRewardL1Pct          float64   `json:"invite_reward_l1_pct" db:"invite_reward_l1_pct"`
	InviteRewardL2Pct          float64   `json:"invite_reward_l2_pct" db:"invite_reward_l2_pct"`
	InviteRewardL3Pct          float64   `json:"invite_reward_l3_pct" db:"invite_reward_l3_pct"`
	LevelIncomeL1Pct           float64   `json:"level_income_l1_pct" db:"level_income_l1_pct"`
	LevelIncomeL2Pct           float64   `json:"level_income_l2_pct" db:"level_income_l2_pct"`
	LevelIncomeL3Pct           float64   `json:"level_income_l3_pct" db:"level_income_l3_pct"`
	LevelIncomeL4ToL10Pct      float64   `json:"level_income_l4_to_l10_pct" db:"level_income_l4_to_l10_pct"`
	LevelIncomeL11ToL15Pct     float64   `json:"level_income_l11_to_l15_pct" db:"level_income_l11_to_l15_pct"`
	NonWorkingCapMultiplier    float64   `json:"non_working_cap_multiplier" db:"non_working_cap_multiplier"`
	WorkingCapMultiplier       float64   `json:"working_cap_multiplier" db:"working_cap_multiplier"`
	PaymentUPIID               string    `json:"payment_upi_id" db:"payment_upi_id"`
	PaymentBankName            string    `json:"payment_bank_name" db:"payment_bank_name"`
	PaymentAccountName         string    `json:"payment_account_name" db:"payment_account_name"`
	PaymentAccountNumber       string    `json:"payment_account_number" db:"payment_account_number"`
	PaymentIFSC                string    `json:"payment_ifsc" db:"payment_ifsc"`
	UpdatedAt                  time.Time `json:"updated_at" db:"updated_at"`
}

type OTP struct {
	ID        uuid.UUID  `json:"id" db:"id"`
	Email     string     `json:"email" db:"email"`
	OTP       string     `json:"otp" db:"otp"`
	Purpose   string     `json:"purpose" db:"purpose"` // REGISTER, FORGOT_PASSWORD
	ExpiresAt time.Time  `json:"expires_at" db:"expires_at"`
	UsedAt    *time.Time `json:"used_at,omitempty" db:"used_at"`
	CreatedAt time.Time  `json:"created_at" db:"created_at"`
}
