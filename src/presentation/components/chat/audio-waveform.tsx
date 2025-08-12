"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/src/lib/i18n";

interface AudioWaveformProps {
  isRecording?: boolean;
  isPlaying?: boolean;
  duration?: number;
  currentTime?: number;
  hasAudio?: boolean;
  className?: string;
  audioStream?: MediaStream | null;
  audioElement?: HTMLAudioElement | null;
}

export function AudioWaveform({
  isRecording = false,
  isPlaying = false,
  duration = 0,
  currentTime = 0,
  hasAudio = false,
  className,
  audioStream,
}: AudioWaveformProps) {
  const { t } = useI18n();
  const [audioData, setAudioData] = useState<number[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  // Initialize Web Audio API for real-time analysis
  const initializeAudioAnalysis = useCallback(async (stream: MediaStream) => {
    try {
      audioContextRef.current = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);

      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;

      source.connect(analyserRef.current);

      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);

      startAnalysis();
    } catch (error) {
      console.error("Error initializing audio analysis:", error);
    }
  }, []);

  // Start real-time audio analysis
  const startAnalysis = useCallback(() => {
    if (!analyserRef.current || !dataArrayRef.current) return;

    const analyze = () => {
      if (!analyserRef.current || !dataArrayRef.current) return;

      const bufferLength = analyserRef.current.frequencyBinCount;
      const frequencyData = new Uint8Array(bufferLength);
      analyserRef.current.getByteFrequencyData(frequencyData);

      // Calculate average volume level
      const average =
        frequencyData.reduce((acc, val) => acc + val, 0) / frequencyData.length;
      const normalizedLevel = (average / 255) * 100;

      // Update waveform data
      setAudioData((prev) => {
        const newData = [...prev];
        if (newData.length > 80) {
          // More bars for wider visualization
          newData.shift();
        }
        newData.push(normalizedLevel);
        return newData;
      });

      // Draw canvas visualization
      drawWaveform();

      animationIdRef.current = requestAnimationFrame(analyze);
    };

    analyze();
  }, []);

  // Draw waveform on canvas
  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyserRef.current) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width / window.devicePixelRatio;
    const height = canvas.height / window.devicePixelRatio;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Get frequency data
    const bufferLength = analyserRef.current.frequencyBinCount;
    const frequencyData = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(frequencyData);

    // Calculate how many bars we want across the full width
    const desiredBars = Math.floor(width / 8); // Bar every 8px
    const barWidth = width / desiredBars;

    // Draw frequency bars distributed across full width
    for (let i = 0; i < desiredBars; i++) {
      // Map bar index to frequency data index
      const dataIndex = Math.floor((i / desiredBars) * bufferLength);
      const barHeight = (frequencyData[dataIndex] / 255) * height * 0.85;

      const gradient = ctx.createLinearGradient(
        0,
        height,
        0,
        height - barHeight
      );

      if (isRecording) {
        gradient.addColorStop(0, "rgba(239, 68, 68, 0.9)"); // red-500
        gradient.addColorStop(0.6, "rgba(239, 68, 68, 0.7)");
        gradient.addColorStop(1, "rgba(239, 68, 68, 0.3)");
      } else if (isPlaying) {
        gradient.addColorStop(0, "rgba(59, 130, 246, 0.9)"); // blue-500
        gradient.addColorStop(0.6, "rgba(59, 130, 246, 0.7)");
        gradient.addColorStop(1, "rgba(59, 130, 246, 0.3)");
      } else {
        gradient.addColorStop(0, "rgba(156, 163, 175, 0.7)"); // gray-400
        gradient.addColorStop(0.6, "rgba(156, 163, 175, 0.5)");
        gradient.addColorStop(1, "rgba(156, 163, 175, 0.2)");
      }

      ctx.fillStyle = gradient;

      // Add some randomness for more natural look and ensure minimum height
      const naturalHeight = Math.max(barHeight + (Math.random() - 0.5) * 8, 4);

      ctx.fillRect(
        i * barWidth + 2,
        height - naturalHeight,
        barWidth - 4,
        naturalHeight
      );
    }
  }, [isRecording, isPlaying]);

  // Initialize audio analysis when recording starts
  useEffect(() => {
    if (isRecording && audioStream) {
      initializeAudioAnalysis(audioStream);
    } else if (!isRecording && audioContextRef.current) {
      // Stop analysis when recording stops
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
        animationIdRef.current = null;
      }
      if (audioContextRef.current.state === "running") {
        audioContextRef.current.close();
      }
      audioContextRef.current = null;
      analyserRef.current = null;
    }

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [isRecording, audioStream, initializeAudioAnalysis]);

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  // Generate static waveform when not recording
  useEffect(() => {
    if (!isRecording && !isPlaying && audioData.length === 0) {
      setAudioData(Array.from({ length: 120 }, () => Math.random() * 30 + 5));
    }
  }, [isRecording, isPlaying]);

  const formatTime = (seconds: number) => {
    // Handle invalid values
    if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) {
      return "0:00";
    }

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className={cn("flex items-center gap-3 w-full", className)}>
      {/* Audio visualization */}
      <div className="flex-1 relative h-16 bg-secondary-background/20 rounded-lg border border-border/10 overflow-hidden">
        {isRecording ? (
          /* Real-time waveform during recording */
          <>
            <canvas
              ref={canvasRef}
              className="w-full h-full"
              style={{ width: "100%", height: "100%", display: "block" }}
            />
            {/* Recording indicator overlay */}
            <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/20 backdrop-blur-sm rounded-full px-3 py-1">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-red-500">
                {t("common.recording")}
              </span>
            </div>
          </>
        ) : hasAudio ? (
          /* Progress bar when audio exists (playing or paused) */
          <div className="w-full h-full flex items-center p-6">
            <div className="flex-1 relative">
              {/* Background track */}
              <div className="w-full h-3 bg-secondary-background/50 rounded-full shadow-inner">
                {/* Progress fill */}
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-100 ease-linear relative shadow-sm"
                  style={{
                    width:
                      duration > 0
                        ? `${(currentTime / duration) * 100}%`
                        : "0%",
                  }}
                >
                  {/* Progress indicator dot */}
                  <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-lg border-2 border-blue-500 transition-transform hover:scale-110" />
                </div>
              </div>
              {/* Time labels */}
              <div className="flex justify-between mt-3 text-xs text-foreground/60 font-mono">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
            {/* Status indicator */}
            {isPlaying ? (
              <div className="ml-6 flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-full">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                  {t("audio.playing")}
                </span>
              </div>
            ) : (
              <div className="ml-6 flex items-center gap-2 bg-gray-50 dark:bg-gray-900/20 px-3 py-2 rounded-full">
                <div className="w-2 h-2 bg-gray-500 rounded-full" />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  {t("audio.ready")}
                </span>
              </div>
            )}
          </div>
        ) : (
          /* Static waveform when idle */
          <div className="w-full h-full flex items-end justify-between gap-[1px] p-3 overflow-hidden">
            {audioData.map((level, index) => (
              <div
                key={index}
                className="bg-foreground/30 rounded-sm transition-all duration-300 flex-grow"
                style={{
                  height: `${Math.max(level * 1.2, 8)}%`,
                  minHeight: "8px",
                  maxHeight: "100%",
                  maxWidth: "6px",
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Duration and status */}
      <div className="flex items-center gap-3 min-w-[100px] justify-end">
        {duration > 0 && !isRecording && !hasAudio && (
          <div className="text-xs text-foreground/50 bg-secondary-background/20 px-2 py-1 rounded">
            {`${(duration * 8).toFixed(1)}KB`}
          </div>
        )}
        {!hasAudio && (
          <div className="text-sm font-mono text-foreground/70 min-w-[50px] text-right">
            {formatTime(duration)}
          </div>
        )}
      </div>
    </div>
  );
}
