package ws

import (
	"encoding/json"
	"sync"
)

type Hub struct {
	mu      sync.RWMutex
	clients map[string]map[*Client]bool
}

type Client struct {
	Send chan []byte
}

func NewHub() *Hub {
	return &Hub{clients: make(map[string]map[*Client]bool)}
}

func (h *Hub) Register(branchID string, c *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if h.clients[branchID] == nil {
		h.clients[branchID] = make(map[*Client]bool)
	}
	h.clients[branchID][c] = true
}

func (h *Hub) Unregister(branchID string, c *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	delete(h.clients[branchID], c)
}

func (h *Hub) Broadcast(branchID string, payload []byte) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	for c := range h.clients[branchID] {
		c.Send <- payload
	}
}

func (h *Hub) BroadcastJSON(branchID string, v any) {
	data, err := json.Marshal(v)
	if err != nil {
		return
	}
	h.Broadcast(branchID, data)
}
