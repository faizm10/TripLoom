package middleware

import (
	"strings"

	"github.com/MicahParks/keyfunc/v3"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

type AuthMiddleware struct {
	jwks        keyfunc.Keyfunc
	supabaseURL string
}

func NewAuthMiddleware(jwks keyfunc.Keyfunc, supabaseURL string) *AuthMiddleware {
	return &AuthMiddleware{jwks: jwks, supabaseURL: strings.TrimRight(supabaseURL, "/")}
}

func (m *AuthMiddleware) RequireAuth(c *fiber.Ctx) error {
	auth := c.Get("Authorization")
	if !strings.HasPrefix(strings.ToLower(auth), "bearer ") {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"ok": false, "error": "missing bearer token"})
	}
	tokenString := strings.TrimSpace(auth[7:])
	token, err := jwt.Parse(tokenString, m.jwks.Keyfunc)
	if err != nil || !token.Valid {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"ok": false, "error": "invalid token"})
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"ok": false, "error": "invalid claims"})
	}

	if iss, _ := claims["iss"].(string); m.supabaseURL != "" && iss != "" && !strings.HasPrefix(iss, m.supabaseURL) {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"ok": false, "error": "invalid issuer"})
	}

	sub, _ := claims["sub"].(string)
	if sub == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"ok": false, "error": "missing subject"})
	}

	c.Locals("userID", sub)
	return c.Next()
}

func RequireTestUser(c *fiber.Ctx) error {
	userID := strings.TrimSpace(c.Get("X-User-Id"))
	if userID == "" {
		userID = "local-test-user"
	}
	c.Locals("userID", userID)
	return c.Next()
}
