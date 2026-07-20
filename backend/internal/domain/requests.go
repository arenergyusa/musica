package domain

type RegisterRequest struct {
	Name         string `json:"name" binding:"required"`
	Email        string `json:"email" binding:"required,email"`
	Phone        string `json:"phone" binding:"required,len=10"`
	Password     string `json:"password" binding:"required,min=8"`
	ReferralCode string `json:"referral_code"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type InvestRequest struct {
	Amount float64 `json:"amount" binding:"required,min=10000"`
}

type WithdrawRequest struct {
	Amount float64 `json:"amount" binding:"required,min=1000"`
}

type UpdateProfileRequest struct {
	Name string `json:"name"`
	BankAccount string `json:"bank_account"`
	IFSC string `json:"ifsc"`
}
