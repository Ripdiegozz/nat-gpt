import { describe, it, expect, beforeEach } from "vitest";
import { ConversationRepository } from "../conversation-repository";
import { Conversation } from "../../entities/conversation";
import { Message } from "../../entities/message";
import { ConversationId } from "../../value-objects/conversation-id";

// Mock implementation for testing the interface contract
class MockConversationRepository implements ConversationRepository {
  private conversations: Map<string, Conversation> = new Map();

  async findAll(): Promise<Conversation[]> {
    return Array.from(this.conversations.values());
  }

  async findById(id: ConversationId): Promise<Conversation | null> {
    return this.conversations.get(id.toString()) || null;
  }

  async save(conversation: Conversation): Promise<void> {
    this.conversations.set(conversation.id.toString(), conversation);
  }

  async delete(id: ConversationId): Promise<void> {
    this.conversations.delete(id.toString());
  }

  async exists(id: ConversationId): Promise<boolean> {
    return this.conversations.has(id.toString());
  }
}

describe("ConversationRepository Interface", () => {
  let repository: ConversationRepository;
  let conversation: Conversation;
  let conversationId: ConversationId;

  beforeEach(() => {
    repository = new MockConversationRepository();
    conversationId = ConversationId.generate();
    conversation = Conversation.create("Test Conversation", conversationId);
  });

  describe("findAll", () => {
    it("should return empty array when no conversations exist", async () => {
      const conversations = await repository.findAll();
      expect(conversations).toEqual([]);
    });

    it("should return all conversations", async () => {
      await repository.save(conversation);
      const conversation2 = Conversation.create("Another Conversation");
      await repository.save(conversation2);

      const conversations = await repository.findAll();
      expect(conversations).toHaveLength(2);
      expect(conversations).toContain(conversation);
      expect(conversations).toContain(conversation2);
    });
  });

  describe("findById", () => {
    it("should return null when conversation does not exist", async () => {
      const result = await repository.findById(conversationId);
      expect(result).toBeNull();
    });

    it("should return conversation when it exists", async () => {
      await repository.save(conversation);
      const result = await repository.findById(conversationId);
      expect(result).toBe(conversation);
    });
  });

  describe("save", () => {
    it("should save a new conversation", async () => {
      await repository.save(conversation);
      const result = await repository.findById(conversationId);
      expect(result).toBe(conversation);
    });

    it("should update an existing conversation", async () => {
      await repository.save(conversation);
      const updatedConversation = conversation.addMessage({
        id: { toString: () => "msg-1" },
        content: "Hello",
        role: "user",
        timestamp: new Date(),
      } as unknown as Message);

      await repository.save(updatedConversation);
      const result = await repository.findById(conversationId);
      expect(result).toBe(updatedConversation);
    });
  });

  describe("delete", () => {
    it("should delete an existing conversation", async () => {
      await repository.save(conversation);
      expect(await repository.exists(conversationId)).toBe(true);

      await repository.delete(conversationId);
      expect(await repository.exists(conversationId)).toBe(false);
    });

    it("should not throw when deleting non-existent conversation", async () => {
      await expect(repository.delete(conversationId)).resolves.not.toThrow();
    });
  });

  describe("exists", () => {
    it("should return false when conversation does not exist", async () => {
      const exists = await repository.exists(conversationId);
      expect(exists).toBe(false);
    });

    it("should return true when conversation exists", async () => {
      await repository.save(conversation);
      const exists = await repository.exists(conversationId);
      expect(exists).toBe(true);
    });
  });
});
