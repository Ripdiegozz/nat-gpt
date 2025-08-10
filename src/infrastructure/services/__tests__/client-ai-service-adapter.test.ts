import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ClientAIServiceAdapter } from "../client-ai-service-adapter";
import { Message } from "../../../domain/entities/message";
import { MessageId } from "../../../domain/value-objects/message-id";
import { MessageRole } from "../../../domain/enums/message-role";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("ClientAIServiceAdapter", () => {
  let service: ClientAIServiceAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ClientAIServiceAdapter();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("constructor", () => {
    it("should use default endpoint when none provided", () => {
      const defaultService = new ClientAIServiceAdapter();
      expect(defaultService["endpoint"]).toBe("/api/ai");
    });

    it("should use custom endpoint when provided", () => {
      const customService = new ClientAIServiceAdapter({
        endpoint: "/custom/ai",
      });
      expect(customService["endpoint"]).toBe("/custom/ai");
    });
  });

  describe("generateResponse", () => {
    it("should send POST request with correct payload", async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ text: "AI response" }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const context: Message[] = [
        new Message(new MessageId("1"), "Hello", MessageRole.USER, new Date()),
        new Message(
          new MessageId("2"),
          "Hi there!",
          MessageRole.ASSISTANT,
          new Date()
        ),
      ];

      const result = await service.generateResponse("How are you?", context);

      expect(mockFetch).toHaveBeenCalledWith("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: "How are you?",
          context: [
            { role: "user", content: "Hello" },
            { role: "assistant", content: "Hi there!" },
          ],
        }),
      });
      expect(result).toBe("AI response");
    });

    it("should handle empty context", async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ text: "AI response" }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await service.generateResponse("Hello", []);

      expect(mockFetch).toHaveBeenCalledWith("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: "Hello",
          context: [],
        }),
      });
    });

    it("should throw error for empty prompt", async () => {
      await expect(service.generateResponse("", [])).rejects.toThrow(
        "Prompt cannot be empty"
      );
      await expect(service.generateResponse("   ", [])).rejects.toThrow(
        "Prompt cannot be empty"
      );
    });

    it("should throw error when response is not ok", async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        json: vi.fn().mockResolvedValue({ error: "Server error" }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await expect(service.generateResponse("Hello", [])).rejects.toThrow(
        "Server error"
      );
    });

    it("should throw generic error when response is not ok and no error message", async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        json: vi.fn().mockResolvedValue({}),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await expect(service.generateResponse("Hello", [])).rejects.toThrow(
        "AI request failed with 500"
      );
    });

    it("should handle json parse errors for error responses", async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        json: vi.fn().mockRejectedValue(new Error("Invalid JSON")),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await expect(service.generateResponse("Hello", [])).rejects.toThrow(
        "AI request failed with 500"
      );
    });

    it("should throw error for empty response text", async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ text: "" }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await expect(service.generateResponse("Hello", [])).rejects.toThrow(
        "Empty response from AI"
      );
    });

    it("should throw error for missing response text", async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({}),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await expect(service.generateResponse("Hello", [])).rejects.toThrow(
        "Empty response from AI"
      );
    });

    it("should handle network errors", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      await expect(service.generateResponse("Hello", [])).rejects.toThrow(
        "Network error"
      );
    });
  });

  describe("isAvailable", () => {
    it("should return true when service is available", async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ ok: true }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await service.isAvailable();

      expect(mockFetch).toHaveBeenCalledWith("/api/ai", { method: "GET" });
      expect(result).toBe(true);
    });

    it("should return false when response is not ok", async () => {
      const mockResponse = {
        ok: false,
        json: vi.fn(),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await service.isAvailable();
      expect(result).toBe(false);
    });

    it("should return false when response data is not ok", async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ ok: false }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await service.isAvailable();
      expect(result).toBe(false);
    });

    it("should return false when response data is missing ok field", async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({}),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await service.isAvailable();
      expect(result).toBe(false);
    });

    it("should return false on network errors", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      const result = await service.isAvailable();
      expect(result).toBe(false);
    });

    it("should return false on json parse errors", async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockRejectedValue(new Error("Invalid JSON")),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await service.isAvailable();
      expect(result).toBe(false);
    });
  });

  describe("getMaxTokens", () => {
    it("should return server config default", () => {
      expect(service.getMaxTokens()).toBe(8192);
    });
  });

  describe("estimateTokens", () => {
    it("should estimate tokens correctly", () => {
      const text = "This is a test message with some words";
      const estimated = service.estimateTokens(text);

      // Should be roughly text.length / 4, rounded up
      const expected = Math.ceil(text.length / 4);
      expect(estimated).toBe(expected);
    });

    it("should handle empty text", () => {
      expect(service.estimateTokens("")).toBe(0);
    });

    it("should handle single character", () => {
      expect(service.estimateTokens("a")).toBe(1);
    });

    it("should handle long text", () => {
      const longText = "a".repeat(1000);
      const estimated = service.estimateTokens(longText);
      expect(estimated).toBe(250); // 1000 / 4
    });
  });
});
