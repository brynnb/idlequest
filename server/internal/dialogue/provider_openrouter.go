package dialogue

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
)

// OpenRouterProvider implements the Provider interface for OpenRouter
type OpenRouterProvider struct {
	config ProviderConfig
}

// NewOpenRouterProvider creates a new OpenRouter provider
func NewOpenRouterProvider() *OpenRouterProvider {
	return &OpenRouterProvider{
		config: ProviderConfig{
			APIKey:  os.Getenv("OPENROUTER_API_KEY"),
			Model:   getEnvOrDefault("OPENROUTER_MODEL", "openai/gpt-4o-mini"),
			BaseURL: getEnvOrDefault("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1/chat/completions"),
		},
	}
}

func (p *OpenRouterProvider) Name() string {
	return "openrouter"
}

func (p *OpenRouterProvider) IsConfigured() bool {
	return p.config.APIKey != ""
}

func (p *OpenRouterProvider) Complete(ctx context.Context, messages []ChatMessage) (*DialogueResponse, error) {
	requestBody := map[string]interface{}{
		"model":    p.config.Model,
		"messages": messages,
	}

	jsonBody, err := json.Marshal(requestBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", p.config.BaseURL, bytes.NewBuffer(jsonBody))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+p.config.APIKey)
	req.Header.Set("HTTP-Referer", "https://idlequest.app")
	req.Header.Set("X-Title", "IdleQuest")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to call API: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("API returned status %d: %s", resp.StatusCode, string(body))
	}

	var apiResponse struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&apiResponse); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	if len(apiResponse.Choices) == 0 {
		return nil, fmt.Errorf("no choices in API response")
	}

	// OpenRouter may not always return JSON, so try to parse it
	content := apiResponse.Choices[0].Message.Content

	// Strip markdown code blocks if present (```json ... ``` or ``` ... ```)
	content = strings.TrimSpace(content)
	if strings.HasPrefix(content, "```json") {
		content = strings.TrimPrefix(content, "```json")
		content = strings.TrimSuffix(content, "```")
		content = strings.TrimSpace(content)
	} else if strings.HasPrefix(content, "```") {
		content = strings.TrimPrefix(content, "```")
		content = strings.TrimSuffix(content, "```")
		content = strings.TrimSpace(content)
	}

	// Try to parse as our expected format first
	var dialogueResp DialogueResponse
	if err := json.Unmarshal([]byte(content), &dialogueResp); err == nil && dialogueResp.Dialogue != "" {
		return &dialogueResp, nil
	}

	// LLM might return responses as objects with "text" and "next" fields
	// Try parsing that format
	var complexResp struct {
		Dialogue  string `json:"dialogue"`
		Responses []struct {
			Text string `json:"text"`
			Next string `json:"next"`
		} `json:"responses"`
	}
	if err := json.Unmarshal([]byte(content), &complexResp); err == nil && complexResp.Dialogue != "" {
		// Convert complex responses to simple strings
		responses := make([]string, len(complexResp.Responses))
		for i, r := range complexResp.Responses {
			responses[i] = r.Text
		}
		return &DialogueResponse{
			Dialogue:  complexResp.Dialogue,
			Responses: responses,
		}, nil
	}

	// If not valid JSON, treat the whole response as dialogue
	return &DialogueResponse{
		Dialogue:  content,
		Responses: []string{},
	}, nil
}
