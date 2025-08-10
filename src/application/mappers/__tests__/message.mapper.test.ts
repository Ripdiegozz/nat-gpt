import { describe, it, expect } from 'vitest'
import { MessageMapper } from '../message.mapper'
import { Message } from '../../../domain/entities/message'
import { MessageId } from '../../../domain/value-objects/message-id'
import { MessageRole } from '../../../domain/enums/message-role'
import { MessageDTO } from '../../dtos/message.dto'

describe('MessageMapper', () => {
  const testDate = new Date('2024-01-01T12:00:00.000Z')
  const messageId = new MessageId('test-id')
  
  const domainMessage = new Message(
    messageId,
    'Hello, world!',
    MessageRole.USER,
    testDate
  )

  const dtoMessage: MessageDTO = {
    id: 'test-id',
    content: 'Hello, world!',
    role: 'user',
    timestamp: '2024-01-01T12:00:00.000Z'
  }

  describe('toDTO', () => {
    it('should convert domain message to DTO', () => {
      const result = MessageMapper.toDTO(domainMessage)
      
      expect(result).toEqual(dtoMessage)
    })
  })

  describe('toDomain', () => {
    it('should convert DTO to domain message', () => {
      const result = MessageMapper.toDomain(dtoMessage)
      
      expect(result.id.toString()).toBe(domainMessage.id.toString())
      expect(result.content).toBe(domainMessage.content)
      expect(result.role).toBe(domainMessage.role)
      expect(result.timestamp.toISOString()).toBe(domainMessage.timestamp.toISOString())
    })
  })

  describe('toDTOArray', () => {
    it('should convert array of domain messages to DTOs', () => {
      const messages = [domainMessage]
      const result = MessageMapper.toDTOArray(messages)
      
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(dtoMessage)
    })

    it('should handle empty array', () => {
      const result = MessageMapper.toDTOArray([])
      
      expect(result).toEqual([])
    })
  })

  describe('toDomainArray', () => {
    it('should convert array of DTOs to domain messages', () => {
      const dtos = [dtoMessage]
      const result = MessageMapper.toDomainArray(dtos)
      
      expect(result).toHaveLength(1)
      expect(result[0].id.toString()).toBe(domainMessage.id.toString())
      expect(result[0].content).toBe(domainMessage.content)
      expect(result[0].role).toBe(domainMessage.role)
    })

    it('should handle empty array', () => {
      const result = MessageMapper.toDomainArray([])
      
      expect(result).toEqual([])
    })
  })
})