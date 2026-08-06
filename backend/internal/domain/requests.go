package domain

type RegisterRequest struct {
	Name       string `json:"name" binding:"required"`
	Email      string `json:"email" binding:"required,email"`
	Phone      string `json:"phone" binding:"required"`
	Password   string `json:"password" binding:"required,min=8"`
	InviteCode string `json:"invite_code"`
}

type LoginRequest struct {
	Email      string `json:"email" binding:"required,email"`
	Password   string `json:"password" binding:"required"`
	RememberMe bool   `json:"remember_me"`
}

type InvestRequest struct {
	Amount        float64 `json:"amount" binding:"required,min=100"`
	PaymentMethod string  `json:"payment_method"`
	PaymentRef    string  `json:"payment_ref"`
}

type ConfirmDepositRequest struct {
	TxHash string `json:"tx_hash" binding:"required"`
}

type WithdrawRequest struct {
	Amount float64 `json:"amount" binding:"required,min=10"`
}

type UpdateProfileRequest struct {
	Name        string `json:"name"`
	Phone       string `json:"phone"`
	UsdtAddress string `json:"usdt_address"`
}

type VerifyOTPRequest struct {
	Email string `json:"email" binding:"required,email"`
	OTP   string `json:"otp" binding:"required"`
}

type ForgotPasswordRequest struct {
	Email string `json:"email" binding:"required,email"`
}

type ResetPasswordRequest struct {
	Email    string `json:"email" binding:"required,email"`
	OTP      string `json:"otp" binding:"required"`
	Password string `json:"password" binding:"required,min=8"`
}

type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password" binding:"required"`
	NewPassword     string `json:"new_password" binding:"required,min=8"`
}
