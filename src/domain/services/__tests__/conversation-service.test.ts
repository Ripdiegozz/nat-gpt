import { describe, it, expect, beforeEach } from "vitest";
import { ConversationService } from "../conversation-service";
import { Conversation } from "../../entities/conversation";
import { Message } from "../../entities/message";
import { ConversationId } from "../../value-objects/conversation-id";
import { MessageId } from "../../value-objects/message-id";
import { MessageRole } from "../../enums/message-role";

// Mock implementation for testing the interface contract
class MockConversationService implements ConversationService {
  private maxMessageLimit: number = 100;

  generateTitle(conversation: Conversation): string {
    const messages = conversation.getMessages();
    if (messages.length === 0) {
      return "New Conversation";
    }

    const firstUserMessage = messages.find((m) => m.role === MessageRole.USER);
    if (firstUserMessage) {
      // Take first 30 characters of the first user message
      return (
        firstUserMessage.content.substring(0, 30) +
        (firstUserMessage.content.length > 30 ? "..." : "")
      );
    }

    return "Conversation";
  }

  shouldArchive(conversation: Conversation): boolean {
    const daysSinceUpdate =
      (Date.now() - conversation.updatedAt.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceUpdate > 30; // Archive after 30 days of inactivity
  }

  getMaxMessageLimit(): number {
    return this.maxMessageLimit;
  }

  canAddMessage(conversation: Conversation, message: Message): boolean {
    return conversation.getMessageCount() < this.maxMessageLimit;
  }

  trimConversationIfNeeded(conversation: Conversation): Conversation {
    const messages = conversation.getMessages();
    if (messages.length <= this.maxMessageLimit) {
      return conversation;
    }

    // Keep the most recent messages
    const trimmedMessages = messages.slice(-this.maxMessageLimit);
    return new Conversation(
      conversation.id,
      conversation.title,
      trimmedMessages,
      conversation.createdAt,
      new Date()
    );
  }

  // Test helper method
  setMaxMessageLimit(limit: number): void {
    this.maxMessageLimit = limit;
  }
}

describe("ConversationService Interface", () => {
  let conversationService: MockConversationService;
  let conversation: Conversation;
  let userMessage: Message;
  let assistantMessage: Message;

  beforeEach(() => {
    conversationService = new MockConversationService();
    conversation = Conversation.create("Test Conversation");
    userMessage = new Message(
      new MessageId("user-msg-1"),
      "Hello, how are you doing today?",
      MessageRole.USER
    );
    assistantMessage = new Message(
      new MessageId("ai-msg-1"),
      "I am doing well, thank you for asking!",
      MessageRole.ASSISTANT
    );
  });

  describe("generateTitle", () => {
    it("should return default title for empty conversation", () => {
      const title = conversationService.generateTitle(conversation);
      expect(title).toBe("New Conversation");
    });

    it("should generate title from first user message", () => {
      const conversationWithMessage = conversation.addMessage(userMessage);
      const title = conversationService.generateTitle(conversationWithMessage);
      expect(title).toBe("Hello, how are you doing today...");
    });

    it("should not truncate short messages", () => {
      const shortMessage = new Message(
        new MessageId("short-msg"),
        "Hi there!",
        MessageRole.USER
      );
      const conversationWithMessage = conversation.addMessage(shortMessage);
      const title = conversationService.generateTitle(conversationWithMessage);
      expect(title).toBe("Hi there!");
    });

    it("should handle conversation with only assistant messages", () => {
      const conversationWithAssistant =
        conversation.addMessage(assistantMessage);
      const title = conversationService.generateTitle(
        conversationWithAssistant
      );
      expect(title).toBe("Conversation");
    });

    it("should use first user message even if assistant message comes first", () => {
      const conversationWithMessages = conversation
        .addMessage(assistantMessage)
        .addMessage(userMessage);
      const title = conversationService.generateTitle(conversationWithMessages);
      expect(title).toBe("Hello, how are you doing today...");
    });
  });

  describe("shouldArchive", () => {
    it("should not archive recent conversations", () => {
      const shouldArchive = conversationService.shouldArchive(conversation);
      expect(shouldArchive).toBe(false);
    });

    it("should archive old conversations", () => {
      const oldDate = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000); // 31 days ago
      const oldConversation = new Conversation(
        ConversationId.generate(),
        "Old Conversation",
        [],
        oldDate,
        oldDate
      );
      const shouldArchive = conversationService.shouldArchive(oldConversation);
      expect(shouldArchive).toBe(true);
    });
  });

  describe("getMaxMessageLimit", () => {
    it("should return the maximum message limit", () => {
      const limit = conversationService.getMaxMessageLimit();
      expect(limit).toBe(100);
    });

    it("should return updated limit when changed", () => {
      conversationService.setMaxMessageLimit(50);
      const limit = conversationService.getMaxMessageLimit();
      expect(limit).toBe(50);
    });
  });

  describe("canAddMessage", () => {
    it("should allow adding message when under limit", () => {
      const canAdd = conversationService.canAddMessage(
        conversation,
        userMessage
      );
      expect(canAdd).toBe(true);
    });

    it("should not allow adding message when at limit", () => {
      conversationService.setMaxMessageLimit(1);
      const conversationWithMessage = conversation.addMessage(userMessage);
      const canAdd = conversationService.canAddMessage(
        conversationWithMessage,
        assistantMessage
      );
      expect(canAdd).toBe(false);
    });

    it("should allow adding message when exactly at limit minus one", () => {
      conversationService.setMaxMessageLimit(2);
      const conversationWithMessage = conversation.addMessage(userMessage);
      const canAdd = conversationService.canAddMessage(
        conversationWithMessage,
        assistantMessage
      );
      expect(canAdd).toBe(true);
    });
  });

  describe("trimConversationIfNeeded", () => {
    it("should not trim conversation under limit", () => {
      const conversationWithMessage = conversation.addMessage(userMessage);
      const trimmed = conversationService.trimConversationIfNeeded(
        conversationWithMessage
      );
      expect(trimmed).toBe(conversationWithMessage);
    });

    it("should trim conversation over limit", () => {
      conversationService.setMaxMessageLimit(2);

      // Add 3 messages to exceed limit
      const message2 = new Message(
        new MessageId("msg-2"),
        "Message 2",
        MessageRole.ASSISTANT
      );
      const message3 = new Message(
        new MessageId("msg-3"),
        "Message 3",
        MessageRole.USER
      );

      const conversationWithMessages = conversation
        .addMessage(userMessage)
        .addMessage(message2)
        .addMessage(message3);

      const trimmed = conversationService.trimConversationIfNeeded(
        conversationWithMessages
      );

      expect(trimmed.getMessageCount()).toBe(2);
      expect(trimmed.getMessages()[0]).toBe(message2); // Should keep the last 2 messages
      expect(trimmed.getMessages()[1]).toBe(message3);
    });

    it("should update timestamp when trimming", () => {
      conversationService.setMaxMessageLimit(1);
      const conversationWithMessages = conversation
        .addMessage(userMessage)
        .addMessage(assistantMessage);

      const originalUpdatedAt = conversationWithMessages.updatedAt;
      const trimmed = conversationService.trimConversationIfNeeded(
        conversationWithMessages
      );

      expect(trimmed.updatedAt.getTime()).toBeGreaterThanOrEqual(
        originalUpdatedAt.getTime()
      );
    });
  });
});
