package ai

import (
	"context"
	"errors"
	"fmt"
	"regexp"
	"strconv"
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

type PlannerChatRequest struct {
	Messages       []ChatMessage  `json:"messages"`
	PlannerContext map[string]any `json:"plannerContext"`
	Refresh        bool           `json:"refresh"`
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

type PlannerDraftItem struct {
	DayIndex  int    `json:"dayIndex,omitempty"`
	Title     string `json:"title,omitempty"`
	TimeBlock string `json:"timeBlock,omitempty"`
	Category  string `json:"category,omitempty"`
	Notes     string `json:"notes,omitempty"`
}

type PlannerDraft struct {
	Destination string             `json:"destination,omitempty"`
	Country     string             `json:"country,omitempty"`
	Cities      []string           `json:"cities,omitempty"`
	StartDate   string             `json:"startDate,omitempty"`
	EndDate     string             `json:"endDate,omitempty"`
	Travelers   int                `json:"travelers,omitempty"`
	BudgetTotal float64            `json:"budgetTotal,omitempty"`
	Activities  []string           `json:"activities,omitempty"`
	Itinerary   []PlannerDraftItem `json:"itinerary,omitempty"`
}

type PlannerChatResponse struct {
	Answer       string        `json:"answer"`
	Sources      []Source      `json:"sources"`
	Degraded     bool          `json:"degraded"`
	PlannerDraft *PlannerDraft `json:"plannerDraft,omitempty"`
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

func (s *Service) PlannerChat(ctx context.Context, userID string, req PlannerChatRequest) (*PlannerChatResponse, error) {
	if len(req.Messages) == 0 {
		return nil, ErrInvalidInput
	}

	contextPayload := map[string]any{
		"pageKey": "agent",
		"userID":  userID,
	}
	if len(req.PlannerContext) > 0 {
		contextPayload["plannerContext"] = req.PlannerContext
	}

	sources := []Source{
		{Name: "planner_context", Status: "ok", FetchedAt: time.Now().UTC().Format(time.RFC3339)},
	}
	degraded := false

	userPrompt := req.Messages[len(req.Messages)-1].Content
	model := s.modelSelector.Select(userPrompt, req.Messages)
	systemPrompt := BuildPlannerSystemPrompt(contextPayload, degraded)

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
		result.Text = "I can help build this trip plan. Share destination, dates (or month), traveler count, and top experiences, then I’ll draft a practical plan you can apply."
	}

	draft := buildPlannerDraft(req.PlannerContext, req.Messages, result.Text)
	resp := &PlannerChatResponse{
		Answer:       result.Text,
		Sources:      sources,
		Degraded:     degraded,
		PlannerDraft: draft,
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

func buildPlannerDraft(plannerContext map[string]any, messages []ChatMessage, answer string) *PlannerDraft {
	combined := strings.TrimSpace(strings.Join([]string{stringFromMap(plannerContext, "mustDoExperiences"), stringFromMap(plannerContext, "concerns"), answer, collectUserMessages(messages)}, "\n"))
	draft := &PlannerDraft{}

	if destination := inferDestination(plannerContext, combined); destination != "" {
		draft.Destination = destination
	}
	if country := inferCountry(plannerContext, combined); country != "" {
		draft.Country = country
	}
	draft.Cities = inferCities(plannerContext, combined)
	startDate, endDate := inferDateRange(combined)
	draft.StartDate = startDate
	draft.EndDate = endDate
	if travelers := inferTravelers(plannerContext, combined); travelers > 0 {
		draft.Travelers = travelers
	}
	if budget := inferBudget(combined); budget > 0 {
		draft.BudgetTotal = budget
	}
	draft.Activities = inferActivities(plannerContext, combined)
	draft.Itinerary = buildItinerarySkeleton(draft.Activities, startDate, endDate)

	if draft.Destination == "" && draft.Country == "" && len(draft.Cities) == 0 && draft.StartDate == "" && draft.EndDate == "" && draft.Travelers == 0 && len(draft.Activities) == 0 {
		return nil
	}
	return draft
}

func stringFromMap(m map[string]any, key string) string {
	if m == nil {
		return ""
	}
	if v, ok := m[key].(string); ok {
		return strings.TrimSpace(v)
	}
	return ""
}

func collectUserMessages(messages []ChatMessage) string {
	parts := make([]string, 0, len(messages))
	for _, m := range messages {
		if m.Role == "assistant" {
			continue
		}
		if t := strings.TrimSpace(m.Content); t != "" {
			parts = append(parts, t)
		}
	}
	return strings.Join(parts, "\n")
}

func inferDestination(plannerContext map[string]any, combined string) string {
	if v := stringFromMap(plannerContext, "destination"); v != "" {
		return v
	}
	re := regexp.MustCompile(`(?i)\b(?:to|in|for)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){0,2})\b`)
	if m := re.FindStringSubmatch(combined); len(m) > 1 {
		return strings.TrimSpace(m[1])
	}
	return ""
}

func inferCountry(plannerContext map[string]any, combined string) string {
	if v := stringFromMap(plannerContext, "country"); v != "" {
		return v
	}
	re := regexp.MustCompile(`(?i)\b(?:in|to)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){0,2})\b`)
	if m := re.FindStringSubmatch(combined); len(m) > 1 {
		return strings.TrimSpace(m[1])
	}
	return ""
}

func inferCities(plannerContext map[string]any, combined string) []string {
	if raw, ok := plannerContext["cities"]; ok {
		switch v := raw.(type) {
		case []any:
			out := make([]string, 0, len(v))
			seen := map[string]bool{}
			for _, item := range v {
				if s, ok := item.(string); ok {
					s = strings.TrimSpace(s)
					if s == "" {
						continue
					}
					k := strings.ToLower(s)
					if seen[k] {
						continue
					}
					seen[k] = true
					out = append(out, s)
				}
			}
			if len(out) > 0 {
				return out
			}
		case string:
			parts := strings.FieldsFunc(v, func(r rune) bool {
				return r == ',' || r == ';' || r == '\n'
			})
			out := make([]string, 0, len(parts))
			seen := map[string]bool{}
			for _, p := range parts {
				s := strings.TrimSpace(p)
				if s == "" {
					continue
				}
				k := strings.ToLower(s)
				if seen[k] {
					continue
				}
				seen[k] = true
				out = append(out, s)
			}
			if len(out) > 0 {
				return out
			}
		}
	}

	re := regexp.MustCompile(`(?i)\b(?:in|to|via)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){0,2})`)
	matches := re.FindAllStringSubmatch(combined, -1)
	out := make([]string, 0, len(matches))
	seen := map[string]bool{}
	for _, m := range matches {
		if len(m) < 2 {
			continue
		}
		s := strings.TrimSpace(m[1])
		if s == "" {
			continue
		}
		k := strings.ToLower(s)
		if seen[k] {
			continue
		}
		seen[k] = true
		out = append(out, s)
		if len(out) >= 6 {
			break
		}
	}
	return out
}

func inferDateRange(text string) (string, string) {
	re := regexp.MustCompile(`\b(20\d{2}-\d{2}-\d{2})\b`)
	matches := re.FindAllStringSubmatch(text, -1)
	if len(matches) >= 2 {
		return matches[0][1], matches[1][1]
	}
	if len(matches) == 1 {
		return matches[0][1], ""
	}
	return "", ""
}

func inferTravelers(plannerContext map[string]any, text string) int {
	if raw, ok := plannerContext["travelers"]; ok {
		switch v := raw.(type) {
		case float64:
			if v > 0 {
				return int(v)
			}
		case int:
			if v > 0 {
				return v
			}
		case string:
			if n := regexp.MustCompile(`\d+`).FindString(v); n != "" {
				if parsed, err := strconv.Atoi(n); err == nil && parsed > 0 {
					return parsed
				}
			}
		}
	}
	if m := regexp.MustCompile(`(?i)\b(\d{1,2})\s+(?:travelers?|people|adults?)\b`).FindStringSubmatch(text); len(m) > 1 {
		if parsed, err := strconv.Atoi(m[1]); err == nil && parsed > 0 {
			return parsed
		}
	}
	if strings.Contains(strings.ToLower(text), "solo") {
		return 1
	}
	return 0
}

func inferBudget(text string) float64 {
	re := regexp.MustCompile(`(?i)(?:budget|spend|cost)[^\d]{0,20}(\d{2,6})`)
	if m := re.FindStringSubmatch(text); len(m) > 1 {
		if parsed, err := strconv.ParseFloat(m[1], 64); err == nil {
			return parsed
		}
	}
	return 0
}

func inferActivities(plannerContext map[string]any, text string) []string {
	base := stringFromMap(plannerContext, "mustDoExperiences")
	if base == "" {
		base = text
	}
	parts := strings.FieldsFunc(base, func(r rune) bool {
		return r == ',' || r == ';' || r == '\n'
	})
	out := make([]string, 0, len(parts))
	seen := map[string]bool{}
	for _, part := range parts {
		v := strings.TrimSpace(part)
		if v == "" {
			continue
		}
		key := strings.ToLower(v)
		if seen[key] {
			continue
		}
		seen[key] = true
		out = append(out, v)
		if len(out) >= 8 {
			break
		}
	}
	return out
}

func buildItinerarySkeleton(activities []string, startDate, endDate string) []PlannerDraftItem {
	if len(activities) == 0 {
		return nil
	}
	days := len(activities)
	if startDate != "" && endDate != "" {
		if start, err := time.Parse("2006-01-02", startDate); err == nil {
			if end, err := time.Parse("2006-01-02", endDate); err == nil && !end.Before(start) {
				days = int(end.Sub(start).Hours()/24) + 1
				if days < 1 {
					days = 1
				}
			}
		}
	}
	if days > len(activities) {
		days = len(activities)
	}
	out := make([]PlannerDraftItem, 0, days)
	for i := 0; i < days; i++ {
		out = append(out, PlannerDraftItem{
			DayIndex:  i + 1,
			Title:     activities[i],
			TimeBlock: "afternoon",
			Category:  "activities",
			Notes:     "Drafted by Agent planner conversation.",
		})
	}
	return out
}
