package config

import (
	"fmt"
	"os"
	"strconv"
)

type Config struct {
	ServerPort    string
	DBURL         string
	RedisURL      string
	JWTSecret     string
	Environment   string
	SMTPHost      string
	SMTPPort      int
	SMTPUser      string
	SMTPPass      string
	EncryptionKey string
}

func getEnvOrDefault(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}

func LoadConfig() (config Config, err error) {
	config.ServerPort = getEnvOrDefault("SERVER_PORT", "8080")
	config.Environment = getEnvOrDefault("ENVIRONMENT", "development")
	
	config.DBURL = os.Getenv("DATABASE_URL")
	if config.DBURL == "" {
		return config, fmt.Errorf("DATABASE_URL is required")
	}

	config.RedisURL = os.Getenv("REDIS_URL")

	config.JWTSecret = os.Getenv("JWT_SECRET")
	if config.JWTSecret == "" {
		return config, fmt.Errorf("JWT_SECRET is required")
	}
	if len(config.JWTSecret) < 32 {
		return config, fmt.Errorf("JWT_SECRET must be at least 32 bytes")
	}

	config.EncryptionKey = os.Getenv("ENCRYPTION_KEY")
	if config.EncryptionKey == "" || len(config.EncryptionKey) != 32 {
		return config, fmt.Errorf("ENCRYPTION_KEY is required and must be exactly 32 bytes")
	}
	config.SMTPHost = os.Getenv("SMTP_HOST")
	config.SMTPUser = os.Getenv("SMTP_USER")
	config.SMTPPass = os.Getenv("SMTP_PASS")
	if config.SMTPHost == "" || config.SMTPUser == "" || config.SMTPPass == "" {
		return config, fmt.Errorf("SMTP_HOST, SMTP_USER, and SMTP_PASS are required")
	}

	smtpPortStr := getEnvOrDefault("SMTP_PORT", "465")
	smtpPort, err := strconv.Atoi(smtpPortStr)
	if err != nil {
		return config, fmt.Errorf("invalid SMTP_PORT: %v", err)
	}
	if smtpPort < 1 || smtpPort > 65535 {
		return config, fmt.Errorf("SMTP_PORT must be between 1 and 65535")
	}
	config.SMTPPort = smtpPort

	return config, nil
}
