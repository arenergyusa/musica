package domain

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID              uuid.UUID `json:"id" db:"id"`
	Name            string    `json:"name" db:"name"`
	Email           string    `json:"email" db:"email"`
	Phone           string    `json:"phone" db:"phone"`
	PasswordHash    string    `json:"-" db:"password_hash"`
	InviteCode      string    `json:"invite_code" db:"invite_code"`
	InvitedBy       *uuid.UUID `json:"invited_by,omitempty" db:"invited_by"`
	UsdtAddress     string    `json:"usdt_address" db:"usdt_address"`
	Leg             string    `json:"leg" db:"leg"` // LEFT, RIGHT
	Status          string    `json:"status" db:"status"` // ACTIVE, BLOCKED
	Role            string    `json:"role" db:"role"`
	CreatedAt       time.Time `json:"created_at" db:"created_at"`
	UpdatedAt       time.Time `json:"updated_at" db:"updated_at"`
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
	SalaryIncome   float64   `json:"salary_income" db:"salary_income"`
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
	MonthlyRewardPct           float64   `json:"monthly_reward_pct" db:"monthly_reward_pct"`
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
	UpdatedAt                  time.Time `json:"updated_at" db:"updated_at"`
}

type UserDepositAddress struct {
	ID              uuid.UUID `json:"id" db:"id"`
	UserID          uuid.UUID `json:"user_id" db:"user_id"`
	Address         string    `json:"address" db:"address"`
	DerivationIndex int       `json:"derivation_index" db:"derivation_index"`
	CreatedAt       time.Time `json:"created_at" db:"created_at"`
}

type TransactionAuditLog struct {
	ID         uuid.UUID `json:"id" db:"id"`
	UserID     *uuid.UUID `json:"user_id,omitempty" db:"user_id"`
	Action     string    `json:"action" db:"action"`
	AmountUSD  float64   `json:"amount_usd" db:"amount_usd"`
	UsdtAmount float64   `json:"usdt_amount" db:"usdt_amount"`
	TxHash     string    `json:"tx_hash" db:"tx_hash"`
	Status     string    `json:"status" db:"status"`
	Details    string    `json:"details" db:"details"`
	CreatedAt  time.Time `json:"created_at" db:"created_at"`
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

type SalaryTier struct {
	Tier                 int       `json:"tier" db:"tier"`
	MinVolumeUSD         float64   `json:"min_volume_usd" db:"min_volume_usd"`
	MonthlySalaryUSD     float64   `json:"monthly_salary_usd" db:"monthly_salary_usd"`
	MaxStrongLegPct      float64   `json:"max_strong_leg_pct" db:"max_strong_leg_pct"`
	MinWeakerLegPct      float64   `json:"min_weaker_leg_pct" db:"min_weaker_leg_pct"`
	MonthlyIncrementPct  float64   `json:"monthly_increment_pct" db:"monthly_increment_pct"`
	CreatedAt            time.Time `json:"created_at" db:"created_at"`
}

type SalaryQualification struct {
	ID                 uuid.UUID  `json:"id" db:"id"`
	UserID             uuid.UUID  `json:"user_id" db:"user_id"`
	Tier               int        `json:"tier" db:"tier"`
	LeftLegVolume      float64    `json:"left_leg_volume" db:"left_leg_volume"`
	RightLegVolume     float64    `json:"right_leg_volume" db:"right_leg_volume"`
	TotalVolume        float64    `json:"total_volume" db:"total_volume"`
	CycleStartDate     time.Time  `json:"cycle_start_date" db:"cycle_start_date"`
	CycleNewVolume     float64    `json:"cycle_new_volume" db:"cycle_new_volume"`
	Status             string     `json:"status" db:"status"` // QUALIFIED, PENDING_INCREMENT, PAYOUT_ACTIVE
	LastPayoutAt       *time.Time `json:"last_payout_at,omitempty" db:"last_payout_at"`
	CreatedAt          time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt          time.Time  `json:"updated_at" db:"updated_at"`
}

type SalaryPayoutLog struct {
	ID              uuid.UUID `json:"id" db:"id"`
	UserID          uuid.UUID `json:"user_id" db:"user_id"`
	Tier            int       `json:"tier" db:"tier"`
	AmountUSD       float64   `json:"amount_usd" db:"amount_usd"`
	TotalVolume     float64   `json:"total_volume" db:"total_volume"`
	LeftLegVolume   float64   `json:"left_leg_volume" db:"left_leg_volume"`
	RightLegVolume  float64   `json:"right_leg_volume" db:"right_leg_volume"`
	CycleNewVolume  float64   `json:"cycle_new_volume" db:"cycle_new_volume"`
	CreatedAt       time.Time `json:"created_at" db:"created_at"`
}

type SalaryProgressResponse struct {
	CurrentTier             int          `json:"current_tier"`
	CurrentSalaryUSD        float64      `json:"current_salary_usd"`
	NextTier                *SalaryTier  `json:"next_tier,omitempty"`
	LeftLegVolume           float64      `json:"left_leg_volume"`
	RightLegVolume          float64      `json:"right_leg_volume"`
	TotalVolume             float64      `json:"total_volume"`
	TargetVolumeUSD         float64      `json:"target_volume_usd"`
	RemainingVolumeUSD      float64      `json:"remaining_volume_usd"`
	StrongLegVolume         float64      `json:"strong_leg_volume"`
	WeakerLegVolume         float64      `json:"weaker_leg_volume"`
	WeakerLegRequiredUSD    float64      `json:"weaker_leg_required_usd"`
	WeakerLegRemainingUSD   float64      `json:"weaker_leg_remaining_usd"`
	LegRatioMet             bool         `json:"leg_ratio_met"`
	MonthlyIncrementTarget  float64      `json:"monthly_increment_target"`
	MonthlyIncrementAchieved float64     `json:"monthly_increment_achieved"`
	MonthlyIncrementRemaining float64    `json:"monthly_increment_remaining"`
	DaysRemainingInCycle    int          `json:"days_remaining_in_cycle"`
	Status                  string       `json:"status"`
}
