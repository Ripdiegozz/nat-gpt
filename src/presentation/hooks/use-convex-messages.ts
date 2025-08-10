"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { useState } from "react";

export function useMessages(conversationId?: Id<"conversations">) {
  const { user } = useUser();

  const messages = useQuery(
    api.messages.getMessages,
    conversationId && user?.id
      ? { conversationId, clerkUserId: user.id }
      : "skip"
  );

  const addMessage = useMutation(api.messages.addMessage);
  const editMessage = useMutation(api.messages.editMessage);
  const deleteMessage = useMutation(api.messages.deleteMessage);
  const addReaction = useMutation(api.messages.addReaction);
  const removeReaction = useMutation(api.messages.removeReaction);

  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (
    content: string,
    role: "user" | "assistant" | "system" = "user",
    metadata?: {
      model?: string;
      tokens?: number;
      finishReason?: string;
      processingTime?: number;
    }
  ) => {
    if (!user?.id || !conversationId)
      throw new Error("User not signed in or no conversation selected");

    setIsSending(true);
    setError(null);

    try {
      const messageId = await addMessage({
        conversationId,
        clerkUserId: user.id,
        role,
        content,
        metadata,
      });

      return messageId;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to send message";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  const editMessageById = async (
    messageId: Id<"messages">,
    content: string
  ) => {
    if (!user?.id) throw new Error("User not signed in");

    setError(null);
    try {
      await editMessage({
        messageId,
        content,
        clerkUserId: user.id,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to edit message";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteMessageById = async (messageId: Id<"messages">) => {
    if (!user?.id) throw new Error("User not signed in");

    setError(null);
    try {
      await deleteMessage({
        messageId,
        clerkUserId: user.id,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete message";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const addReactionToMessage = async (
    messageId: Id<"messages">,
    type: "like" | "dislike" | "heart"
  ) => {
    if (!user?.id) throw new Error("User not signed in");

    setError(null);
    try {
      await addReaction({
        messageId,
        clerkUserId: user.id,
        type,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to add reaction";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const removeReactionFromMessage = async (messageId: Id<"messages">) => {
    if (!user?.id) throw new Error("User not signed in");

    setError(null);
    try {
      await removeReaction({
        messageId,
        clerkUserId: user.id,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to remove reaction";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  return {
    messages: messages || [],
    isLoading: messages === undefined && conversationId !== undefined,
    isSending,
    error,
    sendMessage,
    editMessage: editMessageById,
    deleteMessage: deleteMessageById,
    addReaction: addReactionToMessage,
    removeReaction: removeReactionFromMessage,
    clearError: () => setError(null),
  };
}

export function useMessageStats(conversationId?: Id<"conversations">) {
  const { user } = useUser();

  const stats = useQuery(
    api.messages.getMessageStats,
    conversationId && user?.id
      ? { conversationId, clerkUserId: user.id }
      : "skip"
  );

  return {
    stats,
    isLoading: stats === undefined && conversationId !== undefined,
  };
}
