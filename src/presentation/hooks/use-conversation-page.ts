"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useConvexUser } from "./use-convex-user";
import { useConvexChat } from "./use-convex-chat";
import { ConversationPageAdapter } from "../adapters/conversation-page-adapter";
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

  // Create adapter instance
  const adapter = new ConversationPageAdapter(chatData, router, conversationId);
  const adaptedChatData = adapter.adapt();

  return {
    isLoaded,
    adaptedChatData,
  };
}