import { ConversationRepository } from '../../domain/repositories/conversation-repository'
import { Conversation } from '../../domain/entities/conversation'
import { CreateConversationRequest, CreateConversationResponse } from '../dtos/conversation-management.dto'
import { ConversationMapper } from '../mappers/conversation.mapper'

export class CreateConversationUseCase {
  constructor(
    private readonly conversationRepository: ConversationRepository
  ) {}

  async execute(request: CreateConversationRequest = {}): Promise<CreateConversationResponse> {
    try {
      // Create new conversation with provided title or default
      const conversation = request.title && request.title.trim().length > 0
        ? Conversation.create(request.title.trim())
        : Conversation.createWithDefaultTitle()

      // Save the conversation
      await this.conversationRepository.save(conversation)

      // Return response
      return {
        conversation: ConversationMapper.toDTO(conversation)
      }
    } catch (error) {
      throw this.handleError(error, request)
    }
  }

  private handleError(error: unknown, request: CreateConversationRequest): Error {
    if (error instanceof Error) {
      // Log error for debugging (in a real app, use proper logging)
      console.error('CreateConversationUseCase error:', {
        message: error.message,
        title: request.title || 'default'
      })

      // Return user-friendly error messages
      if (error.message.includes('title cannot be empty')) {
        return new Error('Conversation title cannot be empty')
      }

      return new Error('Failed to create conversation. Please try again.')
    }

    return new Error('Failed to create conversation. Please try again.')
  }
}