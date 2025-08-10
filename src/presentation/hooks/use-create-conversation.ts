import { useState, useCallback, useMemo } from "react";
import { LocalStorageConversationRepository } from "../../infrastructure/repositories/local-storage-conversation-repository";
import { CreateConversationUseCase } from "../../application/use-cases/create-conversation.use-case";
import { toast } from "sonner";

interface UseCreateConversationState {
  isLoading: boolean;
  error: string | null;
}

export function useCreateConversation() {
  const [state, setState] = useState<UseCreateConversationState>({
    isLoading: false,
    error: null,
  });

  const repo = useMemo(() => new LocalStorageConversationRepository(), []);
  const useCase = useMemo(() => new CreateConversationUseCase(repo), [repo]);

  const createConversation = useCallback(
    async (title?: string) => {
      setState({ isLoading: true, error: null });

      try {
        const conversation = await useCase.execute({ title });
        setState({ isLoading: false, error: null });
        toast.success("New conversation created");
        return conversation;
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to create conversation";
        setState({ isLoading: false, error: errorMessage });
        toast.error(errorMessage);
        return null;
      }
    },
    [useCase]
  );

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    createConversation,
    isLoading: state.isLoading,
    error: state.error,
    clearError,
  };
}
