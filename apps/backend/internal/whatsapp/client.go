package whatsapp

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"

	"crm-whatsapp-api/internal/config"
)

type Client struct {
	cfg *config.Config
}

func NewClient(cfg *config.Config) *Client {
	return &Client{cfg: cfg}
}

func (c *Client) baseURL() string {
	return fmt.Sprintf("https://graph.facebook.com/%s/%s/messages", c.cfg.MetaAPIVersion, c.cfg.MetaPhoneNumberID)
}

func (c *Client) send(payload map[string]interface{}) error {
	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	req, err := http.NewRequest(http.MethodPost, c.baseURL(), bytes.NewBuffer(body))
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+c.cfg.MetaWabaToken)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	log.Printf("WhatsApp API response [%d]: %s", resp.StatusCode, string(respBody))

	if resp.StatusCode >= 300 {
		return fmt.Errorf("meta api error: status %d — %s", resp.StatusCode, string(respBody))
	}
	return nil
}

func (c *Client) SendText(to, text string) error {
	payload := map[string]interface{}{
		"messaging_product": "whatsapp",
		"to":                to,
		"type":              "text",
		"text":              map[string]string{"body": text},
	}
	return c.send(payload)
}
