import { Message } from "../entities/message";

export interface AIService {
  /**
   * Generates a response from the AI based on the prompt and conversation context
   * @param prompt The user's message/prompt
   * @param context Array of previous messages for conversation context
   * @param options Optional parameters including model selection
   * @returns Promise that resolves to the AI's response text
   * @throws Error if the AI service fails to generate a response
   */
  generateResponse(
    prompt: string,
    context: Message[],
    options?: { model?: string }
  ): Promise<string>;

  /**
   * Checks if the AI service is available and properly configured
   * @returns Promise that resolves to true if the service is available, false otherwise
   */
  isAvailable(): Promise<boolean>;

  /**
   * Gets the maximum number of tokens that can be processed in a single request
   * @returns The maximum token limit
   */
  getMaxTokens(): number;

  /**
   * Estimates the token count for a given text
   * @param text The text to estimate tokens for
   * @returns Estimated number of tokens
   */
  estimateTokens(text: string): number;
}
