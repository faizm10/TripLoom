package ai

import (
	"context"
	"errors"
	"fmt"
	"regexp"
	"strings"
	"time"

	"triploom/backend/internal/providers/nextbridge"
	"triploom/backend/internal/providers/openai"
	"triploom/backend/internal/store"
)

var (
	ErrUnauthorizedTrip = errors.New("unauthorized trip access")
	ErrInvalidInput     = errors.New("invalid input")
)

type ChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type ChatRequest struct {
	TripID      string         `json:"tripId"`
	PageKey     string         `json:"pageKey"`
	PageContext map[string]any `json:"pageContext"`
	Messages    []ChatMessage  `json:"messages"`
	Refresh     bool           `json:"refresh"`
}

type Source struct {
	Name      string `json:"name"`
	Status    string `json:"status"`
	FetchedAt string `json:"fetchedAt"`
	Detail    string `json:"detail,omitempty"`
}

type ChatResponse struct {
	ConversationID   string   `json:"conversationId"`
	Answer           string   `json:"answer"`
	Highlights       []string `json:"highlights"`
	SuggestedActions []string `json:"suggestedActions"`
	Sources          []Source `json:"sources"`
	Degraded         bool     `json:"degraded"`
}

type RefreshContextRequest struct {
	TripID  string `json:"tripId"`
	PageKey string `json:"pageKey"`
}

type RefreshContextResponse struct {
	UpdatedAt string `json:"updatedAt"`
	PageKey   string `json:"pageKey"`
}

type Service struct {
	repo          *store.AIRepository
	openaiClient  *openai.Client
	nextClient    *nextbridge.Client
	modelSelector *ModelSelector
}

func NewService(repo *store.AIRepository, openaiClient *openai.Client, nextClient *nextbridge.Client, modelSelector *ModelSelector) *Service {
	return &Service{repo: repo, openaiClient: openaiClient, nextClient: nextClient, modelSelector: modelSelector}
}

func (s *Service) Chat(ctx context.Context, userID string, req ChatRequest) (*ChatResponse, error) {
	if req.TripID == "" || req.PageKey == "" || len(req.Messages) == 0 {
		return nil, ErrInvalidInput
	}

	ok, err := s.repo.IsTripMember(ctx, req.TripID, userID)
	if err != nil {
		return nil, err
	}
	if !ok {
		return nil, ErrUnauthorizedTrip
	}

	trip, err := s.repo.GetTripByID(ctx, req.TripID)
	if err != nil {
		return nil, err
	}

	conversationID, err := s.repo.UpsertConversation(ctx, req.TripID, userID, fmt.Sprintf("%s assistant", strings.Title(req.PageKey)))
	if err != nil {
		return nil, err
	}

	contextPayload := map[string]any{
		"trip": map[string]any{
			"id":          trip.ID,
			"destination": trip.Destination,
			"startDate":   trip.StartDate.Format("2006-01-02"),
			"endDate":     trip.EndDate.Format("2006-01-02"),
			"timezone":    trip.Timezone,
		},
		"pageKey": req.PageKey,
	}
	if len(req.PageContext) > 0 {
		contextPayload["pageContext"] = req.PageContext
	}

	sources := make([]Source, 0)
	degraded := false
	if req.Refresh {
		toolSources, toolDegraded, toolContext := s.fetchRealtimeContext(ctx, req.PageKey, req.Messages)
		degraded = toolDegraded
		for k, v := range toolContext {
			contextPayload[k] = v
		}
		sources = append(sources, toolSources...)
	}

	if len(sources) == 0 {
		sources = append(sources, Source{Name: "trip_db_context", Status: "ok", FetchedAt: time.Now().UTC().Format(time.RFC3339)})
	}

	_ = s.repo.InsertContextSnapshot(ctx, req.TripID, req.PageKey, contextPayload)

	userPrompt := req.Messages[len(req.Messages)-1].Content
	model := s.modelSelector.Select(userPrompt, req.Messages)
	systemPrompt := BuildSystemPrompt(req.PageKey, contextPayload, degraded)

	mapped := make([]openai.Message, 0, len(req.Messages))
	for _, m := range req.Messages {
		if m.Role != "assistant" {
			m.Role = "user"
		}
		mapped = append(mapped, openai.Message{Role: m.Role, Content: m.Content})
	}

	result, err := s.openaiClient.ResponsesChat(ctx, model, systemPrompt, mapped)
	if err != nil {
		return nil, err
	}
	if strings.TrimSpace(result.Text) == "" || result.Text == "I could not generate a response." {
		result.Text = buildLocalFallbackAnswer(req.PageKey, req.Messages, degraded)
	}

	if err := s.repo.InsertMessage(ctx, conversationID, "user", userPrompt, "", nil); err != nil {
		return nil, err
	}
	if err := s.repo.InsertMessage(ctx, conversationID, "assistant", result.Text, model, result.TokenUsage); err != nil {
		return nil, err
	}
	for _, src := range sources {
		_ = s.repo.InsertToolSnapshot(ctx, conversationID, req.PageKey, src.Name, src.Status, map[string]any{"detail": src.Detail, "fetchedAt": src.FetchedAt})
	}
	_ = s.repo.InsertAuditLog(ctx, userID, req.TripID, "ai_chat", map[string]any{"pageKey": req.PageKey, "model": model, "degraded": degraded})

	resp := &ChatResponse{
		ConversationID: conversationID,
		Answer:         result.Text,
		Highlights: []string{
			"Read-only guidance generated from current trip context",
			fmt.Sprintf("Page-aware reasoning for %s", req.PageKey),
		},
		SuggestedActions: suggestActionsForPage(req.PageKey),
		Sources:          sources,
		Degraded:         degraded,
	}
	return resp, nil
}

