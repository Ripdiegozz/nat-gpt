import { ConversationId } from '../value-objects/conversation-id'
import { Message } from './message'

export class Conversation {
  public readonly id: ConversationId
  public readonly title: string
  private readonly _messages: Message[]
  public readonly createdAt: Date
  public readonly updatedAt: Date

  constructor(
    id: ConversationId,
    title: string,
    messages: Message[] = [],
    createdAt: Date = new Date(),
    updatedAt: Date = new Date()
  ) {
    this.validateTitle(title)
    this.id = id
    this.title = title.trim()
    this._messages = [...messages]
    this.createdAt = createdAt
    this.updatedAt = updatedAt
  }

  private validateTitle(title: string): void {
    if (!title || title.trim().length === 0) {
      throw new Error('Conversation title cannot be empty')
    }
  }

  addMessage(message: Message): Conversation {
    const newMessages = [...this._messages, message]
    return new Conversation(
      this.id,
      this.title,
      newMessages,
      this.createdAt,
      new Date()
    )
  }

  getMessages(): ReadonlyArray<Message> {
    return Object.freeze([...this._messages])
  }

  getLastMessage(): Message | null {
    return this._messages.length > 0 ? this._messages[this._messages.length - 1] : null
  }

  getMessageCount(): number {
    return this._messages.length
  }

  isEmpty(): boolean {
    return this._messages.length === 0
  }

  hasMessages(): boolean {
    return this._messages.length > 0
  }

  equals(other: Conversation): boolean {
    return this.id.equals(other.id)
  }

  static create(title: string, id?: ConversationId): Conversation {
    return new Conversation(
      id || ConversationId.generate(),
      title
    )
  }

  static createWithDefaultTitle(id?: ConversationId): Conversation {
    return new Conversation(
      id || ConversationId.generate(),
      'New Conversation'
    )
  }
}