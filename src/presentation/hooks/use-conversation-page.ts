"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useConvexUser } from "./use-convex-user";
import { useConvexChat } from "./use-convex-chat";
import { ConversationPageAdapter } from "../adapters/conversation-page-adapter";
import { type ConvexChatData } from "../adapters/convex-chat-data-adapter";
import { Id } from "../../../convex/_generated/dataModel";

export function useConversationPage(conversationId: string) {
  const { isLoaded } = useConvexUser();
  const chatData = useConvexChat();
  const router = useRouter();

  // Set active conversation from URL when component mounts
  useEffect(() => {
    if (
      isLoaded &&
      conversationId &&
      conversationId !== "undefined" &&
      chatData.setActiveConversation
    ) {
      // Validate that conversationId is a valid Convex ID format
      try {
        chatData.setActiveConversation(conversationId as Id<"conversations">);
      } catch (error) {
        console.error("Invalid conversation ID:", conversationId, error);
        // Redirect to chat home if invalid ID
        router.push("/chat");
      }
    }
  }, [isLoaded, conversationId, chatData.setActiveConversation, router]);

  // Transform the chat data to match ConvexChatData interface
  const transformedChatData: ConvexChatData = {
    activeConversationId: chatData.activeConversationId,
    activeConversation: chatData.activeConversation ? {
      _id: chatData.activeConversation._id,
      title: chatData.activeConversation.title,
      userId: chatData.activeConversation.userId || chatData.activeConversation.clerkUserId,
      _creationTime: chatData.activeConversation._creationTime,
    } : null,
    conversations: chatData.conversations
      .filter((conv): conv is NonNullable<typeof conv> => conv !== null)
      .map(conv => ({
        _id: conv._id,
        title: conv.title,
        userId: conv.userId || conv.clerkUserId,
        _creationTime: conv._creationTime,
      })),
    messages: chatData.messages.map(message => ({
      _id: message.id.toString() as Id<"messages">,
      content: message.content,
      role: message.role as "user" | "assistant",
      conversationId: chatData.activeConversationId!,
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
  const adapter = new ConversationPageAdapter(transformedChatData, router, conversationId);
  const adaptedChatData = adapter.adapt();

  return {
    isLoaded,
    adaptedChatData,
  };
}