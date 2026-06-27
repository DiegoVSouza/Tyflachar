package chatbot

import (
	"context"
	"fmt"
	"strings"

	"crm-whatsapp-api/internal/llm"
	"crm-whatsapp-api/internal/models"
	"crm-whatsapp-api/internal/redisclient"
	"crm-whatsapp-api/internal/repository"
	"crm-whatsapp-api/internal/whatsapp"
)

// LLMEngine implements BotEngine using Claude with RAG and tool calling.
type LLMEngine struct {
	wa        *whatsapp.Client
	repo      *repository.Repository
	publisher *redisclient.Publisher
	llm       *llm.Client
}

func NewLLMEngine(
	wa *whatsapp.Client,
	repo *repository.Repository,
	publisher *redisclient.Publisher,
	llmClient *llm.Client,
) *LLMEngine {
	return &LLMEngine{wa: wa, repo: repo, publisher: publisher, llm: llmClient}
}

// Process handles an incoming message using Claude with RAG and tool calling.
func (e *LLMEngine) Process(conv *models.Conversation, msg IncomingMessage) error {
	if conv.Context == nil {
		conv.Context = map[string]interface{}{}
	}

	// 1. Load recent conversation history for context
	history, _ := e.repo.GetRecentMessages(conv.ID, 10)

	// 2. Load RAG knowledge for this branch
	knowledge, _ := e.repo.GetBranchKnowledge(conv.BranchID)

	// 3. Get branch name for system prompt
	branchName := "our establishment"
	if branch, err := e.repo.GetBranchByID(conv.BranchID); err == nil {
		branchName = branch.Name
	}

	// 4. Build Claude messages from history
	messages := buildMessageHistory(history)

	// 5. Append the current user message
	userInput := msg.Text
	if msg.ButtonID != "" {
		userInput = msg.ButtonID
	}
	if userInput == "" {
		userInput = "[empty message]"
	}
	messages = append(messages, llm.Message{Role: "user", Content: userInput})

	// 6. Run Claude with tool-calling loop
	reply, err := e.callWithTools(conv, buildSystemPrompt(branchName, knowledge), messages, e.defineTools())
	if err != nil {
		return e.wa.SendText(msg.From, "I'm having trouble right now. Please try again shortly.")
	}

	// 7. Persist the reply and send
	_ = e.repo.SaveMessage(conv.ID, "out", reply, "text", "")
	_ = e.repo.UpdateState(conv) // keep conversation open in LLM mode
	return e.wa.SendText(msg.From, reply)
}

// ─── System prompt ────────────────────────────────────────────────────────────

func buildSystemPrompt(branchName string, knowledge []models.BranchKnowledge) string {
	var sb strings.Builder
	sb.WriteString(fmt.Sprintf(
		"You are a helpful WhatsApp assistant for %s.\n"+
			"You help clients schedule appointments, answer questions about services, "+
			"and provide general business information.\n\n"+
			"Guidelines:\n"+
			"- Keep replies concise and friendly (this is WhatsApp, not email)\n"+
			"- Always use the available tools to fetch real-time data before answering\n"+
			"- Confirm details before creating an appointment\n"+
			"- If you cannot help, offer to connect the client with a staff member\n",
		branchName,
	))

	if len(knowledge) > 0 {
		sb.WriteString("\n## Business Knowledge Base\n")
		for _, k := range knowledge {
			sb.WriteString(fmt.Sprintf("\n### %s (%s)\n%s\n", k.Title, k.Category, k.Content))
		}
	}

	return sb.String()
}

// ─── Message history builder ──────────────────────────────────────────────────

func buildMessageHistory(msgs []models.Message) []llm.Message {
	var result []llm.Message
	for _, m := range msgs {
		role := "user"
		if m.Direction == "out" {
			role = "assistant"
		}
		result = append(result, llm.Message{Role: role, Content: m.Content})
	}
	return result
}

// ─── Tool definitions ─────────────────────────────────────────────────────────

func (e *LLMEngine) defineTools() []llm.Tool {
	return []llm.Tool{
		{
			Name:        "list_services",
			Description: "List all active services offered by the branch with their prices and IDs.",
			InputSchema: map[string]interface{}{
				"type":       "object",
				"properties": map[string]interface{}{},
			},
		},
		{
			Name:        "search_available_slots",
			Description: "Search for available appointment time slots for a given period of the day.",
			InputSchema: map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"period": map[string]interface{}{
						"type":        "string",
						"enum":        []string{"morning", "afternoon", "evening"},
						"description": "Time of day to search.",
					},
				},
				"required": []string{"period"},
			},
		},
		{
			Name:        "create_appointment",
			Description: "Create a confirmed appointment for the client. Only call after client has confirmed all details.",
			InputSchema: map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"service_id": map[string]interface{}{
						"type":        "string",
						"description": "Service ID string returned by list_services (e.g. 'service_3').",
					},
					"slot_id": map[string]interface{}{
						"type":        "integer",
						"description": "Numeric slot ID returned by search_available_slots.",
					},
					"scheduled_at": map[string]interface{}{
						"type":        "string",
						"description": "ISO 8601 datetime of the slot (e.g. '2024-07-15T10:00:00-03:00').",
					},
				},
				"required": []string{"service_id", "slot_id", "scheduled_at"},
			},
		},
	}
}

