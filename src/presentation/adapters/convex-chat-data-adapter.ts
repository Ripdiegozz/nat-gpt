import { useRouter } from "next/navigation";
import { Id } from "../../../convex/_generated/dataModel";

export interface ConvexChatData {
  activeConversationId: string | null;
  activeConversation: any;
  conversations: any[];
  messages: any[];
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

export interface AdaptedChatData {
  activeConversationId: string | null;
  activeConversation: any;
  conversations: any[];
  isLoadingConversations: boolean;
  conversationsError: string | null;
  sendMessageError: string | null;
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
    private chatData: ConvexChatData,
    private router: ReturnType<typeof useRouter>
  ) {}

  protected transformMessages(messages: any[]) {
    return messages.map((msg) => ({
      id: msg.id.toString(),
      content: msg.content,
      role: msg.role.toString().toLowerCase() as "user" | "assistant",
      timestamp: msg.timestamp.toISOString(),
    }));
  }

  protected transformConversations(conversations: any[]) {
    return conversations
      .filter((conv): conv is NonNullable<typeof conv> => conv !== null)
      .map((conv) => ({
        id: conv._id,
        title: conv.title,
        messages: [], // Messages are loaded separately for the active conversation
        createdAt: new Date(conv.createdAt).toISOString(),
        updatedAt: new Date(conv.updatedAt).toISOString(),
      }));
  }

  adapt(): AdaptedChatData {
    return {
      activeConversationId: this.chatData.activeConversationId,
      activeConversation: this.chatData.activeConversation
        ? {
            ...this.chatData.activeConversation,
            messages: this.transformMessages(this.chatData.messages),
          }
        : null,
      conversations: this.transformConversations(this.chatData.conversations),
      isLoadingConversations: this.chatData.isLoadingConversations,
      conversationsError: this.chatData.conversationsError,
      sendMessageError: this.chatData.sendMessageError,
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
        await this.chatData.deleteConversation(conversationId as any);
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
        await this.chatData.updateConversationTitle(
          conversationId as any,
          newTitle
        );
        return true;
      } catch (err) {
        console.error("Failed to rename conversation:", err);
        return false;
      }
    };
  }
}
