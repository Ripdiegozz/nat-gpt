import { ConversationRepository } from "../../domain/repositories/conversation-repository";
import { Conversation } from "../../domain/entities/conversation";
import { ConversationId } from "../../domain/value-objects/conversation-id";
import { Message } from "../../domain/entities/message";
import { MessageId } from "../../domain/value-objects/message-id";
import { MessageRole } from "../../domain/enums/message-role";

interface StoredConversation {
  id: string;
  title: string;
  messages: StoredMessage[];
  createdAt: string;
  updatedAt: string;
}

interface StoredMessage {
  id: string;
  content: string;
  role: string;
  timestamp: string;
}

export class LocalStorageConversationRepository
  implements ConversationRepository
{
  private readonly storageKey = "chatgpt-clone-conversations";

  async findAll(): Promise<Conversation[]> {
    try {
      const stored = this.getStoredData();
      return stored.map((data) => this.deserializeConversation(data));
    } catch (error) {
      throw new StorageError(
        `Failed to retrieve conversations: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async findById(id: ConversationId): Promise<Conversation | null> {
    try {
      const stored = this.getStoredData();
      const conversationData = stored.find((data) => data.id === id.toString());

      if (!conversationData) {
        return null;
      }

      return this.deserializeConversation(conversationData);
    } catch (error) {
      throw new StorageError(
        `Failed to retrieve conversation ${id.toString()}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async save(conversation: Conversation): Promise<void> {
    try {
      const stored = this.getStoredData();
      const serialized = this.serializeConversation(conversation);

      // Find existing conversation index
      const existingIndex = stored.findIndex(
        (data) => data.id === conversation.id.toString()
      );

      if (existingIndex >= 0) {
        // Update existing conversation
        stored[existingIndex] = serialized;
      } else {
        // Add new conversation
        stored.push(serialized);
      }

      this.setStoredData(stored);
    } catch (error) {
      if (error instanceof StorageQuotaExceededError) {
        throw error;
      }
      throw new StorageError(
        `Failed to save conversation ${conversation.id.toString()}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async delete(id: ConversationId): Promise<void> {
    try {
      const stored = this.getStoredData();
      const filteredData = stored.filter((data) => data.id !== id.toString());

      if (filteredData.length === stored.length) {
        // Conversation not found, but this is not an error for delete operations
        return;
      }

      this.setStoredData(filteredData);
    } catch (error) {
      throw new StorageError(
        `Failed to delete conversation ${id.toString()}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async exists(id: ConversationId): Promise<boolean> {
    try {
      const stored = this.getStoredData();
      return stored.some((data) => data.id === id.toString());
    } catch (error) {
      throw new StorageError(
        `Failed to check if conversation exists ${id.toString()}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private getStoredData(): StoredConversation[] {
    try {
      if (typeof window === "undefined" || !window.localStorage) {
        throw new Error("localStorage is not available");
      }

      const data = window.localStorage.getItem(this.storageKey);
      if (!data) {
        return [];
      }

      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) {
        throw new Error("Invalid data format in localStorage");
      }

      return parsed;
    } catch (error) {
      if (error instanceof SyntaxError) {
        // Corrupted data, clear it and return empty array
        this.clearStoredData();
        return [];
      }
      throw error;
    }
  }

  private setStoredData(data: StoredConversation[]): void {
    if (typeof window === "undefined" || !window.localStorage) {
      throw new Error("localStorage is not available");
    }

    try {
      const serialized = JSON.stringify(data);
      window.localStorage.setItem(this.storageKey, serialized);
    } catch (error) {
      if (error instanceof Error && error.name === "QuotaExceededError") {
        throw new StorageQuotaExceededError(
          "localStorage quota exceeded. Please clear some data."
        );
      }
      throw error;
    }
  }

  private clearStoredData(): void {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(this.storageKey);
      }
    } catch (error) {
      // Ignore errors when clearing data
      console.warn("Failed to clear localStorage data:", error);
    }
  }

  private serializeConversation(
    conversation: Conversation
  ): StoredConversation {
    return {
      id: conversation.id.toString(),
      title: conversation.title,
      messages: conversation
        .getMessages()
        .map((message) => this.serializeMessage(message)),
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
    };
  }

  private serializeMessage(message: Message): StoredMessage {
    return {
      id: message.id.toString(),
      content: message.content,
      role: message.role,
      timestamp: message.timestamp.toISOString(),
    };
  }

  private deserializeConversation(data: StoredConversation): Conversation {
    try {
      const messages = data.messages.map((messageData) =>
        this.deserializeMessage(messageData)
      );

      return new Conversation(
        new ConversationId(data.id),
        data.title,
        messages,
        new Date(data.createdAt),
        new Date(data.updatedAt)
      );
    } catch (error) {
      throw new Error(
        `Failed to deserialize conversation: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private deserializeMessage(data: StoredMessage): Message {
    try {
      // Validate role
      if (!Object.values(MessageRole).includes(data.role as MessageRole)) {
        throw new Error(`Invalid message role: ${data.role}`);
      }

      return new Message(
        new MessageId(data.id),
        data.content,
        data.role as MessageRole,
        new Date(data.timestamp)
      );
    } catch (error) {
      throw new Error(
        `Failed to deserialize message: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Clears all stored conversations (useful for testing or data reset)
   */
  async clear(): Promise<void> {
    try {
      this.clearStoredData();
    } catch (error) {
      throw new StorageError(
        `Failed to clear all conversations: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Gets the total number of stored conversations
   */
  async count(): Promise<number> {
    try {
      const stored = this.getStoredData();
      return stored.length;
    } catch (error) {
      throw new StorageError(
        `Failed to count conversations: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Gets storage usage information
   */
  getStorageInfo(): { used: number; available: number; total: number } {
    try {
      if (typeof window === "undefined" || !window.localStorage) {
        return { used: 0, available: 0, total: 0 };
      }

      // Estimate storage usage
      let used = 0;
      for (const key in window.localStorage) {
        if (window.localStorage.hasOwnProperty(key)) {
          used += window.localStorage[key].length + key.length;
        }
      }

      // Most browsers have a 5-10MB limit for localStorage
      const total = 5 * 1024 * 1024; // 5MB estimate
      const available = total - used;

      return { used, available, total };
    } catch (error) {
      console.error("Failed to get storage info:", error);
      return { used: 0, available: 0, total: 0 };
    }
  }
}

// Custom error classes for better error handling
export class StorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StorageError";
  }
}

export class StorageQuotaExceededError extends StorageError {
  constructor(message: string) {
    super(message);
    this.name = "StorageQuotaExceededError";
  }
}
