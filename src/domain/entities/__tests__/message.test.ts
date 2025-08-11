import { describe, it, expect, beforeEach } from "vitest";
import { Message } from "../message";
import { MessageId } from "../../value-objects/message-id";
import { MessageRole } from "../../enums/message-role";

describe("Message", () => {
  let messageId: MessageId;
  let timestamp: Date;

  beforeEach(() => {
    messageId = new MessageId("test-message-id");
    timestamp = new Date("2024-01-01T00:00:00Z");
  });

  describe("constructor", () => {
    it("should create a message with valid parameters", () => {
      const message = new Message(
        messageId,
        "Hello world",
        MessageRole.USER,
        timestamp
      );

      expect(message.id).toBe(messageId);
      expect(message.content).toBe("Hello world");
      expect(message.role).toBe(MessageRole.USER);
      expect(message.timestamp).toBe(timestamp);
    });

    it("should trim content whitespace", () => {
      const message = new Message(
        messageId,
        "  Hello world  ",
        MessageRole.USER,
        timestamp
      );
      expect(message.content).toBe("Hello world");
    });

    it("should use current date if timestamp not provided", () => {
      const beforeCreation = new Date();
      const message = new Message(messageId, "Hello world", MessageRole.USER);
      const afterCreation = new Date();

      expect(message.timestamp.getTime()).toBeGreaterThanOrEqual(
        beforeCreation.getTime()
      );
      expect(message.timestamp.getTime()).toBeLessThanOrEqual(
        afterCreation.getTime()
      );
    });

    it("should throw error for empty content", () => {
      expect(
        () => new Message(messageId, "", MessageRole.USER, timestamp)
      ).toThrow("Message content cannot be empty");
    });

    it("should throw error for whitespace-only content", () => {
      expect(
        () => new Message(messageId, "   ", MessageRole.USER, timestamp)
      ).toThrow("Message content cannot be empty");
    });

    it("should throw error for null content", () => {
      expect(
        () =>
          new Message(
            messageId,
            null as unknown as string,
            MessageRole.USER,
            timestamp
          )
      ).toThrow("Message content cannot be empty");
    });

    it("should throw error for undefined content", () => {
      expect(
        () =>
          new Message(
            messageId,
            undefined as unknown as string,
            MessageRole.USER,
            timestamp
          )
      ).toThrow("Message content cannot be empty");
    });
  });

  describe("isFromUser", () => {
    it("should return true for user messages", () => {
      const message = new Message(
        messageId,
        "Hello",
        MessageRole.USER,
        timestamp
      );
      expect(message.isFromUser()).toBe(true);
    });

    it("should return false for assistant messages", () => {
      const message = new Message(
        messageId,
        "Hello",
        MessageRole.ASSISTANT,
        timestamp
      );
      expect(message.isFromUser()).toBe(false);
    });
  });

  describe("isFromAssistant", () => {
    it("should return true for assistant messages", () => {
      const message = new Message(
        messageId,
        "Hello",
        MessageRole.ASSISTANT,
        timestamp
      );
      expect(message.isFromAssistant()).toBe(true);
    });

    it("should return false for user messages", () => {
      const message = new Message(
        messageId,
        "Hello",
        MessageRole.USER,
        timestamp
      );
      expect(message.isFromAssistant()).toBe(false);
    });
  });

  describe("equals", () => {
    it("should return true for messages with same id", () => {
      const message1 = new Message(
        messageId,
        "Hello",
        MessageRole.USER,
        timestamp
      );
      const message2 = new Message(
        messageId,
        "Different content",
        MessageRole.ASSISTANT,
        new Date()
      );

      expect(message1.equals(message2)).toBe(true);
    });

    it("should return false for messages with different ids", () => {
      const message1 = new Message(
        messageId,
        "Hello",
        MessageRole.USER,
        timestamp
      );
      const message2 = new Message(
        new MessageId("different-id"),
        "Hello",
        MessageRole.USER,
        timestamp
      );

      expect(message1.equals(message2)).toBe(false);
    });
  });

  describe("createUserMessage", () => {
    it("should create a user message with generated id", () => {
      const message = Message.createUserMessage("Hello world");

      expect(message.content).toBe("Hello world");
      expect(message.role).toBe(MessageRole.USER);
      expect(message.id).toBeInstanceOf(MessageId);
      expect(message.timestamp).toBeInstanceOf(Date);
    });

    it("should create a user message with provided id", () => {
      const message = Message.createUserMessage("Hello world", messageId);

      expect(message.content).toBe("Hello world");
      expect(message.role).toBe(MessageRole.USER);
      expect(message.id).toBe(messageId);
    });

    it("should validate content", () => {
      expect(() => Message.createUserMessage("")).toThrow(
        "Message content cannot be empty"
      );
    });
  });

  describe("createAssistantMessage", () => {
    it("should create an assistant message with generated id", () => {
      const message = Message.createAssistantMessage("Hello there!");

      expect(message.content).toBe("Hello there!");
      expect(message.role).toBe(MessageRole.ASSISTANT);
      expect(message.id).toBeInstanceOf(MessageId);
      expect(message.timestamp).toBeInstanceOf(Date);
    });

    it("should create an assistant message with provided id", () => {
      const message = Message.createAssistantMessage("Hello there!", messageId);

      expect(message.content).toBe("Hello there!");
      expect(message.role).toBe(MessageRole.ASSISTANT);
      expect(message.id).toBe(messageId);
    });

    it("should validate content", () => {
      expect(() => Message.createAssistantMessage("")).toThrow(
        "Message content cannot be empty"
      );
    });
  });
});
