import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ConversationList } from "./conversation-list";
import { useUISettings } from "../../stores/chat-settings.store";
import { cn } from "@/lib/utils";
import { Plus, Menu, X, MessageSquare } from "lucide-react";

interface ConversationData {
  _id: string;
  title: string;
  updatedAt: number;
  messageCount?: number;
}

interface SidebarProps {
  activeConversationId: string | null;
  onConversationSelect: (conversationId: string) => void;
  conversations?: ConversationData[];
  isLoading?: boolean;
  onNewConversation?: () => Promise<boolean>;
  onDeleteConversation?: (conversationId: string) => Promise<boolean>;
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
  isCreatingConversation = false,
  className,
  isMobile = false,
  onClose,
}: SidebarProps) {
  const { sidebarCollapsed, setSidebarCollapsed } = useUISettings();

  // Use local state for mobile, global state for desktop
  const isCollapsed = isMobile ? false : sidebarCollapsed;

  const handleNewConversation = async () => {
    if (onNewConversation) {
      await onNewConversation();
      // Close sidebar on mobile after creating conversation
      if (isMobile && onClose) {
        onClose();
      }
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (onDeleteConversation) {
      await onDeleteConversation(conversationId);
      // If we deleted the active conversation, clear selection
      if (activeConversationId === conversationId) {
        onConversationSelect("");
      }
    }
  };

  const handleConversationSelect = (conversationId: string) => {
    onConversationSelect(conversationId);
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
        "flex flex-col h-full bg-secondary-background transition-all duration-300 border-r-2 border-border",
        isCollapsed && !isMobile ? "w-16" : "w-80",
        className
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center border-b-2 border-border",
          isCollapsed && !isMobile
            ? "justify-center p-2"
            : "justify-between p-4"
        )}
      >
        {isCollapsed && !isMobile ? (
          <Button
            variant="neutral"
            size="icon"
            onClick={handleToggleCollapse}
            className="shrink-0"
            aria-label="Expand sidebar"
          >
            <Menu className="h-5 w-5" />
          </Button>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-foreground shrink-0" />
              <h2 className="text-lg font-heading text-foreground">
                Conversations
              </h2>
            </div>
            <Button
              variant="neutral"
              size="icon"
              onClick={handleToggleCollapse}
              className="shrink-0"
              aria-label={isMobile ? "Close sidebar" : "Collapse sidebar"}
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {/* New Conversation Button */}
      <div className={cn(isCollapsed && !isMobile ? "p-2" : "p-4")}>
        <Button
          onClick={handleNewConversation}
          disabled={isCreatingConversation}
          className="w-full justify-center"
          size={isCollapsed && !isMobile ? "icon" : "default"}
          aria-label="Start new conversation"
        >
          <Plus className="h-4 w-4" />
          {!isCollapsed && (
            <span className="ml-2">
              {isCreatingConversation ? "Creating..." : "New Chat"}
            </span>
          )}
        </Button>
      </div>

      {/* Conversation List */}
      <ScrollArea className="flex-1 px-2">
        <ConversationList
          conversations={conversations.map((conv) => ({
            id: conv._id,
            title: conv.title,
            messages: [], // ConversationList no usa messages en realidad
            createdAt: new Date(conv.updatedAt).toISOString(),
            updatedAt: new Date(conv.updatedAt).toISOString(),
            messageCount: conv.messageCount || 0,
          }))}
          activeConversationId={activeConversationId}
          onConversationSelect={handleConversationSelect}
          onConversationDelete={handleDeleteConversation}
          isLoading={isLoading}
          isCollapsed={isCollapsed && !isMobile}
          isMobile={isMobile}
        />
      </ScrollArea>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t-2 border-border">
          <div className="text-xs text-foreground/60 font-base">
            {conversations.length} conversation
            {conversations.length !== 1 ? "s" : ""}
          </div>
        </div>
      )}
    </div>
  );
}
