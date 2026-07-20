package main

import (
	"context"
	"log"

	"github.com/arenergyusa/musica/backend/internal/api/handler"
	"github.com/arenergyusa/musica/backend/internal/api/middleware"
	"github.com/arenergyusa/musica/backend/internal/config"
	"github.com/arenergyusa/musica/backend/internal/cron"
	"github.com/arenergyusa/musica/backend/internal/repository"
	"github.com/arenergyusa/musica/backend/internal/service"
	"github.com/arenergyusa/musica/backend/pkg/database"
	"github.com/arenergyusa/musica/backend/pkg/response"
	"github.com/gin-gonic/gin"
)

func main() {
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Config loading error: %v", err)
	}

	// Run Migrations
	if err := database.RunMigrations(cfg.DBURL, "migrations"); err != nil {
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

	// Initialize Services
	authSvc := service.NewAuthService(userRepo, mlmRepo, cfg.JWTSecret)
	invSvc := service.NewInvestmentService(invRepo, userRepo, mlmRepo, settingsRepo)
	walletSvc := service.NewWalletService(walletRepo)
	wdSvc := service.NewWithdrawalService(dbPool, withdrawalRepo, walletRepo, userRepo, settingsRepo)
	teamSvc := service.NewTeamService(mlmRepo, settingsRepo)
	adminSvc := service.NewAdminService(dbPool, invRepo, withdrawalRepo, userRepo, walletRepo, settingsRepo)
	userSvc := service.NewUserService(userRepo, walletRepo, invRepo, mlmRepo)

	// Initialize Handlers
	authH := handler.NewAuthHandler(authSvc)
	invH := handler.NewInvestmentHandler(invSvc)
	walletH := handler.NewWalletHandler(walletSvc)
	wdH := handler.NewWithdrawalHandler(wdSvc)
	teamH := handler.NewTeamHandler(teamSvc)
	adminH := handler.NewAdminHandler(adminSvc)
	userH := handler.NewUserHandler(userSvc)

	// Initialize and Start Cron Jobs
	jobRunner := cron.NewJobRunner(invRepo, mlmRepo, walletRepo)
	jobRunner.Start()
	defer jobRunner.Stop()

	router := gin.Default()

	// Global Middlewares
	router.Use(middleware.RateLimiter())

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
		{
			auth.POST("/register", authH.Register)
			auth.POST("/login", authH.Login)
			// auth.POST("/refresh-token", MockHandler)
			// auth.POST("/logout", MockHandler)
		}

		user := api.Group("/user")
		user.Use(middleware.AuthMiddleware())
		{
			user.GET("/profile", userH.GetProfile)
			user.PUT("/profile", userH.UpdateProfile)
			user.GET("/dashboard", userH.GetDashboard)
			user.POST("/kyc", userH.SubmitKYC)
			user.GET("/kyc/status", userH.GetKYCStatus)
		}

		investment := api.Group("/investment")
		investment.Use(middleware.AuthMiddleware())
		{
			investment.GET("/plans", invH.GetPlans)
			investment.POST("/create", invH.CreateInvestment)
			investment.GET("/my", invH.GetMyInvestments)
			// investment.GET("/:id", MockHandler)
		}

		wallet := api.Group("/wallet")
		wallet.Use(middleware.AuthMiddleware())
		{
			wallet.GET("/balance", walletH.GetBalance)
			wallet.GET("/transactions", walletH.GetTransactions)
		}

		team := api.Group("/team")
		team.Use(middleware.AuthMiddleware())
		{
			team.GET("/direct", teamH.GetDirectReferrals)
			team.GET("/tree", teamH.GetTree)
			team.GET("/stats", teamH.GetTeamStats)
		}

		withdrawal := api.Group("/withdrawal")
		withdrawal.Use(middleware.AuthMiddleware())
		{
			withdrawal.POST("/request", wdH.RequestWithdrawal)
			withdrawal.GET("/history", wdH.GetHistory)
			withdrawal.GET("/next-dates", wdH.GetNextDates)
		}

		admin := api.Group("/admin")
		admin.Use(middleware.AuthMiddleware(), middleware.AdminMiddleware())
		{
			admin.GET("/dashboard", adminH.GetDashboard)
			admin.GET("/users", adminH.GetUsers)
			admin.PUT("/users/:id/block", adminH.BlockUser)
			admin.POST("/investments/:id/activate", adminH.ActivateInvestment)
			admin.GET("/kyc", adminH.GetPendingKYC)
			admin.PUT("/kyc/:id", adminH.ApproveKYC)
			admin.PUT("/kyc/:id/reject", adminH.RejectKYC)
			admin.GET("/withdrawals", adminH.GetAllWithdrawals)
			admin.PUT("/withdrawals/:id/approve", adminH.ApproveWithdrawal)
			admin.PUT("/withdrawals/:id/reject", adminH.RejectWithdrawal)
			admin.GET("/settings", adminH.GetSettings)
			admin.PUT("/settings", adminH.UpdateSettings)
		}
	}

	log.Printf("Server starting on port %s", cfg.ServerPort)
	if err := router.Run(":" + cfg.ServerPort); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
