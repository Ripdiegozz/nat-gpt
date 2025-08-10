"use client";

import React, { useState, useRef, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { ModelSelector } from "../common";

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function MessageInput({
  onSendMessage,
  disabled = false,
  placeholder = "Type your message...",
  className,
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && !disabled) {
      onSendMessage(trimmedMessage);
      setMessage("");
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter (without Shift)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }

    // Allow Shift+Enter for new lines
    if (e.key === "Enter" && e.shiftKey) {
      // Let the default behavior happen (new line)
      return;
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);

    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
  };

  const isMessageValid = message.trim().length > 0;

  return (
    <div className={cn("border-t-2 border-border bg-background", className)}>
      {/* Model selector row */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2 border-b border-border/30">
        <div className="text-xs text-foreground/70 font-base">AI Model:</div>
        <ModelSelector compact />
      </div>

      {/* Input row */}
      <div className="flex gap-2 p-3 sm:p-4">
        <div className="flex-1 relative min-w-0">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="min-h-[44px] max-h-[120px] resize-none pr-12 sm:pr-16 text-base touch-target"
            rows={1}
            style={{ fontSize: "16px" }} // Prevent zoom on iOS
          />
          <div className="absolute bottom-2 right-2 text-xs text-foreground/50 font-base hidden sm:block">
            {disabled
              ? "Sending..."
              : "Enter to send, Shift+Enter for new line"}
          </div>
        </div>

        <Button
          onClick={handleSend}
          disabled={disabled || !isMessageValid}
          size="icon"
          className="h-[44px] w-[44px] shrink-0 touch-manipulation touch-target"
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
