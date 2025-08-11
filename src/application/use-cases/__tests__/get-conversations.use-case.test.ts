import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetConversationsUseCase } from "../get-conversations.use-case";
import { ConversationRepository } from "../../../domain/repositories/conversation-repository";
import { Conversation } from "../../../domain/entities/conversation";
import { ConversationId } from "../../../domain/value-objects/conversation-id";

describe("GetConversationsUseCase", () => {
  let useCase: GetConversationsUseCase;
  let mockConversationRepository: ConversationRepository;

  beforeEach(() => {
    // Create mock
    mockConversationRepository = {
      findAll: vi.fn(),
      findById: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      exists: vi.fn(),
    };

    // Create use case instance
    useCase = new GetConversationsUseCase(mockConversationRepository);
  });

  describe("execute", () => {
    it("should return all conversations sorted by updatedAt descending", async () => {
      // Arrange
      const oldDate = new Date("2024-01-01T10:00:00.000Z");
      const newDate = new Date("2024-01-02T10:00:00.000Z");

      const conversation1 = new Conversation(
        new ConversationId("conv-1"),
        "Old Conversation",
        [],
        oldDate,
        oldDate
      );

      const conversation2 = new Conversation(
        new ConversationId("conv-2"),
        "New Conversation",
        [],
        newDate,
        newDate
      );

      vi.mocked(mockConversationRepository.findAll).mockResolvedValue([
        conversation1,
        conversation2,
      ]);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toBeDefined();
      expect(result.conversations).toHaveLength(2);

      // Should be sorted by updatedAt descending (newest first)
      expect(result.conversations[0].title).toBe("New Conversation");
      expect(result.conversations[1].title).toBe("Old Conversation");

      // Verify repository call
      expect(mockConversationRepository.findAll).toHaveBeenCalled();
    });

    it("should return empty array when no conversations exist", async () => {
      // Arrange
      vi.mocked(mockConversationRepository.findAll).mockResolvedValue([]);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toBeDefined();
      expect(result.conversations).toEqual([]);
      expect(mockConversationRepository.findAll).toHaveBeenCalled();
    });

    it("should handle request parameter (even though not used)", async () => {
      // Arrange
      vi.mocked(mockConversationRepository.findAll).mockResolvedValue([]);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toBeDefined();
      expect(result.conversations).toEqual([]);
    });

    it("should properly sort conversations with same updatedAt", async () => {
      // Arrange
      const sameDate = new Date("2024-01-01T10:00:00.000Z");

      const conversation1 = new Conversation(
        new ConversationId("conv-1"),
        "Conversation A",
        [],
        sameDate,
        sameDate
      );

      const conversation2 = new Conversation(
        new ConversationId("conv-2"),
        "Conversation B",
        [],
        sameDate,
        sameDate
      );

      vi.mocked(mockConversationRepository.findAll).mockResolvedValue([
        conversation1,
        conversation2,
      ]);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toBeDefined();
      expect(result.conversations).toHaveLength(2);
      // Order should be maintained when dates are equal
    });

    it("should handle repository errors", async () => {
      // Arrange
      vi.mocked(mockConversationRepository.findAll).mockRejectedValue(
        new Error("Database error")
      );

      // Act & Assert
      await expect(useCase.execute()).rejects.toThrow(
        "Failed to retrieve conversations. Please try again."
      );
    });

    it("should convert domain entities to DTOs correctly", async () => {
      // Arrange
      const testDate = new Date("2024-01-01T10:00:00.000Z");
      const conversation = new Conversation(
        new ConversationId("test-id"),
        "Test Conversation",
        [],
        testDate,
        testDate
      );

      vi.mocked(mockConversationRepository.findAll).mockResolvedValue([
        conversation,
      ]);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result.conversations[0]).toEqual({
        id: "test-id",
        title: "Test Conversation",
        messages: [],
        createdAt: testDate.toISOString(),
        updatedAt: testDate.toISOString(),
      });
    });
  });

  describe("error handling", () => {
    it("should log errors for debugging", async () => {
      // Arrange
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      vi.mocked(mockConversationRepository.findAll).mockRejectedValue(
        new Error("Database connection failed")
      );

      // Act
      try {
        await useCase.execute();
      } catch (error) {
        // Expected to throw
        expect(error).toBeInstanceOf(Error);
      }

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        "GetConversationsUseCase error:",
        {
          message: "Database connection failed",
        }
      );

      consoleSpy.mockRestore();
    });

    it("should handle unknown error types", async () => {
      // Arrange
      vi.mocked(mockConversationRepository.findAll).mockRejectedValue(
        "String error"
      );

      // Act & Assert
      await expect(useCase.execute()).rejects.toThrow(
        "Failed to retrieve conversations. Please try again."
      );
    });
  });
});
