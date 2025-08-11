import { ConversationDTO } from "./conversation.dto";

export interface CreateConversationRequest {
  title?: string;
}

export interface CreateConversationResponse {
  conversation: ConversationDTO;
}

export interface GetConversationsRequest {
  // No parameters needed for getting all conversations - using object type for future extensibility
  [key: string]: never;
}

export interface GetConversationsResponse {
  conversations: ConversationDTO[];
}

export interface DeleteConversationRequest {
  conversationId: string;
}

export interface DeleteConversationResponse {
  success: boolean;
}
