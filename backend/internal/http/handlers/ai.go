package handlers

import (
	"strconv"

	"github.com/gofiber/fiber/v2"

	"triploom/backend/internal/ai"
)

type AIHandler struct {
	service *ai.Service
}

func NewAIHandler(service *ai.Service) *AIHandler {
	return &AIHandler{service: service}
}

func (h *AIHandler) Chat(c *fiber.Ctx) error {
	userID, _ := c.Locals("userID").(string)
	var req ai.ChatRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"ok": false, "error": "invalid request body"})
	}

	resp, err := h.service.Chat(c.UserContext(), userID, req)
	if err != nil {
		status := fiber.StatusInternalServerError
		if err == ai.ErrUnauthorizedTrip {
			status = fiber.StatusForbidden
		}
		if err == ai.ErrInvalidInput {
			status = fiber.StatusBadRequest
		}
		return c.Status(status).JSON(fiber.Map{"ok": false, "error": err.Error()})
	}
	return c.JSON(fiber.Map{"ok": true, "data": resp})
}

func (h *AIHandler) ListConversations(c *fiber.Ctx) error {
	userID, _ := c.Locals("userID").(string)
	tripID := c.Params("tripId")
	resp, err := h.service.ListConversations(c.UserContext(), userID, tripID)
	if err != nil {
		status := fiber.StatusInternalServerError
		if err == ai.ErrUnauthorizedTrip {
			status = fiber.StatusForbidden
		}
		return c.Status(status).JSON(fiber.Map{"ok": false, "error": err.Error()})
	}
	return c.JSON(fiber.Map{"ok": true, "data": resp})
}

func (h *AIHandler) ListMessages(c *fiber.Ctx) error {
	userID, _ := c.Locals("userID").(string)
	conversationID := c.Params("conversationId")
	limit, _ := strconv.Atoi(c.Query("limit", "50"))
	if limit <= 0 || limit > 200 {
		limit = 50
	}
	resp, err := h.service.ListMessages(c.UserContext(), userID, conversationID, limit)
	if err != nil {
		status := fiber.StatusInternalServerError
		if err == ai.ErrUnauthorizedTrip {
			status = fiber.StatusForbidden
		}
		return c.Status(status).JSON(fiber.Map{"ok": false, "error": err.Error()})
	}
	return c.JSON(fiber.Map{"ok": true, "data": resp})
}

func (h *AIHandler) RefreshContext(c *fiber.Ctx) error {
	userID, _ := c.Locals("userID").(string)
	var req ai.RefreshContextRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"ok": false, "error": "invalid request body"})
	}
	resp, err := h.service.RefreshContext(c.UserContext(), userID, req)
	if err != nil {
		status := fiber.StatusInternalServerError
		if err == ai.ErrUnauthorizedTrip {
			status = fiber.StatusForbidden
		}
		if err == ai.ErrInvalidInput {
			status = fiber.StatusBadRequest
		}
		return c.Status(status).JSON(fiber.Map{"ok": false, "error": err.Error()})
	}
	return c.JSON(fiber.Map{"ok": true, "data": resp})
}
