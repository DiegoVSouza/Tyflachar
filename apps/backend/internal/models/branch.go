package models

import "time"

type Branch struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	WAPhone   string    `json:"wa_phone"`
	MetaToken string    `json:"-"`
	Plan      string    `json:"plan"`
	BotMode   string    `json:"bot_mode"` // "fixed" | "llm"
	CreatedAt time.Time `json:"created_at"`
}
