import { Message } from '../../domain/entities/message'
import { MessageId } from '../../domain/value-objects/message-id'
import { MessageRole } from '../../domain/enums/message-role'
import { MessageDTO } from '../dtos/message.dto'

export class MessageMapper {
  static toDTO(message: Message): MessageDTO {
    return {
      id: message.id.toString(),
      content: message.content,
      role: message.role,
      timestamp: message.timestamp.toISOString()
    }
  }

  static toDomain(dto: MessageDTO): Message {
    return new Message(
      new MessageId(dto.id),
      dto.content,
      dto.role as MessageRole,
      new Date(dto.timestamp)
    )
  }

  static toDTOArray(messages: ReadonlyArray<Message>): MessageDTO[] {
    return messages.map(message => this.toDTO(message))
  }

  static toDomainArray(dtos: MessageDTO[]): Message[] {
    return dtos.map(dto => this.toDomain(dto))
  }
}