package domain

type RegisterRequest struct {
	Name       string `json:"name" binding:"required"`
	Email      string `json:"email" binding:"required,email"`
	Phone      string `json:"phone" binding:"required"`
	Password   string `json:"password" binding:"required,min=8"`
	InviteCode string `json:"invite_code"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type InvestRequest struct {
	Amount        float64 `json:"amount" binding:"required,min=10000"`
	PaymentMethod string  `json:"payment_method"`
	PaymentRef    string  `json:"payment_ref"`
}

type WithdrawRequest struct {
	Amount float64 `json:"amount" binding:"required,min=1000"`
}

type UpdateProfileRequest struct {
	Name        string `json:"name"`
	Phone       string `json:"phone"`
	BankAccount string `json:"bank_account"`
    IFSC        string `json:"ifsc"`
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
