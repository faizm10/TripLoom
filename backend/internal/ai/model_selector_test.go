package ai

import "testing"

func TestModelSelector(t *testing.T) {
	sel := NewModelSelector("gpt-5-mini")
	if got := sel.Select("hello", []ChatMessage{{Role: "user", Content: "hello"}}); got != "gpt-5-mini" {
		t.Fatalf("expected default model, got %s", got)
	}
	if got := sel.Select("Please compare and optimize", make([]ChatMessage, 12)); got != "gpt-5-mini" {
		t.Fatalf("expected default model for all prompts/contexts, got %s", got)
	}
}
