package handlers

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"crm-whatsapp-api/internal/models"
	"crm-whatsapp-api/internal/repository"
)

type AppointmentHandler struct {
	repo *repository.Repository
}

func NewAppointmentHandler(repo *repository.Repository) *AppointmentHandler {
	return &AppointmentHandler{repo: repo}
}

func (h *AppointmentHandler) List(c *fiber.Ctx) error {
	branchID := int(c.Locals("branch_id").(float64))
	status := c.Query("status")
	period := c.Query("period")

	appointments, err := h.repo.ListAppointments(branchID, status, period)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to fetch appointments"})
	}
	if appointments == nil {
		appointments = []models.AppointmentWithClient{}
	}
	return c.JSON(appointments)
}

func (h *AppointmentHandler) Create(c *fiber.Ctx) error {
	branchID := int(c.Locals("branch_id").(float64))

	var body struct {
		ClientID    int    `json:"client_id"`
		Service     string `json:"service"`
		ScheduledAt string `json:"scheduled_at"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid payload"})
	}
	if body.ClientID == 0 || body.Service == "" || body.ScheduledAt == "" {
		return c.Status(fiber.StatusUnprocessableEntity).JSON(fiber.Map{"error": "client_id, service and scheduled_at are required"})
	}

	appt, err := h.repo.CreateAppointmentForClient(branchID, body.ClientID, body.Service, body.ScheduledAt)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to create appointment"})
	}
	return c.Status(fiber.StatusCreated).JSON(appt)
}

func (h *AppointmentHandler) Update(c *fiber.Ctx) error {
	branchID := int(c.Locals("branch_id").(float64))
	appointmentID, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid id"})
	}

	var body struct {
		Status string `json:"status"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid payload"})
	}

	appt, err := h.repo.UpdateAppointment(branchID, appointmentID, body.Status)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to update appointment"})
	}
	return c.JSON(appt)
}
