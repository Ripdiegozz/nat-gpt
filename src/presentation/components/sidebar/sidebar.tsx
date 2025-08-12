import React from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ConversationList } from "./conversation-list";
import { useUISettings } from "../../stores/chat-settings.store";
import { cn } from "@/lib/utils";
import { Plus, X, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { MessageDTO } from "@/src/application/dtos/message.dto";
import { useI18n } from "@/src/lib/i18n";

interface ConversationData {
  id: string;
  title: string;
  messages: MessageDTO[];
  createdAt: string;
  updatedAt: string;
  messageCount?: number;
}

interface SidebarProps {
  activeConversationId: string | null;
  onConversationSelect: (conversationId: string) => void;
  conversations?: ConversationData[];
  isLoading?: boolean;
  onNewConversation?: () => Promise<string | null>;
  onDeleteConversation?: (conversationId: string) => Promise<boolean>;
  onRenameConversation?: (
    conversationId: string,
    newTitle: string
  ) => Promise<boolean>;
  isCreatingConversation?: boolean;
  className?: string;
  isMobile?: boolean;
  onClose?: () => void;
}

export function Sidebar({
  activeConversationId,
  onConversationSelect,
  conversations = [],
  isLoading = false,
  onNewConversation,
  onDeleteConversation,
  onRenameConversation,
  isCreatingConversation = false,
  className,
  isMobile = false,
  onClose,
}: SidebarProps) {
  const { t } = useI18n();
  const { sidebarCollapsed, setSidebarCollapsed } = useUISettings();
  const router = useRouter();

  // Use local state for mobile, global state for desktop
  const isCollapsed = isMobile ? false : sidebarCollapsed;

  // Conversations are already mapped in the parent components, no need to map again
  const mappedConversations = conversations.filter((conv) => conv && conv.id);

  const handleNewConversation = async () => {
    if (onNewConversation) {
      await onNewConversation();
      // Close sidebar on mobile after creating conversation
      if (isMobile && onClose) {
        onClose();
      }
      // Navigation will be handled by the parent component
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (onDeleteConversation) {
      await onDeleteConversation(conversationId);
      // If we deleted the active conversation, navigate to chat home
      if (activeConversationId === conversationId) {
        router.push("/chat");
      }
    }
  };

  const handleRenameConversation = async (
    conversationId: string,
    newTitle: string
  ) => {
    if (onRenameConversation) {
      await onRenameConversation(conversationId, newTitle);
    }
  };

  const handleConversationSelect = (conversationId: string) => {
    // First update the internal state
    onConversationSelect(conversationId);
    // Then navigate to the conversation page using SSR routing
    router.push(`/chat/${conversationId}`);
    if (isMobile && onClose) {
      onClose();
    }
  };

  const handleToggleCollapse = () => {
    if (isMobile && onClose) {
      // On mobile, close the sidebar overlay
      onClose();
    } else {
      // On desktop, toggle collapsed state in Zustand store
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-secondary-background border-r-2 border-border overflow-hidden",
        // Desktop transition for width
        !isMobile && "transition-all duration-300 ease-in-out",
        isCollapsed && !isMobile ? "w-0" : "w-80",
        className
      )}
    >
      {/* Content - only show when not collapsed */}
      <div
        className={cn(
          "flex flex-col h-full w-80",
          // Desktop transition for opacity
          !isMobile && "transition-opacity duration-300 ease-in-out",
          isCollapsed && !isMobile
            ? "opacity-0 pointer-events-none"
            : "opacity-100"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-5 border-b-2 border-border">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-5 w-5 text-foreground shrink-0" />
            <h2 className="text-lg font-heading text-foreground">
              {t("sidebar.conversations")}
            </h2>
          </div>
          <Button
            variant="neutral"
            size="icon"
            onClick={handleToggleCollapse}
            className="shrink-0"
            aria-label={
              isMobile
                ? t("sidebar.closeSidebar")
                : t("sidebar.collapseSidebar")
            }
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* New Conversation Button */}
        <div className="p-4">
          <Button
            onClick={handleNewConversation}
            disabled={isCreatingConversation}
            className="w-full justify-center"
            aria-label={t("chat.newChat")}
          >
            <Plus className="h-4 w-4" />
            <span className="ml-2">
              {isCreatingConversation ? t("common.loading") : t("chat.newChat")}
            </span>
          </Button>
        </div>

        {/* Conversation List */}
        <ScrollArea className="flex-1 px-2 overflow-hidden">
          <ConversationList
            conversations={mappedConversations}
            activeConversationId={activeConversationId}
            onConversationSelect={handleConversationSelect}
            onConversationDelete={handleDeleteConversation}
            onConversationRename={handleRenameConversation}
            isLoading={isLoading}
            isCollapsed={false}
            isMobile={isMobile}
          />
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t-2 border-border">
          <div className="text-xs text-foreground/60 font-base">
            {conversations.length === 1
              ? t("sidebar.conversationCount").replace(
                  "{{count}}",
                  conversations.length.toString()
                )
              : t("sidebar.conversationCountPlural").replace(
                  "{{count}}",
                  conversations.length.toString()
                )}
          </div>
        </div>
      </div>
    </div>
  );
}
