import { ConversationDTO } from './conversation.dto'

export interface CreateConversationRequest {
  title?: string
}

export interface CreateConversationResponse {
  conversation: ConversationDTO
}

export interface GetConversationsRequest {
  // No parameters needed for getting all conversations
}

export interface GetConversationsResponse {
  conversations: ConversationDTO[]
}

export interface DeleteConversationRequest {
  conversationId: string
}

export interface DeleteConversationResponse {
  success: boolean
}