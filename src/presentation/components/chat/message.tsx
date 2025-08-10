import React from 'react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { MessageDTO } from '../../../application/dtos/message.dto'
import { User, Bot } from 'lucide-react'

interface MessageProps {
  message: MessageDTO
  className?: string
}

export function Message({ message, className }: MessageProps) {
  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'

  return (
    <div
      className={cn(
        'flex gap-3 p-4 group',
        isUser && 'flex-row-reverse',
        className
      )}
      role="article"
      aria-label={`${isUser ? 'User' : 'Assistant'} message`}
    >
      {/* Avatar */}
      <Avatar className={cn(
        'flex-shrink-0',
        isUser ? 'bg-main text-main-foreground' : 'bg-secondary-background'
      )}>
        <AvatarFallback>
          {isUser ? (
            <User className="h-4 w-4" />
          ) : (
            <Bot className="h-4 w-4" />
          )}
        </AvatarFallback>
      </Avatar>

      {/* Message Content */}
      <div className={cn(
        'flex-1 space-y-2 overflow-hidden',
        isUser && 'text-right'
      )}>
        {/* Message Header */}
        <div className={cn(
          'flex items-center gap-2 text-sm text-foreground/70',
          isUser && 'justify-end'
        )}>
          <span className="font-heading">
            {isUser ? 'You' : 'Assistant'}
          </span>
          <span className="text-xs">
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>

        {/* Message Text */}
        <div className={cn(
          'prose prose-sm max-w-none',
          'prose-p:leading-relaxed prose-p:m-0',
          'prose-pre:bg-secondary-background prose-pre:border-2 prose-pre:border-border prose-pre:rounded-base',
          'prose-code:bg-secondary-background prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:border prose-code:border-border',
          isUser && 'text-right'
        )}>
          <MessageContent content={message.content} />
        </div>
      </div>
    </div>
  )
}

interface MessageContentProps {
  content: string
}

function MessageContent({ content }: MessageContentProps) {
  // Simple markdown-like rendering for basic formatting
  const renderContent = (text: string) => {
    // Split by code blocks first
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
    const parts = []
    let lastIndex = 0
    let match

    while ((match = codeBlockRegex.exec(text)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        parts.push(
          <span key={lastIndex}>
            {renderInlineFormatting(text.slice(lastIndex, match.index))}
          </span>
        )
      }

      // Add code block
      const language = match[1] || 'text'
      const code = match[2]
      parts.push(
        <pre key={match.index} className="my-2">
          <code className={`language-${language}`}>
            {code}
          </code>
        </pre>
      )

      lastIndex = match.index + match[0].length
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(
        <span key={lastIndex}>
          {renderInlineFormatting(text.slice(lastIndex))}
        </span>
      )
    }

    return parts.length > 0 ? parts : renderInlineFormatting(text)
  }

  const renderInlineFormatting = (text: string) => {
    // Handle inline code
    const inlineCodeRegex = /`([^`]+)`/g
    const parts = []
    let lastIndex = 0
    let match

    while ((match = inlineCodeRegex.exec(text)) !== null) {
      // Add text before inline code
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index))
      }

      // Add inline code
      parts.push(
        <code key={match.index} className="inline">
          {match[1]}
        </code>
      )

      lastIndex = match.index + match[0].length
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex))
    }

    return parts.length > 0 ? parts : text
  }

  return <div className="whitespace-pre-wrap">{renderContent(content)}</div>
}

Message.displayName = 'Message'