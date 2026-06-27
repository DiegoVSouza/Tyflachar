package handlers

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"crm-whatsapp-api/internal/models"
	"crm-whatsapp-api/internal/repository"
)

type ClientHandler struct {
	repo *repository.Repository
}

func NewClientHandler(repo *repository.Repository) *ClientHandler {
	return &ClientHandler{repo: repo}
}

func (h *ClientHandler) List(c *fiber.Ctx) error {
	branchID := int(c.Locals("branch_id").(float64))
	q := c.Query("q")
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "30"))

	clients, total, err := h.repo.ListClients(branchID, q, page, limit)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to fetch clients"})
	}
	if clients == nil {
		clients = []models.Client{}
	}
	return c.JSON(fiber.Map{"items": clients, "total": total})
}

func (h *ClientHandler) GetByID(c *fiber.Ctx) error {
	branchID := int(c.Locals("branch_id").(float64))
	clientID, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid id"})
	}

	client, err := h.repo.GetClientByID(branchID, clientID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "client not found"})
	}
	return c.JSON(client)
}

func (h *ClientHandler) UpdateTags(c *fiber.Ctx) error {
	branchID := int(c.Locals("branch_id").(float64))
	clientID, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid id"})
	}

	var body struct {
		Tags []string `json:"tags"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid payload"})
	}

	client, err := h.repo.UpdateClientTags(branchID, clientID, body.Tags)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to update tags"})
	}
	return c.JSON(client)
}

func (h *ClientHandler) GetAppointments(c *fiber.Ctx) error {
	branchID := int(c.Locals("branch_id").(float64))
	clientID, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid id"})
	}

	appointments, err := h.repo.GetClientAppointments(branchID, clientID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to fetch appointments"})
	}
	if appointments == nil {
		appointments = []models.AppointmentWithClient{}
	}
	return c.JSON(appointments)
}
