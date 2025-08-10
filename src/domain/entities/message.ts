import { MessageId } from '../value-objects/message-id'
import { MessageRole } from '../enums/message-role'

export class Message {
  public readonly id: MessageId
  public readonly content: string
  public readonly role: MessageRole
  public readonly timestamp: Date

  constructor(
    id: MessageId,
    content: string,
    role: MessageRole,
    timestamp: Date = new Date()
  ) {
    this.validateContent(content)
    this.id = id
    this.content = content.trim()
    this.role = role
    this.timestamp = timestamp
  }

  private validateContent(content: string): void {
    if (!content || content.trim().length === 0) {
      throw new Error('Message content cannot be empty')
    }
  }

  isFromUser(): boolean {
    return this.role === MessageRole.USER
  }

  isFromAssistant(): boolean {
    return this.role === MessageRole.ASSISTANT
  }

  equals(other: Message): boolean {
    return this.id.equals(other.id)
  }

  static createUserMessage(content: string, id?: MessageId): Message {
    return new Message(
      id || MessageId.generate(),
      content,
      MessageRole.USER
    )
  }

  static createAssistantMessage(content: string, id?: MessageId): Message {
    return new Message(
      id || MessageId.generate(),
      content,
      MessageRole.ASSISTANT
    )
  }
}