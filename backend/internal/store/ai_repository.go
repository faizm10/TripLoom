package store

import (
	"context"
	"encoding/json"
	"fmt"
	"sort"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type AIRepository struct {
	db *pgxpool.Pool

	mu                  sync.RWMutex
	conversationsByID   map[string]Conversation
	conversationByOwner map[string]string
	messagesByConvID    map[string][]Message
}

type Trip struct {
	ID          string    `json:"id"`
	Destination string    `json:"destination"`
	StartDate   time.Time `json:"startDate"`
	EndDate     time.Time `json:"endDate"`
	Timezone    string    `json:"timezone"`
}

type Conversation struct {
	ID        string    `json:"id"`
	TripID    string    `json:"tripId"`
	UserID    string    `json:"userId"`
	Title     string    `json:"title"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type Message struct {
	ID             string         `json:"id"`
	ConversationID string         `json:"conversationId"`
	Role           string         `json:"role"`
	Content        string         `json:"content"`
	Model          string         `json:"model"`
	TokenUsageJSON map[string]any `json:"tokenUsageJson"`
	CreatedAt      time.Time      `json:"createdAt"`
}

func NewAIRepository(db *pgxpool.Pool) *AIRepository {
	return &AIRepository{db: db}
}

func NewInMemoryAIRepository() *AIRepository {
	return &AIRepository{
		conversationsByID:   make(map[string]Conversation),
		conversationByOwner: make(map[string]string),
		messagesByConvID:    make(map[string][]Message),
	}
}

func (r *AIRepository) IsTripMember(ctx context.Context, tripID, userID string) (bool, error) {
	if r.db == nil {
		return tripID != "" && userID != "", nil
	}

	const q = `SELECT EXISTS(SELECT 1 FROM trip_members WHERE trip_id = $1 AND user_id = $2)`
	var exists bool
	if err := r.db.QueryRow(ctx, q, tripID, userID).Scan(&exists); err != nil {
		return false, err
	}
	return exists, nil
}

func (r *AIRepository) GetTripByID(ctx context.Context, tripID string) (*Trip, error) {
	if r.db == nil {
		now := time.Now().UTC()
		return &Trip{
			ID:          tripID,
			Destination: "Test Destination",
			StartDate:   now,
			EndDate:     now.Add(72 * time.Hour),
			Timezone:    "UTC",
		}, nil
	}

	const q = `SELECT id, destination, start_date, end_date, COALESCE(timezone, '') FROM trips WHERE id = $1`
	var t Trip
	if err := r.db.QueryRow(ctx, q, tripID).Scan(&t.ID, &t.Destination, &t.StartDate, &t.EndDate, &t.Timezone); err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *AIRepository) UpsertConversation(ctx context.Context, tripID, userID, title string) (string, error) {
	if r.db == nil {
		ownerKey := tripID + ":" + userID
		now := time.Now().UTC()

		r.mu.Lock()
		defer r.mu.Unlock()

		if id, ok := r.conversationByOwner[ownerKey]; ok {
			conv := r.conversationsByID[id]
			conv.UpdatedAt = now
			r.conversationsByID[id] = conv
			return id, nil
		}

		id := uuid.NewString()
		conv := Conversation{ID: id, TripID: tripID, UserID: userID, Title: title, CreatedAt: now, UpdatedAt: now}
		r.conversationsByID[id] = conv
		r.conversationByOwner[ownerKey] = id
		return id, nil
	}

	const findLatest = `SELECT id FROM ai_conversations WHERE trip_id = $1 AND user_id = $2 ORDER BY updated_at DESC LIMIT 1`
	var id string
	if err := r.db.QueryRow(ctx, findLatest, tripID, userID).Scan(&id); err == nil {
		_, _ = r.db.Exec(ctx, `UPDATE ai_conversations SET updated_at = NOW() WHERE id = $1`, id)
		return id, nil
	}

	id = uuid.NewString()
	const insert = `
		INSERT INTO ai_conversations (id, trip_id, user_id, title, created_at, updated_at)
		VALUES ($1, $2, $3, $4, NOW(), NOW())`
	if _, err := r.db.Exec(ctx, insert, id, tripID, userID, title); err != nil {
		return "", err
	}
	return id, nil
}

func (r *AIRepository) InsertMessage(ctx context.Context, conversationID, role, content, model string, usage map[string]any) error {
	if r.db == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		copiedUsage := map[string]any{}
		for k, v := range usage {
			copiedUsage[k] = v
		}
		msg := Message{
			ID:             uuid.NewString(),
			ConversationID: conversationID,
			Role:           role,
			Content:        content,
			Model:          model,
			TokenUsageJSON: copiedUsage,
			CreatedAt:      time.Now().UTC(),
		}
		r.messagesByConvID[conversationID] = append(r.messagesByConvID[conversationID], msg)
		if conv, ok := r.conversationsByID[conversationID]; ok {
			conv.UpdatedAt = msg.CreatedAt
			r.conversationsByID[conversationID] = conv
		}
		return nil
	}

	usageJSON, _ := json.Marshal(usage)
	const q = `
		INSERT INTO ai_messages (id, conversation_id, role, content, model, token_usage_json, created_at)
		VALUES ($1, $2, $3, $4, $5, $6::jsonb, NOW())`
	_, err := r.db.Exec(ctx, q, uuid.NewString(), conversationID, role, content, model, string(usageJSON))
	return err
}

func (r *AIRepository) InsertToolSnapshot(ctx context.Context, conversationID, pageKey, toolName, status string, payload map[string]any) error {
	if r.db == nil {
		return nil
	}

	payloadJSON, _ := json.Marshal(payload)
	const q = `
		INSERT INTO ai_tool_snapshots (id, conversation_id, page_key, tool_name, status, payload_json, fetched_at)
		VALUES ($1, $2, $3, $4, $5, $6::jsonb, NOW())`
	_, err := r.db.Exec(ctx, q, uuid.NewString(), conversationID, pageKey, toolName, status, string(payloadJSON))
	return err
}

func (r *AIRepository) InsertContextSnapshot(ctx context.Context, tripID, pageKey string, payload map[string]any) error {
	if r.db == nil {
		return nil
	}

	payloadJSON, _ := json.Marshal(payload)
	const q = `
		INSERT INTO ai_context_snapshots (id, trip_id, page_key, context_json, generated_at)
		VALUES ($1, $2, $3, $4::jsonb, NOW())`
	_, err := r.db.Exec(ctx, q, uuid.NewString(), tripID, pageKey, string(payloadJSON))
	return err
}

func (r *AIRepository) InsertAuditLog(ctx context.Context, userID, tripID, action string, metadata map[string]any) error {
	if r.db == nil {
		return nil
	}

	meta, _ := json.Marshal(metadata)
	const q = `
		INSERT INTO ai_audit_logs (id, user_id, trip_id, action, metadata_json, created_at)
		VALUES ($1, $2, $3, $4, $5::jsonb, NOW())`
	_, err := r.db.Exec(ctx, q, uuid.NewString(), userID, tripID, action, string(meta))
	return err
}

func (r *AIRepository) ListConversations(ctx context.Context, tripID, userID string) ([]Conversation, error) {
	if r.db == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		out := make([]Conversation, 0)
		for _, c := range r.conversationsByID {
			if c.TripID == tripID && c.UserID == userID {
				out = append(out, c)
			}
		}
		sort.Slice(out, func(i, j int) bool {
			return out[i].UpdatedAt.After(out[j].UpdatedAt)
		})
		if len(out) > 50 {
			out = out[:50]
		}
		return out, nil
	}

	const q = `
		SELECT id, trip_id, user_id, title, created_at, updated_at
		FROM ai_conversations
		WHERE trip_id = $1 AND user_id = $2
		ORDER BY updated_at DESC
		LIMIT 50`
	rows, err := r.db.Query(ctx, q, tripID, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := make([]Conversation, 0)
	for rows.Next() {
		var c Conversation
		if err := rows.Scan(&c.ID, &c.TripID, &c.UserID, &c.Title, &c.CreatedAt, &c.UpdatedAt); err != nil {
			return nil, err
		}
		out = append(out, c)
	}
	return out, rows.Err()
}

func (r *AIRepository) ConversationBelongsToUser(ctx context.Context, conversationID, userID string) (bool, error) {
	if r.db == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		conv, ok := r.conversationsByID[conversationID]
		return ok && conv.UserID == userID, nil
	}

	const q = `SELECT EXISTS(SELECT 1 FROM ai_conversations WHERE id = $1 AND user_id = $2)`
	var ok bool
	if err := r.db.QueryRow(ctx, q, conversationID, userID).Scan(&ok); err != nil {
		return false, err
	}
	return ok, nil
}

func (r *AIRepository) ListMessages(ctx context.Context, conversationID string, limit int) ([]Message, error) {
	if r.db == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		msgs := r.messagesByConvID[conversationID]
		if len(msgs) == 0 {
			return []Message{}, nil
		}
		start := len(msgs) - limit
		if start < 0 {
			start = 0
		}
		selected := msgs[start:]
		out := make([]Message, 0, len(selected))
		for i := len(selected) - 1; i >= 0; i-- {
			out = append(out, selected[i])
		}
		return out, nil
	}

	const q = `
		SELECT id, conversation_id, role, content, model, token_usage_json, created_at
		FROM ai_messages
		WHERE conversation_id = $1
		ORDER BY created_at DESC
		LIMIT $2`
	rows, err := r.db.Query(ctx, q, conversationID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := make([]Message, 0)
	for rows.Next() {
		var m Message
		var usageBytes []byte
		if err := rows.Scan(&m.ID, &m.ConversationID, &m.Role, &m.Content, &m.Model, &usageBytes, &m.CreatedAt); err != nil {
			return nil, err
		}
		if len(usageBytes) > 0 {
			_ = json.Unmarshal(usageBytes, &m.TokenUsageJSON)
		}
		out = append(out, m)
	}
	return out, rows.Err()
}

func (r *AIRepository) Mode() string {
	if r.db == nil {
		return "in-memory"
	}
	return fmt.Sprintf("postgres:%T", r.db)
}
