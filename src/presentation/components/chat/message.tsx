import React from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageDTO } from "../../../application/dtos/message.dto";
import { User, Bot } from "lucide-react";
import { useUser } from "@clerk/nextjs";

interface MessageProps {
  message: MessageDTO;
  className?: string;
}

export function Message({ message, className }: MessageProps) {
  const isUser = message.role === "user";
  const { user } = useUser();

  return (
    <div
      className={cn(
        "flex gap-3 px-4 py-2 max-w-full",
        isUser ? "flex-row-reverse justify-start" : "flex-row justify-start",
        className
      )}
      role="article"
      aria-label={`${isUser ? "User" : "Assistant"} message`}
    >
      {/* Avatar */}
      <Avatar className="h-8 w-8 shrink-0">
        {isUser && user?.imageUrl && (
          <AvatarImage
            src={user.imageUrl}
            alt={user.fullName || user.username || "User"}
          />
        )}
        <AvatarFallback
          className={cn(
            "text-xs font-heading",
            isUser
              ? "bg-main text-main-foreground"
              : "bg-secondary-background text-foreground"
          )}
        >
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>

      {/* Message Bubble */}
      <div
        className={cn(
          "max-w-[80%] p-3 rounded-2xl shadow-sm",
          isUser
            ? "bg-main text-main-foreground rounded-br-md border border-border"
            : "bg-secondary-background text-foreground border border-border rounded-bl-md"
        )}
      >
        <div className="text-sm font-base whitespace-pre-wrap break-words">
          <MessageContent content={message.content} />
        </div>
        <div
          className={cn(
            "text-xs mt-2 flex",
            isUser ? "justify-end opacity-70" : "justify-start opacity-60"
          )}
        >
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
}

interface MessageContentProps {
  content: string;
}

function MessageContent({ content }: MessageContentProps) {
  // Simple markdown-like rendering for basic formatting
  const renderContent = (text: string) => {
    // Split by code blocks first
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        parts.push(
          <span key={lastIndex}>
            {renderInlineFormatting(text.slice(lastIndex, match.index))}
          </span>
        );
      }

      // Add code block
      const language = match[1] || "text";
      const code = match[2];
      parts.push(
        <pre key={match.index} className="my-2">
          <code className={`language-${language}`}>{code}</code>
        </pre>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(
        <span key={lastIndex}>
          {renderInlineFormatting(text.slice(lastIndex))}
        </span>
      );
    }

    return parts.length > 0 ? parts : renderInlineFormatting(text);
  };

  const renderInlineFormatting = (text: string) => {
    // Handle inline code
    const inlineCodeRegex = /`([^`]+)`/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = inlineCodeRegex.exec(text)) !== null) {
      // Add text before inline code
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }

      // Add inline code
      parts.push(
        <code key={match.index} className="inline">
          {match[1]}
        </code>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  return <div>{renderContent(content)}</div>;
}

Message.displayName = "Message";
