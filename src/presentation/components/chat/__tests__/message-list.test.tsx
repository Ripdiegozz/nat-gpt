import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MessageList } from '../message-list'
import { MessageDTO } from '../../../../application/dtos/message.dto'

describe('MessageList', () => {
  const mockMessages: MessageDTO[] = [
    {
      id: '1',
      content: 'Hello!',
      role: 'user',
      timestamp: '2024-01-01T12:00:00Z'
    },
    {
      id: '2',
      content: 'Hi there! How can I help you?',
      role: 'assistant',
      timestamp: '2024-01-01T12:01:00Z'
    }
  ]

  it('renders messages correctly', () => {
    render(<MessageList messages={mockMessages} />)
    
    expect(screen.getByText('Hello!')).toBeInTheDocument()
    expect(screen.getByText('Hi there! How can I help you?')).toBeInTheDocument()
  })

  it('shows empty state when no messages', () => {
    render(<MessageList messages={[]} />)
    
    expect(screen.getByText('Start a conversation')).toBeInTheDocument()
    expect(screen.getByText('Send a message to begin chatting')).toBeInTheDocument()
  })

  it('shows loading indicator when isLoading is true', () => {
    render(<MessageList messages={mockMessages} isLoading={true} />)
    
    expect(screen.getByText('AI is thinking...')).toBeInTheDocument()
  })

  it('does not show empty state when loading', () => {
    render(<MessageList messages={[]} isLoading={true} />)
    
    expect(screen.queryByText('Start a conversation')).not.toBeInTheDocument()
    expect(screen.getByText('AI is thinking...')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(<MessageList messages={mockMessages} className="custom-class" />)
    
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('renders messages in correct order', () => {
    render(<MessageList messages={mockMessages} />)
    
    const messages = screen.getAllByRole('article')
    expect(messages).toHaveLength(2)
    
    // First message should be the user message
    expect(messages[0]).toHaveAttribute('aria-label', 'User message')
    // Second message should be the assistant message
    expect(messages[1]).toHaveAttribute('aria-label', 'Assistant message')
  })
})