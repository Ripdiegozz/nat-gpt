import { useState, useCallback, useEffect } from "react";
import { useSendMessage } from "./use-send-message";
import { useConversations } from "./use-conversations";
import { useCreateConversation } from "./use-create-conversation";
import { ConversationDTO } from "../../application/dtos/conversation.dto";
import { useSelectedModel } from "../stores/chat-settings.store";

interface UseChatState {
  activeConversationId: string | null;
  activeConversation: ConversationDTO | null;
}

interface UseChatReturn extends UseChatState {
  // Conversation management
  conversations: ConversationDTO[];
  isLoadingConversations: boolean;
  conversationsError: string | null;
  refreshConversations: () => Promise<void>;

  // Active conversation
  setActiveConversation: (conversationId: string | null) => void;

  // Message sending
  sendMessage: (content: string) => Promise<boolean>;
  isSendingMessage: boolean;
  sendMessageError: string | null;

  // Conversation creation
  createNewConversation: (title?: string) => Promise<boolean>;
  isCreatingConversation: boolean;
  createConversationError: string | null;

  // Conversation deletion
  deleteConversation: (conversationId: string) => Promise<boolean>;
  isDeletingConversation: boolean;

  // Error handling
  clearAllErrors: () => void;
}

export function useChat(): UseChatReturn {
  const [state, setState] = useState<UseChatState>({
    activeConversationId: null,
    activeConversation: null,
  });

  const { selectedModel } = useSelectedModel();

  // Use individual hooks
  const {
    sendMessage: baseSendMessage,
    isLoading: isSendingMessage,
    error: sendMessageError,
    clearError: clearSendMessageError,
  } = useSendMessage();

  const {
    conversations,
    isLoading: isLoadingConversations,
    error: conversationsError,
    refreshConversations,
    deleteConversation: baseDeleteConversation,
    isDeleting: isDeletingConversation,
    clearError: clearConversationsError,
  } = useConversations();

  const {
    createConversation: baseCreateConversation,
    isLoading: isCreatingConversation,
    error: createConversationError,
    clearError: clearCreateConversationError,
  } = useCreateConversation();

  // Update active conversation when conversations change
  useEffect(() => {
    if (state.activeConversationId) {
      const activeConv = conversations.find(
        (conv) => conv.id === state.activeConversationId
      );
      setState((prev) => ({ ...prev, activeConversation: activeConv || null }));
    }
  }, [conversations, state.activeConversationId]);

  const setActiveConversation = useCallback(
    (conversationId: string | null) => {
      const activeConv = conversationId
        ? conversations.find((conv) => conv.id === conversationId) || null
        : null;

      setState({
        activeConversationId: conversationId,
        activeConversation: activeConv,
      });
    },
    [conversations]
  );

  const sendMessage = useCallback(
    async (content: string): Promise<boolean> => {
      if (!state.activeConversationId) {
        // Create a new conversation if none is active
        const newConvResponse = await baseCreateConversation();
        if (!newConvResponse) return false;

        const newConv = newConvResponse.conversation;
        setState((prev) => ({
          ...prev,
          activeConversationId: newConv.id,
          activeConversation: newConv,
        }));

        // Refresh conversations to get the new one
        await refreshConversations();

        // Send message to the new conversation
        const response = await baseSendMessage(
          newConv.id,
          content,
          selectedModel
        );
        if (response) {
          await refreshConversations();
          return true;
        }
        return false;
      }

      const response = await baseSendMessage(
        state.activeConversationId,
        content,
        selectedModel
      );
      if (response) {
        await refreshConversations();
        return true;
      }
      return false;
    },
    [
      state.activeConversationId,
      baseSendMessage,
      baseCreateConversation,
      refreshConversations,
      selectedModel,
    ]
  );

  const createNewConversation = useCallback(
    async (title?: string): Promise<boolean> => {
      const newConvResponse = await baseCreateConversation(title);
      if (newConvResponse) {
        const newConv = newConvResponse.conversation;
        await refreshConversations();
        setState({
          activeConversationId: newConv.id,
          activeConversation: newConv,
        });
        return true;
      }
      return false;
    },
    [baseCreateConversation, refreshConversations]
  );

  const deleteConversation = useCallback(
    async (conversationId: string): Promise<boolean> => {
      const success = await baseDeleteConversation(conversationId);

      if (success && state.activeConversationId === conversationId) {
        // If we deleted the active conversation, clear the active state
        setState({
          activeConversationId: null,
          activeConversation: null,
        });
      }

      return success;
    },
    [baseDeleteConversation, state.activeConversationId]
  );

  const clearAllErrors = useCallback(() => {
    clearSendMessageError();
    clearConversationsError();
    clearCreateConversationError();
  }, [
    clearSendMessageError,
    clearConversationsError,
    clearCreateConversationError,
  ]);

  return {
    // State
    ...state,

    // Conversations
    conversations,
    isLoadingConversations,
    conversationsError,
    refreshConversations,

    // Active conversation
    setActiveConversation,

    // Message sending
    sendMessage,
    isSendingMessage,
    sendMessageError,

    // Conversation creation
    createNewConversation,
    isCreatingConversation,
    createConversationError,

    // Conversation deletion
    deleteConversation,
    isDeletingConversation,

    // Error handling
    clearAllErrors,
  };
}
