import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { LocalStorageConversationRepository, StorageError, StorageQuotaExceededError } from '../local-storage-conversation-repository'
import { Conversation } from '../../../domain/entities/conversation'
import { Message } from '../../../domain/entities/message'
import { ConversationId } from '../../../domain/value-objects/conversation-id'
import { MessageId } from '../../../domain/value-objects/message-id'
import { MessageRole } from '../../../domain/enums/message-role'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
}

// Mock window.localStorage
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
})

describe('LocalStorageConversationRepository', () => {
  let repository: LocalStorageConversationRepository
  let testConversation: Conversation
  let testMessage: Message

  beforeEach(() => {
    vi.clearAllMocks()
    repository = new LocalStorageConversationRepository()
    
    // Create test data
    testMessage = new Message(
      new MessageId('msg-1'),
      'Hello, world!',
      MessageRole.USER,
      new Date('2023-01-01T10:00:00Z')
    )
    
    testConversation = new Conversation(
      new ConversationId('conv-1'),
      'Test Conversation',
      [testMessage],
      new Date('2023-01-01T09:00:00Z'),
      new Date('2023-01-01T10:00:00Z')
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('findAll', () => {
    it('should return empty array when no conversations are stored', async () => {
      localStorageMock.getItem.mockReturnValue(null)

      const result = await repository.findAll()

      expect(result).toEqual([])
      expect(localStorageMock.getItem).toHaveBeenCalledWith('chatgpt-clone-conversations')
    })

    it('should return all stored conversations', async () => {
      const storedData = JSON.stringify([{
        id: 'conv-1',
        title: 'Test Conversation',
        messages: [{
          id: 'msg-1',
          content: 'Hello, world!',
          role: 'user',
          timestamp: '2023-01-01T10:00:00.000Z'
        }],
        createdAt: '2023-01-01T09:00:00.000Z',
        updatedAt: '2023-01-01T10:00:00.000Z'
      }])
      localStorageMock.getItem.mockReturnValue(storedData)

      const result = await repository.findAll()

      expect(result).toHaveLength(1)
      expect(result[0].id.toString()).toBe('conv-1')
      expect(result[0].title).toBe('Test Conversation')
      expect(result[0].getMessages()).toHaveLength(1)
    })

    it('should handle corrupted data by clearing storage and returning empty array', async () => {
      localStorageMock.getItem.mockReturnValue('invalid json')

      const result = await repository.findAll()

      expect(result).toEqual([])
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('chatgpt-clone-conversations')
    })

    it('should throw StorageError when localStorage is not available', async () => {
      // Mock window.localStorage as undefined
      Object.defineProperty(window, 'localStorage', {
        value: undefined,
        writable: true
      })

      await expect(repository.findAll()).rejects.toThrow(StorageError)
      await expect(repository.findAll()).rejects.toThrow('localStorage is not available')

      // Restore localStorage mock
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
        writable: true
      })
    })
  })

  describe('findById', () => {
    it('should return conversation when found', async () => {
      const storedData = JSON.stringify([{
        id: 'conv-1',
        title: 'Test Conversation',
        messages: [],
        createdAt: '2023-01-01T09:00:00.000Z',
        updatedAt: '2023-01-01T10:00:00.000Z'
      }])
      localStorageMock.getItem.mockReturnValue(storedData)

      const result = await repository.findById(new ConversationId('conv-1'))

      expect(result).not.toBeNull()
      expect(result!.id.toString()).toBe('conv-1')
      expect(result!.title).toBe('Test Conversation')
    })

    it('should return null when conversation not found', async () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify([]))

      const result = await repository.findById(new ConversationId('non-existent'))

      expect(result).toBeNull()
    })

    it('should throw StorageError on localStorage failure', async () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error')
      })

      await expect(repository.findById(new ConversationId('conv-1'))).rejects.toThrow(StorageError)
    })
  })

  describe('save', () => {
    it('should save new conversation', async () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify([]))

      await repository.save(testConversation)

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'chatgpt-clone-conversations',
        expect.stringContaining('"id":"conv-1"')
      )
    })

    it('should update existing conversation', async () => {
      const existingData = JSON.stringify([{
        id: 'conv-1',
        title: 'Old Title',
        messages: [],
        createdAt: '2023-01-01T09:00:00.000Z',
        updatedAt: '2023-01-01T09:30:00.000Z'
      }])
      localStorageMock.getItem.mockReturnValue(existingData)

      await repository.save(testConversation)

      const savedData = localStorageMock.setItem.mock.calls[0][1]
      const parsedData = JSON.parse(savedData)
      
      expect(parsedData).toHaveLength(1)
      expect(parsedData[0].id).toBe('conv-1')
      expect(parsedData[0].title).toBe('Test Conversation')
    })

    it('should throw StorageQuotaExceededError when quota is exceeded', async () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify([]))
      const quotaError = new Error('QuotaExceededError')
      quotaError.name = 'QuotaExceededError'
      localStorageMock.setItem.mockImplementation(() => {
        throw quotaError
      })

      await expect(repository.save(testConversation)).rejects.toThrow(StorageQuotaExceededError)
    })

    it('should throw StorageError on other localStorage failures', async () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify([]))
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage error')
      })

      await expect(repository.save(testConversation)).rejects.toThrow(StorageError)
    })
  })

  describe('delete', () => {
    it('should delete existing conversation', async () => {
      const storedData = JSON.stringify([
        {
          id: 'conv-1',
          title: 'Test Conversation',
          messages: [],
          createdAt: '2023-01-01T09:00:00.000Z',
          updatedAt: '2023-01-01T10:00:00.000Z'
        },
        {
          id: 'conv-2',
          title: 'Another Conversation',
          messages: [],
          createdAt: '2023-01-01T09:00:00.000Z',
          updatedAt: '2023-01-01T10:00:00.000Z'
        }
      ])
      localStorageMock.getItem.mockReturnValue(storedData)

      await repository.delete(new ConversationId('conv-1'))

      const savedData = localStorageMock.setItem.mock.calls[0][1]
      const parsedData = JSON.parse(savedData)
      
      expect(parsedData).toHaveLength(1)
      expect(parsedData[0].id).toBe('conv-2')
    })

    it('should not throw error when deleting non-existent conversation', async () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify([]))

      await expect(repository.delete(new ConversationId('non-existent'))).resolves.not.toThrow()
    })

    it('should throw StorageError on localStorage failure', async () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error')
      })

      await expect(repository.delete(new ConversationId('conv-1'))).rejects.toThrow(StorageError)
    })
  })

  describe('exists', () => {
    it('should return true when conversation exists', async () => {
      const storedData = JSON.stringify([{
        id: 'conv-1',
        title: 'Test Conversation',
        messages: [],
        createdAt: '2023-01-01T09:00:00.000Z',
        updatedAt: '2023-01-01T10:00:00.000Z'
      }])
      localStorageMock.getItem.mockReturnValue(storedData)

      const result = await repository.exists(new ConversationId('conv-1'))

      expect(result).toBe(true)
    })

    it('should return false when conversation does not exist', async () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify([]))

      const result = await repository.exists(new ConversationId('non-existent'))

      expect(result).toBe(false)
    })

    it('should throw StorageError on localStorage failure', async () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error')
      })

      await expect(repository.exists(new ConversationId('conv-1'))).rejects.toThrow(StorageError)
    })
  })

  describe('clear', () => {
    it('should clear all conversations', async () => {
      await repository.clear()

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('chatgpt-clone-conversations')
    })
  })

  describe('count', () => {
    it('should return correct count of conversations', async () => {
      const storedData = JSON.stringify([
        { id: 'conv-1', title: 'Conv 1', messages: [], createdAt: '2023-01-01T09:00:00.000Z', updatedAt: '2023-01-01T10:00:00.000Z' },
        { id: 'conv-2', title: 'Conv 2', messages: [], createdAt: '2023-01-01T09:00:00.000Z', updatedAt: '2023-01-01T10:00:00.000Z' }
      ])
      localStorageMock.getItem.mockReturnValue(storedData)

      const result = await repository.count()

      expect(result).toBe(2)
    })

    it('should return 0 when no conversations exist', async () => {
      localStorageMock.getItem.mockReturnValue(null)

      const result = await repository.count()

      expect(result).toBe(0)
    })
  })

  describe('getStorageInfo', () => {
    it('should return storage information', () => {
      const result = repository.getStorageInfo()

      expect(result).toHaveProperty('used')
      expect(result).toHaveProperty('available')
      expect(result).toHaveProperty('total')
      expect(typeof result.used).toBe('number')
      expect(typeof result.available).toBe('number')
      expect(typeof result.total).toBe('number')
    })

    it('should return zeros when localStorage is not available', () => {
      Object.defineProperty(window, 'localStorage', {
        value: undefined,
        writable: true
      })

      const result = repository.getStorageInfo()

      expect(result).toEqual({ used: 0, available: 0, total: 0 })

      // Restore localStorage mock
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
        writable: true
      })
    })
  })

  describe('data serialization/deserialization', () => {
    it('should correctly serialize and deserialize conversations with messages', async () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify([]))

      // Save conversation
      await repository.save(testConversation)

      // Get the saved data
      const savedData = localStorageMock.setItem.mock.calls[0][1]
      
      // Mock the saved data as if it was retrieved from localStorage
      localStorageMock.getItem.mockReturnValue(savedData)

      // Retrieve the conversation
      const retrieved = await repository.findById(testConversation.id)

      expect(retrieved).not.toBeNull()
      expect(retrieved!.id.toString()).toBe(testConversation.id.toString())
      expect(retrieved!.title).toBe(testConversation.title)
      expect(retrieved!.getMessages()).toHaveLength(1)
      expect(retrieved!.getMessages()[0].content).toBe(testMessage.content)
      expect(retrieved!.getMessages()[0].role).toBe(testMessage.role)
    })

    it('should throw error for invalid message role during deserialization', async () => {
      const invalidData = JSON.stringify([{
        id: 'conv-1',
        title: 'Test Conversation',
        messages: [{
          id: 'msg-1',
          content: 'Hello',
          role: 'invalid-role',
          timestamp: '2023-01-01T10:00:00.000Z'
        }],
        createdAt: '2023-01-01T09:00:00.000Z',
        updatedAt: '2023-01-01T10:00:00.000Z'
      }])
      localStorageMock.getItem.mockReturnValue(invalidData)

      await expect(repository.findAll()).rejects.toThrow(StorageError)
    })
  })
})