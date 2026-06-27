package models

import "time"

type Client struct {
	ID        int       `json:"id"`
	BranchID  int       `json:"branch_id"`
	Name      string    `json:"name"`
	Phone     string    `json:"phone"`
	Tags      []string  `json:"tags,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}
