package ai

// ModelSelector chooses which LLM to use for a given request.
// TODO: Add routing logic (e.g. by prompt length, complexity, or user tier) so Select()
// returns something other than DefaultModel when appropriate. For now it's a single-model placeholder.
type ModelSelector struct {
	DefaultModel string
}

func NewModelSelector(defaultModel string) *ModelSelector {
	return &ModelSelector{DefaultModel: defaultModel}
}

func (m *ModelSelector) Select(_ string, _ []ChatMessage) string {
	return m.DefaultModel
}
