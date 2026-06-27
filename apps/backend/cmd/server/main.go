package main

import (
	"context"
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"

	"crm-whatsapp-api/internal/chatbot"
	"crm-whatsapp-api/internal/config"
	"crm-whatsapp-api/internal/database"
	"crm-whatsapp-api/internal/handlers"
	"crm-whatsapp-api/internal/llm"
	"crm-whatsapp-api/internal/redisclient"
	"crm-whatsapp-api/internal/repository"
	"crm-whatsapp-api/internal/routes"
	"crm-whatsapp-api/internal/whatsapp"
	"crm-whatsapp-api/internal/ws"
)

func main() {
	cfg := config.Load()
	ctx := context.Background()

	database.RunMigrations(cfg.DatabaseURL)

	db, err := pgxpool.New(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatal("failed to connect to postgres: ", err)
	}
	defer db.Close()

	rdb := redis.NewClient(&redis.Options{Addr: cfg.RedisURL})
	defer rdb.Close()

	repo := repository.New(db)
	publisher := redisclient.NewPublisher(rdb)
	waClient := whatsapp.NewClient(cfg)
	hub := ws.NewHub()

	// Fixed state-machine engine (always available)
	fixedEngine := chatbot.NewEngine(waClient, repo, publisher)

	// LLM engine — only created when Anthropic API key is set
	var llmEngine *chatbot.LLMEngine
	if cfg.AnthropicAPIKey != "" {
		llmClient := llm.NewClient(cfg.AnthropicAPIKey, cfg.AnthropicModel)
		llmEngine = chatbot.NewLLMEngine(waClient, repo, publisher, llmClient)
		log.Println("🤖 LLM engine enabled (Claude)")
	} else {
		log.Println("ℹ️  LLM engine disabled (set ANTHROPIC_API_KEY to enable)")
	}

	go subscribeEvents(ctx, rdb, hub)

	webhookHandler := handlers.NewWebhookHandler(cfg, fixedEngine, llmEngine, repo)
	authHandler := handlers.NewAuthHandler(cfg, repo)
	clientHandler := handlers.NewClientHandler(repo)
	appointmentHandler := handlers.NewAppointmentHandler(repo)
	conversationHandler := handlers.NewConversationHandler(repo, hub)

	app := fiber.New()
	routes.Setup(app, routes.Deps{
		Webhook:      webhookHandler,
		Auth:         authHandler,
		Client:       clientHandler,
		Appointment:  appointmentHandler,
		Conversation: conversationHandler,
		Hub:          hub,
		Cfg:          cfg,
	})

	log.Fatal(app.Listen(":" + cfg.AppPort))
}

func subscribeEvents(ctx context.Context, rdb *redis.Client, hub *ws.Hub) {
	sub := rdb.PSubscribe(ctx, "branch:*:events")
	defer sub.Close()

	for msg := range sub.Channel() {
		branchID := extractBranchIDFromChannel(msg.Channel)
		hub.Broadcast(branchID, []byte(msg.Payload))
	}
}

// extractBranchIDFromChannel parses "branch:123:events" → "123".
// "branch:" = 7 chars, ":events" = 7 chars
func extractBranchIDFromChannel(channel string) string {
	parts := []byte(channel)
	start, end := 7, len(parts)-7
	if start >= end {
		return ""
	}
	return string(parts[start:end])
}
