"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Mic,
  MicOff,
  Square,
  Play,
  Pause,
  Loader2,
  Send,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguageSettings } from "../../stores/language-settings.store";

interface AudioRecorderProps {
  onTranscription: (text: string) => void;
  onClose?: () => void;
  disabled?: boolean;
  className?: string;
}

export function AudioRecorder({
  onTranscription,
  onClose,
  disabled,
  className,
}: AudioRecorderProps) {
  const { transcriptionLanguage } = useLanguageSettings();
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isActuallyPlaying, setIsActuallyPlaying] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mimeTypeRef = useRef<string>("audio/webm");

  const startRecording = useCallback(async () => {
    try {
      setError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      setAudioStream(stream); // Store stream for waveform analysis

      // Set up MediaRecorder with better format selection
      let mimeType = "audio/webm";
      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        mimeType = "audio/webm;codecs=opus";
      } else if (MediaRecorder.isTypeSupported("audio/webm")) {
        mimeType = "audio/webm";
      } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
        mimeType = "audio/mp4";
      } else if (MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")) {
        mimeType = "audio/ogg;codecs=opus";
      }

      mimeTypeRef.current = mimeType;
      const mediaRecorder = new MediaRecorder(stream, { mimeType });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        setAudioStream(null); // Clear stream when stopped
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      setRecordingDuration(0);

      // Start duration counter
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error starting recording:", error);
      setError("Failed to access microphone. Please check permissions.");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      // Stop all tracks from the audio stream
      if (audioStream) {
        audioStream.getTracks().forEach((track) => {
          track.stop();
        });
        setAudioStream(null);
      }

      // Create audio blob and URL
      setTimeout(() => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mimeTypeRef.current,
        });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
      }, 100);
    }
  }, [isRecording, audioStream]);

  const playRecording = useCallback(() => {
    if (audioUrl && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  }, [audioUrl, isPlaying]);

  const transcribeAudio = useCallback(async () => {
    if (!audioUrl) return;

    try {
      setIsTranscribing(true);
      setError(null);

      // Convert audio URL to blob
      const response = await fetch(audioUrl);
      const audioBlob = await response.blob();

      // Create form data
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");

      // Add selected language for transcription
      if (transcriptionLanguage) {
        formData.append("language", transcriptionLanguage);
      }

      // Send to transcription API
      const transcribeResponse = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!transcribeResponse.ok) {
        const errorData = await transcribeResponse.json();
        throw new Error(errorData.error || "Transcription failed");
      }

      const { text } = await transcribeResponse.json();

      // Send transcription first, then clear
      if (text.trim()) {
        onTranscription(text.trim());
        // Clear the recording after successful transcription
        clearRecording();
      } else {
        throw new Error("No text was transcribed from the audio");
      }
    } catch (error) {
      console.error("Transcription error:", error);
      setError(
        error instanceof Error ? error.message : "Failed to transcribe audio"
      );
    } finally {
      setIsTranscribing(false);
    }
  }, [audioUrl, onTranscription]);

  const clearRecording = useCallback(() => {
    // Stop recording if currently recording
    if (isRecording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
    }

    // Stop all tracks from the audio stream
    if (audioStream) {
      audioStream.getTracks().forEach((track) => {
        track.stop();
      });
      setAudioStream(null);
    }

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setIsPlaying(false);
    setIsActuallyPlaying(false);
    setRecordingDuration(0);
    setCurrentTime(0);
    setError(null);
    audioChunksRef.current = [];
  }, [audioUrl, isRecording, audioStream]);

  // Cleanup effect to stop stream when component unmounts
  useEffect(() => {
    return () => {
      // Stop any ongoing recording
      if (isRecording && mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }

      // Stop all tracks from the audio stream
      if (audioStream) {
        audioStream.getTracks().forEach((track) => {
          track.stop();
        });
      }

      // Clear any intervals
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }

      // Revoke object URLs
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [isRecording, audioStream, audioUrl]);

  return (
    <div className={cn("flex flex-col gap-4 w-full max-w-full", className)}>
      {/* Audio Recording Indicator */}
      <div className="flex items-center gap-3 w-full min-h-[60px]">
        {/* Simple Recording Indicator */}
        <div className="flex-1 flex items-center justify-center gap-3 p-4 bg-secondary-background border-2 border-border rounded-base">
          {isRecording ? (
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                <div className="w-2 h-6 bg-red-500 rounded-sm animate-pulse"></div>
                <div
                  className="w-2 h-4 bg-red-400 rounded-sm animate-pulse"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-8 bg-red-500 rounded-sm animate-pulse"
                  style={{ animationDelay: "0.2s" }}
                ></div>
                <div
                  className="w-2 h-3 bg-red-400 rounded-sm animate-pulse"
                  style={{ animationDelay: "0.3s" }}
                ></div>
                <div
                  className="w-2 h-7 bg-red-500 rounded-sm animate-pulse"
                  style={{ animationDelay: "0.4s" }}
                ></div>
              </div>
              <span className="text-sm text-foreground/70">
                {Math.floor(recordingDuration / 60)}:
                {(recordingDuration % 60).toString().padStart(2, "0")}
              </span>
            </div>
          ) : audioUrl ? (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-foreground/70">
                Recording ready
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
              <span className="text-sm text-foreground/50">
                Ready to record
              </span>
            </div>
          )}
        </div>

        {/* Recording/Stop Button */}
        {!audioUrl && (
          <Button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={disabled || isTranscribing}
            variant={isRecording ? "reverse" : "default"}
            size="sm"
            className={cn(
              "transition-all shrink-0",
              isRecording && "bg-red-500 text-white border-red-600"
            )}
          >
            {isRecording ? (
              <Square className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
        )}

        {/* Close button (X) - always visible on the right */}
        {onClose && (
          <Button
            onClick={onClose}
            disabled={disabled || isTranscribing}
            variant="neutral"
            size="sm"
            className="shrink-0 opacity-70 hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Playback Controls - only show when audio exists */}
      {audioUrl && (
        <div className="flex items-center justify-center gap-2">
          <Button
            onClick={playRecording}
            disabled={disabled || isTranscribing}
            variant="neutral"
            size="sm"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {isPlaying ? "Pause" : "Play"}
          </Button>

          <Button
            onClick={transcribeAudio}
            disabled={disabled || isTranscribing}
            variant="default"
            size="sm"
            className="gap-2"
          >
            {isTranscribing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Transcribing...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send Message
              </>
            )}
          </Button>

          <Button
            onClick={clearRecording}
            disabled={disabled || isTranscribing}
            variant="neutral"
            size="sm"
            className="opacity-70 hover:opacity-100"
          >
            <MicOff className="h-4 w-4" />
            Clear
          </Button>
        </div>
      )}

      {/* Hidden audio element for playback */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onPlay={() => setIsActuallyPlaying(true)}
          onPause={() => setIsActuallyPlaying(false)}
          onEnded={() => {
            setIsPlaying(false);
            setIsActuallyPlaying(false);
            setCurrentTime(0);
          }}
          onTimeUpdate={(e) => {
            const audio = e.target as HTMLAudioElement;
            setCurrentTime(audio.currentTime);
          }}
          onLoadedMetadata={(e) => {
            const audio = e.target as HTMLAudioElement;
            setRecordingDuration(audio.duration);
          }}
          className="hidden"
        />
      )}

      {/* Error Display */}
      {error && (
        <div className="text-center">
          <span className="text-sm text-red-500 break-words">{error}</span>
        </div>
      )}
    </div>
  );
}
