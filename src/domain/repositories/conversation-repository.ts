import { Conversation } from '../entities/conversation'
import { ConversationId } from '../value-objects/conversation-id'

export interface ConversationRepository {
  /**
   * Retrieves all conversations
   * @returns Promise that resolves to an array of all conversations
   */
  findAll(): Promise<Conversation[]>

  /**
   * Retrieves a conversation by its ID
   * @param id The conversation ID to search for
   * @returns Promise that resolves to the conversation if found, null otherwise
   */
  findById(id: ConversationId): Promise<Conversation | null>

  /**
   * Saves a conversation (creates new or updates existing)
   * @param conversation The conversation to save
   * @returns Promise that resolves when the operation is complete
   */
  save(conversation: Conversation): Promise<void>

  /**
   * Deletes a conversation by its ID
   * @param id The conversation ID to delete
   * @returns Promise that resolves when the operation is complete
   */
  delete(id: ConversationId): Promise<void>

  /**
   * Checks if a conversation exists by its ID
   * @param id The conversation ID to check
   * @returns Promise that resolves to true if the conversation exists, false otherwise
   */
  exists(id: ConversationId): Promise<boolean>
}