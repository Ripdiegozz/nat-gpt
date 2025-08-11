import { useRouter } from "next/navigation";
import {
  ConvexChatDataAdapter,
  ConvexChatData,
} from "./convex-chat-data-adapter";

export class ConversationPageAdapter extends ConvexChatDataAdapter {
  constructor(
    chatData: ConvexChatData,
    router: ReturnType<typeof useRouter>,
    private conversationId: string
  ) {
    super(chatData, router);
  }

  protected createSendMessageHandler() {
    return async (content: string): Promise<boolean> => {
      try {
        const result = await this.chatData.sendMessage(content);
        // For conversation pages, we don't need to navigate on new conversation
        // since we're already in a conversation context
        return result.success;
      } catch (err) {
        console.error("Failed to send message:", err);
        return false;
      }
    };
  }

  protected createDeleteConversationHandler() {
    return async (convIdToDelete: string): Promise<boolean> => {
      try {
        await this.chatData.deleteConversation(convIdToDelete);
        // If we deleted the current conversation, navigate to chat home
        if (convIdToDelete === this.conversationId) {
          this.router.push("/chat");
        }
        return true;
      } catch (err) {
        console.error("Failed to delete conversation:", err);
        return false;
      }
    };
  }
}
