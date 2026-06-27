package config

import (
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	AppPort           string
	DatabaseURL       string
	RedisURL          string
	JWTSecret         string
	AllowedOrigins    string

	MetaAPIVersion    string
	MetaPhoneNumberID string
	MetaWabaToken     string
	MetaVerifyToken   string
	MetaAppSecret     string

	DefaultBranchID   int

	AnthropicAPIKey   string
	AnthropicModel    string
}

func Load() *Config {
	_ = godotenv.Load()

	defaultBranchID, _ := strconv.Atoi(getEnv("DEFAULT_BRANCH_ID", "1"))

	return &Config{
		AppPort:           getEnv("APP_PORT", "8080"),
		DatabaseURL:       getEnv("DATABASE_URL", ""),
		RedisURL:          getEnv("REDIS_URL", ""),
		JWTSecret:         getEnv("JWT_SECRET", ""),
		AllowedOrigins:    getEnv("ALLOWED_ORIGINS", "http://localhost:3000"),
		MetaAPIVersion:    getEnv("META_API_VERSION", "v18.0"),
		MetaPhoneNumberID: getEnv("META_PHONE_NUMBER_ID", ""),
		MetaWabaToken:     getEnv("META_WABA_TOKEN", ""),
		MetaVerifyToken:   getEnv("META_WEBHOOK_VERIFY_TOKEN", ""),
		MetaAppSecret:     getEnv("META_APP_SECRET", ""),
		DefaultBranchID:   defaultBranchID,
		AnthropicAPIKey:   getEnv("ANTHROPIC_API_KEY", ""),
		AnthropicModel:    getEnv("ANTHROPIC_MODEL", "claude-3-5-haiku-20241022"),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
