// Package llm provides a minimal HTTP client for the Anthropic Claude API
// with support for tool calling (function calling).
package llm

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

const anthropicAPIURL = "https://api.anthropic.com/v1/messages"
const anthropicVersion = "2023-06-01"

// Client is a thin wrapper around the Anthropic Messages API.
type Client struct {
	apiKey string
	model  string
}

func NewClient(apiKey, model string) *Client {
	return &Client{apiKey: apiKey, model: model}
}

// ─── Message types ────────────────────────────────────────────────────────────

// ContentBlock represents one item inside a message's content array.
type ContentBlock struct {
	// Common
	Type string `json:"type"`

	// type = "text"
	Text string `json:"text,omitempty"`

	// type = "tool_use" (assistant → us)
	ID    string                 `json:"id,omitempty"`
	Name  string                 `json:"name,omitempty"`
	Input map[string]interface{} `json:"input,omitempty"`

	// type = "tool_result" (us → assistant)
	ToolUseID string `json:"tool_use_id,omitempty"`
	Content   string `json:"content,omitempty"`
}

// Message is a single conversation turn.
// Content can be a plain string (simple text turns) or []ContentBlock (tool use).
type Message struct {
	Role    string      `json:"role"`
	Content interface{} `json:"content"` // string | []ContentBlock
}

// ─── Tool definition ──────────────────────────────────────────────────────────

// Tool defines a callable function Claude can invoke.
type Tool struct {
	Name        string      `json:"name"`
	Description string      `json:"description"`
	InputSchema interface{} `json:"input_schema"`
}

// ─── API request / response ───────────────────────────────────────────────────

type apiRequest struct {
	Model     string    `json:"model"`
	MaxTokens int       `json:"max_tokens"`
	System    string    `json:"system,omitempty"`
	Messages  []Message `json:"messages"`
	Tools     []Tool    `json:"tools,omitempty"`
}

// Response is the parsed reply from Claude.
type Response struct {
	Content    []ContentBlock `json:"content"`
	StopReason string         `json:"stop_reason"`
}

// ─── Complete ─────────────────────────────────────────────────────────────────

// Complete sends a request to Claude and returns the response.
// It handles both plain-text and tool-use stop reasons; the caller is
// responsible for the tool-use loop.
func (c *Client) Complete(system string, messages []Message, tools []Tool) (*Response, error) {
	payload := apiRequest{
		Model:     c.model,
		MaxTokens: 1024,
		System:    system,
		Messages:  messages,
		Tools:     tools,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("llm: marshal request: %w", err)
	}

	req, err := http.NewRequest(http.MethodPost, anthropicAPIURL, bytes.NewBuffer(body))
	if err != nil {
		return nil, fmt.Errorf("llm: create request: %w", err)
	}
	req.Header.Set("x-api-key", c.apiKey)
	req.Header.Set("anthropic-version", anthropicVersion)
	req.Header.Set("content-type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("llm: http request: %w", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode >= 300 {
		return nil, fmt.Errorf("llm: anthropic api error %d: %s", resp.StatusCode, string(respBody))
	}

	var result Response
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, fmt.Errorf("llm: decode response: %w", err)
	}
	return &result, nil
}
