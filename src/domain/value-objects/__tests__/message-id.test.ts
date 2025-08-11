import { describe, it, expect } from 'vitest'
import { MessageId } from '../message-id'

describe('MessageId', () => {
  describe('constructor', () => {
    it('should create a MessageId with valid value', () => {
      const id = new MessageId('test-id')
      expect(id.toString()).toBe('test-id')
    })

    it('should trim whitespace from value', () => {
      const id = new MessageId('  test-id  ')
      expect(id.toString()).toBe('test-id')
    })

    it('should throw error for empty string', () => {
      expect(() => new MessageId('')).toThrow('MessageId cannot be empty')
    })

    it('should throw error for whitespace-only string', () => {
      expect(() => new MessageId('   ')).toThrow('MessageId cannot be empty')
    })

    it('should throw error for null value', () => {
      expect(() => new MessageId(null as unknown as string)).toThrow('MessageId cannot be empty')
    })

    it('should throw error for undefined value', () => {
      expect(() => new MessageId(undefined as unknown as string)).toThrow('MessageId cannot be empty')
    })
  })

  describe('toString', () => {
    it('should return the string representation', () => {
      const id = new MessageId('test-id')
      expect(id.toString()).toBe('test-id')
    })
  })

  describe('equals', () => {
    it('should return true for equal MessageIds', () => {
      const id1 = new MessageId('test-id')
      const id2 = new MessageId('test-id')
      expect(id1.equals(id2)).toBe(true)
    })

    it('should return false for different MessageIds', () => {
      const id1 = new MessageId('test-id-1')
      const id2 = new MessageId('test-id-2')
      expect(id1.equals(id2)).toBe(false)
    })

    it('should handle trimmed values correctly', () => {
      const id1 = new MessageId('test-id')
      const id2 = new MessageId('  test-id  ')
      expect(id1.equals(id2)).toBe(true)
    })
  })

  describe('generate', () => {
    it('should generate a valid MessageId', () => {
      const id = MessageId.generate()
      expect(id).toBeInstanceOf(MessageId)
      expect(id.toString()).toBeTruthy()
    })

    it('should generate unique MessageIds', () => {
      const id1 = MessageId.generate()
      const id2 = MessageId.generate()
      expect(id1.equals(id2)).toBe(false)
    })
  })
})