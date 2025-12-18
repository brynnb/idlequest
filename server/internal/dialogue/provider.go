package dialogue

import (
	"context"
)

// ChatMessage represents a message in the chat completion request
type ChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// Provider defines the interface for LLM providers
type Provider interface {
	// Name returns the provider name for logging/config
	Name() string

	// Complete sends messages to the LLM and returns the parsed dialogue response
	Complete(ctx context.Context, messages []ChatMessage) (*DialogueResponse, error)

	// IsConfigured returns true if the provider has valid credentials
	IsConfigured() bool
}

// ProviderConfig holds common configuration for providers
type ProviderConfig struct {
	APIKey  string
	Model   string
	BaseURL string
}
