import { ConversationRepository } from "../../domain/repositories/conversation-repository";
import { AIService } from "../../domain/services/ai-service";
import { ConversationId } from "../../domain/value-objects/conversation-id";
import { Message } from "../../domain/entities/message";
import {
  SendMessageRequest,
  SendMessageResponse,
} from "../dtos/send-message.dto";
import { MessageMapper } from "../mappers/message.mapper";

export class SendMessageUseCase {
  constructor(
    private readonly conversationRepository: ConversationRepository,
    private readonly aiService: AIService
  ) {}

  async execute(request: SendMessageRequest): Promise<SendMessageResponse> {
    try {
      // Validate input
      this.validateRequest(request);

      // Get the conversation
      const conversationId = new ConversationId(request.conversationId);
      const conversation = await this.conversationRepository.findById(
        conversationId
      );

      if (!conversation) {
        throw new Error(
          `Conversation with id ${request.conversationId} not found`
        );
      }

      // Create user message
      const userMessage = Message.createUserMessage(request.content);

      // Add user message to conversation
      const conversationWithUserMessage = conversation.addMessage(userMessage);

      // Save conversation with user message
      await this.conversationRepository.save(conversationWithUserMessage);

      // Get AI response
      const aiResponseContent = await this.generateAIResponse(
        request.content,
        conversationWithUserMessage.getMessages(),
        request.model
      );

      // Create AI message
      const aiMessage = Message.createAssistantMessage(aiResponseContent);

      // Add AI message to conversation
      const finalConversation =
        conversationWithUserMessage.addMessage(aiMessage);

      // Save final conversation
      await this.conversationRepository.save(finalConversation);

      // Return response
      return {
        userMessage: MessageMapper.toDTO(userMessage),
        aiMessage: MessageMapper.toDTO(aiMessage),
        conversationId: request.conversationId,
      };
    } catch (error) {
      throw this.handleError(error, request);
    }
  }

  private validateRequest(request: SendMessageRequest): void {
    if (!request.conversationId || request.conversationId.trim().length === 0) {
      throw new Error("Conversation ID is required");
    }

    if (!request.content || request.content.trim().length === 0) {
      throw new Error("Message content is required");
    }

    if (request.content.length > 10000) {
      throw new Error(
        "Message content is too long (maximum 10,000 characters)"
      );
    }
  }

  private async generateAIResponse(
    prompt: string,
    context: ReadonlyArray<Message>,
    model?: string
  ): Promise<string> {
    try {
      // Check if AI service is available
      const isAvailable = await this.aiService.isAvailable();
      if (!isAvailable) {
        throw new Error("AI service is currently unavailable");
      }

      // Convert readonly array to regular array for the AI service
      const contextArray = Array.from(context);

      // Generate response
      const response = await this.aiService.generateResponse(
        prompt,
        contextArray,
        { model }
      );

      if (!response || response.trim().length === 0) {
        throw new Error("AI service returned an empty response");
      }

      return response.trim();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to generate AI response: ${error.message}`);
      }
      throw new Error("Failed to generate AI response: Unknown error");
    }
  }

  private handleError(error: unknown, request: SendMessageRequest): Error {
    if (error instanceof Error) {
      // Log error for debugging (in a real app, use proper logging)
      console.error("SendMessageUseCase error:", {
        message: error.message,
        conversationId: request.conversationId,
        contentLength: request.content?.length || 0,
      });

      // Return user-friendly error messages
      if (error.message.includes("not found")) {
        return new Error(
          "The conversation could not be found. Please try starting a new conversation."
        );
      }

      if (
        error.message.includes("AI service") ||
        error.message.includes("Failed to generate AI response")
      ) {
        return new Error("Unable to get AI response. Please try again later.");
      }

      if (
        error.message.includes("required") ||
        error.message.includes("too long")
      ) {
        return error; // Validation errors can be shown as-is
      }

      return new Error("An unexpected error occurred. Please try again.");
    }

    return new Error("An unexpected error occurred. Please try again.");
  }
}
