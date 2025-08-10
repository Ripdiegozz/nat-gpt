import { describe, it, expect, beforeEach } from 'vitest'
import { AIService } from '../ai-service'
import { Message } from '../../entities/message'
import { MessageRole } from '../../enums/message-role'
import { MessageId } from '../../value-objects/message-id'

// Mock implementation for testing the interface contract
class MockAIService implements AIService {
  private available: boolean = true
  private maxTokens: number = 4096

  async generateResponse(prompt: string, context: Message[]): Promise<string> {
    if (!this.available) {
      throw new Error('AI service is not available')
    }
    if (!prompt.trim()) {
      throw new Error('Prompt cannot be empty')
    }
    return `AI response to: ${prompt}`
  }

  async isAvailable(): Promise<boolean> {
    return this.available
  }

  getMaxTokens(): number {
    return this.maxTokens
  }

  estimateTokens(text: string): number {
    // Simple estimation: roughly 4 characters per token
    return Math.ceil(text.length / 4)
  }

  // Test helper methods
  setAvailable(available: boolean): void {
    this.available = available
  }

  setMaxTokens(maxTokens: number): void {
    this.maxTokens = maxTokens
  }
}

describe('AIService Interface', () => {
  let aiService: MockAIService
  let userMessage: Message
  let assistantMessage: Message

  beforeEach(() => {
    aiService = new MockAIService()
    userMessage = new Message(
      new MessageId('user-msg-1'),
      'Hello, how are you?',
      MessageRole.USER
    )
    assistantMessage = new Message(
      new MessageId('ai-msg-1'),
      'I am doing well, thank you!',
      MessageRole.ASSISTANT
    )
  })

  describe('generateResponse', () => {
    it('should generate response for valid prompt', async () => {
      const response = await aiService.generateResponse('Hello', [])
      expect(response).toBe('AI response to: Hello')
    })

    it('should generate response with context', async () => {
      const context = [userMessage, assistantMessage]
      const response = await aiService.generateResponse('What did I just say?', context)
      expect(response).toBe('AI response to: What did I just say?')
    })

    it('should throw error when service is not available', async () => {
      aiService.setAvailable(false)
      await expect(aiService.generateResponse('Hello', []))
        .rejects.toThrow('AI service is not available')
    })

    it('should throw error for empty prompt', async () => {
      await expect(aiService.generateResponse('', []))
        .rejects.toThrow('Prompt cannot be empty')
    })

    it('should throw error for whitespace-only prompt', async () => {
      await expect(aiService.generateResponse('   ', []))
        .rejects.toThrow('Prompt cannot be empty')
    })
  })

  describe('isAvailable', () => {
    it('should return true when service is available', async () => {
      const available = await aiService.isAvailable()
      expect(available).toBe(true)
    })

    it('should return false when service is not available', async () => {
      aiService.setAvailable(false)
      const available = await aiService.isAvailable()
      expect(available).toBe(false)
    })
  })

  describe('getMaxTokens', () => {
    it('should return the maximum token limit', () => {
      const maxTokens = aiService.getMaxTokens()
      expect(maxTokens).toBe(4096)
    })

    it('should return updated max tokens when changed', () => {
      aiService.setMaxTokens(8192)
      const maxTokens = aiService.getMaxTokens()
      expect(maxTokens).toBe(8192)
    })
  })

  describe('estimateTokens', () => {
    it('should estimate tokens for short text', () => {
      const tokens = aiService.estimateTokens('Hello')
      expect(tokens).toBe(2) // 5 characters / 4 = 1.25, rounded up to 2
    })

    it('should estimate tokens for longer text', () => {
      const text = 'This is a longer text that should have more tokens'
      const tokens = aiService.estimateTokens(text)
      expect(tokens).toBe(Math.ceil(text.length / 4))
    })

    it('should return 0 for empty text', () => {
      const tokens = aiService.estimateTokens('')
      expect(tokens).toBe(0)
    })

    it('should handle special characters', () => {
      const text = 'Hello! 🌟 How are you? 😊'
      const tokens = aiService.estimateTokens(text)
      expect(tokens).toBeGreaterThan(0)
    })
  })
})