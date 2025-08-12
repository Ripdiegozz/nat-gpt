"use client";

import { useState, useRef, useCallback } from "react";

export interface AudioRecording {
  blob: Blob;
  url: string;
  duration: number;
}

// Helper function to ensure compatible format
function convertToCompatibleFormat(blob: Blob, mimeType: string): Blob {
  // Clean up the MIME type (remove codec specifications)
  const cleanMimeType = mimeType.split(';')[0];
  
  // List of formats supported by the transcription API
  const supportedFormats = [
    'audio/webm',
    'audio/mp4', 
    'audio/mpeg',
    'audio/wav',
    'audio/ogg'
  ];
  
  // If it's already a supported format, return with clean MIME type
  if (supportedFormats.includes(cleanMimeType)) {
    return new Blob([blob], { type: cleanMimeType });
  }
  
  // Default to webm if format is not recognized
  return new Blob([blob], { type: 'audio/webm' });
}

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isWarmingUp, setIsWarmingUp] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<number | null>(null);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setIsWarmingUp(true);

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      // Set up audio analysis for visual feedback
      const audioContext = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);

      analyser.fftSize = 512; // Higher resolution for better audio analysis
      analyser.smoothingTimeConstant = 0.3; // Faster response to audio changes
      analyser.minDecibels = -90;
      analyser.maxDecibels = -10;
      source.connect(analyser);
      
      // Audio analyser configured successfully

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // Start audio level monitoring immediately for warm-up feedback
      const updateAudioLevel = () => {
        if (analyserRef.current) {
          const dataArray = new Uint8Array(
            analyserRef.current.frequencyBinCount
          );
          analyserRef.current.getByteFrequencyData(dataArray);

          // Calculate audio level with better scaling
          const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
          // Scale by 15 to make it more sensitive (as you suggested)
          const normalizedLevel = Math.min((average * 15) / 255, 1); // Normalize to 0-1
          
          setAudioLevel(normalizedLevel);

          // Continue animation during warm-up and recording
          if (isWarmingUp || (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording')) {
            animationRef.current = requestAnimationFrame(updateAudioLevel);
          }
        }
      };
      
      // Start audio level monitoring immediately
      updateAudioLevel();

      // Warm-up period: wait 2 seconds before starting actual recording
      setTimeout(() => {
        // Set up MediaRecorder with compatible format selection for transcription
        // Priority order: mp4 > webm > ogg > wav > mpeg
        let mimeType = "audio/webm";
        if (MediaRecorder.isTypeSupported("audio/mp4")) {
          mimeType = "audio/mp4";
        } else if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
          mimeType = "audio/webm;codecs=opus";
        } else if (MediaRecorder.isTypeSupported("audio/webm")) {
          mimeType = "audio/webm";
        } else if (MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")) {
          mimeType = "audio/ogg;codecs=opus";
        } else if (MediaRecorder.isTypeSupported("audio/wav")) {
          mimeType = "audio/wav";
        } else if (MediaRecorder.isTypeSupported("audio/mpeg")) {
          mimeType = "audio/mpeg";
        }

        const mediaRecorder = new MediaRecorder(stream, { mimeType });

        mediaRecorderRef.current = mediaRecorder;
        chunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunksRef.current.push(event.data);
          }
        };

        // Start actual recording after warm-up
        mediaRecorder.start(100); // Collect data every 100ms
        setIsWarmingUp(false);
        setIsRecording(true);
        setRecordingTime(0);

        // Start timer
        timerRef.current = setInterval(() => {
          setRecordingTime((prev) => prev + 1);
        }, 1000);
      }, 2000); // 2 second warm-up period

    } catch (err) {
      console.error("Error starting recording:", err);
      setError("Failed to access microphone. Please check permissions.");
      setIsWarmingUp(false);
    }
  }, [isRecording]);

  const stopRecording = useCallback((): Promise<AudioRecording | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || !isRecording) {
        resolve(null);
        return;
      }

      mediaRecorderRef.current.onstop = () => {
        const originalBlob = new Blob(chunksRef.current, {
          type: mediaRecorderRef.current?.mimeType || "audio/webm",
        });
        
        // Convert to a compatible format if needed
        const finalBlob = convertToCompatibleFormat(originalBlob, mediaRecorderRef.current?.mimeType || "audio/webm");
        const url = URL.createObjectURL(finalBlob);
        const duration = recordingTime;

        resolve({ blob: finalBlob, url, duration });
        cleanup();
      };

      mediaRecorderRef.current.stop();
      setIsRecording(false);
    });
  }, [isRecording, recordingTime]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  }, [isRecording, isPaused]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
  }, [isRecording, isPaused]);

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      cleanup();
    }
  }, [isRecording]);

  const cleanup = useCallback(() => {
    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Clear animation frame
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Reset state
    setIsPaused(false);
    setRecordingTime(0);
    setAudioLevel(0);
    setError(null);
    setIsWarmingUp(false);
    chunksRef.current = [];
  }, []);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);

  return {
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
    isSupported:
      typeof navigator !== "undefined" &&
      !!navigator.mediaDevices?.getUserMedia,
  };
}
