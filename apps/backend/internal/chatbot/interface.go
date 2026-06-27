package chatbot

import "crm-whatsapp-api/internal/models"

// BotEngine is satisfied by both Engine (fixed flow) and LLMEngine (Claude).
type BotEngine interface {
	Process(conv *models.Conversation, msg IncomingMessage) error
}
