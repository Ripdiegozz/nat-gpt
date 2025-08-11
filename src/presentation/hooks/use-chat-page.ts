"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useConvexUser } from "./use-convex-user";
import { useConvexChat } from "./use-convex-chat";
import { ConvexChatDataAdapter } from "../adapters/convex-chat-data-adapter";

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

  // Create adapter instance
  const adapter = new ConvexChatDataAdapter(chatData, router);
  const adaptedChatData = adapter.adapt();

  return {
    isLoaded,
    adaptedChatData,
  };
}