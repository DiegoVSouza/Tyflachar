package models

import "time"

type AvailableSlot struct {
	ID          int       `json:"id"`
	ScheduledAt time.Time `json:"scheduled_at"`
}
