import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Message } from '../message'
import { MessageDTO } from '../../../../application/dtos/message.dto'

describe('Message', () => {
  const mockUserMessage: MessageDTO = {
    id: '1',
    content: 'Hello, how are you?',
    role: 'user',
    timestamp: '2024-01-01T12:00:00Z'
  }

  const mockAssistantMessage: MessageDTO = {
    id: '2',
    content: 'I am doing well, thank you for asking!',
    role: 'assistant',
    timestamp: '2024-01-01T12:01:00Z'
  }

  it('renders user message correctly', () => {
    render(<Message message={mockUserMessage} />)
    
    expect(screen.getByText('Hello, how are you?')).toBeInTheDocument()
    expect(screen.getByText('You')).toBeInTheDocument()
    expect(screen.getByLabelText('User message')).toBeInTheDocument()
  })

  it('renders assistant message correctly', () => {
    render(<Message message={mockAssistantMessage} />)
    
    expect(screen.getByText('I am doing well, thank you for asking!')).toBeInTheDocument()
    expect(screen.getByText('Assistant')).toBeInTheDocument()
    expect(screen.getByLabelText('Assistant message')).toBeInTheDocument()
  })

  it('displays timestamp correctly', () => {
    render(<Message message={mockUserMessage} />)
    
    // Check that some time format is displayed (exact format may vary by locale)
    expect(screen.getByText(/\d{1,2}:\d{2}/)).toBeInTheDocument()
  })

  it('renders code blocks correctly', () => {
    const messageWithCode: MessageDTO = {
      id: '3',
      content: 'Here is some code:\n```javascript\nconsole.log("Hello World");\n```',
      role: 'assistant',
      timestamp: '2024-01-01T12:02:00Z'
    }

    render(<Message message={messageWithCode} />)
    
    expect(screen.getByText('Here is some code:')).toBeInTheDocument()
    expect(screen.getByText('console.log("Hello World");')).toBeInTheDocument()
  })

  it('renders inline code correctly', () => {
    const messageWithInlineCode: MessageDTO = {
      id: '4',
      content: 'Use the `console.log()` function to debug.',
      role: 'assistant',
      timestamp: '2024-01-01T12:03:00Z'
    }

    render(<Message message={messageWithInlineCode} />)
    
    expect(screen.getByText(/Use the/)).toBeInTheDocument()
    expect(screen.getByText('console.log()')).toBeInTheDocument()
    expect(screen.getByText(/function to debug/)).toBeInTheDocument()
  })

  it('applies correct styling for user messages', () => {
    render(<Message message={mockUserMessage} />)
    
    const messageContainer = screen.getByLabelText('User message')
    expect(messageContainer).toHaveClass('flex-row-reverse')
  })

  it('applies correct styling for assistant messages', () => {
    render(<Message message={mockAssistantMessage} />)
    
    const messageContainer = screen.getByLabelText('Assistant message')
    expect(messageContainer).not.toHaveClass('flex-row-reverse')
  })

  it('accepts custom className', () => {
    render(<Message message={mockUserMessage} className="custom-class" />)
    
    const messageContainer = screen.getByLabelText('User message')
    expect(messageContainer).toHaveClass('custom-class')
  })
})