func buildLocalFallbackAnswer(pageKey string, messages []ChatMessage, degraded bool) string {
	last := ""
	if len(messages) > 0 {
		last = strings.TrimSpace(messages[len(messages)-1].Content)
	}

	if pageKey == "transit" {
		origin, destination := extractTransitInputs(last)
		if origin != "" && destination != "" {
			if degraded {
				return fmt.Sprintf(
					"I can’t fetch live transit suggestions right now, but I can still guide you. For %s to %s, FlixBus is commonly an option on this corridor. Next actions: 1) check FlixBus for your exact date/time, 2) compare against rail duration/price, 3) pick the best reliability-cost tradeoff.",
					origin,
					destination,
				)
			}
			return fmt.Sprintf("For %s to %s, I can help compare bus vs rail if you share your target departure date/time.", origin, destination)
		}
		if degraded {
			return "Live transit data is unavailable right now. Share route in the format 'from <origin> to <destination>' and I’ll provide a structured bus-vs-rail recommendation."
		}
	}

	if degraded {
		return "I can still help, but live data is currently unavailable. Share the key details and I’ll give a best-available recommendation with clear assumptions."
	}
	return "Share a bit more detail and I’ll give a concrete next-step recommendation."
}

func (s *Service) ListConversations(ctx context.Context, userID, tripID string) ([]store.Conversation, error) {
	ok, err := s.repo.IsTripMember(ctx, tripID, userID)
	if err != nil {
		return nil, err
	}
	if !ok {
		return nil, ErrUnauthorizedTrip
	}
	return s.repo.ListConversations(ctx, tripID, userID)
}

func (s *Service) ListMessages(ctx context.Context, userID, conversationID string, limit int) ([]store.Message, error) {
	ok, err := s.repo.ConversationBelongsToUser(ctx, conversationID, userID)
	if err != nil {
		return nil, err
	}
	if !ok {
		return nil, ErrUnauthorizedTrip
	}
	return s.repo.ListMessages(ctx, conversationID, limit)
}

func (s *Service) RefreshContext(ctx context.Context, userID string, req RefreshContextRequest) (*RefreshContextResponse, error) {
	if req.TripID == "" || req.PageKey == "" {
		return nil, ErrInvalidInput
	}
	ok, err := s.repo.IsTripMember(ctx, req.TripID, userID)
	if err != nil {
		return nil, err
	}
	if !ok {
		return nil, ErrUnauthorizedTrip
	}
	context := map[string]any{"pageKey": req.PageKey, "refreshedBy": userID}
	if err := s.repo.InsertContextSnapshot(ctx, req.TripID, req.PageKey, context); err != nil {
		return nil, err
	}
	now := time.Now().UTC().Format(time.RFC3339)
	return &RefreshContextResponse{UpdatedAt: now, PageKey: req.PageKey}, nil
}

