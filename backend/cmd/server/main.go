package main

import (
	"context"
	"fmt"
	"log"
	"strings"
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
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
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
	otpRepo := repository.NewOTPRepository(dbPool)
	salaryRepo := repository.NewSalaryRepository(dbPool)

	// Initialize Email Sender
	emailSender := email.NewEmailSender(cfg.SMTPHost, cfg.SMTPPort, cfg.SMTPUser, cfg.SMTPPass)

	// Initialize Services
	authSvc := service.NewAuthService(userRepo, mlmRepo, otpRepo, emailSender, cfg.JWTSecret)
	invSvc := service.NewInvestmentService(invRepo, userRepo, mlmRepo, settingsRepo)
	walletSvc := service.NewWalletService(walletRepo)
	auditSvc := service.NewAuditService(dbPool)
	usdtSvc := service.NewUSDTService(dbPool, auditSvc)
	wdSvc := service.NewWithdrawalService(dbPool, withdrawalRepo, walletRepo, userRepo, settingsRepo, usdtSvc)
	teamSvc := service.NewTeamService(mlmRepo, settingsRepo, walletRepo)
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
	jobRunner := cron.NewJobRunner(invRepo, mlmRepo, walletRepo, settingsRepo)
	jobRunner.Start()
	defer jobRunner.Stop()

	router := gin.Default()
	// KYC scans are intentionally not served as public static files.

	// CORS Middleware
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "https://themusica.in", "https://www.themusica.in"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))


	// Redis client for Rate Limiter
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

	// Configure trusted proxies for ingress/nginx IP resolution
	_ = router.SetTrustedProxies([]string{"127.0.0.1", "10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"})

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

		mediaCatalog := map[string]struct {
			VideoURL    string
			IsExclusive bool
		}{
			"m1": {VideoURL: "https://www.youtube.com/embed/v91-cUp4b3A", IsExclusive: true},
			"m2": {VideoURL: "https://www.youtube.com/embed/74_yJny-uB0", IsExclusive: false},
			"m3": {VideoURL: "https://www.youtube.com/embed/kXYiU_JCYtU", IsExclusive: true},
			"m4": {VideoURL: "https://www.youtube.com/embed/dQw4w9WgXcQ", IsExclusive: true},
		}

		media := api.Group("/media")
		media.Use(middleware.AuthMiddleware())
		{
			media.GET("/stream/:id", func(c *gin.Context) {
				id := c.Param("id")
				item, exists := mediaCatalog[id]
				if !exists {
					response.Error(c, 404, "Media item not found", nil)
					return
				}

				userIDVal, _ := c.Get("user_id")
				userIDStr := fmt.Sprintf("%v", userIDVal)

				if item.IsExclusive {
					userID, _ := uuid.Parse(userIDStr)
					activeInvs, err := invRepo.GetActiveInvestmentsByUserID(c.Request.Context(), userID)
					if err != nil || len(activeInvs) == 0 {
						response.Error(c, 403, "Active VIP subscription required for exclusive playback", nil)
						return
					}
				}

				// Issue signed JWT token containing media_id, user_id, and 5-minute expiration
				playURL := item.VideoURL
				if item.IsExclusive {
					claims := jwt.MapClaims{
						"media_id": id,
						"user_id":  userIDStr,
						"exp":      time.Now().Add(5 * time.Minute).Unix(),
					}
					token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
					tokenStr, err := token.SignedString([]byte(cfg.JWTSecret))
					if err != nil {
						response.Error(c, 500, "Failed to issue playback token", err)
						return
					}
					playURL = fmt.Sprintf("/api/v1/media/play/%s?token=%s", id, tokenStr)
				}

				response.Success(c, 200, "Playback authorized", gin.H{
					"id":          id,
					"videoUrl":    playURL,
					"isExclusive": item.IsExclusive,
				})
			})

			media.GET("/play/:id", func(c *gin.Context) {
				id := c.Param("id")
				item, exists := mediaCatalog[id]
				if !exists {
					response.Error(c, 404, "Media item not found", nil)
					return
				}

				if item.IsExclusive {
					tokenStr := c.Query("token")
					if tokenStr == "" {
						response.Error(c, 403, "Playback token required for exclusive media", nil)
						return
					}

					token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
						if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
							return nil, fmt.Errorf("unexpected signing method")
						}
						return []byte(cfg.JWTSecret), nil
					})
					if err != nil || !token.Valid {
						response.Error(c, 403, "Invalid or expired playback token", nil)
						return
					}

					claims, ok := token.Claims.(jwt.MapClaims)
					if !ok {
						response.Error(c, 403, "Invalid token claims", nil)
						return
					}

					userIDVal, _ := c.Get("user_id")
					currentUserIDStr := fmt.Sprintf("%v", userIDVal)

					if fmt.Sprintf("%v", claims["media_id"]) != id || fmt.Sprintf("%v", claims["user_id"]) != currentUserIDStr {
						response.Error(c, 403, "Playback token authorization mismatch", nil)
						return
					}

					userID, _ := uuid.Parse(currentUserIDStr)
					activeInvs, err := invRepo.GetActiveInvestmentsByUserID(c.Request.Context(), userID)
					if err != nil || len(activeInvs) == 0 {
						response.Error(c, 403, "Active VIP subscription required for exclusive playback", nil)
						return
					}

					// Serve protected embed player without exposing raw URL redirect
					c.Header("Content-Type", "text/html; charset=utf-8")
					c.String(200, fmt.Sprintf(`<!DOCTYPE html><html><head><style>body{margin:0;background:#000;display:flex;justify-content:center;align-items:center;height:100vh;}</style></head><body><iframe width="100%%" height="100%%" src="%s" frameborder="0" allowfullscreen></iframe></body></html>`, item.VideoURL))
					return
				}

				c.Redirect(302, item.VideoURL)
			})
		}

		user := api.Group("/user")
		user.Use(middleware.AuthMiddleware())
		{
			user.GET("/profile", userH.GetProfile)
			user.PUT("/profile", userH.UpdateProfile)
			user.PUT("/password", userH.ChangePassword)
			user.GET("/dashboard", userH.GetDashboard)
			user.GET("/deposit-address", usdtH.GetDepositAddress)
			user.GET("/audit-logs", usdtH.GetAuditLogs)
		}

		sponsorship := api.Group("/sponsorship")
		sponsorship.Use(middleware.AuthMiddleware())
		{
			sponsorship.GET("/plans", invH.GetPlans)
			sponsorship.POST("/create", invH.CreateInvestment)
			sponsorship.GET("/my", invH.GetMyInvestments)
		}

		investment := api.Group("/investment")
		investment.Use(middleware.AuthMiddleware())
		{
			investment.GET("/plans", invH.GetPlans)
			investment.POST("/create", invH.CreateInvestment)
			investment.POST("/:id/confirm-deposit", invH.ConfirmDeposit)
			investment.GET("/my", invH.GetMyInvestments)
		}

		wallet := api.Group("/wallet")
		wallet.Use(middleware.AuthMiddleware())
		{
			wallet.GET("/balance", walletH.GetBalance)
			wallet.GET("/transactions", walletH.GetTransactions)
		}

		invites := api.Group("/invites")
		invites.Use(middleware.AuthMiddleware())
		{
			invites.GET("/direct", teamH.GetDirectReferrals)
			invites.GET("/tree", teamH.GetTree)
		invites.GET("/stats", teamH.GetTeamStats)
		invites.GET("/breakdown", teamH.GetTeamBreakdown)
		}

		team := api.Group("/team")
		team.Use(middleware.AuthMiddleware())
		{
			team.GET("/direct", teamH.GetDirectReferrals)
			team.GET("/tree", teamH.GetTree)
		team.GET("/stats", teamH.GetTeamStats)
		team.GET("/breakdown", teamH.GetTeamBreakdown)
		}

		withdrawal := api.Group("/withdrawal")
		withdrawal.Use(middleware.AuthMiddleware())
		{
			withdrawal.POST("/request", wdH.RequestWithdrawal)
			withdrawal.GET("/history", wdH.GetHistory)
			withdrawal.GET("/next-dates", wdH.GetNextDates)
		}

		salary := api.Group("/salary")
		salary.Use(middleware.AuthMiddleware())
		salary.POST("/divide-downlines", salaryH.DivideDownlines)
		{
			salary.GET("/progress", salaryH.GetUserSalaryProgress)
			salary.GET("/tiers", salaryH.GetSalaryTiers)
		}

		admin := api.Group("/admin")
		admin.Use(middleware.AuthMiddleware(), middleware.AdminMiddleware())
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
	if err := router.Run(":" + cfg.ServerPort); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
