import { Conversation } from "../entities/conversation";
import { Message } from "../entities/message";

export interface ConversationService {
  /**
   * Generates a title for a conversation based on its messages
   * @param conversation The conversation to generate a title for
   * @returns A suggested title for the conversation
   */
  generateTitle(conversation: Conversation): string;

  /**
   * Determines if a conversation should be archived based on business rules
   * @param conversation The conversation to evaluate
   * @returns True if the conversation should be archived, false otherwise
   */
  shouldArchive(conversation: Conversation): boolean;

  /**
   * Gets the maximum number of messages allowed in a conversation
   * @returns The maximum message limit
   */
  getMaxMessageLimit(): number;

  /**
   * Validates if a new message can be added to a conversation
   * @param conversation The conversation to validate
   * @param message The message to be added
   * @returns True if the message can be added, false otherwise
   */
  canAddMessage(conversation: Conversation, message: Message): boolean;

  /**
   * Trims old messages from a conversation if it exceeds limits
   * @param conversation The conversation to trim
   * @returns A new conversation with trimmed messages if necessary
   */
  trimConversationIfNeeded(conversation: Conversation): Conversation;
}
