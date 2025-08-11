import { describe, it, expect } from 'vitest'
import { ConversationId } from '../conversation-id'

describe('ConversationId', () => {
  describe('constructor', () => {
    it('should create a ConversationId with valid value', () => {
      const id = new ConversationId('test-conversation-id')
      expect(id.toString()).toBe('test-conversation-id')
    })

    it('should trim whitespace from value', () => {
      const id = new ConversationId('  test-conversation-id  ')
      expect(id.toString()).toBe('test-conversation-id')
    })

    it('should throw error for empty string', () => {
      expect(() => new ConversationId('')).toThrow('ConversationId cannot be empty')
    })

    it('should throw error for whitespace-only string', () => {
      expect(() => new ConversationId('   ')).toThrow('ConversationId cannot be empty')
    })

    it('should throw error for null value', () => {
      expect(() => new ConversationId(null as unknown as string)).toThrow('ConversationId cannot be empty')
    })

    it('should throw error for undefined value', () => {
      expect(() => new ConversationId(undefined as unknown as string)).toThrow('ConversationId cannot be empty')
    })
  })

  describe('toString', () => {
    it('should return the string representation', () => {
      const id = new ConversationId('test-conversation-id')
      expect(id.toString()).toBe('test-conversation-id')
    })
  })

  describe('equals', () => {
    it('should return true for equal ConversationIds', () => {
      const id1 = new ConversationId('test-conversation-id')
      const id2 = new ConversationId('test-conversation-id')
      expect(id1.equals(id2)).toBe(true)
    })

    it('should return false for different ConversationIds', () => {
      const id1 = new ConversationId('test-conversation-id-1')
      const id2 = new ConversationId('test-conversation-id-2')
      expect(id1.equals(id2)).toBe(false)
    })

    it('should handle trimmed values correctly', () => {
      const id1 = new ConversationId('test-conversation-id')
      const id2 = new ConversationId('  test-conversation-id  ')
      expect(id1.equals(id2)).toBe(true)
    })
  })

  describe('generate', () => {
    it('should generate a valid ConversationId', () => {
      const id = ConversationId.generate()
      expect(id).toBeInstanceOf(ConversationId)
      expect(id.toString()).toBeTruthy()
    })

    it('should generate unique ConversationIds', () => {
      const id1 = ConversationId.generate()
      const id2 = ConversationId.generate()
      expect(id1.equals(id2)).toBe(false)
    })
  })
})