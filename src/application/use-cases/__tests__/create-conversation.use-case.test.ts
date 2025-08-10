import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CreateConversationUseCase } from '../create-conversation.use-case'
import { ConversationRepository } from '../../../domain/repositories/conversation-repository'
import { CreateConversationRequest } from '../../dtos/conversation-management.dto'

describe('CreateConversationUseCase', () => {
  let useCase: CreateConversationUseCase
  let mockConversationRepository: ConversationRepository

  beforeEach(() => {
    // Create mock
    mockConversationRepository = {
      findAll: vi.fn(),
      findById: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      exists: vi.fn()
    }

    // Create use case instance
    useCase = new CreateConversationUseCase(mockConversationRepository)
  })

  describe('execute', () => {
    it('should create conversation with custom title', async () => {
      // Arrange
      const request: CreateConversationRequest = {
        title: 'My Custom Conversation'
      }
      vi.mocked(mockConversationRepository.save).mockResolvedValue()

      // Act
      const result = await useCase.execute(request)

      // Assert
      expect(result).toBeDefined()
      expect(result.conversation.title).toBe('My Custom Conversation')
      expect(result.conversation.id).toBeDefined()
      expect(result.conversation.messages).toEqual([])
      expect(result.conversation.createdAt).toBeDefined()
      expect(result.conversation.updatedAt).toBeDefined()

      // Verify repository call
      expect(mockConversationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'My Custom Conversation'
        })
      )
    })

    it('should create conversation with default title when no title provided', async () => {
      // Arrange
      vi.mocked(mockConversationRepository.save).mockResolvedValue()

      // Act
      const result = await useCase.execute()

      // Assert
      expect(result).toBeDefined()
      expect(result.conversation.title).toBe('New Conversation')
      expect(result.conversation.id).toBeDefined()
      expect(result.conversation.messages).toEqual([])

      // Verify repository call
      expect(mockConversationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Conversation'
        })
      )
    })

    it('should create conversation with default title when empty request provided', async () => {
      // Arrange
      const request: CreateConversationRequest = {}
      vi.mocked(mockConversationRepository.save).mockResolvedValue()

      // Act
      const result = await useCase.execute(request)

      // Assert
      expect(result).toBeDefined()
      expect(result.conversation.title).toBe('New Conversation')
    })

    it('should trim whitespace from title', async () => {
      // Arrange
      const request: CreateConversationRequest = {
        title: '  Trimmed Title  '
      }
      vi.mocked(mockConversationRepository.save).mockResolvedValue()

      // Act
      const result = await useCase.execute(request)

      // Assert
      expect(result.conversation.title).toBe('Trimmed Title')
    })

    it('should handle repository save errors', async () => {
      // Arrange
      const request: CreateConversationRequest = {
        title: 'Test Conversation'
      }
      vi.mocked(mockConversationRepository.save).mockRejectedValue(new Error('Database error'))

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow(
        'Failed to create conversation. Please try again.'
      )
    })

    it('should use default title when empty title provided', async () => {
      // Arrange
      const request: CreateConversationRequest = {
        title: '' // Empty title should result in default title
      }
      vi.mocked(mockConversationRepository.save).mockResolvedValue()

      // Act
      const result = await useCase.execute(request)

      // Assert
      expect(result.conversation.title).toBe('New Conversation')
    })
  })

  describe('error handling', () => {
    it('should log errors for debugging', async () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.mocked(mockConversationRepository.save).mockRejectedValue(new Error('Database connection failed'))

      // Act
      try {
        await useCase.execute({ title: 'Test' })
      } catch (error) {
        // Expected to throw
      }

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('CreateConversationUseCase error:', {
        message: 'Database connection failed',
        title: 'Test'
      })

      consoleSpy.mockRestore()
    })

    it('should handle unknown error types', async () => {
      // Arrange
      vi.mocked(mockConversationRepository.save).mockRejectedValue('String error')

      // Act & Assert
      await expect(useCase.execute({ title: 'Test' })).rejects.toThrow(
        'Failed to create conversation. Please try again.'
      )
    })
  })
})