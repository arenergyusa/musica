package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/arenergyusa/musica/backend/internal/api/handler"
	"github.com/arenergyusa/musica/backend/internal/api/middleware"
	"github.com/arenergyusa/musica/backend/internal/config"
	"github.com/arenergyusa/musica/backend/internal/cron"
	"github.com/arenergyusa/musica/backend/internal/pkg/crypto"
	"github.com/arenergyusa/musica/backend/internal/pkg/email"
	"github.com/arenergyusa/musica/backend/internal/repository"
	"github.com/arenergyusa/musica/backend/internal/service"
	"github.com/arenergyusa/musica/backend/pkg/database"
	"github.com/arenergyusa/musica/backend/pkg/response"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
)

func main() {
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Config loading error: %v", err)
	}

	// Initialize Crypto
	if err := crypto.Init(cfg.EncryptionKey); err != nil {
		log.Fatalf("Crypto initialization error: %v", err)
	}

	// Run Migrations (path configurable so it is not CWD-dependent, L4)
	if err := database.RunMigrations(cfg.DBURL, cfg.MigrationsPath); err != nil {
		log.Fatalf("Migration error: %v", err)
	}

	ctx := context.Background()
	dbPool, err := database.NewPostgresPool(ctx, cfg.DBURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer dbPool.Close()

	// Initialize Repositories
	userRepo := repository.NewUserRepository(dbPool)
	mlmRepo := repository.NewMLMRepository(dbPool)
	walletRepo := repository.NewWalletRepository(dbPool)
	invRepo := repository.NewInvestmentRepository(dbPool)
	withdrawalRepo := repository.NewWithdrawalRepository(dbPool)
	settingsRepo := repository.NewSettingsRepository(dbPool)
	otpRepo := repository.NewOTPRepository(dbPool)
	salaryRepo := repository.NewSalaryRepository(dbPool)

	// Redis client for Rate Limiter + OTP brute-force lockout
	var opt *redis.Options
	if strings.HasPrefix(cfg.RedisURL, "redis://") || strings.HasPrefix(cfg.RedisURL, "rediss://") {
		var err error
		opt, err = redis.ParseURL(cfg.RedisURL)
		if err != nil {
			log.Fatalf("Invalid Redis URL: %v", err)
		}
	} else {
		opt = &redis.Options{
			Addr: cfg.RedisURL,
		}
	}
	redisClient := redis.NewClient(opt)

	// Initialize Email Sender
	emailSender := email.NewEmailSender(cfg.SMTPHost, cfg.SMTPPort, cfg.SMTPUser, cfg.SMTPPass)

	// Initialize Services
	authSvc := service.NewAuthService(userRepo, mlmRepo, otpRepo, emailSender, cfg.JWTSecret, redisClient)
	invSvc := service.NewInvestmentService(invRepo, userRepo, mlmRepo, settingsRepo)
	walletSvc := service.NewWalletService(walletRepo)
	auditSvc := service.NewAuditService(dbPool)
	usdtSvc := service.NewUSDTService(dbPool, auditSvc)
	wdSvc := service.NewWithdrawalService(dbPool, withdrawalRepo, walletRepo, userRepo, settingsRepo, usdtSvc)
	teamSvc := service.NewTeamService(invRepo, mlmRepo, settingsRepo, walletRepo)
	adminSvc := service.NewAdminService(dbPool, invRepo, withdrawalRepo, userRepo, walletRepo, settingsRepo, mlmRepo, usdtSvc)
	userSvc := service.NewUserService(userRepo, walletRepo, invRepo, mlmRepo, settingsRepo)

	// Initialize Handlers
	authH := handler.NewAuthHandler(authSvc)
	walletH := handler.NewWalletHandler(walletSvc)
	wdH := handler.NewWithdrawalHandler(wdSvc)
	teamH := handler.NewTeamHandler(teamSvc)
	adminH := handler.NewAdminHandler(adminSvc)
	invH := handler.NewInvestmentHandler(invSvc, adminSvc)
	userH := handler.NewUserHandler(userSvc)
	usdtH := handler.NewUSDTHandler(usdtSvc, auditSvc)
	salaryH := handler.NewSalaryHandler(salaryRepo)

	// Initialize and Start Cron Jobs
	jobRunner := cron.NewJobRunner(dbPool, invRepo, mlmRepo, walletRepo, settingsRepo, salaryRepo, wdSvc)
	jobRunner.Start()

	router := gin.Default()
	// KYC scans are intentionally not served as public static files.

	// CORS allowlist driven by env so it is not hardcoded per domain (L6).
	// Comma-separated: CORS_ALLOWED_ORIGINS=https://the-musica.com,https://www.the-musica.com
	var allowedOrigins []string
	for _, o := range strings.Split(cfg.CORSAllowedOrigins, ",") {
		o = strings.TrimSpace(o)
		if o != "" {
			allowedOrigins = append(allowedOrigins, o)
		}
	}
	if len(allowedOrigins) == 0 {
		allowedOrigins = []string{"http://localhost:3000"}
	}

	// CORS Middleware
	router.Use(cors.New(cors.Config{
		AllowOrigins:     allowedOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))


	// Configure trusted proxies for ingress/nginx IP resolution. Only trust the
	// loopback interface and the Docker bridge so attackers cannot spoof
	// X-Forwarded-For through the proxy headers (H3).
	_ = router.SetTrustedProxies([]string{"127.0.0.1", "172.16.0.0/12"})

	// Global Middlewares
	router.Use(middleware.RateLimiter(redisClient))

	// Health Check
	router.GET("/health", func(c *gin.Context) {
		response.Success(c, 200, "Server is running", nil)
	})

	api := router.Group("/api/v1")
	{
		api.GET("/settings", func(c *gin.Context) {
			settings, err := settingsRepo.GetSettings(c.Request.Context())
			if err != nil {
				log.Printf("Failed to get settings: %v", err)
				response.Error(c, 500, "Failed to get settings", nil)
				return
			}
			response.Success(c, 200, "Settings retrieved", settings)
		})
		auth := api.Group("/auth")
		auth.Use(middleware.AuthRateLimiter(redisClient))
		{
			auth.POST("/register", authH.Register)
			auth.POST("/register/verify", authH.VerifyRegister)
			auth.POST("/login", authH.Login)
			auth.POST("/forgot-password", authH.ForgotPassword)
			auth.POST("/forgot-password/verify", authH.VerifyForgotPasswordOTP)
			auth.POST("/forgot-password/reset", authH.ResetPassword)
			// auth.POST("/refresh-token", MockHandler)
			auth.POST("/logout", authH.Logout)
		}

		user := api.Group("/user")
		user.Use(middleware.AuthMiddleware(dbPool, redisClient))
		{
			user.GET("/profile", userH.GetProfile)
			user.PUT("/profile", userH.UpdateProfile)
			user.PUT("/password", userH.ChangePassword)
			user.GET("/dashboard", userH.GetDashboard)
			user.GET("/deposit-address", usdtH.GetDepositAddress)
			user.GET("/audit-logs", usdtH.GetAuditLogs)
		}

		sponsorship := api.Group("/sponsorship")
		sponsorship.Use(middleware.AuthMiddleware(dbPool, redisClient))
		{
			sponsorship.GET("/plans", invH.GetPlans)
			sponsorship.POST("/create", invH.CreateInvestment)
			sponsorship.GET("/my", invH.GetMyInvestments)
		}

		investment := api.Group("/investment")
		investment.Use(middleware.AuthMiddleware(dbPool, redisClient))
		{
			investment.GET("/plans", invH.GetPlans)
			investment.POST("/create", invH.CreateInvestment)
			investment.POST("/:id/confirm-deposit", invH.ConfirmDeposit)
			investment.GET("/my", invH.GetMyInvestments)
		}

		wallet := api.Group("/wallet")
		wallet.Use(middleware.AuthMiddleware(dbPool, redisClient))
		{
			wallet.GET("/balance", walletH.GetBalance)
			wallet.GET("/transactions", walletH.GetTransactions)
		}

		invites := api.Group("/invites")
		invites.Use(middleware.AuthMiddleware(dbPool, redisClient))
		{
			invites.GET("/direct", teamH.GetDirectReferrals)
			invites.GET("/tree", teamH.GetTree)
		invites.GET("/stats", teamH.GetTeamStats)
		invites.GET("/breakdown", teamH.GetTeamBreakdown)
		}

		team := api.Group("/team")
		team.Use(middleware.AuthMiddleware(dbPool, redisClient))
		{
			team.GET("/direct", teamH.GetDirectReferrals)
			team.GET("/tree", teamH.GetTree)
		team.GET("/stats", teamH.GetTeamStats)
		team.GET("/breakdown", teamH.GetTeamBreakdown)
		}

		withdrawal := api.Group("/withdrawal")
		withdrawal.Use(middleware.AuthMiddleware(dbPool, redisClient))
		{
			withdrawal.POST("/request", wdH.RequestWithdrawal)
			withdrawal.GET("/history", wdH.GetHistory)
		}

		salary := api.Group("/salary")
		salary.Use(middleware.AuthMiddleware(dbPool, redisClient))
		salary.POST("/divide-downlines", salaryH.DivideDownlines)
		{
			salary.GET("/progress", salaryH.GetUserSalaryProgress)
			salary.GET("/tiers", salaryH.GetSalaryTiers)
		}

		admin := api.Group("/admin")
		admin.Use(middleware.AuthMiddleware(dbPool, redisClient), middleware.AdminMiddleware())
		{
			admin.GET("/dashboard", adminH.GetDashboard)
			admin.GET("/analytics", adminH.GetAnalytics)
			admin.GET("/users", adminH.GetUsers)
			admin.GET("/users/:id/summary", adminH.GetUserSummary)
			admin.GET("/investments", adminH.GetInvestments)
			admin.PUT("/investments/:id/status", adminH.ChangeInvestmentStatus)
			admin.GET("/wallet/balance", adminH.GetMasterWalletBalance)
			admin.GET("/users/:id/wallet/balance", adminH.GetDepositWalletBalance)
			admin.PUT("/users/:id/block", adminH.BlockUser)
			admin.PUT("/users/:id/unblock", adminH.UnblockUser)
			admin.POST("/investments/:id/activate", adminH.ActivateInvestment)
			admin.POST("/sponsorships/:id/activate", adminH.ActivateInvestment)
			admin.POST("/investments/manual", adminH.CreateManualInvestment)
			admin.GET("/withdrawals", adminH.GetAllWithdrawals)
			admin.PUT("/withdrawals/:id/approve", adminH.ApproveWithdrawal)
			admin.PUT("/withdrawals/:id/reject", adminH.RejectWithdrawal)
			admin.GET("/settings", adminH.GetSettings)
			admin.PUT("/settings", adminH.UpdateSettings)
			admin.GET("/salary/tiers", salaryH.GetSalaryTiers)
			admin.PUT("/salary/tiers", salaryH.UpdateSalaryTier)
			admin.POST("/salary/trigger-payout", salaryH.TriggerSalaryPayout)
		}
	}

	log.Printf("Server starting on port %s", cfg.ServerPort)

	// Graceful shutdown (H14): on SIGTERM/SIGINT we drain in-flight HTTP
	// requests and let cron payouts finish, rather than dying mid-transaction.
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	srv := &http.Server{
		Addr:              ":" + cfg.ServerPort,
		Handler:           router,
		ReadHeaderTimeout: 15 * time.Second,
		ReadTimeout:       30 * time.Second,
		WriteTimeout:      45 * time.Second,
	}

	go func() {
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	<-ctx.Done()
	log.Println("Shutdown signal received; draining in-flight work...")

	// Stop the cron scheduler, waiting for any running credit/payout job to land.
	jobRunner.Stop()

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Printf("HTTP server shutdown error: %v", err)
	}
	log.Println("Server shut down cleanly.")
}
