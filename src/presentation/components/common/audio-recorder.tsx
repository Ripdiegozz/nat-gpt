"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Mic, Square, Play, Pause, Trash2, Send } from "lucide-react";
import {
  useAudioRecorder,
  type AudioRecording,
} from "../../hooks/use-audio-recorder";
import { AudioPlayer } from "./audio-player";
import { Slider } from "@/components/ui/slider";
import { LanguageSelector } from "./language-selector";
import { useI18n } from "@/src/lib/i18n";

interface AudioRecorderProps {
  onSendAudio?: (recording: AudioRecording) => void;
  onCancel?: () => void;
  className?: string;
  maxDuration?: number; // in seconds
}

export function AudioRecorder({
  onSendAudio,
  onCancel,
  className,
  maxDuration = 300, // 5 minutes default
}: AudioRecorderProps) {
  const { t } = useI18n();
  const [recording, setRecording] = useState<AudioRecording | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const {
    isRecording,
    isPaused,
    recordingTime,
    audioLevel,
    error,
    isWarmingUp,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    cancelRecording,
    formatTime,
    isSupported,
  } = useAudioRecorder();

  const handleStartRecording = async () => {
    setRecording(null);
    setIsPreviewMode(false);
    await startRecording();
  };

  const handleStopRecording = async () => {
    const result = await stopRecording();
    if (result) {
      setRecording(result);
      setIsPreviewMode(true);
    }
  };

  const handleCancelRecording = () => {
    cancelRecording();
    setRecording(null);
    setIsPreviewMode(false);
    onCancel?.();
  };

  const handleSendRecording = () => {
    if (recording && onSendAudio) {
      onSendAudio(recording);
      setRecording(null);
      setIsPreviewMode(false);
    }
  };

  const handleDeleteRecording = () => {
    if (recording) {
      URL.revokeObjectURL(recording.url);
      setRecording(null);
      setIsPreviewMode(false);
    }
  };

  if (!isSupported) {
    return (
      <div
        className={cn(
          "p-4 bg-secondary-background border-2 border-border rounded-base",
          className
        )}
      >
        <div className="text-center text-foreground/60">
          <Mic className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <div className="text-sm">
            {t("audio.audioNotSupported")}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          "p-4 bg-red-50 border-2 border-red-200 rounded-base",
          className
        )}
      >
        <div className="text-center text-red-600">
          <div className="text-sm">⚠️ {error}</div>
          <Button
            variant="neutral"
            size="sm"
            onClick={handleCancelRecording}
            className="mt-2"
          >
            {t("common.close")}
          </Button>
        </div>
      </div>
    );
  }

  // Preview mode - show recorded audio
  if (isPreviewMode && recording) {
    return (
      <div
        className={cn(
          "p-4 bg-secondary-background border-2 border-border rounded-base space-y-3",
          className
        )}
      >
        <div className="flex items-center justify-between">
          <div className="text-sm font-base text-foreground">
            {t("chat.audioRecording")} ({formatTime(recording.duration)})
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="neutral"
              size="sm"
              onClick={handleDeleteRecording}
              className="text-red-500 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <AudioPlayer src={recording.url} duration={recording.duration} />

        <div className="flex items-center gap-2 pt-2">
          <Button
            variant="neutral"
            onClick={() => setIsPreviewMode(false)}
            className="flex-1"
          >
            {t("chat.startRecording")}
          </Button>
          <Button onClick={handleSendRecording} className="flex-1">
            <Send className="h-4 w-4 mr-2" />
            {t("chat.sendRecording")}
          </Button>
        </div>
      </div>
    );
  }

  // Warm-up mode - preparing microphone
  if (isWarmingUp) {
    return (
      <div
        className={cn(
          "p-4 bg-secondary-background border-2 border-border rounded-base",
          className
        )}
      >
        <div className="space-y-4">
          {/* Warm-up indicator */}
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full animate-pulse bg-blue-500 shadow-lg shadow-blue-500/50" />
              <span className="text-sm font-medium text-blue-600">
                {t("common.processing")}
              </span>
            </div>
          </div>

          {/* Audio level visualization during warm-up */}
          <div className="space-y-2">
            <div className="text-center text-xs text-foreground/60">
              {t("audio.volume")}
            </div>
            <div className="px-2">
              <Slider
                value={[audioLevel * 100]}
                max={100}
                step={0.1}
                className="w-full [&>span[role=slider]]:h-3 [&>span[role=slider]]:w-3 [&>span[role=slider]]:transition-all [&>span[role=slider]]:duration-150 [&>span[role=slider]]:ease-out"
                disabled
              />
            </div>
          </div>

          {/* Cancel button during warm-up */}
          <div className="flex items-center justify-center">
            <Button
              variant="neutral"
              onClick={handleCancelRecording}
              className="text-red-500 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t("common.cancel")}
            </Button>
          </div>

          <div className="text-center text-xs text-foreground/60">
            {t("common.processing")}...
          </div>
        </div>
      </div>
    );
  }

  // Recording mode
  if (isRecording) {
    const isNearMaxDuration = recordingTime >= maxDuration * 0.9;
    const isAtMaxDuration = recordingTime >= maxDuration;

    return (
      <div
        className={cn(
          "p-4 bg-secondary-background border-2 border-border rounded-base",
          className
        )}
      >
        <div className="space-y-4">
          {/* Recording indicator */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "w-4 h-4 rounded-full animate-pulse shadow-lg",
                  isPaused
                    ? "bg-yellow-500 shadow-yellow-500/50"
                    : "bg-red-500 shadow-red-500/50"
                )}
              />
              <span
                className={cn(
                  "text-sm font-medium",
                  isPaused ? "text-yellow-600" : "text-red-600"
                )}
              >
                {isPaused ? t("audio.pause") : t("common.recording")}
              </span>
            </div>

            <div
              className={cn(
                "text-xl font-mono font-bold px-3 py-1 rounded-full border-2",
                isNearMaxDuration
                  ? "text-red-500 border-red-500 bg-red-50"
                  : "text-foreground border-border bg-secondary-background"
              )}
            >
              {formatTime(recordingTime)}
            </div>
          </div>

          {/* Audio level visualization */}
          <div className="space-y-2">
            <div className="text-center text-xs text-foreground/60">
              {t("audio.volume")}
            </div>
            <div className="px-2">
              <Slider
                value={[audioLevel * 100]}
                max={100}
                step={0.1}
                className="w-full [&>span[role=slider]]:h-3 [&>span[role=slider]]:w-3 [&>span[role=slider]]:transition-all [&>span[role=slider]]:duration-150 [&>span[role=slider]]:ease-out"
                disabled
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="neutral"
              onClick={handleCancelRecording}
              className="text-red-500 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </Button>

            {!isPaused ? (
              <Button
                variant="neutral"
                onClick={pauseRecording}
                disabled={isAtMaxDuration}
              >
                <Pause className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="neutral"
                onClick={resumeRecording}
                disabled={isAtMaxDuration}
              >
                <Play className="h-4 w-4" />
              </Button>
            )}

            <Button onClick={handleStopRecording} disabled={recordingTime < 1}>
              <Square className="h-4 w-4" />
            </Button>
          </div>

          {isAtMaxDuration && (
            <div className="text-center text-sm text-red-500">
              {t("chat.recordingDuration")} máxima alcanzada
            </div>
          )}
        </div>
      </div>
    );
  }

  // Initial state - show record button
  return (
    <div
      className={cn(
        "p-4 bg-secondary-background border-2 border-border rounded-base",
        className
      )}
    >
      <div className="space-y-4">
        {/* Language selector */}
        <LanguageSelector type="transcription" />
        
        {/* Record button */}
        <div className="text-center space-y-3">
          <Button onClick={handleStartRecording} size="lg" className="w-full">
            <Mic className="h-5 w-5 mr-2" />
            {t("chat.startRecording")}
          </Button>

          <div className="text-xs text-foreground/60">
            {t("chat.voiceInput")}
          </div>
        </div>
      </div>
    </div>
  );
}
