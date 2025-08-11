"use client";

import { use } from "react";
import { ConvexChatInterface } from "@/src/presentation/components/chat/convex-chat-interface";
import { LoadingScreen } from "@/src/presentation/components/common/loading-screen";
import { useConversationPage } from "@/src/presentation/hooks/use-conversation-page";

interface ConversationPageProps {
  params: Promise<{
    conversationId: string;
  }>;
}

export default function ConversationPage({ params }: ConversationPageProps) {
  const { conversationId } = use(params);
  const { isLoaded, adaptedChatData } = useConversationPage(conversationId);

  if (!isLoaded) {
    return <LoadingScreen />;
  }

  return <ConvexChatInterface chatData={adaptedChatData} />;
}
