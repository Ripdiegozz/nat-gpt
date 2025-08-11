"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useConvexUser } from "./use-convex-user";
import { useConvexChat } from "./use-convex-chat";
import {
  ConvexChatDataAdapter,
  type ConvexChatData,
} from "../adapters/convex-chat-data-adapter";
import { Id } from "../../../convex/_generated/dataModel";

export function useChatPage() {
  const { isLoaded } = useConvexUser();
  const chatData = useConvexChat();
  const router = useRouter();

  // Clear any active conversation when on the main chat page
  useEffect(() => {
    if (isLoaded && chatData.setActiveConversation) {
      chatData.setActiveConversation(null);
    }
  }, [isLoaded, chatData.setActiveConversation]);

  // Transform the chat data to match ConvexChatData interface
  const transformedChatData: ConvexChatData = {
    activeConversationId: chatData.activeConversationId,
    activeConversation: chatData.activeConversation
      ? {
          _id: chatData.activeConversation._id,
          title: chatData.activeConversation.title,
          userId:
            chatData.activeConversation.userId ||
            chatData.activeConversation.clerkUserId,
          _creationTime: chatData.activeConversation._creationTime,
        }
      : null,
    conversations: chatData.conversations
      .filter((conv): conv is NonNullable<typeof conv> => conv !== null)
      .map((conv) => ({
        _id: conv._id,
        title: conv.title,
        userId: conv.userId || conv.clerkUserId,
        _creationTime: conv._creationTime,
      })),
    messages: chatData.messages.map((message) => ({
      _id: message.id.toString() as Id<"messages">, // Use toString() to get the value
      content: message.content,
      role: message.role as "user" | "assistant", // MessageRole enum values are already strings
      conversationId: chatData.activeConversationId!, // All messages belong to active conversation
      _creationTime: message.timestamp.getTime(),
    })),
    isLoadingConversations: chatData.isLoadingConversations,
    conversationsError: chatData.conversationsError,
    sendMessageError: chatData.sendMessageError,
    isSendingMessage: chatData.isSendingMessage,
    isCreatingConversation: chatData.isCreatingConversation,
    setActiveConversation: chatData.setActiveConversation,
    sendMessage: chatData.sendMessage,
    createNewConversation: chatData.createNewConversation,
    deleteConversation: chatData.deleteConversation,
    updateConversationTitle: chatData.updateConversationTitle,
    clearAllErrors: chatData.clearAllErrors,
  };

  // Create adapter instance
  const adapter = new ConvexChatDataAdapter(transformedChatData, router);
  const adaptedChatData = adapter.adapt();

  return {
    isLoaded,
    adaptedChatData,
  };
}
