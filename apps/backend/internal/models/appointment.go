package models

import "time"

type Appointment struct {
	ID         int       `json:"id"`
	ClientID   int       `json:"client_id"`
	Service    string    `json:"service"`
	ScheduledAt time.Time `json:"scheduled_at"`
	Status     string    `json:"status"`
	CreatedAt  time.Time `json:"created_at"`
}

type AppointmentWithClient struct {
	ID          int       `json:"id"`
	ClientName  string    `json:"client_name"`
	Service     string    `json:"service"`
	ScheduledAt time.Time `json:"scheduled_at"`
	Status      string    `json:"status"`
}
