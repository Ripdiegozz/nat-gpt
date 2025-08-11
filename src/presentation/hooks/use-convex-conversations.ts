"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export function useConversations() {
  const { user } = useUser();

  const conversations = useQuery(
    api.conversations.getUserConversations,
    user?.id ? { clerkUserId: user.id } : "skip"
  );

  const sharedConversations = useQuery(
    api.conversations.getSharedConversations,
    user?.id ? { clerkUserId: user.id } : "skip"
  );

  const createConversation = useMutation(api.conversations.createConversation);
  const updateTitle = useMutation(api.conversations.updateConversationTitle);
  const archiveConversation = useMutation(
    api.conversations.archiveConversation
  );
  const deleteConversation = useMutation(api.conversations.deleteConversation);
  const shareConversation = useMutation(api.conversations.shareConversation);

  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createNewConversation = async (title?: string) => {
    if (!user?.id) throw new Error("User not signed in");

    setIsCreating(true);
    setError(null);

    try {
      const conversationId = await createConversation({
        title: title || "New Conversation",
        clerkUserId: user.id,
        metadata: {
          model: "gpt-4o-mini",
          temperature: 0.7,
          maxTokens: 8192,
          tags: [],
        },
      });

      return conversationId;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create conversation";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const updateConversationTitle = async (
    conversationId: Id<"conversations">,
    title: string
  ) => {
    if (!user?.id) throw new Error("User not signed in");

    setError(null);
    try {
      await updateTitle({
        conversationId,
        title,
        clerkUserId: user.id,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update title";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const archiveConversationById = async (
    conversationId: Id<"conversations">
  ) => {
    if (!user?.id) throw new Error("User not signed in");

    setError(null);
    try {
      await archiveConversation({
        conversationId,
        clerkUserId: user.id,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to archive conversation";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteConversationById = async (
    conversationId: Id<"conversations">
  ) => {
    if (!user?.id) throw new Error("User not signed in");

    setError(null);
    try {
      await deleteConversation({
        conversationId,
        clerkUserId: user.id,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete conversation";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const shareConversationWithUser = async (
    conversationId: Id<"conversations">,
    email: string,
    permissions: {
      canRead: boolean;
      canWrite: boolean;
      canShare: boolean;
      canDelete: boolean;
    },
    expiresAt?: number
  ) => {
    if (!user?.id) throw new Error("User not signed in");

    setError(null);
    try {
      await shareConversation({
        conversationId,
        sharedWithEmail: email,
        clerkUserId: user.id,
        permissions,
        expiresAt,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to share conversation";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  return {
    conversations: conversations || [],
    sharedConversations: sharedConversations || [],
    isLoading: conversations === undefined,
    isCreating,
    error,
    createNewConversation,
    updateConversationTitle,
    archiveConversation: archiveConversationById,
    deleteConversation: deleteConversationById,
    shareConversation: shareConversationWithUser,
    clearError: () => setError(null),
  };
}

export function useConversation(conversationId?: Id<"conversations">) {
  const { user } = useUser();
  const router = useRouter();
  const [conversationError, setConversationError] = useState<string | null>(
    null
  );

  const conversation = useQuery(
    api.conversations.getConversationWithMessages,
    conversationId && user?.id
      ? { conversationId, clerkUserId: user.id }
      : "skip"
  );

  // Handle conversation errors and redirect if deleted
  useEffect(() => {
    if (conversation === null && conversationId) {
      // Conversation was not found (likely deleted), redirect to chat
      console.log("Conversation not found, redirecting to /chat");
      setConversationError("Conversation not found");
      router.push("/chat");
    } else if (conversation) {
      // Conversation loaded successfully, clear any errors
      setConversationError(null);
    }
  }, [conversation, conversationId, router]);

  return {
    conversation,
    messages: conversation?.messages || [],
    isLoading: conversation === undefined && conversationId !== undefined,
    error: conversationError,
  };
}
