package models

import "time"

type Message struct {
	ID             int       `json:"id"`
	ConversationID int       `json:"conversation_id"`
	Direction      string    `json:"direction"` // "in" or "out"
	Content        string    `json:"content"`
	Type           string    `json:"type"` // text, button, interactive
	WaMessageID    string    `json:"wa_message_id,omitempty"`
	Status         string    `json:"status"`
	Timestamp      time.Time `json:"timestamp"`
}
