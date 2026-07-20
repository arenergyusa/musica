package config

import (
	"fmt"
	"log"

	"github.com/spf13/viper"
)

type Config struct {
	ServerPort  string `mapstructure:"SERVER_PORT"`
	DBURL       string `mapstructure:"DATABASE_URL"`
	RedisURL    string `mapstructure:"REDIS_URL"`
	JWTSecret   string `mapstructure:"JWT_SECRET"`
	Environment string `mapstructure:"ENVIRONMENT"`
}

func LoadConfig() (config Config, err error) {
	viper.SetConfigFile(".env")
	viper.AutomaticEnv()

	// Default values
	viper.SetDefault("SERVER_PORT", "8080")
	viper.SetDefault("ENVIRONMENT", "development")
    
	viper.BindEnv("SERVER_PORT")
	viper.BindEnv("DATABASE_URL")
	viper.BindEnv("REDIS_URL")
	viper.BindEnv("JWT_SECRET")
	viper.BindEnv("ENVIRONMENT")

	err = viper.ReadInConfig()
	if err != nil {
		log.Printf("Warning: Could not read .env file, relying on environment variables: %v", err)
	}

	err = viper.Unmarshal(&config)
	if err != nil {
		return config, err
	}

	if config.DBURL == "" {
		return config, fmt.Errorf("DATABASE_URL is required")
	}
	if config.JWTSecret == "" {
		return config, fmt.Errorf("JWT_SECRET is required")
	}

	return config, nil
}
