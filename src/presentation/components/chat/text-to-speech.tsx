"use client";

import React, { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, Loader2, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAudioSettings } from "../../stores/chat-settings.store";
import { useI18n } from "@/src/lib/i18n";

interface TextToSpeechProps {
  text: string;
  className?: string;
  size?: "sm" | "default" | "lg";
}

export function TextToSpeech({
  text,
  className,
  size = "sm",
}: TextToSpeechProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const { selectedVoice, enableTTS } = useAudioSettings();
  const { t } = useI18n();

  const generateAndPlaySpeech = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Clean up previous audio
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }

      // Generate TTS
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text, voice: selectedVoice }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate speech");
      }

      // Create audio blob and URL
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      audioUrlRef.current = audioUrl;

      // Create and play audio
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("TTS error:", error);
      setError(
        error instanceof Error ? error.message : "Failed to generate speech"
      );
    } finally {
      setIsLoading(false);
    }
  }, [text, selectedVoice]);

  const togglePlayback = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else if (audioUrlRef.current) {
        audioRef.current.play();
        setIsPlaying(true);
      } else {
        generateAndPlaySpeech();
      }
    } else {
      generateAndPlaySpeech();
    }
  }, [isPlaying, generateAndPlaySpeech]);

  const handleAudioEnded = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handleAudioError = useCallback(() => {
    setIsPlaying(false);
    setError("Failed to play audio");
  }, []);

  // Don't render if text is too short, empty, or TTS is disabled
  if (!text || text.trim().length < 10 || !enableTTS) {
    return null;
  }

  return (
    <>
      <Button
        onClick={togglePlayback}
        disabled={isLoading}
        variant="neutral"
        size={size}
        className={cn(
          "opacity-90 hover:opacity-100 transition-all bg-secondary-background hover:bg-main hover:text-main-foreground border border-border",
          error && "text-red-500 border-red-500",
          isPlaying && "bg-main text-main-foreground opacity-100",
          className
        )}
        aria-label={isPlaying ? t("audio.pauseSpeech") : t("audio.playSpeech")}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : error ? (
          <VolumeX className="h-4 w-4" />
        ) : (
          <Volume2 className="h-4 w-4" />
        )}
      </Button>

      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onEnded={handleAudioEnded}
        onError={handleAudioError}
        className="hidden"
        preload="none"
      />
    </>
  );
}