// ─── Tool execution ───────────────────────────────────────────────────────────

func (e *LLMEngine) executeTool(conv *models.Conversation, block llm.ContentBlock) string {
	switch block.Name {

	case "list_services":
		services, err := e.repo.ListActiveServices(conv.BranchID)
		if err != nil || len(services) == 0 {
			return "No services available at the moment."
		}
		var sb strings.Builder
		sb.WriteString("Available services:\n")
		for _, s := range services {
			sb.WriteString(fmt.Sprintf("- ID: service_%d | %s | Starting at R$ %.2f\n",
				s.ID, s.Name, s.StartingPrice))
		}
		return sb.String()

	case "search_available_slots":
		period, _ := block.Input["period"].(string)
		slots, err := e.repo.ListAvailableSlots(conv.BranchID, period)
		if err != nil || len(slots) == 0 {
			return fmt.Sprintf("No slots available in the %s period.", period)
		}
		var sb strings.Builder
		sb.WriteString(fmt.Sprintf("Available %s slots:\n", period))
		for _, s := range slots {
			sb.WriteString(fmt.Sprintf("- Slot ID: %d | Time: %s\n",
				s.ID, s.ScheduledAt.Format("Jan 02 at 15:04")))
		}
		return sb.String()

	case "create_appointment":
		serviceID, _ := block.Input["service_id"].(string)
		slotIDFloat, _ := block.Input["slot_id"].(float64) // JSON numbers decode as float64
		slotID := int(slotIDFloat)
		scheduledAt, _ := block.Input["scheduled_at"].(string)

		appointmentID, err := e.repo.CreateAppointment(conv.ClientID, serviceID, slotID, scheduledAt)
		if err != nil {
			return "Failed to create the appointment. Please try again."
		}

		if e.publisher != nil {
			_ = e.publisher.PublishNewAppointment(context.Background(), redisclient.NewAppointmentEvent{
				BranchID:      conv.BranchID,
				AppointmentID: appointmentID,
				Service:       serviceID,
				ScheduledAt:   scheduledAt,
			})
		}

		return fmt.Sprintf("Appointment created successfully! Booking ID: %d, scheduled for %s.", appointmentID, scheduledAt)
	}

	return "Unknown tool."
}

// ─── Tool-calling loop ────────────────────────────────────────────────────────

// callWithTools sends to Claude and handles tool_use iterations (max 5 rounds).
func (e *LLMEngine) callWithTools(
	conv *models.Conversation,
	system string,
	messages []llm.Message,
	tools []llm.Tool,
) (string, error) {
	for i := 0; i < 5; i++ {
		resp, err := e.llm.Complete(system, messages, tools)
		if err != nil {
			return "", err
		}

		// Extract plain text when Claude is done
		if resp.StopReason == "end_turn" {
			for _, block := range resp.Content {
				if block.Type == "text" && block.Text != "" {
					return block.Text, nil
				}
			}
			return "", nil
		}

		// Handle tool_use — execute tools and feed results back
		if resp.StopReason == "tool_use" {
			// Append Claude's assistant message (which contains tool_use blocks)
			messages = append(messages, llm.Message{
				Role:    "assistant",
				Content: resp.Content,
			})

			// Execute each tool and collect results
			var toolResults []llm.ContentBlock
			for _, block := range resp.Content {
				if block.Type == "tool_use" {
					result := e.executeTool(conv, block)
					toolResults = append(toolResults, llm.ContentBlock{
						Type:      "tool_result",
						ToolUseID: block.ID,
						Content:   result,
					})
				}
			}

			// Append tool results as a user message
			messages = append(messages, llm.Message{
				Role:    "user",
				Content: toolResults,
			})
			continue
		}

		// Fallback: extract any text found
		for _, block := range resp.Content {
			if block.Type == "text" && block.Text != "" {
				return block.Text, nil
			}
		}
		break
	}

	return "I wasn't able to process that request. Please try again or type 'menu' to start over.", nil
}
