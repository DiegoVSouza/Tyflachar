package main

import (
	"context"
	"log"
	"strings"

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

	fixedEngine := chatbot.NewEngine(waClient, repo, publisher)

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

func extractBranchIDFromChannel(channel string) string {
	parts := strings.Split(channel, ":")
	if len(parts) != 3 {
		return ""
	}
	return parts[1]
}
