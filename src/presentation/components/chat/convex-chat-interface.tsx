"use client";
import React, { useState, useEffect, useCallback } from "react";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import { Sidebar } from "../sidebar";
import { UserProfileButton, ModelSelector, ThemeSelector } from "../common";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Types for the chat data
interface ChatData {
  activeConversationId: string | null;
  activeConversation: any;
  conversations: any[];
  isLoadingConversations: boolean;
  conversationsError: string | null;
  setActiveConversation: (id: string) => void;
  sendMessage: (content: string) => Promise<boolean>;
  isSendingMessage: boolean;
  sendMessageError: string | null;
  createNewConversation: () => Promise<boolean>;
  isCreatingConversation: boolean;
  deleteConversation: (id: string) => Promise<boolean>;
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

  const {
    activeConversationId,
    activeConversation,
    conversations,
    isLoadingConversations,
    conversationsError,
    setActiveConversation,
    sendMessage,
    isSendingMessage,
    sendMessageError,
    createNewConversation,
    isCreatingConversation,
    deleteConversation,
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
  }, [conversationsError, sendMessageError]);

  const handleSendMessage = async (content: string) => {
    const success = await sendMessage(content);
    if (!success) {
      toast.error("Failed to send message. Please try again.");
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

  const handleNewConversation = async () => {
    const success = await createNewConversation();
    if (!success) {
      toast.error("Failed to create new conversation. Please try again.");
    }
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    const success = await deleteConversation(conversationId);
    if (!success) {
      toast.error("Failed to delete conversation. Please try again.");
    }
  };

  return (
    <div
      className={cn(
        "flex h-screen w-full bg-background overflow-hidden",
        className
      )}
    >
      {/* Sidebar */}
      <div
        className={cn(
          "flex-shrink-0",
          isMobile
            ? sidebarOpen
              ? "fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] shadow-lg"
              : "w-0 overflow-hidden"
            : "" // On desktop, let sidebar control its own width
        )}
        id="sidebar"
        role="complementary"
        aria-label="Conversations sidebar"
      >
        <Sidebar
          activeConversationId={activeConversationId}
          onConversationSelect={handleConversationSelect}
          conversations={conversations}
          isLoading={isLoadingConversations}
          onNewConversation={createNewConversation}
          onDeleteConversation={deleteConversation}
          isCreatingConversation={isCreatingConversation}
          className="h-full"
          isMobile={isMobile}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-overlay z-40"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      )}

      {/* Main Chat Area */}
      <div
        className="flex-1 flex flex-col min-w-0 w-full"
        role="main"
        aria-label="Chat main content"
      >
        {/* Chat Header */}
        <div className="flex items-center justify-between p-3 md:p-4 border-b-2 border-border bg-background flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1 overflow-hidden">
            {isMobile && !sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 hover:bg-secondary-background rounded-base border-2 border-border touch-manipulation flex-shrink-0"
                aria-label="Open sidebar"
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
              </button>
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
            <button
              onClick={handleNewConversation}
              disabled={isCreatingConversation}
              className="px-3 py-2 text-sm font-base bg-main text-main-foreground border-2 border-border rounded-base hover:shadow-shadow transition-all disabled:opacity-50 touch-manipulation"
              aria-label="Start new conversation"
            >
              {isCreatingConversation ? (
                <span className="inline-block animate-spin">⟳</span>
              ) : (
                <>
                  <span className="sm:hidden">+</span>
                  <span className="hidden sm:inline">New Chat</span>
                </>
              )}
            </button>

            {/* Theme and Profile with better spacing */}
            <div className="flex items-center gap-3">
              <ThemeSelector />
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
              <button
                className="px-2 py-1 text-xs font-base bg-main text-main-foreground border-2 border-border rounded-base hover:shadow-shadow touch-manipulation flex-shrink-0"
                onClick={clearAllErrors}
                aria-label="Clear error"
              >
                Dismiss
              </button>
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
            disabled={isSendingMessage || isLoadingConversations}
            placeholder={
              isLoadingConversations
                ? "Loading conversations..."
                : "Type your message..."
            }
          />
        </div>
      </div>
    </div>
  );
}
