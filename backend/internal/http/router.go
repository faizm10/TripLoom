package http

import (
	"context"
	"log"
	"strings"

	"github.com/MicahParks/keyfunc/v3"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"

	"triploom/backend/internal/ai"
	"triploom/backend/internal/config"
	"triploom/backend/internal/http/handlers"
	"triploom/backend/internal/http/middleware"
	"triploom/backend/internal/store"
)

func NewRouter(cfg *config.Config, aiService *ai.Service, repo *store.AIRepository) (*fiber.App, error) {
	app := fiber.New()

	app.Use(cors.New(cors.Config{
		AllowOrigins: cfg.AllowedOrigins,
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
	}))

	h := handlers.NewAIHandler(aiService)
	var api fiber.Router
	if cfg.UseSupabase {
		jwks, err := keyfunc.NewDefaultCtx(context.Background(), []string{cfg.SupabaseJWKSURL})
		if err != nil {
			return nil, err
		}
		authMiddleware := middleware.NewAuthMiddleware(jwks, cfg.SupabaseURL)
		api = app.Group("/v1", authMiddleware.RequireAuth)
	} else {
		log.Printf("router auth mode: test user passthrough enabled (set X-User-Id header to override default user)")
		api = app.Group("/v1", middleware.RequireTestUser)
	}

	api.Post("/ai/chat", h.Chat)
	api.Post("/ai/planner/chat", h.PlannerChat)
	api.Get("/ai/conversations/:tripId", h.ListConversations)
	api.Get("/ai/conversations/:conversationId/messages", h.ListMessages)
	api.Post("/ai/context/refresh", h.RefreshContext)

	app.Get("/healthz", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"ok": true, "origins": strings.Split(cfg.AllowedOrigins, ",")})
	})

	_ = repo // kept for parity with constructor dependencies
	return app, nil
}
