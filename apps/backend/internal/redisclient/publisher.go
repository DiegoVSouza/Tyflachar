package redisclient

import (
	"context"
	"encoding/json"
	"strconv"

	"github.com/redis/go-redis/v9"
)

type Publisher struct {
	rdb *redis.Client
}

func NewPublisher(rdb *redis.Client) *Publisher {
	return &Publisher{rdb: rdb}
}

type NewAppointmentEvent struct {
	BranchID      int    `json:"branch_id"`
	AppointmentID int    `json:"appointment_id"`
	ClientName    string `json:"client_name"`
	Service       string `json:"service"`
	ScheduledAt   string `json:"scheduled_at"`
}

type NewMessageEvent struct {
	BranchID       int    `json:"branch_id"`
	ConversationID int    `json:"conversation_id"`
	Direction      string `json:"direction"`
	Content        string `json:"content"`
}

func branchChannel(branchID int) string {
	return "branch:" + strconv.Itoa(branchID) + ":events"
}

func (p *Publisher) PublishNewAppointment(ctx context.Context, event NewAppointmentEvent) error {
	payload, err := json.Marshal(map[string]interface{}{
		"type": "new_appointment",
		"data": event,
	})
	if err != nil {
		return err
	}
	return p.rdb.Publish(ctx, branchChannel(event.BranchID), payload).Err()
}

func (p *Publisher) PublishNewMessage(ctx context.Context, event NewMessageEvent) error {
	payload, err := json.Marshal(map[string]interface{}{
		"type": "new_message",
		"data": event,
	})
	if err != nil {
		return err
	}
	return p.rdb.Publish(ctx, branchChannel(event.BranchID), payload).Err()
}
