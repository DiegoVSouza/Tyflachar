package chatbot

import (
	"context"
	"fmt"

	"crm-whatsapp-api/internal/models"
	"crm-whatsapp-api/internal/redisclient"
	"crm-whatsapp-api/internal/repository"
	"crm-whatsapp-api/internal/whatsapp"
)

// Engine implements the fixed state-machine chatbot flow.
type Engine struct {
	wa        *whatsapp.Client
	repo      *repository.Repository
	publisher *redisclient.Publisher
}

func NewEngine(wa *whatsapp.Client, repo *repository.Repository, publisher *redisclient.Publisher) *Engine {
	return &Engine{wa: wa, repo: repo, publisher: publisher}
}

type IncomingMessage struct {
	From     string
	Type     string
	Text     string
	ButtonID string
}

// Process dispatches to the right state handler and persists conversation state.
func (e *Engine) Process(conv *models.Conversation, msg IncomingMessage) error {
	if conv.Context == nil {
		conv.Context = map[string]interface{}{}
	}

	var err error

	switch conv.BotState {
	case StateStart, "":
		err = e.sendMainMenu(conv, msg)
	case StateMainMenu:
		err = e.handleMainMenu(conv, msg)
	case StateChoosingService:
		err = e.handleServiceChoice(conv, msg)
	case StateChoosingSlot:
		err = e.handleSlotChoice(conv, msg)
	case StateConfirming:
		err = e.handleConfirmation(conv, msg)
	case StateDone:
		err = e.sendMainMenu(conv, msg)
	default:
		err = e.sendMainMenu(conv, msg)
	}

	if err != nil {
		return err
	}
	return e.repo.UpdateState(conv)
}

func (e *Engine) sendMainMenu(conv *models.Conversation, msg IncomingMessage) error {
	conv.BotState = StateMainMenu
	return e.wa.SendButtons(
		msg.From,
		"Hi! 👋 I'm the virtual assistant. How can I help you today?",
		[]whatsapp.ButtonOption{
			{ID: BtnSchedule, Title: "Schedule appointment"},
			{ID: BtnViewSlots, Title: "View availability"},
			{ID: BtnTalkToAgent, Title: "Talk to staff"},
		},
	)
}

func (e *Engine) handleMainMenu(conv *models.Conversation, msg IncomingMessage) error {
	switch msg.ButtonID {
	case BtnSchedule:
		conv.BotState = StateChoosingService
		return e.sendServiceList(conv, msg.From)

	case BtnViewSlots:
		slots, err := e.repo.ListAvailableSlots(conv.BranchID, PeriodMorning)
		if err != nil || len(slots) == 0 {
			return e.wa.SendText(msg.From, "No available slots at the moment, please try again later.")
		}
		text := "Next available slots:\n"
		for _, s := range slots {
			text += fmt.Sprintf("- %s\n", s.ScheduledAt.Format("01/02 15:04"))
		}
		return e.wa.SendText(msg.From, text)

	case BtnTalkToAgent:
		conv.BotState = StateDone
		conv.Status = "waiting_agent"
		return e.wa.SendText(msg.From, "Perfect! We'll connect you with our staff shortly 🙂")

	default:
		return e.sendMainMenu(conv, msg)
	}
}

func (e *Engine) sendServiceList(conv *models.Conversation, to string) error {
	services, err := e.repo.ListActiveServices(conv.BranchID)
	if err != nil || len(services) == 0 {
		return e.wa.SendText(to, "No services registered at the moment. We'll contact you manually.")
	}

	rows := make([]whatsapp.ListRow, 0, len(services))
	for _, s := range services {
		rows = append(rows, whatsapp.ListRow{
			ID:          fmt.Sprintf("service_%d", s.ID),
			Title:       s.Name,
			Description: fmt.Sprintf("Starting at R$ %.2f", s.StartingPrice),
		})
	}
	return e.wa.SendList(to, "Which service would you like to book?", "View services", "Available services", rows)
}

func (e *Engine) handleServiceChoice(conv *models.Conversation, msg IncomingMessage) error {
	if msg.ButtonID == "" {
		return e.sendServiceList(conv, msg.From)
	}

	conv.Context["service_id"] = msg.ButtonID
	conv.BotState = StateChoosingSlot

	return e.wa.SendButtons(
		msg.From,
		"Great choice! Which period do you prefer?",
		[]whatsapp.ButtonOption{
			{ID: PeriodMorning, Title: "Morning"},
			{ID: PeriodAfternoon, Title: "Afternoon"},
			{ID: PeriodEvening, Title: "Evening"},
		},
	)
}

func (e *Engine) handleSlotChoice(conv *models.Conversation, msg IncomingMessage) error {
	period := msg.ButtonID
	if period != PeriodMorning && period != PeriodAfternoon && period != PeriodEvening {
		return e.wa.SendButtons(
			msg.From,
			"I didn't understand. Which period do you prefer?",
			[]whatsapp.ButtonOption{
				{ID: PeriodMorning, Title: "Morning"},
				{ID: PeriodAfternoon, Title: "Afternoon"},
				{ID: PeriodEvening, Title: "Evening"},
			},
		)
	}

	slots, err := e.repo.ListAvailableSlots(conv.BranchID, period)
	if err != nil || len(slots) == 0 {
		return e.wa.SendText(msg.From, "No slots available for this period, please choose another (morning/afternoon/evening).")
	}

	conv.Context["slot_id"] = slots[0].ID
	conv.Context["slot_time"] = slots[0].ScheduledAt.Format("2006-01-02T15:04:05Z07:00")
	conv.BotState = StateConfirming

	return e.wa.SendButtons(
		msg.From,
		fmt.Sprintf("I found the slot %s. Confirm the booking?", slots[0].ScheduledAt.Format("01/02 15:04")),
		[]whatsapp.ButtonOption{
			{ID: BtnConfirmYes, Title: "Confirm"},
			{ID: BtnConfirmNo, Title: "Choose another"},
		},
	)
}

func (e *Engine) handleConfirmation(conv *models.Conversation, msg IncomingMessage) error {
	switch msg.ButtonID {
	case BtnConfirmYes:
		slotID, _ := conv.Context["slot_id"].(int)
		scheduledAt, _ := conv.Context["slot_time"].(string)
		serviceID, _ := conv.Context["service_id"].(string)

		appointmentID, err := e.repo.CreateAppointment(conv.ClientID, serviceID, slotID, scheduledAt)
		if err != nil {
			return e.wa.SendText(msg.From, "We had a problem confirming. We'll contact you manually.")
		}

		conv.BotState = StateDone
		conv.Status = "closed"

		if e.publisher != nil {
			_ = e.publisher.PublishNewAppointment(context.Background(), redisclient.NewAppointmentEvent{
				BranchID:      conv.BranchID,
				AppointmentID: appointmentID,
				Service:       serviceID,
				ScheduledAt:   scheduledAt,
			})
		}

		return e.wa.SendText(msg.From, "Appointment confirmed! ✅ We'll see you there.")

	case BtnConfirmNo:
		conv.BotState = StateChoosingService
		return e.sendServiceList(conv, msg.From)

	default:
		return e.wa.SendButtons(
			msg.From,
			"I didn't understand. Can you confirm the appointment?",
			[]whatsapp.ButtonOption{
				{ID: BtnConfirmYes, Title: "Confirm"},
				{ID: BtnConfirmNo, Title: "Choose another"},
			},
		)
	}
}
