import { useRouter } from "next/navigation";
import { Id } from "../../../convex/_generated/dataModel";

// Define types for Convex data structures
interface ConvexConversation {
  _id: Id<"conversations">;
  title: string;
  userId: string;
  _creationTime: number;
  lastMessageTime?: number;
}

interface ConvexMessage {
  _id: Id<"messages">;
  content: string;
  role: "user" | "assistant";
  conversationId: Id<"conversations">;
  _creationTime: number;
}

export interface ConvexChatData {
  activeConversationId: string | null;
  activeConversation: ConvexConversation | null | undefined;
  conversations: ConvexConversation[];
  messages: ConvexMessage[];
  isLoadingConversations: boolean;
  conversationsError: string | null;
  sendMessageError: string | null;
  isSendingMessage: boolean;
  isCreatingConversation: boolean;
  setActiveConversation: (id: string | null) => void;
  sendMessage: (content: string) => Promise<{
    success: boolean;
    isNewConversation?: boolean;
    conversationId?: string;
  }>;
  createNewConversation: (title?: string) => Promise<string | null>;
  deleteConversation: (id: string) => Promise<boolean>;
  updateConversationTitle: (id: string, title: string) => Promise<void>;
  clearAllErrors: () => void;
}

// Define adapted conversation structure
interface AdaptedConversation {
  id: string;
  title: string;
  messages: Array<{
    id: string;
    content: string;
    role: "user" | "assistant";
    timestamp: string;
  }>;
  createdAt: string;
  updatedAt: string;
  messageCount?: number;
}

export interface AdaptedChatData {
  activeConversationId: string | null;
  activeConversation: {
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    lastMessageTime?: Date;
    messages: Array<{
      id: string;
      content: string;
      role: "user" | "assistant";
      timestamp: string;
    }>;
    messageCount?: number;
  } | null;
  conversations: AdaptedConversation[];
  isLoadingConversations: boolean;
  conversationsError: string | null;
  sendMessageError: string | null;
  error: string | null;
  isSendingMessage: boolean;
  isCreatingConversation: boolean;
  setActiveConversation: (id: string) => void;
  sendMessage: (content: string) => Promise<boolean>;
  createNewConversation: () => Promise<string | null>;
  deleteConversation: (id: string) => Promise<boolean>;
  renameConversation: (id: string, newTitle: string) => Promise<boolean>;
  clearAllErrors: () => void;
}

export class ConvexChatDataAdapter {
  constructor(
    protected chatData: ConvexChatData,
    protected router: ReturnType<typeof useRouter>
  ) {}

  protected transformMessages(messages: ConvexMessage[]) {
    return messages.map((msg) => ({
      id: msg._id.toString(),
      content: msg.content,
      role: msg.role as "user" | "assistant",
      timestamp: new Date(msg._creationTime).toISOString(),
    }));
  }

  protected transformConversations(conversations: ConvexConversation[]) {
    return conversations
      .filter((conv): conv is NonNullable<typeof conv> => conv !== null)
      .map((conv) => ({
        id: conv._id.toString(),
        title: conv.title,
        messages: [], // Messages are loaded separately for the active conversation
        createdAt: new Date(conv._creationTime).toISOString(),
        updatedAt: new Date(
          conv.lastMessageTime || conv._creationTime
        ).toISOString(),
        messageCount: 0, // Can be calculated if needed
      }));
  }

  adapt(): AdaptedChatData {
    return {
      activeConversationId: this.chatData.activeConversationId,
      activeConversation: this.chatData.activeConversation
        ? {
            id: this.chatData.activeConversation._id.toString(),
            title: this.chatData.activeConversation.title,
            createdAt: new Date(
              this.chatData.activeConversation._creationTime
            ).toISOString(),
            updatedAt: new Date(
              this.chatData.activeConversation.lastMessageTime ||
                this.chatData.activeConversation._creationTime
            ).toISOString(),
            lastMessageTime: this.chatData.activeConversation.lastMessageTime
              ? new Date(this.chatData.activeConversation.lastMessageTime)
              : undefined,
            messages: this.transformMessages(this.chatData.messages),
            messageCount: this.chatData.messages.length,
          }
        : null,
      conversations: this.transformConversations(this.chatData.conversations),
      isLoadingConversations: this.chatData.isLoadingConversations,
      conversationsError: this.chatData.conversationsError,
      sendMessageError: this.chatData.sendMessageError,
      error: this.chatData.conversationsError || this.chatData.sendMessageError,
      isSendingMessage: this.chatData.isSendingMessage,
      isCreatingConversation: this.chatData.isCreatingConversation,
      setActiveConversation: this.createSetActiveConversationHandler(),
      sendMessage: this.createSendMessageHandler(),
      createNewConversation: this.createNewConversationHandler(),
      deleteConversation: this.createDeleteConversationHandler(),
      renameConversation: this.createRenameConversationHandler(),
      clearAllErrors: this.chatData.clearAllErrors,
    };
  }

  protected createSetActiveConversationHandler() {
    return (newConversationId: string) => {
      this.chatData.setActiveConversation(newConversationId);
      this.router.push(`/chat/${newConversationId}`);
    };
  }

  protected createSendMessageHandler() {
    return async (content: string): Promise<boolean> => {
      try {
        const result = await this.chatData.sendMessage(content);
        if (
          result.success &&
          result.isNewConversation &&
          result.conversationId
        ) {
          this.router.push(`/chat/${result.conversationId}`);
        }
        return result.success;
      } catch (err) {
        console.error("Failed to send message:", err);
        return false;
      }
    };
  }

  protected createNewConversationHandler() {
    return async (): Promise<string | null> => {
      try {
        const newConversationId = await this.chatData.createNewConversation();
        if (newConversationId) {
          this.router.push(`/chat/${newConversationId}`);
          return newConversationId;
        }
        return null;
      } catch (err) {
        console.error("Failed to create conversation:", err);
        return null;
      }
    };
  }

  protected createDeleteConversationHandler() {
    return async (conversationId: string): Promise<boolean> => {
      try {
        await this.chatData.deleteConversation(conversationId);
        return true;
      } catch (err) {
        console.error("Failed to delete conversation:", err);
        return false;
      }
    };
  }

  protected createRenameConversationHandler() {
    return async (
      conversationId: string,
      newTitle: string
    ): Promise<boolean> => {
      try {
        await this.chatData.updateConversationTitle(conversationId, newTitle);
        return true;
      } catch (err) {
        console.error("Failed to rename conversation:", err);
        return false;
      }
    };
  }
}
