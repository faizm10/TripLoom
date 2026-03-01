package main

import (
	"context"
	"log"
	"os/signal"
	"syscall"

	"triploom/backend/internal/ai"
	"triploom/backend/internal/config"
	"triploom/backend/internal/http"
	"triploom/backend/internal/providers/nextbridge"
	"triploom/backend/internal/providers/openai"
	"triploom/backend/internal/store"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("load config: %v", err)
	}

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	var repo *store.AIRepository
	if cfg.UseSupabase {
		db, err := store.NewPostgres(ctx, cfg.SupabaseDBURL)
		if err != nil {
			log.Fatalf("connect db: %v", err)
		}
		defer db.Close()
		repo = store.NewAIRepository(db)
		log.Printf("running with Supabase/Postgres persistence enabled")
	} else {
		repo = store.NewInMemoryAIRepository()
		log.Printf("running in test mode: Supabase auth and persistence are disabled")
	}

	oa := openai.NewClient(cfg.OpenAIAPIKey)
	next := nextbridge.NewClient(cfg.NextAPIBaseURL)
	modelSelector := ai.NewModelSelector(cfg.OpenAIModelDefault)
	aiService := ai.NewService(repo, oa, next, modelSelector)

	app, err := http.NewRouter(cfg, aiService, repo)
	if err != nil {
		log.Fatalf("create router: %v", err)
	}

	go func() {
		<-ctx.Done()
		_ = app.Shutdown()
	}()

	log.Printf("backend server listening on :%s", cfg.Port)
	if err := app.Listen(":" + cfg.Port); err != nil {
		log.Fatalf("listen: %v", err)
	}
}
