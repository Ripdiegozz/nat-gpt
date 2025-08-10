import { describe, it, expect } from 'vitest'
import { ConversationMapper } from '../conversation.mapper'
import { Conversation } from '../../../domain/entities/conversation'
import { Message } from '../../../domain/entities/message'
import { ConversationId } from '../../../domain/value-objects/conversation-id'
import { MessageId } from '../../../domain/value-objects/message-id'
import { MessageRole } from '../../../domain/enums/message-role'
import { ConversationDTO } from '../../dtos/conversation.dto'

describe('ConversationMapper', () => {
  const testDate = new Date('2024-01-01T12:00:00.000Z')
  const conversationId = new ConversationId('conv-id')
  const messageId = new MessageId('msg-id')
  
  const message = new Message(
    messageId,
    'Hello!',
    MessageRole.USER,
    testDate
  )

  const domainConversation = new Conversation(
    conversationId,
    'Test Conversation',
    [message],
    testDate,
    testDate
  )

  const dtoConversation: ConversationDTO = {
    id: 'conv-id',
    title: 'Test Conversation',
    messages: [{
      id: 'msg-id',
      content: 'Hello!',
      role: 'user',
      timestamp: '2024-01-01T12:00:00.000Z'
    }],
    createdAt: '2024-01-01T12:00:00.000Z',
    updatedAt: '2024-01-01T12:00:00.000Z'
  }

  describe('toDTO', () => {
    it('should convert domain conversation to DTO', () => {
      const result = ConversationMapper.toDTO(domainConversation)
      
      expect(result).toEqual(dtoConversation)
    })

    it('should handle conversation with no messages', () => {
      const emptyConversation = new Conversation(
        conversationId,
        'Empty Conversation',
        [],
        testDate,
        testDate
      )

      const result = ConversationMapper.toDTO(emptyConversation)
      
      expect(result.messages).toEqual([])
      expect(result.title).toBe('Empty Conversation')
    })
  })

  describe('toDomain', () => {
    it('should convert DTO to domain conversation', () => {
      const result = ConversationMapper.toDomain(dtoConversation)
      
      expect(result.id.toString()).toBe(domainConversation.id.toString())
      expect(result.title).toBe(domainConversation.title)
      expect(result.getMessages()).toHaveLength(1)
      expect(result.getMessages()[0].content).toBe('Hello!')
      expect(result.createdAt.toISOString()).toBe(domainConversation.createdAt.toISOString())
      expect(result.updatedAt.toISOString()).toBe(domainConversation.updatedAt.toISOString())
    })
  })

  describe('toDTOArray', () => {
    it('should convert array of domain conversations to DTOs', () => {
      const conversations = [domainConversation]
      const result = ConversationMapper.toDTOArray(conversations)
      
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(dtoConversation)
    })

    it('should handle empty array', () => {
      const result = ConversationMapper.toDTOArray([])
      
      expect(result).toEqual([])
    })
  })

  describe('toDomainArray', () => {
    it('should convert array of DTOs to domain conversations', () => {
      const dtos = [dtoConversation]
      const result = ConversationMapper.toDomainArray(dtos)
      
      expect(result).toHaveLength(1)
      expect(result[0].id.toString()).toBe(domainConversation.id.toString())
      expect(result[0].title).toBe(domainConversation.title)
      expect(result[0].getMessages()).toHaveLength(1)
    })

    it('should handle empty array', () => {
      const result = ConversationMapper.toDomainArray([])
      
      expect(result).toEqual([])
    })
  })
})