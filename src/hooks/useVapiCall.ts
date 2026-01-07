'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Vapi from '@vapi-ai/web';

/**
 * Call status types
 */
export type CallStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'speaking'
  | 'listening'
  | 'ended'
  | 'error';

/**
 * Transcript message from the conversation
 */
export interface TranscriptMessage {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  timestamp: Date;
  isFinal: boolean;
}

/**
 * Call metrics and performance data
 */
export interface CallMetrics {
  startTime: Date | null;
  endTime: Date | null;
  duration: number; // in seconds
  latency: number | null; // response latency in ms
  messageCount: number;
}

/**
 * Hook state interface
 */
export interface VapiCallState {
  status: CallStatus;
  isConnecting: boolean;
  isActive: boolean;
  isSpeaking: boolean;
  isListening: boolean;
  transcript: TranscriptMessage[];
  metrics: CallMetrics;
  error: string | null;
  volumeLevel: number;
}

/**
 * Hook options interface
 */
export interface UseVapiCallOptions {
  publicKey: string;
  onCallStart?: () => void;
  onCallEnd?: () => void;
  onMessage?: (message: TranscriptMessage) => void;
  onError?: (error: Error) => void;
}

/**
 * Custom hook for managing Vapi voice calls
 */
export function useVapiCall(options: UseVapiCallOptions) {
  const { publicKey, onCallStart, onCallEnd, onMessage, onError } = options;

  const vapiRef = useRef<Vapi | null>(null);
  const metricsStartRef = useRef<Date | null>(null);
  const lastAssistantSpeakRef = useRef<Date | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [state, setState] = useState<VapiCallState>({
    status: 'idle',
    isConnecting: false,
    isActive: false,
    isSpeaking: false,
    isListening: false,
    transcript: [],
    metrics: {
      startTime: null,
      endTime: null,
      duration: 0,
      latency: null,
      messageCount: 0,
    },
    error: null,
    volumeLevel: 0,
  });

  // Initialize Vapi client
  useEffect(() => {
    if (publicKey && !vapiRef.current) {
      vapiRef.current = new Vapi(publicKey);
      setupEventListeners();
    }

    return () => {
      cleanup();
    };
  }, [publicKey]);

  const cleanup = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    if (vapiRef.current) {
      vapiRef.current.stop();
      // Remove event listeners by creating new instance next time
      vapiRef.current = null;
    }
  }, []);

  const setupEventListeners = useCallback(() => {
    const vapi = vapiRef.current;
    if (!vapi) return;

    // Call started
    vapi.on('call-start', () => {
      metricsStartRef.current = new Date();

      setState(prev => ({
        ...prev,
        status: 'connected',
        isConnecting: false,
        isActive: true,
        metrics: {
          ...prev.metrics,
          startTime: new Date(),
        },
      }));

      // Start duration timer
      durationIntervalRef.current = setInterval(() => {
        setState(prev => ({
          ...prev,
          metrics: {
            ...prev.metrics,
            duration: metricsStartRef.current
              ? Math.floor((Date.now() - metricsStartRef.current.getTime()) / 1000)
              : 0,
          },
        }));
      }, 1000);

      onCallStart?.();
    });

    // Call ended
    vapi.on('call-end', () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      setState(prev => ({
        ...prev,
        status: 'ended',
        isActive: false,
        isConnecting: false,
        isSpeaking: false,
        isListening: false,
        metrics: {
          ...prev.metrics,
          endTime: new Date(),
        },
      }));

      onCallEnd?.();
    });

    // Speech events
    vapi.on('speech-start', () => {
      lastAssistantSpeakRef.current = new Date();
      setState(prev => ({
        ...prev,
        status: 'speaking',
        isSpeaking: true,
        isListening: false,
      }));
    });

    vapi.on('speech-end', () => {
      setState(prev => ({
        ...prev,
        status: 'listening',
        isSpeaking: false,
        isListening: true,
      }));
    });

    // Message received (transcript)
    vapi.on('message', (message: any) => {
      if (message.type === 'transcript') {
        const newMessage: TranscriptMessage = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          role: message.role === 'assistant' ? 'assistant' : 'user',
          text: message.transcript,
          timestamp: new Date(),
          isFinal: message.transcriptType === 'final',
        };

        // Calculate latency if this is an assistant response
        if (newMessage.role === 'assistant' && lastAssistantSpeakRef.current) {
          const latency = Date.now() - lastAssistantSpeakRef.current.getTime();
          setState(prev => ({
            ...prev,
            metrics: {
              ...prev.metrics,
              latency,
            },
          }));
        }

        setState(prev => {
          // For partial transcripts, update the last message if same role
          if (!newMessage.isFinal && prev.transcript.length > 0) {
            const lastMessage = prev.transcript[prev.transcript.length - 1];
            if (lastMessage.role === newMessage.role && !lastMessage.isFinal) {
              const updatedTranscript = [...prev.transcript];
              updatedTranscript[updatedTranscript.length - 1] = newMessage;
              return {
                ...prev,
                transcript: updatedTranscript,
              };
            }
          }

          // For final transcripts, add new message
          if (newMessage.isFinal) {
            const updatedTranscript = [...prev.transcript];
            // Remove partial message if exists
            if (updatedTranscript.length > 0) {
              const lastMessage = updatedTranscript[updatedTranscript.length - 1];
              if (lastMessage.role === newMessage.role && !lastMessage.isFinal) {
                updatedTranscript.pop();
              }
            }
            updatedTranscript.push(newMessage);
            return {
              ...prev,
              transcript: updatedTranscript,
              metrics: {
                ...prev.metrics,
                messageCount: updatedTranscript.filter(m => m.isFinal).length,
              },
            };
          }

          return {
            ...prev,
            transcript: [...prev.transcript, newMessage],
          };
        });

        if (newMessage.isFinal) {
          onMessage?.(newMessage);
        }
      }
    });

    // Volume level
    vapi.on('volume-level', (level: number) => {
      setState(prev => ({
        ...prev,
        volumeLevel: level,
      }));
    });

    // Error handling
    vapi.on('error', (error: Error) => {
      console.error('Vapi error:', error);
      setState(prev => ({
        ...prev,
        status: 'error',
        isConnecting: false,
        isActive: false,
        error: error.message || 'An unknown error occurred',
      }));
      onError?.(error);
    });
  }, [onCallStart, onCallEnd, onMessage, onError]);

  /**
   * Start a call with the specified assistant
   */
  const startCall = useCallback(async (assistantId: string) => {
    if (!vapiRef.current) {
      // Reinitialize if needed
      if (publicKey) {
        vapiRef.current = new Vapi(publicKey);
        setupEventListeners();
      } else {
        throw new Error('Vapi client not initialized');
      }
    }

    setState(prev => ({
      ...prev,
      status: 'connecting',
      isConnecting: true,
      error: null,
      transcript: [],
      metrics: {
        startTime: null,
        endTime: null,
        duration: 0,
        latency: null,
        messageCount: 0,
      },
    }));

    try {
      await vapiRef.current.start(assistantId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start call';
      setState(prev => ({
        ...prev,
        status: 'error',
        isConnecting: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, [publicKey, setupEventListeners]);

  /**
   * Stop the current call
   */
  const stopCall = useCallback(() => {
    if (vapiRef.current) {
      vapiRef.current.stop();
    }
  }, []);

  /**
   * Send a message during the call (for testing with text input)
   */
  const sendMessage = useCallback((text: string) => {
    if (vapiRef.current && state.isActive) {
      vapiRef.current.send({
        type: 'add-message',
        message: {
          role: 'user',
          content: text,
        },
      });
    }
  }, [state.isActive]);

  /**
   * Reset the call state
   */
  const reset = useCallback(() => {
    cleanup();
    setState({
      status: 'idle',
      isConnecting: false,
      isActive: false,
      isSpeaking: false,
      isListening: false,
      transcript: [],
      metrics: {
        startTime: null,
        endTime: null,
        duration: 0,
        latency: null,
        messageCount: 0,
      },
      error: null,
      volumeLevel: 0,
    });

    // Reinitialize Vapi client
    if (publicKey) {
      vapiRef.current = new Vapi(publicKey);
      setupEventListeners();
    }
  }, [publicKey, cleanup, setupEventListeners]);

  /**
   * Mute/unmute the microphone
   */
  const setMuted = useCallback((muted: boolean) => {
    if (vapiRef.current) {
      vapiRef.current.setMuted(muted);
    }
  }, []);

  /**
   * Check if the browser supports the required APIs
   */
  const checkBrowserSupport = useCallback(async (): Promise<{
    supported: boolean;
    issues: string[];
  }> => {
    const issues: string[] = [];

    if (!navigator.mediaDevices?.getUserMedia) {
      issues.push('Microphone access is not supported in this browser');
    }

    if (!window.AudioContext && !(window as any).webkitAudioContext) {
      issues.push('Web Audio API is not supported in this browser');
    }

    if (!window.RTCPeerConnection) {
      issues.push('WebRTC is not supported in this browser');
    }

    return {
      supported: issues.length === 0,
      issues,
    };
  }, []);

  /**
   * Request microphone permissions
   */
  const requestMicrophonePermission = useCallback(async (): Promise<{
    granted: boolean;
    error?: string;
  }> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the stream immediately - we just wanted to check permissions
      stream.getTracks().forEach(track => track.stop());
      return { granted: true };
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          return { granted: false, error: 'Microphone access was denied' };
        }
        if (error.name === 'NotFoundError') {
          return { granted: false, error: 'No microphone was found' };
        }
        return { granted: false, error: error.message };
      }
      return { granted: false, error: 'Failed to access microphone' };
    }
  }, []);

  return {
    ...state,
    startCall,
    stopCall,
    sendMessage,
    reset,
    setMuted,
    checkBrowserSupport,
    requestMicrophonePermission,
  };
}
