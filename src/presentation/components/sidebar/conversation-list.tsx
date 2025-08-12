import React from "react";
import { ConversationItem } from "./conversation-item";
import { ConversationDTO } from "../../../application/dtos/conversation.dto";
import { cn } from "@/lib/utils";
import { useI18n } from "@/src/lib/i18n";

interface ConversationListProps {
  conversations: ConversationDTO[];
  activeConversationId: string | null;
  onConversationSelect: (conversationId: string) => void;
  onConversationDelete: (conversationId: string) => void;
  onConversationRename?: (conversationId: string, newTitle: string) => void;
  isLoading?: boolean;
  isCollapsed?: boolean;
  isMobile?: boolean;
  className?: string;
}

export function ConversationList({
  conversations,
  activeConversationId,
  onConversationSelect,
  onConversationDelete,
  onConversationRename,
  isLoading = false,
  isCollapsed = false,
  className,
}: ConversationListProps) {
  const { t } = useI18n();

  if (isLoading) {
    return (
      <div className={cn("space-y-2 p-2", className)}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-12 bg-background/50 border-2 border-border rounded-base animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className={cn("flex items-center justify-center h-32", className)}>
        {!isCollapsed && (
          <div className="text-center text-foreground/60">
            <div className="text-sm font-base">
              {t("sidebar.noConversations")}
            </div>
            <div className="text-xs">{t("sidebar.startNewChat")}</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-1 pb-4 w-full overflow-hidden", className)}>
      {conversations
        .filter((conversation) => conversation.id) // Filter out conversations without valid IDs
        .map((conversation) => (
          <ConversationItem
            key={conversation.id}
            conversation={conversation}
            isActive={conversation.id === activeConversationId}
            onSelect={() => onConversationSelect(conversation.id)}
            onDelete={() => onConversationDelete(conversation.id)}
            onRename={
              onConversationRename
                ? (newTitle) => onConversationRename(conversation.id, newTitle)
                : undefined
            }
            isCollapsed={isCollapsed}
          />
        ))}
    </div>
  );
}
