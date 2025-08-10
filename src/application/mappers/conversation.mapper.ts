import { Conversation } from '../../domain/entities/conversation'
import { ConversationId } from '../../domain/value-objects/conversation-id'
import { ConversationDTO } from '../dtos/conversation.dto'
import { MessageMapper } from './message.mapper'

export class ConversationMapper {
  static toDTO(conversation: Conversation): ConversationDTO {
    return {
      id: conversation.id.toString(),
      title: conversation.title,
      messages: MessageMapper.toDTOArray(conversation.getMessages()),
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString()
    }
  }

  static toDomain(dto: ConversationDTO): Conversation {
    const messages = MessageMapper.toDomainArray(dto.messages)
    return new Conversation(
      new ConversationId(dto.id),
      dto.title,
      messages,
      new Date(dto.createdAt),
      new Date(dto.updatedAt)
    )
  }

  static toDTOArray(conversations: Conversation[]): ConversationDTO[] {
    return conversations.map(conversation => this.toDTO(conversation))
  }

  static toDomainArray(dtos: ConversationDTO[]): Conversation[] {
    return dtos.map(dto => this.toDomain(dto))
  }
}