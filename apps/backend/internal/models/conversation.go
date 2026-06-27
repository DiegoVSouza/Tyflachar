package models

import "time"

type Conversation struct {
	ID        int                    `json:"id"`
	ClientID  int                    `json:"client_id"`
	BranchID  int                    `json:"branch_id"`
	Status    string                 `json:"status"`
	BotState  string                 `json:"bot_state"`
	Context   map[string]interface{} `json:"context"`
	LastMsgAt time.Time              `json:"last_msg_at"`
}

type ConversationWithClient struct {
	ID            int       `json:"id"`
	ClientID      int       `json:"client_id"`
	ClientName    string    `json:"client_name"`
	ClientPhone   string    `json:"client_phone"`
	Status        string    `json:"status"`
	LastMessageAt time.Time `json:"last_message_at"`
	LastMessage   string    `json:"last_message"`
	Unread        int       `json:"unread"`
}
