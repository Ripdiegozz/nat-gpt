import { ConversationRepository } from '../../domain/repositories/conversation-repository'
import { ConversationId } from '../../domain/value-objects/conversation-id'
import { DeleteConversationRequest, DeleteConversationResponse } from '../dtos/conversation-management.dto'

export class DeleteConversationUseCase {
  constructor(
    private readonly conversationRepository: ConversationRepository
  ) {}

  async execute(request: DeleteConversationRequest): Promise<DeleteConversationResponse> {
    try {
      // Validate input
      this.validateRequest(request)

      // Create conversation ID
      const conversationId = new ConversationId(request.conversationId)

      // Check if conversation exists
      const exists = await this.conversationRepository.exists(conversationId)
      if (!exists) {
        throw new Error(`Conversation with id ${request.conversationId} not found`)
      }

      // Delete the conversation
      await this.conversationRepository.delete(conversationId)

      // Return success response
      return {
        success: true
      }
    } catch (error) {
      throw this.handleError(error, request)
    }
  }

  private validateRequest(request: DeleteConversationRequest): void {
    if (!request.conversationId || request.conversationId.trim().length === 0) {
      throw new Error('Conversation ID is required')
    }
  }

  private handleError(error: unknown, request: DeleteConversationRequest): Error {
    if (error instanceof Error) {
      // Log error for debugging (in a real app, use proper logging)
      console.error('DeleteConversationUseCase error:', {
        message: error.message,
        conversationId: request.conversationId
      })

      // Return user-friendly error messages
      if (error.message.includes('not found')) {
        return new Error('The conversation could not be found or has already been deleted.')
      }

      if (error.message.includes('required')) {
        return error // Validation errors can be shown as-is
      }

      return new Error('Failed to delete conversation. Please try again.')
    }

    return new Error('Failed to delete conversation. Please try again.')
  }
}