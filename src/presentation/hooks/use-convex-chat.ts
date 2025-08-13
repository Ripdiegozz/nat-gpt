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
import { useLanguageSettings } from "../stores/language-settings.store";

export function useConvexChat() {
  const [activeConversationId, setActiveConversationId] =
    useState<Id<"conversations"> | null>(null);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const { convexUser } = useConvexUser();
  const { selectedModel } = useSelectedModel();
  const { transcriptionLanguage, getTranscriptionCode } = useLanguageSettings();

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
  const { conversation: activeConversation, error: conversationError } =
    useConversation(activeConversationId || undefined);

  // Messages for active conversation
  const {
    messages: convexMessages,
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
  const error = conversationsError || messagesError || conversationError;
  const clearAllErrors = useCallback(() => {
    clearConversationsError();
    clearMessagesError();
  }, [clearConversationsError, clearMessagesError]);

  // Send audio message with transcription and AI response
  const sendAudioMessage = useCallback(
    async (
      audioBlob: Blob
    ): Promise<{
      success: boolean;
      conversationId?: string;
      isNewConversation?: boolean;
    }> => {
      try {
        // Check if user is signed in
        if (!convexUser?.clerkId) {
          throw new Error("User not signed in");
        }

        // First, transcribe the audio
        console.log("🎤 [CLIENT] Preparing audio for transcription:", {
          blobSize: audioBlob.size,
          blobType: audioBlob.type,
          sizeInMB: (audioBlob.size / 1024 / 1024).toFixed(2),
        });

        const formData = new FormData();
        formData.append("audio", audioBlob, "recording.webm");

        // Add selected language for transcription
        const languageCode = getTranscriptionCode(transcriptionLanguage);
        formData.append("language", languageCode);
        console.log("🎤 [CLIENT] Using transcription language:", languageCode);

        console.log("🎤 [CLIENT] Sending transcription request...");
        const transcribeResponse = await fetch("/api/transcribe", {
          method: "POST",
          body: formData,
        });

        console.log("🎤 [CLIENT] Transcription response:", {
          status: transcribeResponse.status,
          statusText: transcribeResponse.statusText,
          ok: transcribeResponse.ok,
        });

        if (!transcribeResponse.ok) {
          const errorData = await transcribeResponse.json().catch(() => ({}));
          console.error("🎤 [CLIENT] Transcription error response:", errorData);
          throw new Error(errorData.error || "Transcription failed");
        }

        const transcriptionResult = await transcribeResponse.json();
        console.log("🎤 [CLIENT] Transcription result:", {
          hasText: !!transcriptionResult.text,
          textLength: transcriptionResult.text?.length || 0,
          language: transcriptionResult.language,
          duration: transcriptionResult.duration,
        });

        const { text: transcribedText } = transcriptionResult;

        if (!transcribedText?.trim()) {
          throw new Error("No text was transcribed from the audio");
        }

        // Note: Audio URL creation removed for now as we're not persisting audio

        let conversationId = activeConversationId;
        let isNewConversation = false;

        // If no active conversation, create a new one
        if (!conversationId) {
          const title =
            transcribedText.length > 50
              ? transcribedText.substring(0, 50) + "..."
              : transcribedText;
          conversationId = await createNewConversation(title);
          setActiveConversationId(conversationId);
          isNewConversation = true;
        } else {
          // Check if the active conversation is empty (should generate title)
          const currentMessages =
            ConvexMessageAdapter.toDomainMessages(convexMessages);
          if (currentMessages.length === 0) {
            isNewConversation = true;
          }
        }

        // Add user message with transcribed text
        // Note: Audio data is handled client-side only for now
        await addMessage({
          conversationId,
          clerkUserId: convexUser.clerkId,
          role: "user",
          content: `🎤 ${transcribedText}`, // Add audio indicator
        });

        // NOW set loading state after user message is added
        setIsSendingMessage(true);

        // Get AI response using context
        const contextMessages = isNewConversation
          ? []
          : ConvexMessageAdapter.toAIServiceContext(convexMessages);

        const aiResponse = await aiService.generateResponse(
          transcribedText,
          contextMessages,
          {
            model: selectedModel,
            isFirstMessage: isNewConversation,
            fromAudio: true,
          }
        );

        // Add AI response
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

        // Generate and update title for new conversations
        if (isNewConversation) {
          try {
            const generatedTitle = await aiService.generateTitle(
              transcribedText,
              selectedModel
            );
            await updateConversationTitle(conversationId, generatedTitle);
          } catch (titleError) {
            console.warn("Failed to generate conversation title:", titleError);
          }
        }

        return {
          success: true,
          conversationId: conversationId,
          isNewConversation,
        };
      } catch (err) {
        console.error("Failed to send audio message:", err);
        return { success: false };
      } finally {
        setIsSendingMessage(false);
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
      updateConversationTitle,
    ]
  );

  // Send message with AI response
  const sendMessage = useCallback(
    async (
      content: string,
      fromAudio = false
    ): Promise<{
      success: boolean;
      conversationId?: string;
      isNewConversation?: boolean;
    }> => {
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

          // Note: The navigation will be handled by the calling component
          // This is important for SSR routing pattern
        } else {
          // Check if the active conversation is empty (should generate title)
          const currentMessages =
            ConvexMessageAdapter.toDomainMessages(convexMessages);
          if (currentMessages.length === 0) {
            isNewConversation = true;
          }
        }

        // Add user message using direct mutation
        await addMessage({
          conversationId,
          clerkUserId: convexUser.clerkId,
          role: "user",
          content,
        });

        // NOW set loading state after user message is added
        setIsSendingMessage(true);

        // Get AI response using context (empty for new conversations)
        const contextMessages = isNewConversation
          ? []
          : ConvexMessageAdapter.toAIServiceContext(convexMessages);

        const aiResponse = await aiService.generateResponse(
          content,
          contextMessages,
          { model: selectedModel, isFirstMessage: isNewConversation, fromAudio }
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

        // Generate and update title for new conversations
        if (isNewConversation) {
          try {
            // Use the title that was extracted from the combined response
            const generatedTitle = await aiService.generateTitle(
              content,
              selectedModel
            );
            await updateConversationTitle(conversationId, generatedTitle);
          } catch (titleError) {
            console.warn("Failed to generate conversation title:", titleError);
            // Title generation failure shouldn't break the conversation flow
          }
        }

        return {
          success: true,
          conversationId: conversationId,
          isNewConversation,
        };
      } catch (err) {
        console.error("Failed to send message:", err);
        return { success: false };
      } finally {
        setIsSendingMessage(false);
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
    async (title?: string): Promise<string | null> => {
      try {
        const conversationId = await createNewConversation(title);
        setActiveConversationId(conversationId);
        return conversationId;
      } catch (err) {
        console.error("Failed to create conversation:", err);
        return null;
      }
    },
    [createNewConversation]
  );

  // Delete conversation and clear if active (with string ID wrapper)
  const deleteConversationWrapper = useCallback(
    async (conversationId: string): Promise<boolean> => {
      try {
        await deleteConversationById(conversationId as Id<"conversations">);
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

  // Update conversation title wrapper (with string ID wrapper)
  const updateConversationTitleWrapper = useCallback(
    async (conversationId: string, title: string): Promise<void> => {
      try {
        await updateConversationTitle(
          conversationId as Id<"conversations">,
          title
        );
      } catch (err) {
        console.error("Failed to update conversation title:", err);
        throw err;
      }
    },
    [updateConversationTitle]
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
    sendAudioMessage,
    createNewConversation: createAndSetConversation,
    deleteConversation: deleteConversationWrapper,
    updateConversationTitle: updateConversationTitleWrapper,
    archiveConversation,
    shareConversation,

    // Message actions
    editMessage,
    deleteMessage,
    addReaction,
    removeReaction,

    // Loading states
    isSendingMessage,
    isCreatingConversation: isCreating,

    // Error handling
    error,
    conversationsError,
    sendMessageError: messagesError,
    clearAllErrors,
  };
}
