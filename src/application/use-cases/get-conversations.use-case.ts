import { ConversationRepository } from "../../domain/repositories/conversation-repository";
import { GetConversationsResponse } from "../dtos/conversation-management.dto";
import { ConversationMapper } from "../mappers/conversation.mapper";

export class GetConversationsUseCase {
  constructor(
    private readonly conversationRepository: ConversationRepository
  ) {}

  async execute(): Promise<GetConversationsResponse> {
    try {
      // Get all conversations from repository
      const conversations = await this.conversationRepository.findAll();

      // Sort conversations by updatedAt in descending order (most recent first)
      const sortedConversations = conversations.sort(
        (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
      );

      // Return response
      return {
        conversations: ConversationMapper.toDTOArray(sortedConversations),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private handleError(error: unknown): Error {
    if (error instanceof Error) {
      // Log error for debugging (in a real app, use proper logging)
      console.error("GetConversationsUseCase error:", {
        message: error.message,
      });

      return new Error("Failed to retrieve conversations. Please try again.");
    }

    return new Error("Failed to retrieve conversations. Please try again.");
  }
}
