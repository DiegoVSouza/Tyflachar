package handlers

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"log"
	"strings"

	"github.com/gofiber/fiber/v2"

	"crm-whatsapp-api/internal/chatbot"
	"crm-whatsapp-api/internal/config"
	"crm-whatsapp-api/internal/repository"
)

type WebhookHandler struct {
	cfg         *config.Config
	fixedEngine *chatbot.Engine
	llmEngine   *chatbot.LLMEngine // nil when ANTHROPIC_API_KEY is not set
	repo        *repository.Repository
}

func NewWebhookHandler(
	cfg *config.Config,
	fixed *chatbot.Engine,
	llm *chatbot.LLMEngine,
	repo *repository.Repository,
) *WebhookHandler {
	return &WebhookHandler{cfg: cfg, fixedEngine: fixed, llmEngine: llm, repo: repo}
}

// engine returns the correct BotEngine for the given branch.
// Falls back to fixed mode if LLM engine is not configured or branch mode is "fixed".
func (h *WebhookHandler) engine(branchID int) chatbot.BotEngine {
	if h.llmEngine != nil && h.repo.GetBranchBotMode(branchID) == "llm" {
		return h.llmEngine
	}
	return h.fixedEngine
}

func (h *WebhookHandler) VerifyWebhook(c *fiber.Ctx) error {
	mode := c.Query("hub.mode")
	token := c.Query("hub.verify_token")
	challenge := c.Query("hub.challenge")

	if mode == "subscribe" && token == h.cfg.MetaVerifyToken {
		return c.SendString(challenge)
	}
	return c.SendStatus(fiber.StatusForbidden)
}

func (h *WebhookHandler) ReceiveWebhook(c *fiber.Ctx) error {
	signature := c.Get("X-Hub-Signature-256")
	if !h.validSignature(c.Body(), signature) {
		return c.SendStatus(fiber.StatusUnauthorized)
	}

	var payload MetaWebhookPayload
	if err := json.Unmarshal(c.Body(), &payload); err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	for _, entry := range payload.Entry {
		for _, change := range entry.Changes {
			if len(change.Value.Messages) == 0 {
				continue
			}

			for _, msg := range change.Value.Messages {
				incoming := h.normalizeMessage(msg)
				incoming.From = normalizeBRPhone(incoming.From)
				log.Printf("📩 MESSAGE RECEIVED | From: %s | Type: %s | Text: '%s'", incoming.From, incoming.Type, incoming.Text)

				client, err := h.repo.FindOrCreateClient(h.cfg.DefaultBranchID, incoming.From)
				if err != nil {
					log.Printf("❌ DB ERROR: Failed to find/create client: %v", err)
					continue
				}

				conv, err := h.repo.FindOrCreateConversation(client.ID)
				if err != nil {
					log.Printf("❌ DB ERROR: Failed to find/create conversation: %v", err)
					continue
				}
				conv.BranchID = client.BranchID

				err = h.repo.SaveMessage(conv.ID, "in", incoming.Text, incoming.Type, msg.ID)
				if err != nil {
					log.Printf("⚠️ DB WARNING: Failed to save message history: %v", err)
				}

				engine := h.engine(conv.BranchID)
				log.Println("🤖 Bot processing reply...")
				err = engine.Process(conv, incoming)
				if err != nil {
					log.Printf("❌ BOT ERROR: Failed to send reply: %v", err)
				} else {
					log.Println("✅ Bot sent reply successfully!")
				}
			}
		}
	}

	return c.SendStatus(fiber.StatusOK)
}

func normalizeBRPhone(raw string) string {
	digits := make([]byte, 0, len(raw))
	for _, r := range raw {
		if r >= '0' && r <= '9' {
			digits = append(digits, byte(r))
		}
	}
	number := string(digits)

	if !strings.HasPrefix(number, "55") {
		return number
	}

	rest := number[2:]
	switch len(rest) {
	case 11:
		return "55" + rest
	case 10:
		ddd := rest[:2]
		line := rest[2:]
		return "55" + ddd + "9" + line
	default:
		return number
	}
}

func (h *WebhookHandler) validSignature(body []byte, signature string) bool {
	if h.cfg.MetaAppSecret == "" {
		return true
	}
	mac := hmac.New(sha256.New, []byte(h.cfg.MetaAppSecret))
	mac.Write(body)
	expected := "sha256=" + hex.EncodeToString(mac.Sum(nil))
	return hmac.Equal([]byte(expected), []byte(signature))
}

func (h *WebhookHandler) normalizeMessage(msg MetaMessage) chatbot.IncomingMessage {
	incoming := chatbot.IncomingMessage{From: msg.From, Type: msg.Type}
	switch msg.Type {
	case "text":
		incoming.Text = msg.Text.Body
	case "interactive":
		if msg.Interactive.Type == "button_reply" {
			incoming.ButtonID = msg.Interactive.ButtonReply.ID
		} else if msg.Interactive.Type == "list_reply" {
			incoming.ButtonID = msg.Interactive.ListReply.ID
		}
	}
	return incoming
}

type MetaWebhookPayload struct {
	Entry []MetaEntry `json:"entry"`
}
type MetaEntry struct {
	Changes []MetaChange `json:"changes"`
}
type MetaChange struct {
	Value MetaValue `json:"value"`
}
type MetaValue struct {
	Messages []MetaMessage `json:"messages"`
}
type MetaMessage struct {
	ID          string          `json:"id"`
	From        string          `json:"from"`
	Type        string          `json:"type"`
	Text        MetaText        `json:"text"`
	Interactive MetaInteractive `json:"interactive"`
}
type MetaText struct {
	Body string `json:"body"`
}
type MetaInteractive struct {
	Type        string          `json:"type"`
	ButtonReply MetaButtonReply `json:"button_reply"`
	ListReply   MetaListReply   `json:"list_reply"`
}
type MetaButtonReply struct {
	ID    string `json:"id"`
	Title string `json:"title"`
}
type MetaListReply struct {
	ID    string `json:"id"`
	Title string `json:"title"`
}
