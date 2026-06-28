package handlers

import (
	"strconv"

	"crm-whatsapp-api/internal/models"
	"crm-whatsapp-api/internal/repository"
	"crm-whatsapp-api/internal/ws"

	"github.com/gofiber/fiber/v2"
)

type ConversationHandler struct {
	repo *repository.Repository
	hub  *ws.Hub
}

func NewConversationHandler(repo *repository.Repository, hub *ws.Hub) *ConversationHandler {
	return &ConversationHandler{repo: repo, hub: hub}
}

func (h *ConversationHandler) List(c *fiber.Ctx) error {
	branchID := int(c.Locals("branch_id").(float64))
	status := c.Query("status")

	conversations, err := h.repo.ListConversations(branchID, status)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to fetch conversations"})
	}
	if conversations == nil {
		conversations = []models.ConversationWithClient{}
	}
	return c.JSON(conversations)
}

func (h *ConversationHandler) GetMessages(c *fiber.Ctx) error {
	branchID := int(c.Locals("branch_id").(float64))
	conversationID, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid id"})
	}
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "50"))

	messages, total, err := h.repo.ListMessages(branchID, conversationID, page, limit)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to fetch messages"})
	}
	if messages == nil {
		messages = []models.Message{}
	}
	return c.JSON(fiber.Map{"items": messages, "total": total})
}

func (h *ConversationHandler) SendMessage(c *fiber.Ctx) error {
	branchID := int(c.Locals("branch_id").(float64))
	conversationID, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid id"})
	}

	var body struct {
		Content string `json:"content"`
	}
	if err := c.BodyParser(&body); err != nil || body.Content == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "content is required"})
	}

	msg, err := h.repo.CreateOutboundMessage(conversationID, body.Content)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to send message"})
	}

	h.hub.BroadcastJSON(strconv.Itoa(branchID), fiber.Map{
		"type": "nova_mensagem",
		"payload": fiber.Map{
			"conversationId": conversationID,
			"message":        msg,
		},
	})

	return c.Status(fiber.StatusCreated).JSON(msg)
}
