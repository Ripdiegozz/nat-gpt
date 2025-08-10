import { useState, useEffect, useCallback, useMemo } from "react";
import { LocalStorageConversationRepository } from "../../infrastructure/repositories/local-storage-conversation-repository";
import { GetConversationsUseCase } from "../../application/use-cases/get-conversations.use-case";
import { DeleteConversationUseCase } from "../../application/use-cases/delete-conversation.use-case";
import { ConversationDTO } from "../../application/dtos/conversation.dto";
import { toast } from "sonner";

interface UseConversationsState {
  conversations: ConversationDTO[];
  isLoading: boolean;
  error: string | null;
}

export function useConversations() {
  const [state, setState] = useState<UseConversationsState>({
    conversations: [],
    isLoading: true,
    error: null,
  });

  const repo = useMemo(() => new LocalStorageConversationRepository(), []);
  const getConversationsUseCase = useMemo(
    () => new GetConversationsUseCase(repo),
    [repo]
  );
  const deleteConversationUseCase = useMemo(
    () => new DeleteConversationUseCase(repo),
    [repo]
  );

  const loadConversations = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await getConversationsUseCase.execute();
      setState({
        conversations: response.conversations,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load conversations";
      setState({
        conversations: [],
        isLoading: false,
        error: errorMessage,
      });
      toast.error(errorMessage);
    }
  }, [getConversationsUseCase]);

  const deleteConversation = useCallback(
    async (conversationId: string): Promise<boolean> => {
      try {
        await deleteConversationUseCase.execute({ conversationId });
        setState((prev) => ({
          ...prev,
          conversations: prev.conversations.filter(
            (conv) => conv.id !== conversationId
          ),
        }));
        toast.success("Conversation deleted");
        return true;
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to delete conversation";
        toast.error(errorMessage);
        return false;
      }
    },
    [deleteConversationUseCase]
  );

  const refreshConversations = useCallback(async () => {
    await loadConversations();
  }, [loadConversations]);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    conversations: state.conversations,
    isLoading: state.isLoading,
    error: state.error,
    deleteConversation,
    refreshConversations,
    isDeleting: false, // Add this for consistency with use-chat.ts
    clearError,
  };
}
