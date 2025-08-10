"use client";

import { ConvexChatInterface } from "@/src/presentation/components/chat/convex-chat-interface";
import { useConvexUser } from "@/src/presentation/hooks/use-convex-user";
import { useConvexChat } from "@/src/presentation/hooks/use-convex-chat";

export default function ChatPage() {
  const { isLoaded } = useConvexUser();
  const chatData = useConvexChat();

  // Show loading state while authentication is being determined
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-main mx-auto mb-4"></div>
          <p className="text-foreground/70 font-base">Loading...</p>
        </div>
      </div>
    );
  }

  // Convert Convex chat data to the format expected by ConvexChatInterface
  const adaptedChatData = {
    activeConversationId: chatData.activeConversationId,
    activeConversation: chatData.activeConversation ? {
      ...chatData.activeConversation,
      messages: chatData.messages.map((msg) => ({
        id: msg.id.toString(),
        content: msg.content,
        role: msg.role.toString().toLowerCase() as "user" | "assistant",
        timestamp: msg.timestamp.toISOString(),
      })),
    } : null,
    conversations: chatData.conversations
      .filter((conv) => conv !== null)
      .map((conv) => ({
        id: conv._id,
        title: conv.title,
        messages: [], // Messages are loaded separately for the active conversation
        createdAt: new Date(conv.createdAt).toISOString(),
        updatedAt: new Date(conv.updatedAt).toISOString(),
      })),
    isLoadingConversations: chatData.isLoadingConversations,
    conversationsError: chatData.conversationsError,
    setActiveConversation: chatData.setActiveConversation,
    sendMessage: async (content: string) => {
      try {
        await chatData.sendMessage(content);
        return true;
      } catch (err) {
        console.error("Failed to send message:", err);
        return false;
      }
    },
    isSendingMessage: chatData.isSendingMessage,
    sendMessageError: chatData.sendMessageError,
    createNewConversation: async () => {
      try {
        await chatData.createNewConversation();
        return true;
      } catch (err) {
        console.error("Failed to create conversation:", err);
        return false;
      }
    },
    isCreatingConversation: chatData.isCreatingConversation,
    deleteConversation: async (conversationId: string) => {
      try {
        await chatData.deleteConversation(conversationId as any);
        return true;
      } catch (err) {
        console.error("Failed to delete conversation:", err);
        return false;
      }
    },
    clearAllErrors: chatData.clearAllErrors,
  };

  // Since middleware protects this route, we know user is authenticated
  return <ConvexChatInterface chatData={adaptedChatData} />;
}
