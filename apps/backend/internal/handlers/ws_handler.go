package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/websocket/v2"
	"crm-whatsapp-api/internal/ws"
)

func WebSocketUpgrade(hub *ws.Hub) fiber.Handler {
	return websocket.New(func(c *websocket.Conn) {
		branchID := c.Params("branchId")
		client := &ws.Client{Send: make(chan []byte, 16)}

		hub.Register(branchID, client)
		defer hub.Unregister(branchID, client)

		go func() {
			for msg := range client.Send {
				if err := c.WriteMessage(websocket.TextMessage, msg); err != nil {
					return
				}
			}
		}()

		for {
			if _, _, err := c.ReadMessage(); err != nil {
				break
			}
		}
	})
}
