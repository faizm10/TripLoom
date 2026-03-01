package openai

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	openai "github.com/openai/openai-go/v3"
	"github.com/openai/openai-go/v3/option"
	"github.com/openai/openai-go/v3/responses"
)

type Client struct {
	client openai.Client
}

type Message struct {
	Role    string
	Content string
}

type ChatResult struct {
	Text       string
	TokenUsage map[string]any
}

func NewClient(apiKey string) *Client {
	return &Client{
		client: openai.NewClient(
			option.WithAPIKey(apiKey),
			option.WithRequestTimeout(45*time.Second),
			option.WithMaxRetries(2),
		),
	}
}

func (c *Client) ResponsesChat(ctx context.Context, model string, systemPrompt string, messages []Message) (*ChatResult, error) {
	var transcript strings.Builder
	for _, m := range messages {
		role := m.Role
		if role != "assistant" {
			role = "user"
		}
		if transcript.Len() > 0 {
			transcript.WriteString("\n\n")
		}
		transcript.WriteString(role)
		transcript.WriteString(": ")
		transcript.WriteString(strings.TrimSpace(m.Content))
	}

	resp, err := c.client.Responses.New(ctx, responses.ResponseNewParams{
		Instructions: openai.String(systemPrompt),
		Model:        model,
		Input: responses.ResponseNewParamsInputUnion{
			OfString: openai.String(transcript.String()),
		},
	})
	if err != nil {
		return nil, fmt.Errorf("openai responses error: %w", err)
	}

	text := strings.TrimSpace(resp.OutputText())
	if text == "" {
		text = "I could not generate a response."
	}

	usage := map[string]any{}
	if usageBytes, err := json.Marshal(resp.Usage); err == nil {
		_ = json.Unmarshal(usageBytes, &usage)
	}

	return &ChatResult{Text: text, TokenUsage: usage}, nil
}
