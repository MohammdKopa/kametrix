'use client';

import { useState, useRef, useCallback } from 'react';

export function useVoicePreview() {
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  const playPreview = useCallback(async (voiceId: string) => {
    // Stop any currently playing audio
    cleanup();
    setIsPlaying(null);
    setIsLoading(voiceId);

    try {
      const response = await fetch('/api/voice-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voiceId }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch preview');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      objectUrlRef.current = audioUrl;

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onplay = () => setIsPlaying(voiceId);
      audio.onended = () => {
        setIsPlaying(null);
        cleanup();
      };
      audio.onerror = () => {
        setIsPlaying(null);
        setIsLoading(null);
        cleanup();
      };

      await audio.play();
    } catch (error) {
      console.error('Preview error:', error);
      cleanup();
    } finally {
      setIsLoading(null);
    }
  }, [cleanup]);

  const stopPreview = useCallback(() => {
    cleanup();
    setIsPlaying(null);
  }, [cleanup]);

  return { playPreview, stopPreview, isPlaying, isLoading };
}