func (s *Service) fetchRealtimeContext(ctx context.Context, pageKey string, messages []ChatMessage) ([]Source, bool, map[string]any) {
	sources := make([]Source, 0)
	data := map[string]any{}
	degraded := false
	now := time.Now().UTC().Format(time.RFC3339)

	last := messages[len(messages)-1].Content
	switch pageKey {
	case "flights":
		flight, date := extractFlightInputs(last)
		if flight == "" || date == "" {
			sources = append(sources, Source{Name: "next_flight_status", Status: "skipped_missing_inputs", FetchedAt: now, Detail: "Include flight number and YYYY-MM-DD for live status."})
			break
		}
		resp, err := s.nextClient.PostJSON(ctx, "/api/flights/status", map[string]any{"flight_number": flight, "departure_date": date})
		if err != nil {
			degraded = true
			sources = append(sources, Source{Name: "next_flight_status", Status: "error", FetchedAt: now, Detail: err.Error()})
		} else {
			data["flightStatus"] = resp
			sources = append(sources, Source{Name: "next_flight_status", Status: "ok", FetchedAt: now})
		}
	case "transit":
		origin, destination := extractTransitInputs(last)
		if origin == "" || destination == "" {
			sources = append(sources, Source{Name: "next_transit_suggest", Status: "skipped_missing_inputs", FetchedAt: now, Detail: "Use phrasing: from <origin> to <destination>."})
			break
		}
		resp, err := s.nextClient.PostJSON(ctx, "/api/transit/suggest", map[string]any{"origin": origin, "destination": destination})
		if err != nil {
			degraded = true
			sources = append(sources, Source{Name: "next_transit_suggest", Status: "error", FetchedAt: now, Detail: err.Error()})
		} else {
			data["transitOptions"] = resp
			sources = append(sources, Source{Name: "next_transit_suggest", Status: "ok", FetchedAt: now})
		}
	case "finance":
		sources = append(sources, Source{Name: "finance_guardrail", Status: "ok", FetchedAt: now, Detail: "Computed from DB trip totals in this phase."})
		data["financeGuardrail"] = map[string]any{"status": "watch", "note": "Placeholder until full finance tables are integrated."}
	case "itinerary":
		sources = append(sources, Source{Name: "itinerary_risk", Status: "ok", FetchedAt: now, Detail: "Derived from current snapshot in this phase."})
		data["itineraryRisk"] = map[string]any{"status": "unknown", "note": "Placeholder until itinerary rows are persisted in backend."}
	default:
		sources = append(sources, Source{Name: "overview_context", Status: "ok", FetchedAt: now})
	}

	return sources, degraded, data
}

func extractFlightInputs(input string) (string, string) {
	flightRe := regexp.MustCompile(`(?i)\b([A-Z0-9]{2,3}\s?\d{1,4}[A-Z]?)\b`)
	dateRe := regexp.MustCompile(`\b(\d{4}-\d{2}-\d{2})\b`)
	flight := ""
	if m := flightRe.FindStringSubmatch(strings.ToUpper(input)); len(m) > 1 {
		flight = strings.ReplaceAll(m[1], " ", "")
	}
	date := ""
	if m := dateRe.FindStringSubmatch(input); len(m) > 1 {
		date = m[1]
	}
	return flight, date
}

func extractTransitInputs(input string) (string, string) {
	re := regexp.MustCompile(`(?i)from\s+(.+?)\s+to\s+(.+)$`)
	m := re.FindStringSubmatch(strings.TrimSpace(input))
	if len(m) != 3 {
		return "", ""
	}
	return strings.TrimSpace(m[1]), strings.TrimSpace(m[2])
}

func suggestActionsForPage(pageKey string) []string {
	switch pageKey {
	case "flights":
		return []string{"Share exact flight number and date for live status", "Compare price-time tradeoff before selecting"}
	case "transit":
		return []string{"Provide 'from X to Y' for route options", "Save top route to itinerary notes"}
	case "finance":
		return []string{"Review highest-spend category", "Set per-day budget target"}
	default:
		return []string{"Ask for next best step", "Request a prioritized checklist"}
	}
}
