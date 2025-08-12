"use client";
import React, { useState, useEffect, useCallback } from "react";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import { Sidebar } from "../sidebar";
import { UserProfileButton } from "../common";
import { SettingsDropdown } from "../common/settings-dropdown";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useUISettings } from "../../stores/chat-settings.store";
import { useI18n } from "@/src/lib/i18n";

// Types for the chat data
interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: string;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
  messageCount?: number;
}

interface ChatData {
  activeConversationId: string | null;
  activeConversation: Conversation | null;
  conversations: Conversation[];
  isLoadingConversations: boolean;
  conversationsError: string | null;
  error: string | null;
  setActiveConversation: (id: string) => void;
  sendMessage: (content: string) => Promise<boolean>;
  sendAudioMessage?: (
    audioBlob: Blob,
    audioDuration: number
  ) => Promise<boolean>;
  isSendingMessage: boolean;
  sendMessageError: string | null;
  createNewConversation: () => Promise<string | null>;
  isCreatingConversation: boolean;
  deleteConversation: (id: string) => Promise<boolean>;
  renameConversation?: (id: string, newTitle: string) => Promise<boolean>;
  clearAllErrors: () => void;
}

interface ConvexChatInterfaceProps {
  className?: string;
  chatData: ChatData;
}

export function ConvexChatInterface({
  className,
  chatData,
}: ConvexChatInterfaceProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { sidebarCollapsed, setSidebarCollapsed } = useUISettings();
  const { t } = useI18n();
  const {
    activeConversationId,
    activeConversation,
    conversations,
    isLoadingConversations,
    conversationsError,
    error,
    setActiveConversation,
    sendMessage,
    isSendingMessage,
    sendMessageError,
    createNewConversation,
    isCreatingConversation,
    deleteConversation,
    renameConversation,
    clearAllErrors,
  } = chatData;

  // Handle mobile responsiveness
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = window.innerWidth < 768; // Changed back to 768 for proper mobile detection
      setIsMobile(isMobileDevice);
      if (isMobileDevice) {
        setSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Handle errors
  useEffect(() => {
    if (conversationsError) {
      toast.error(conversationsError);
    }
    if (sendMessageError) {
      toast.error(sendMessageError);
    }
    // Handle conversation not found - redirect to chat home
    if (error && error.includes("Conversation not found")) {
      toast.error(t("errors.conversationNotFound"));
      window.location.href = "/chat"; // Use window.location for immediate redirect
    }
  }, [conversationsError, sendMessageError, error, t]);

  const handleSendMessage = async (content: string) => {
    const success = await sendMessage(content);
    if (!success) {
      toast.error(t("errors.failedToSendMessage"));
    }
  };

  const handleSendAudio = async (audioBlob: Blob, audioDuration: number) => {
    if (chatData.sendAudioMessage) {
      const success = await chatData.sendAudioMessage(audioBlob, audioDuration);
      if (!success) {
        toast.error(t("errors.failedToSendAudioMessage"));
      }
    } else {
      toast.error(t("errors.audioMessagingNotSupported"));
    }
  };

  // Keyboard shortcuts for accessibility
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ctrl/Cmd + B toggles sidebar
      const isToggle =
        (e.ctrlKey || e.metaKey) && (e.key === "b" || e.key === "B");
      if (isToggle) {
        e.preventDefault();
        setSidebarOpen((prev) => !prev);
        return;
      }
      // Escape closes sidebar on mobile overlays
      if (e.key === "Escape" && isMobile && sidebarOpen) {
        e.preventDefault();
        setSidebarOpen(false);
      }
    },
    [isMobile, sidebarOpen]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleConversationSelect = (conversationId: string) => {
    setActiveConversation(conversationId);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const handleNewConversation = async (): Promise<string | null> => {
    // Check if there's already an active conversation with no messages
    if (activeConversation && activeConversation.messages.length === 0) {
      // Don't create a new conversation, just stay in the current empty one
      if (isMobile) {
        setSidebarOpen(false);
      }
      return activeConversation.id;
    }

    const conversationId = await createNewConversation();
    if (!conversationId) {
      toast.error(t("errors.failedToCreateConversation"));
      return null;
    }
    if (isMobile) {
      setSidebarOpen(false);
    }
    return conversationId;
  };

  return (
    <div
      className={cn(
        "flex h-screen w-full bg-background overflow-hidden",
        className
      )}
    >
      {/* Sidebar */}
      {isMobile ? (
        <>
          {/* Mobile overlay backdrop */}
          <div
            className={cn(
              "fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ease-in-out",
              sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          {/* Mobile sidebar */}
          <div
            className={cn(
              "fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] shadow-lg flex-shrink-0 will-change-transform",
              "transform transition-transform duration-300 ease-in-out",
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}
            id="sidebar"
            role="complementary"
            aria-label={t("navigation.conversationsSidebar")}
            style={{
              // Ensure it's completely off-screen when closed
              transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
            }}
          >
            <Sidebar
              activeConversationId={activeConversationId}
              onConversationSelect={handleConversationSelect}
              conversations={conversations}
              isLoading={isLoadingConversations}
              onNewConversation={handleNewConversation}
              onDeleteConversation={deleteConversation}
              onRenameConversation={renameConversation}
              isCreatingConversation={isCreatingConversation}
              className="h-full"
              isMobile={isMobile}
              onClose={() => setSidebarOpen(false)}
            />
          </div>
        </>
      ) : (
        <div
          className="flex-shrink-0"
          id="sidebar"
          role="complementary"
          aria-label={t("navigation.conversationsSidebar")}
        >
          <Sidebar
            activeConversationId={activeConversationId}
            onConversationSelect={handleConversationSelect}
            conversations={conversations}
            isLoading={isLoadingConversations}
            onNewConversation={handleNewConversation}
            onDeleteConversation={deleteConversation}
            onRenameConversation={renameConversation}
            isCreatingConversation={isCreatingConversation}
            className="h-full"
            isMobile={isMobile}
            onClose={() => setSidebarOpen(false)}
          />
        </div>
      )}

      {/* Main Chat Area */}
      <div
        className="flex-1 flex flex-col min-w-0 w-full"
        role="main"
        aria-label={t("navigation.chatMainContent")}
      >
        {/* Chat Header */}
        <div className="flex items-center justify-between p-3 md:p-4 py-5 border-b-2 border-border bg-background flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1 overflow-hidden py-1">
            {((isMobile && !sidebarOpen) ||
              (!isMobile && sidebarCollapsed)) && (
              <Button
                onClick={() => {
                  if (isMobile) {
                    setSidebarOpen(true);
                  } else {
                    setSidebarCollapsed(false);
                  }
                }}
                className="flex-shrink-0"
                aria-label={t("navigation.openSidebar")}
                aria-controls="sidebar"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </Button>
            )}

            <div className="min-w-0 flex-1 overflow-hidden">
              <h1 className="text-base md:text-lg font-heading text-foreground truncate">
                {activeConversation?.title || "NatGPT Chat"}
              </h1>
              {activeConversation && (
                <p className="text-xs text-foreground/60 font-base hidden sm:block">
                  {activeConversation.messages.length} message
                  {activeConversation.messages.length !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>

          {/* Right side actions - clean and spaced */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <Button
              onClick={handleNewConversation}
              disabled={isCreatingConversation}
              aria-label={t("navigation.startNewConversation")}
              className="hidden sm:flex"
            >
              {isCreatingConversation ? (
                <span className="inline-block animate-spin">⟳</span>
              ) : (
                t("chat.newChat")
              )}
            </Button>

            {/* Settings and Profile with better spacing */}
            <div className="flex items-center gap-3">
              <SettingsDropdown />
              <UserProfileButton />
            </div>
          </div>
        </div>

        {/* Inline error banner for accessibility */}
        {(conversationsError || sendMessageError) && (
          <div
            role="alert"
            aria-live="polite"
            className="m-2 sm:m-4 p-3 rounded-base border-2 border-border bg-secondary-background text-foreground/90"
          >
            <div className="flex items-start sm:items-center justify-between gap-3 flex-col sm:flex-row">
              <span className="text-sm flex-1">
                {conversationsError || sendMessageError}
              </span>
              <Button
                className="px-2 py-1 text-xs font-base bg-main text-main-foreground border-2 border-border rounded-base hover:shadow-shadow touch-manipulation flex-shrink-0"
                onClick={clearAllErrors}
                aria-label={t("navigation.clearError")}
              >
                Dismiss
              </Button>
            </div>
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-hidden w-full">
          <MessageList
            messages={activeConversation?.messages || []}
            isLoading={isSendingMessage}
            className="h-full w-full"
          />
        </div>

        {/* Message Input */}
        <div className="flex-shrink-0 w-full">
          <MessageInput
            onSendMessage={handleSendMessage}
            onSendAudio={handleSendAudio}
            disabled={isSendingMessage || isLoadingConversations}
            placeholder={
              isLoadingConversations
                ? t("chat.loadingConversations")
                : t("chat.typeYourMessage")
            }
          />
        </div>
      </div>
    </div>
  );
}
