"use client";

import { ConvexChatInterface } from "@/src/presentation/components/chat/convex-chat-interface";
import { LoadingScreen } from "@/src/presentation/components/common/loading-screen";
import { useChatPage } from "@/src/presentation/hooks/use-chat-page";

export default function ChatPage() {
  const { isLoaded, adaptedChatData } = useChatPage();

  if (!isLoaded) {
    return <LoadingScreen />;
  }

  return <ConvexChatInterface chatData={adaptedChatData} />;
}
