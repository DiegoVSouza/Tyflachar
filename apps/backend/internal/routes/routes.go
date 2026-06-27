package routes

import (
	"crm-whatsapp-api/internal/config"
	"crm-whatsapp-api/internal/handlers"
	"crm-whatsapp-api/internal/middleware"
	"crm-whatsapp-api/internal/ws"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
)

type Deps struct {
	Webhook      *handlers.WebhookHandler
	Auth         *handlers.AuthHandler
	Client       *handlers.ClientHandler
	Appointment  *handlers.AppointmentHandler
	Conversation *handlers.ConversationHandler
	Hub          *ws.Hub
	Cfg          *config.Config
}

func Setup(app *fiber.App, d Deps) {
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins:     d.Cfg.AllowedOrigins,
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowMethods:     "GET, POST, PATCH, DELETE, OPTIONS",
		AllowCredentials: true,
	}))

	// Public: webhook (Meta / WhatsApp)
	app.Get("/webhook", d.Webhook.VerifyWebhook)
	app.Post("/webhook", middleware.WebhookRateLimit(), d.Webhook.ReceiveWebhook)

	api := app.Group("/api")

	// Auth (public)
	api.Post("/auth/login", d.Auth.Login)

	// Auth + all dashboard routes (JWT required)
	protected := api.Group("", middleware.JWTAuth(d.Cfg.JWTSecret))

	protected.Get("/auth/me", d.Auth.GetMe)

	protected.Get("/clients", d.Client.List)
	protected.Get("/clients/:id", d.Client.GetByID)
	protected.Patch("/clients/:id/tags", d.Client.UpdateTags)
	protected.Get("/clients/:id/appointments", d.Client.GetAppointments)

	protected.Get("/conversations", d.Conversation.List)
	protected.Get("/conversations/:id/messages", d.Conversation.GetMessages)
	protected.Post("/conversations/:id/messages", d.Conversation.SendMessage)

	protected.Get("/appointments", d.Appointment.List)
	protected.Post("/appointments", d.Appointment.Create)
	protected.Patch("/appointments/:id", d.Appointment.Update)

	// WebSocket — JWT validated via ?token= query param
	app.Get("/ws/:branchId",
		middleware.JWTAuthWS(d.Cfg.JWTSecret),
		handlers.WebSocketUpgrade(d.Hub),
	)
}
