"use client";

import React, { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Message } from "./message";
import { MessageDTO } from "../../../application/dtos/message.dto";
import { cn } from "@/lib/utils";
import { Avatar } from "@radix-ui/react-avatar";
import { Bot } from "lucide-react";

interface MessageListProps {
  messages: MessageDTO[];
  isLoading?: boolean;
  className?: string;
}

export function MessageList({
  messages,
  isLoading = false,
  className,
}: MessageListProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (
      messagesEndRef.current &&
      typeof messagesEndRef.current.scrollIntoView === "function"
    ) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <ScrollArea ref={scrollAreaRef} className={cn("flex-1 h-full", className)}>
      <div className="space-y-1">
        {messages.length === 0 && !isLoading ? (
          <div className="flex items-center justify-center h-full min-h-[200px]">
            <div className="text-center text-foreground/60">
              <div className="text-lg font-heading mb-2">
                Start a conversation
              </div>
              <div className="text-sm font-base">
                Send a message to begin chatting
              </div>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <Message key={message.id} message={message} />
          ))
        )}

        {isLoading && (
          <div className="flex gap-3 p-4">
            <div className="h-8 w-8 shrink-0 rounded-full bg-secondary-background border-2 border-border flex items-center justify-center">
              <Avatar>
                <Bot className="h-4 w-4" />
              </Avatar>
            </div>
            <div className="bg-secondary-background border-2 border-border rounded-base p-4 max-w-xs">
              <div className="flex flex-col justify-center items-center gap-1">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span className="text-xs font-base text-foreground/60 ml-2">AI is typing...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
}
