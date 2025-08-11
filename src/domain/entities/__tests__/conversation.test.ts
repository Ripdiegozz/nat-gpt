import { describe, it, expect, beforeEach } from "vitest";
import { Conversation } from "../conversation";
import { Message } from "../message";
import { ConversationId } from "../../value-objects/conversation-id";
import { MessageId } from "../../value-objects/message-id";
import { MessageRole } from "../../enums/message-role";

describe("Conversation", () => {
  let conversationId: ConversationId;
  let message1: Message;
  let message2: Message;
  let createdAt: Date;
  let updatedAt: Date;

  beforeEach(() => {
    conversationId = new ConversationId("test-conversation-id");
    message1 = new Message(new MessageId("msg-1"), "Hello", MessageRole.USER);
    message2 = new Message(
      new MessageId("msg-2"),
      "Hi there!",
      MessageRole.ASSISTANT
    );
    createdAt = new Date("2024-01-01T00:00:00Z");
    updatedAt = new Date("2024-01-01T01:00:00Z");
  });

  describe("constructor", () => {
    it("should create a conversation with valid parameters", () => {
      const conversation = new Conversation(
        conversationId,
        "Test Conversation",
        [message1, message2],
        createdAt,
        updatedAt
      );

      expect(conversation.id).toBe(conversationId);
      expect(conversation.title).toBe("Test Conversation");
      expect(conversation.getMessages()).toHaveLength(2);
      expect(conversation.createdAt).toBe(createdAt);
      expect(conversation.updatedAt).toBe(updatedAt);
    });

    it("should create conversation with empty messages array by default", () => {
      const conversation = new Conversation(
        conversationId,
        "Test Conversation"
      );
      expect(conversation.getMessages()).toHaveLength(0);
    });

    it("should use current date for timestamps if not provided", () => {
      const beforeCreation = new Date();
      const conversation = new Conversation(
        conversationId,
        "Test Conversation"
      );
      const afterCreation = new Date();

      expect(conversation.createdAt.getTime()).toBeGreaterThanOrEqual(
        beforeCreation.getTime()
      );
      expect(conversation.createdAt.getTime()).toBeLessThanOrEqual(
        afterCreation.getTime()
      );
      expect(conversation.updatedAt.getTime()).toBeGreaterThanOrEqual(
        beforeCreation.getTime()
      );
      expect(conversation.updatedAt.getTime()).toBeLessThanOrEqual(
        afterCreation.getTime()
      );
    });

    it("should trim title whitespace", () => {
      const conversation = new Conversation(
        conversationId,
        "  Test Conversation  "
      );
      expect(conversation.title).toBe("Test Conversation");
    });

    it("should throw error for empty title", () => {
      expect(() => new Conversation(conversationId, "")).toThrow(
        "Conversation title cannot be empty"
      );
    });

    it("should throw error for whitespace-only title", () => {
      expect(() => new Conversation(conversationId, "   ")).toThrow(
        "Conversation title cannot be empty"
      );
    });

    it("should throw error for null title", () => {
      expect(
        () => new Conversation(conversationId, null as unknown as string)
      ).toThrow("Conversation title cannot be empty");
    });

    it("should throw error for undefined title", () => {
      expect(
        () => new Conversation(conversationId, undefined as unknown as string)
      ).toThrow("Conversation title cannot be empty");
    });
  });

  describe("addMessage", () => {
    it("should return new conversation with added message", () => {
      const conversation = new Conversation(
        conversationId,
        "Test Conversation",
        [message1]
      );
      const newConversation = conversation.addMessage(message2);

      expect(newConversation).not.toBe(conversation); // Should be immutable
      expect(newConversation.getMessages()).toHaveLength(2);
      expect(newConversation.getMessages()[1]).toBe(message2);
      expect(newConversation.updatedAt.getTime()).toBeGreaterThanOrEqual(
        conversation.updatedAt.getTime()
      );
    });

    it("should preserve original conversation immutability", () => {
      const conversation = new Conversation(
        conversationId,
        "Test Conversation",
        [message1]
      );
      const originalMessageCount = conversation.getMessages().length;

      conversation.addMessage(message2);

      expect(conversation.getMessages()).toHaveLength(originalMessageCount);
    });

    it("should maintain conversation identity", () => {
      const conversation = new Conversation(
        conversationId,
        "Test Conversation"
      );
      const newConversation = conversation.addMessage(message1);

      expect(newConversation.id).toBe(conversation.id);
      expect(newConversation.title).toBe(conversation.title);
      expect(newConversation.createdAt).toBe(conversation.createdAt);
    });
  });

  describe("getMessages", () => {
    it("should return readonly array of messages", () => {
      const conversation = new Conversation(
        conversationId,
        "Test Conversation",
        [message1, message2]
      );
      const messages = conversation.getMessages();

      expect(messages).toHaveLength(2);
      expect(messages[0]).toBe(message1);
      expect(messages[1]).toBe(message2);
      expect(Object.isFrozen(messages)).toBe(true);
    });

    it("should return empty array for conversation with no messages", () => {
      const conversation = new Conversation(
        conversationId,
        "Test Conversation"
      );
      const messages = conversation.getMessages();

      expect(messages).toHaveLength(0);
      expect(Object.isFrozen(messages)).toBe(true);
    });
  });

  describe("getLastMessage", () => {
    it("should return last message when messages exist", () => {
      const conversation = new Conversation(
        conversationId,
        "Test Conversation",
        [message1, message2]
      );
      expect(conversation.getLastMessage()).toBe(message2);
    });

    it("should return null when no messages exist", () => {
      const conversation = new Conversation(
        conversationId,
        "Test Conversation"
      );
      expect(conversation.getLastMessage()).toBeNull();
    });
  });

  describe("getMessageCount", () => {
    it("should return correct message count", () => {
      const conversation = new Conversation(
        conversationId,
        "Test Conversation",
        [message1, message2]
      );
      expect(conversation.getMessageCount()).toBe(2);
    });

    it("should return 0 for empty conversation", () => {
      const conversation = new Conversation(
        conversationId,
        "Test Conversation"
      );
      expect(conversation.getMessageCount()).toBe(0);
    });
  });

  describe("isEmpty", () => {
    it("should return true for conversation with no messages", () => {
      const conversation = new Conversation(
        conversationId,
        "Test Conversation"
      );
      expect(conversation.isEmpty()).toBe(true);
    });

    it("should return false for conversation with messages", () => {
      const conversation = new Conversation(
        conversationId,
        "Test Conversation",
        [message1]
      );
      expect(conversation.isEmpty()).toBe(false);
    });
  });

  describe("hasMessages", () => {
    it("should return false for conversation with no messages", () => {
      const conversation = new Conversation(
        conversationId,
        "Test Conversation"
      );
      expect(conversation.hasMessages()).toBe(false);
    });

    it("should return true for conversation with messages", () => {
      const conversation = new Conversation(
        conversationId,
        "Test Conversation",
        [message1]
      );
      expect(conversation.hasMessages()).toBe(true);
    });
  });

  describe("equals", () => {
    it("should return true for conversations with same id", () => {
      const conversation1 = new Conversation(
        conversationId,
        "Test Conversation 1",
        [message1]
      );
      const conversation2 = new Conversation(
        conversationId,
        "Test Conversation 2",
        [message2]
      );

      expect(conversation1.equals(conversation2)).toBe(true);
    });

    it("should return false for conversations with different ids", () => {
      const conversation1 = new Conversation(
        conversationId,
        "Test Conversation"
      );
      const conversation2 = new Conversation(
        new ConversationId("different-id"),
        "Test Conversation"
      );

      expect(conversation1.equals(conversation2)).toBe(false);
    });
  });

  describe("create", () => {
    it("should create conversation with generated id", () => {
      const conversation = Conversation.create("My Conversation");

      expect(conversation.title).toBe("My Conversation");
      expect(conversation.id).toBeInstanceOf(ConversationId);
      expect(conversation.isEmpty()).toBe(true);
      expect(conversation.createdAt).toBeInstanceOf(Date);
      expect(conversation.updatedAt).toBeInstanceOf(Date);
    });

    it("should create conversation with provided id", () => {
      const conversation = Conversation.create(
        "My Conversation",
        conversationId
      );

      expect(conversation.title).toBe("My Conversation");
      expect(conversation.id).toBe(conversationId);
    });

    it("should validate title", () => {
      expect(() => Conversation.create("")).toThrow(
        "Conversation title cannot be empty"
      );
    });
  });

  describe("createWithDefaultTitle", () => {
    it("should create conversation with default title and generated id", () => {
      const conversation = Conversation.createWithDefaultTitle();

      expect(conversation.title).toBe("New Conversation");
      expect(conversation.id).toBeInstanceOf(ConversationId);
      expect(conversation.isEmpty()).toBe(true);
    });

    it("should create conversation with default title and provided id", () => {
      const conversation = Conversation.createWithDefaultTitle(conversationId);

      expect(conversation.title).toBe("New Conversation");
      expect(conversation.id).toBe(conversationId);
    });
  });
});
