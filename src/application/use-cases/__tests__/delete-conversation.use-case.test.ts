import { describe, it, expect, vi, beforeEach } from "vitest";
import { DeleteConversationUseCase } from "../delete-conversation.use-case";
import { ConversationRepository } from "../../../domain/repositories/conversation-repository";
import { DeleteConversationRequest } from "../../dtos/conversation-management.dto";

describe("DeleteConversationUseCase", () => {
  let useCase: DeleteConversationUseCase;
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
    useCase = new DeleteConversationUseCase(mockConversationRepository);
  });

  describe("execute", () => {
    const validRequest: DeleteConversationRequest = {
      conversationId: "test-conv-id",
    };

    it("should successfully delete existing conversation", async () => {
      // Arrange
      vi.mocked(mockConversationRepository.exists).mockResolvedValue(true);
      vi.mocked(mockConversationRepository.delete).mockResolvedValue();

      // Act
      const result = await useCase.execute(validRequest);

      // Assert
      expect(result).toBeDefined();
      expect(result.success).toBe(true);

      // Verify repository calls
      expect(mockConversationRepository.exists).toHaveBeenCalledWith(
        expect.objectContaining({ value: "test-conv-id" })
      );
      expect(mockConversationRepository.delete).toHaveBeenCalledWith(
        expect.objectContaining({ value: "test-conv-id" })
      );
    });

    it("should throw error when conversation does not exist", async () => {
      // Arrange
      vi.mocked(mockConversationRepository.exists).mockResolvedValue(false);

      // Act & Assert
      await expect(useCase.execute(validRequest)).rejects.toThrow(
        "The conversation could not be found or has already been deleted."
      );

      // Verify exists was called but delete was not
      expect(mockConversationRepository.exists).toHaveBeenCalled();
      expect(mockConversationRepository.delete).not.toHaveBeenCalled();
    });

    it("should handle repository exists errors", async () => {
      // Arrange
      vi.mocked(mockConversationRepository.exists).mockRejectedValue(
        new Error("Database error")
      );

      // Act & Assert
      await expect(useCase.execute(validRequest)).rejects.toThrow(
        "Failed to delete conversation. Please try again."
      );
    });

    it("should handle repository delete errors", async () => {
      // Arrange
      vi.mocked(mockConversationRepository.exists).mockResolvedValue(true);
      vi.mocked(mockConversationRepository.delete).mockRejectedValue(
        new Error("Delete failed")
      );

      // Act & Assert
      await expect(useCase.execute(validRequest)).rejects.toThrow(
        "Failed to delete conversation. Please try again."
      );
    });
  });

  describe("validation", () => {
    it("should throw error for empty conversation ID", async () => {
      const invalidRequest: DeleteConversationRequest = {
        conversationId: "",
      };

      await expect(useCase.execute(invalidRequest)).rejects.toThrow(
        "Conversation ID is required"
      );
    });

    it("should throw error for whitespace-only conversation ID", async () => {
      const invalidRequest: DeleteConversationRequest = {
        conversationId: "   ",
      };

      await expect(useCase.execute(invalidRequest)).rejects.toThrow(
        "Conversation ID is required"
      );
    });

    it("should accept valid conversation ID", async () => {
      // Arrange
      const validRequest: DeleteConversationRequest = {
        conversationId: "valid-id",
      };
      vi.mocked(mockConversationRepository.exists).mockResolvedValue(true);
      vi.mocked(mockConversationRepository.delete).mockResolvedValue();

      // Act & Assert
      await expect(useCase.execute(validRequest)).resolves.toBeDefined();
    });
  });

  describe("error handling", () => {
    it("should log errors for debugging", async () => {
      // Arrange
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      vi.mocked(mockConversationRepository.exists).mockRejectedValue(
        new Error("Database connection failed")
      );

      // Act
      try {
        await useCase.execute({ conversationId: "test-id" });
      } catch (error) {
        // Expected to throw
        expect(error).toBeInstanceOf(Error);
      }

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        "DeleteConversationUseCase error:",
        {
          message: "Database connection failed",
          conversationId: "test-id",
        }
      );

      consoleSpy.mockRestore();
    });

    it("should handle unknown error types", async () => {
      // Arrange
      vi.mocked(mockConversationRepository.exists).mockRejectedValue(
        "String error"
      );

      // Act & Assert
      await expect(
        useCase.execute({ conversationId: "test-id" })
      ).rejects.toThrow("Failed to delete conversation. Please try again.");
    });

    it("should return appropriate error message for not found errors", async () => {
      // Arrange
      vi.mocked(mockConversationRepository.exists).mockResolvedValue(false);

      // Act & Assert
      await expect(
        useCase.execute({ conversationId: "non-existent" })
      ).rejects.toThrow(
        "The conversation could not be found or has already been deleted."
      );
    });

    it("should return validation error as-is", async () => {
      // Act & Assert
      await expect(useCase.execute({ conversationId: "" })).rejects.toThrow(
        "Conversation ID is required"
      );
    });
  });
});
