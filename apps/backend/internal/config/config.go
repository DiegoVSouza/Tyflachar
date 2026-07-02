package config

import (
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	AppEnv         string
	AppPort        string
	DatabaseURL    string
	RedisURL       string
	JWTSecret      string
	AllowedOrigins string

	MetaAPIVersion    string
	MetaPhoneNumberID string
	MetaWabaToken     string
	MetaVerifyToken   string
	MetaAppSecret     string

	DefaultBranchID int

	AnthropicAPIKey string
	AnthropicModel  string
}

func Load() *Config {
	_ = godotenv.Load()

	defaultBranchID, _ := strconv.Atoi(getEnv("DEFAULT_BRANCH_ID", "1"))

	cfg := &Config{
		AppEnv:            getEnv("APP_ENV", "development"),
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
		AnthropicModel:    getEnv("ANTHROPIC_MODEL", "claude-haiku-4-5-20251001"),
	}

	cfg.validate()
	return cfg
}

// validate enforces META_APP_SECRET in production
func (cfg *Config) validate() {
	if cfg.AppEnv == "production" && cfg.MetaAppSecret == "" {
		log.Fatal("❌ META_APP_SECRET não definido em produção (APP_ENV=production) — a validação HMAC do webhook do WhatsApp ficaria desabilitada, aceitando qualquer payload sem verificar a origem. Configure META_APP_SECRET antes de subir a aplicação.")
	}
	if cfg.MetaAppSecret == "" {
		log.Println("ℹ️  META_APP_SECRET não definido — validação HMAC do webhook está DESABILITADA (permissivo). Aceitável fora de produção; nunca faça deploy de produção assim.")
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
