import { useState, useCallback, useMemo } from "react";
import { LocalStorageConversationRepository } from "../../infrastructure/repositories/local-storage-conversation-repository";
import { ClientAIServiceAdapter } from "../../infrastructure/services/client-ai-service-adapter";
import { SendMessageUseCase } from "../../application/use-cases/send-message.use-case";
import { toast } from "sonner";

interface UseSendMessageState {
  isLoading: boolean;
  error: string | null;
}

export function useSendMessage() {
  const [state, setState] = useState<UseSendMessageState>({
    isLoading: false,
    error: null,
  });

  // Build dependencies locally (no DI)
  const repo = useMemo(() => new LocalStorageConversationRepository(), []);
  const ai = useMemo(() => new ClientAIServiceAdapter(), []);
  const useCase = useMemo(() => new SendMessageUseCase(repo, ai), [repo, ai]);

  const sendMessage = useCallback(
    async (conversationId: string, content: string, model?: string) => {
      if (!content.trim()) {
        toast.error("Message cannot be empty");
        return null;
      }

      setState({ isLoading: true, error: null });

      try {
        const result = await useCase.execute({
          conversationId,
          content,
          model,
        });
        setState({ isLoading: false, error: null });
        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to send message";
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
    sendMessage,
    isLoading: state.isLoading,
    error: state.error,
    clearError,
  };
}
