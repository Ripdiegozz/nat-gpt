"use client";

import { useState, useCallback, useMemo } from "react";
import { useConversations, useConversation } from "./use-convex-conversations";
import { useMessages } from "./use-convex-messages";
import { useConvexUser } from "./use-convex-user";
import { Id } from "../../../convex/_generated/dataModel";
import { ClientAIServiceAdapter } from "../../infrastructure/services/client-ai-service-adapter";
import { ConvexMessageAdapter } from "../../infrastructure/adapters/convex-message-adapter";
import { useSelectedModel } from "../stores/chat-settings.store";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

export function useConvexChat() {
  const [activeConversationId, setActiveConversationId] =
    useState<Id<"conversations"> | null>(null);
  const { convexUser } = useConvexUser();
  const { selectedModel } = useSelectedModel();

  // Conversations management
  const {
    conversations,
    sharedConversations,
    isLoading: isLoadingConversations,
    isCreating,
    error: conversationsError,
    createNewConversation,
    updateConversationTitle,
    archiveConversation,
    deleteConversation: deleteConversationById,
    shareConversation,
    clearError: clearConversationsError,
  } = useConversations();

  // Active conversation
  const { conversation: activeConversation } = useConversation(
    activeConversationId || undefined
  );

  // Messages for active conversation
  const {
    messages: convexMessages,
    isSending,
    error: messagesError,
    editMessage,
    deleteMessage,
    addReaction,
    removeReaction,
    clearError: clearMessagesError,
  } = useMessages(activeConversationId || undefined);

  // AI Service
  const aiService = useMemo(() => new ClientAIServiceAdapter(), []);

  // Direct Convex mutations for message handling
  const addMessage = useMutation(api.messages.addMessage);

  // Convert Convex messages to domain messages
  const messages = ConvexMessageAdapter.toDomainMessages(convexMessages);

  // Combined error handling
  const error = conversationsError || messagesError;
  const clearAllErrors = useCallback(() => {
    clearConversationsError();
    clearMessagesError();
  }, [clearConversationsError, clearMessagesError]);

  // Send message with AI response
  const sendMessage = useCallback(
    async (content: string): Promise<boolean> => {
      try {
        // Check if user is signed in
        if (!convexUser?.clerkId) {
          throw new Error("User not signed in");
        }

        let conversationId = activeConversationId;
        let isNewConversation = false;

        // If no active conversation, create a new one
        if (!conversationId) {
          // Generate a title from the first part of the message
          const title =
            content.length > 50 ? content.substring(0, 50) + "..." : content;
          conversationId = await createNewConversation(title);
          setActiveConversationId(conversationId);
          isNewConversation = true;
        }

        // Add user message using direct mutation
        await addMessage({
          conversationId,
          clerkUserId: convexUser.clerkId,
          role: "user",
          content,
        });

        // Get AI response using context (empty for new conversations)
        const contextMessages = isNewConversation
          ? []
          : ConvexMessageAdapter.toAIServiceContext(convexMessages);

        const aiResponse = await aiService.generateResponse(
          content,
          contextMessages,
          { model: selectedModel }
        );

        // Add AI response using direct mutation
        await addMessage({
          conversationId,
          clerkUserId: convexUser.clerkId,
          role: "assistant",
          content: aiResponse,
          metadata: {
            model: selectedModel,
            tokens: aiService.estimateTokens(aiResponse),
          },
        });

        return true;
      } catch (err) {
        console.error("Failed to send message:", err);
        return false;
      }
    },
    [
      activeConversationId,
      convexUser?.clerkId,
      addMessage,
      aiService,
      convexMessages,
      createNewConversation,
      selectedModel,
    ]
  );

  // Create new conversation and set as active
  const createAndSetConversation = useCallback(
    async (title?: string): Promise<boolean> => {
      try {
        const conversationId = await createNewConversation(title);
        setActiveConversationId(conversationId);
        return true;
      } catch (err) {
        console.error("Failed to create conversation:", err);
        return false;
      }
    },
    [createNewConversation]
  );

  // Delete conversation and clear if active
  const deleteConversation = useCallback(
    async (conversationId: Id<"conversations">): Promise<boolean> => {
      try {
        await deleteConversationById(conversationId);
        if (activeConversationId === conversationId) {
          setActiveConversationId(null);
        }
        return true;
      } catch (err) {
        console.error("Failed to delete conversation:", err);
        return false;
      }
    },
    [deleteConversationById, activeConversationId]
  );

  // Set active conversation
  const setActiveConversation = useCallback((conversationId: string | null) => {
    setActiveConversationId(conversationId as Id<"conversations"> | null);
  }, []);

  return {
    // User
    user: convexUser,

    // Active conversation state
    activeConversationId,
    activeConversation,
    setActiveConversation,

    // Conversations
    conversations: [...conversations, ...sharedConversations],
    isLoadingConversations,

    // Messages
    messages,

    // Actions
    sendMessage,
    createNewConversation: createAndSetConversation,
    deleteConversation,
    updateConversationTitle,
    archiveConversation,
    shareConversation,

    // Message actions
    editMessage,
    deleteMessage,
    addReaction,
    removeReaction,

    // Loading states
    isSendingMessage: isSending,
    isCreatingConversation: isCreating,

    // Error handling
    error,
    conversationsError,
    sendMessageError: messagesError,
    clearAllErrors,
  };
}
