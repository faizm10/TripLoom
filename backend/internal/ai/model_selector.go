package ai

type ModelSelector struct {
	DefaultModel string
}

func NewModelSelector(defaultModel string) *ModelSelector {
	return &ModelSelector{DefaultModel: defaultModel}
}

func (m *ModelSelector) Select(_ string, _ []ChatMessage) string {
	return m.DefaultModel
}
