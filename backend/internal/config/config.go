package config

import (
	"fmt"
	"os"
	"strings"
)

type Config struct {
	Port               string
	OpenAIAPIKey       string
	OpenAIModelDefault string
	SupabaseURL        string
	SupabaseJWKSURL    string
	SupabaseDBURL      string
	NextAPIBaseURL     string
	AllowedOrigins     string
	UseSupabase        bool
}

func Load() (*Config, error) {
	cfg := &Config{
		Port:               getOrDefault("PORT", "8080"),
		OpenAIAPIKey:       os.Getenv("OPENAI_API_KEY"),
		OpenAIModelDefault: getOrDefault("OPENAI_MODEL_DEFAULT", "gpt-5-mini"),
		SupabaseURL:        os.Getenv("SUPABASE_URL"),
		SupabaseJWKSURL:    os.Getenv("SUPABASE_JWKS_URL"),
		SupabaseDBURL:      os.Getenv("SUPABASE_DB_URL"),
		NextAPIBaseURL:     getOrDefault("NEXT_API_BASE_URL", "http://localhost:3000"),
		AllowedOrigins:     getOrDefault("ALLOWED_ORIGINS", "http://localhost:3000"),
	}
	cfg.UseSupabase = strings.TrimSpace(cfg.SupabaseDBURL) != "" && strings.TrimSpace(cfg.SupabaseJWKSURL) != ""

	if cfg.OpenAIAPIKey == "" {
		return nil, fmt.Errorf("OPENAI_API_KEY is required")
	}
	if cfg.UseSupabase && cfg.SupabaseURL == "" {
		return nil, fmt.Errorf("SUPABASE_URL is required when SUPABASE_DB_URL and SUPABASE_JWKS_URL are set")
	}
	return cfg, nil
}

func getOrDefault(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
