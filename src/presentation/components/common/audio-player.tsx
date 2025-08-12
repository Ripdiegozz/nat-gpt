"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { Play, Pause, Volume2, VolumeX, Download } from "lucide-react";
import { useI18n } from "@/src/lib/i18n";

interface AudioPlayerProps {
  src: string;
  className?: string;
  showDownload?: boolean;
  autoPlay?: boolean;
  duration?: number; // Optional duration override
}

export function AudioPlayer({ 
  src, 
  className, 
  showDownload = false,
  autoPlay = false,
  duration: propDuration
}: AudioPlayerProps) {
  const { t } = useI18n();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(propDuration || 0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handleLoadedMetadata = () => {
      // Use prop duration if available, otherwise use audio duration
      const audioDuration = propDuration || audio.duration;
      if (audioDuration && isFinite(audioDuration)) {
        setDuration(audioDuration);
      }
      setIsLoading(false);
    };
    
    const handleDurationChange = () => {
      // Use prop duration if available, otherwise use audio duration
      const audioDuration = propDuration || audio.duration;
      if (audioDuration && isFinite(audioDuration)) {
        setDuration(audioDuration);
      }
    };
    
    const handleTimeUpdate = () => {
      // Only update if not playing (paused state backup)
      if (audio.paused || audio.ended) {
        setCurrentTime(audio.currentTime);
      }
    };
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    const handleError = () => {
      setError(t("audio.audioLoadError"));
      setIsLoading(false);
    };

    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    // Force load metadata
    audio.load();

    // Auto play if requested
    if (autoPlay) {
      audio.play().catch(() => {
        // Auto-play failed, which is normal in many browsers
        setIsPlaying(false);
      });
    }

    return () => {
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [src, autoPlay]);

  // Update audio volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Update duration when prop changes
  useEffect(() => {
    if (propDuration && isFinite(propDuration)) {
      setDuration(propDuration);
    }
  }, [propDuration]);

  // Smooth progress update using requestAnimationFrame
  const updateProgress = useCallback(() => {
    const audio = audioRef.current;
    if (audio && isPlaying && !audio.paused && !audio.ended) {
      setCurrentTime(audio.currentTime);
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    }
  }, [isPlaying]);

  // Start/stop smooth progress updates
  useEffect(() => {
    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isPlaying, updateProgress]);

  const togglePlayPause = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
        setCurrentTime(audio.currentTime);
      } else {
        await audio.play();
        setIsPlaying(true);
        setCurrentTime(audio.currentTime);
      }
    } catch (err) {
      console.error('Error playing audio:', err);
      setError(t("audio.audioPlayError"));
    }
  }, [isPlaying]);

  const handleProgressClick = useCallback((event: React.MouseEvent) => {
    const audio = audioRef.current;
    const progressBar = progressRef.current;
    if (!audio || !progressBar || !duration) return;

    const rect = progressBar.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickPercentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = clickPercentage * duration;
    
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  }, [duration]);

  const handleVolumeChange = useCallback((value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted(!isMuted);
  }, [isMuted]);

  const handleDownload = useCallback(() => {
    const link = document.createElement('a');
    link.href = src;
    link.download = `audio-${Date.now()}.webm`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [src]);

  const formatTime = useCallback((time: number) => {
    if (!isFinite(time) || isNaN(time) || time < 0) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (error) {
    return (
      <div className={cn("flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-base", className)}>
        <div className="text-sm text-red-600">⚠️ {error}</div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-3 p-3 bg-secondary-background border-2 border-border rounded-base", className)}>
      <audio ref={audioRef} src={src} preload="metadata" />
      
      {/* Play/Pause Button */}
      <Button
        variant="neutral"
        size="icon"
        onClick={togglePlayPause}
        disabled={isLoading}
        className="h-8 w-8 shrink-0"
        aria-label={isPlaying ? t("audio.pause") : t("audio.play")}
      >
        {isLoading ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
        ) : isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>

      {/* Progress Bar */}
      <div className="flex-1 flex items-center gap-2">
        <span className="text-xs font-mono text-foreground/60 w-10">
          {formatTime(currentTime)}
        </span>
        
        <div 
          ref={progressRef}
          className="flex-1 h-2 bg-background border border-border rounded-full cursor-pointer relative overflow-hidden"
          onClick={handleProgressClick}
        >
          <div 
            className="h-full bg-main rounded-full"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        
        <span className="text-xs font-mono text-foreground/60 w-10">
          {formatTime(duration)}
        </span>
      </div>

      {/* Volume Control */}
      <div className="flex items-center gap-2">
        <Button
          variant="neutral"
          size="icon"
          onClick={toggleMute}
          className="h-6 w-6 shrink-0"
          aria-label={isMuted ? t("audio.unmute") : t("audio.mute")}
        >
          {isMuted ? (
            <VolumeX className="h-3 w-3" />
          ) : (
            <Volume2 className="h-3 w-3" />
          )}
        </Button>
        
        <div className="w-16 hidden sm:block">
          <Slider
            value={[isMuted ? 0 : volume]}
            onValueChange={handleVolumeChange}
            max={1}
            step={0.1}
            className="w-full"
          />
        </div>
      </div>

      {/* Download Button */}
      {showDownload && (
        <Button
          variant="neutral"
          size="icon"
          onClick={handleDownload}
          className="h-6 w-6 shrink-0"
          aria-label={t("common.download")}
        >
          <Download className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}