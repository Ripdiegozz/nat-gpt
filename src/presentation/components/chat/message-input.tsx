"use client";

import React, { useState, useRef, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import { ModelSelector } from "../common";
import { AudioRecorder } from "../common/audio-recorder";
import type { AudioRecording } from "../../hooks/use-audio-recorder";
import { useI18n } from "@/src/lib/i18n";

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  onSendAudio?: (audioBlob: Blob, audioDuration: number) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function MessageInput({
  onSendMessage,
  onSendAudio,
  disabled = false,
  placeholder,
  className,
}: MessageInputProps) {
  const { t } = useI18n();
  const [message, setMessage] = useState("");
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Use i18n placeholder if none provided
  const inputPlaceholder = placeholder || t("chat.messageInput");

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

  const handleSendAudio = (recording: AudioRecording) => {
    if (onSendAudio && !disabled) {
      onSendAudio(recording.blob, recording.duration);
      setShowAudioRecorder(false);
    }
  };

  const handleAudioRecorderClose = () => {
    setShowAudioRecorder(false);
  };

  const toggleAudioRecorder = () => {
    setShowAudioRecorder(!showAudioRecorder);
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
        <div className="text-xs text-foreground/70 font-base">
          {t("chat.aiModel")}:
        </div>
        <ModelSelector compact />
      </div>

      {/* Input row */}
      <div className="flex gap-2 p-3 sm:p-4">
        {showAudioRecorder ? (
          /* Audio Recording Interface - replaces text input completely */
          <div className="flex-1">
            <AudioRecorder
              onSendAudio={handleSendAudio}
              onCancel={handleAudioRecorderClose}
              className="w-full"
            />
          </div>
        ) : (
          /* Text Input Interface */
          <div className="flex-1 relative min-w-0">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder={inputPlaceholder}
              disabled={disabled}
              className="min-h-[44px] max-h-[120px] resize-none pr-12 sm:pr-16 text-base touch-target"
              rows={1}
              style={{ fontSize: "16px" }} // Prevent zoom on iOS
            />
            <div className="absolute bottom-2 right-2 text-xs text-foreground/50 font-base hidden sm:block">
              {disabled ? t("common.loading") : t("chat.enterToSend")}
            </div>
          </div>
        )}

        {/* Audio recorder toggle button - only show when NOT in audio mode */}
        {!showAudioRecorder && (
          <Button
            onClick={toggleAudioRecorder}
            disabled={disabled}
            variant="neutral"
            size="icon"
            className="h-[44px] w-[44px] shrink-0 touch-manipulation touch-target"
            aria-label={t("chat.voiceInput")}
          >
            <Mic className="h-4 w-4" />
          </Button>
        )}

        {/* Send button - only show when using text input */}
        {!showAudioRecorder && (
          <Button
            onClick={handleSend}
            disabled={disabled || !isMessageValid}
            size="icon"
            className="h-[44px] w-[44px] shrink-0 touch-manipulation touch-target"
            aria-label={t("chat.sendMessage")}
          >
            <Send className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
