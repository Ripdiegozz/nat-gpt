import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SendMessageUseCase } from '../send-message.use-case'
import { ConversationRepository } from '../../../domain/repositories/conversation-repository'
import { AIService } from '../../../domain/services/ai-service'
import { Conversation } from '../../../domain/entities/conversation'
import { Message } from '../../../domain/entities/message'
import { ConversationId } from '../../../domain/value-objects/conversation-id'
import { MessageId } from '../../../domain/value-objects/message-id'
import { MessageRole } from '../../../domain/enums/message-role'
import { SendMessageRequest } from '../../dtos/send-message.dto'

describe('SendMessageUseCase', () => {
  let useCase: SendMessageUseCase
  let mockConversationRepository: ConversationRepository
  let mockAIService: AIService
  let testConversation: Conversation
  let testConversationId: ConversationId

  beforeEach(() => {
    // Create mocks
    mockConversationRepository = {
      findAll: vi.fn(),
      findById: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      exists: vi.fn()
    }

    mockAIService = {
      generateResponse: vi.fn(),
      isAvailable: vi.fn(),
      getMaxTokens: vi.fn(),
      estimateTokens: vi.fn()
    }

    // Create test data
    testConversationId = new ConversationId('test-conv-id')
    testConversation = new Conversation(
      testConversationId,
      'Test Conversation',
      [],
      new Date(),
      new Date()
    )

    // Create use case instance
    useCase = new SendMessageUseCase(mockConversationRepository, mockAIService)
  })

  describe('execute', () => {
    const validRequest: SendMessageRequest = {
      conversationId: 'test-conv-id',
      content: 'Hello, AI!'
    }

    it('should successfully send message and get AI response', async () => {
      // Arrange
      vi.mocked(mockConversationRepository.findById).mockResolvedValue(testConversation)
      vi.mocked(mockConversationRepository.save).mockResolvedValue()
      vi.mocked(mockAIService.isAvailable).mockResolvedValue(true)
      vi.mocked(mockAIService.generateResponse).mockResolvedValue('Hello, human!')

      // Act
      const result = await useCase.execute(validRequest)

      // Assert
      expect(result).toBeDefined()
      expect(result.userMessage.content).toBe('Hello, AI!')
      expect(result.userMessage.role).toBe('user')
      expect(result.aiMessage.content).toBe('Hello, human!')
      expect(result.aiMessage.role).toBe('assistant')
      expect(result.conversationId).toBe('test-conv-id')

      // Verify repository calls
      expect(mockConversationRepository.findById).toHaveBeenCalledWith(testConversationId)
      expect(mockConversationRepository.save).toHaveBeenCalledTimes(2) // Once for user message, once for AI message

      // Verify AI service calls
      expect(mockAIService.isAvailable).toHaveBeenCalled()
      expect(mockAIService.generateResponse).toHaveBeenCalledWith('Hello, AI!', expect.any(Array))
    })

    it('should handle conversation with existing messages', async () => {
      // Arrange
      const existingMessage = new Message(
        new MessageId('existing-msg'),
        'Previous message',
        MessageRole.USER,
        new Date()
      )
      const conversationWithMessages = testConversation.addMessage(existingMessage)
      
      vi.mocked(mockConversationRepository.findById).mockResolvedValue(conversationWithMessages)
      vi.mocked(mockConversationRepository.save).mockResolvedValue()
      vi.mocked(mockAIService.isAvailable).mockResolvedValue(true)
      vi.mocked(mockAIService.generateResponse).mockResolvedValue('AI response')

      // Act
      const result = await useCase.execute(validRequest)

      // Assert
      expect(result).toBeDefined()
      expect(mockAIService.generateResponse).toHaveBeenCalledWith(
        'Hello, AI!',
        expect.arrayContaining([
          expect.objectContaining({ content: 'Previous message' }),
          expect.objectContaining({ content: 'Hello, AI!' })
        ])
      )
    })

    it('should throw error when conversation not found', async () => {
      // Arrange
      vi.mocked(mockConversationRepository.findById).mockResolvedValue(null)

      // Act & Assert
      await expect(useCase.execute(validRequest)).rejects.toThrow(
        'The conversation could not be found. Please try starting a new conversation.'
      )
    })

    it('should throw error when AI service is unavailable', async () => {
      // Arrange
      vi.mocked(mockConversationRepository.findById).mockResolvedValue(testConversation)
      vi.mocked(mockConversationRepository.save).mockResolvedValue()
      vi.mocked(mockAIService.isAvailable).mockResolvedValue(false)

      // Act & Assert
      await expect(useCase.execute(validRequest)).rejects.toThrow(
        'Unable to get AI response. Please try again later.'
      )
    })

    it('should throw error when AI service returns empty response', async () => {
      // Arrange
      vi.mocked(mockConversationRepository.findById).mockResolvedValue(testConversation)
      vi.mocked(mockConversationRepository.save).mockResolvedValue()
      vi.mocked(mockAIService.isAvailable).mockResolvedValue(true)
      vi.mocked(mockAIService.generateResponse).mockResolvedValue('')

      // Act & Assert
      await expect(useCase.execute(validRequest)).rejects.toThrow(
        'Unable to get AI response. Please try again later.'
      )
    })

    it('should handle AI service errors gracefully', async () => {
      // Arrange
      vi.mocked(mockConversationRepository.findById).mockResolvedValue(testConversation)
      vi.mocked(mockConversationRepository.save).mockResolvedValue()
      vi.mocked(mockAIService.isAvailable).mockResolvedValue(true)
      vi.mocked(mockAIService.generateResponse).mockRejectedValue(new Error('API rate limit exceeded'))

      // Act & Assert
      await expect(useCase.execute(validRequest)).rejects.toThrow(
        'Unable to get AI response. Please try again later.'
      )
    })

    it('should handle repository save errors', async () => {
      // Arrange
      vi.mocked(mockConversationRepository.findById).mockResolvedValue(testConversation)
      vi.mocked(mockConversationRepository.save).mockRejectedValue(new Error('Database error'))

      // Act & Assert
      await expect(useCase.execute(validRequest)).rejects.toThrow(
        'An unexpected error occurred. Please try again.'
      )
    })
  })

  describe('validation', () => {
    it('should throw error for empty conversation ID', async () => {
      const invalidRequest: SendMessageRequest = {
        conversationId: '',
        content: 'Hello'
      }

      await expect(useCase.execute(invalidRequest)).rejects.toThrow(
        'Conversation ID is required'
      )
    })

    it('should throw error for whitespace-only conversation ID', async () => {
      const invalidRequest: SendMessageRequest = {
        conversationId: '   ',
        content: 'Hello'
      }

      await expect(useCase.execute(invalidRequest)).rejects.toThrow(
        'Conversation ID is required'
      )
    })

    it('should throw error for empty content', async () => {
      const invalidRequest: SendMessageRequest = {
        conversationId: 'test-conv-id',
        content: ''
      }

      await expect(useCase.execute(invalidRequest)).rejects.toThrow(
        'Message content is required'
      )
    })

    it('should throw error for whitespace-only content', async () => {
      const invalidRequest: SendMessageRequest = {
        conversationId: 'test-conv-id',
        content: '   '
      }

      await expect(useCase.execute(invalidRequest)).rejects.toThrow(
        'Message content is required'
      )
    })

    it('should throw error for content that is too long', async () => {
      const invalidRequest: SendMessageRequest = {
        conversationId: 'test-conv-id',
        content: 'a'.repeat(10001) // Exceeds 10,000 character limit
      }

      await expect(useCase.execute(invalidRequest)).rejects.toThrow(
        'Message content is too long (maximum 10,000 characters)'
      )
    })

    it('should accept content at the maximum length', async () => {
      // Arrange
      const maxLengthRequest: SendMessageRequest = {
        conversationId: 'test-conv-id',
        content: 'a'.repeat(10000) // Exactly 10,000 characters
      }

      vi.mocked(mockConversationRepository.findById).mockResolvedValue(testConversation)
      vi.mocked(mockConversationRepository.save).mockResolvedValue()
      vi.mocked(mockAIService.isAvailable).mockResolvedValue(true)
      vi.mocked(mockAIService.generateResponse).mockResolvedValue('AI response')

      // Act & Assert
      await expect(useCase.execute(maxLengthRequest)).resolves.toBeDefined()
    })
  })

  describe('error handling', () => {
    it('should log errors for debugging', async () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.mocked(mockConversationRepository.findById).mockRejectedValue(new Error('Database connection failed'))

      // Act
      try {
        await useCase.execute({
          conversationId: 'test-conv-id',
          content: 'Hello'
        })
      } catch (error) {
        // Expected to throw
      }

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('SendMessageUseCase error:', {
        message: 'Database connection failed',
        conversationId: 'test-conv-id',
        contentLength: 5
      })

      consoleSpy.mockRestore()
    })

    it('should handle unknown error types', async () => {
      // Arrange
      vi.mocked(mockConversationRepository.findById).mockRejectedValue('String error')

      // Act & Assert
      await expect(useCase.execute({
        conversationId: 'test-conv-id',
        content: 'Hello'
      })).rejects.toThrow('An unexpected error occurred. Please try again.')
    })
  })
})