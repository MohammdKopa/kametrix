'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { LiveRegion, LoadingAnnouncer } from '@/components/ui/live-region';
import { useVoiceCallAccessibility } from '@/hooks/useAccessibility';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
} from 'lucide-react';

/**
 * Accessible Voice Call Controls
 *
 * Implements WCAG 2.1 AA accessibility for voice agent interactions:
 * - Screen reader announcements for call status changes
 * - Keyboard-accessible controls
 * - Clear visual indicators with high contrast
 * - Live regions for real-time updates
 */

interface VoiceCallStatus {
  status: 'idle' | 'connecting' | 'connected' | 'speaking' | 'listening' | 'ended' | 'error';
  isMuted: boolean;
  isSpeakerOn: boolean;
  duration: number;
  error?: string;
}

interface AccessibleVoiceCallProps {
  callStatus: VoiceCallStatus;
  onStartCall: () => void;
  onEndCall: () => void;
  onToggleMute: () => void;
  onToggleSpeaker: () => void;
  agentName?: string;
  className?: string;
}

const statusLabels: Record<VoiceCallStatus['status'], string> = {
  idle: 'Ready to call',
  connecting: 'Connecting...',
  connected: 'Connected',
  speaking: 'Agent is speaking',
  listening: 'Listening to you',
  ended: 'Call ended',
  error: 'Error occurred',
};

export function AccessibleVoiceCall({
  callStatus,
  onStartCall,
  onEndCall,
  onToggleMute,
  onToggleSpeaker,
  agentName = 'Voice Agent',
  className,
}: AccessibleVoiceCallProps) {
  const { statusProps } = useVoiceCallAccessibility(callStatus.status);
  const prevStatusRef = React.useRef(callStatus.status);
  const [announcement, setAnnouncement] = React.useState('');

  const isActive = ['connecting', 'connected', 'speaking', 'listening'].includes(
    callStatus.status
  );

  // Announce status changes
  React.useEffect(() => {
    if (callStatus.status !== prevStatusRef.current) {
      let message = '';

      switch (callStatus.status) {
        case 'connecting':
          message = `Connecting to ${agentName}...`;
          break;
        case 'connected':
          message = `Connected to ${agentName}. You can now speak.`;
          break;
        case 'speaking':
          message = `${agentName} is speaking`;
          break;
        case 'listening':
          message = 'Listening to you. Speak now.';
          break;
        case 'ended':
          message = `Call with ${agentName} ended. Duration: ${formatDuration(callStatus.duration)}`;
          break;
        case 'error':
          message = `Error: ${callStatus.error || 'An error occurred during the call'}`;
          break;
      }

      setAnnouncement(message);
      prevStatusRef.current = callStatus.status;

      // Clear announcement after some time
      const timeout = setTimeout(() => setAnnouncement(''), 3000);
      return () => clearTimeout(timeout);
    }
  }, [callStatus.status, callStatus.duration, callStatus.error, agentName]);

  return (
    <div
      className={cn('voice-call-controls', className)}
      role="region"
      aria-label={`Voice call with ${agentName}`}
    >
      {/* Live region for announcements */}
      <LiveRegion
        politeness={callStatus.status === 'error' ? 'assertive' : 'polite'}
        visuallyHidden
      >
        {announcement}
      </LiveRegion>

      {/* Loading announcer for connecting state */}
      <LoadingAnnouncer
        isLoading={callStatus.status === 'connecting'}
        loadingMessage={`Connecting to ${agentName}`}
        completedMessage={`Connected to ${agentName}`}
      />

      {/* Status display */}
      <div
        className="mb-4 text-center"
        {...statusProps}
      >
        <p className="text-lg font-medium">
          {statusLabels[callStatus.status]}
        </p>
        {isActive && (
          <p className="text-sm text-muted-foreground">
            Duration: {formatDuration(callStatus.duration)}
          </p>
        )}
        {callStatus.status === 'error' && callStatus.error && (
          <p className="text-sm text-destructive" role="alert">
            {callStatus.error}
          </p>
        )}
      </div>

      {/* Visual indicator */}
      <VoiceStatusIndicator status={callStatus.status} />

      {/* Call controls */}
      <div
        className="flex items-center justify-center gap-4 mt-6"
        role="group"
        aria-label="Call controls"
      >
        {!isActive ? (
          <Button
            onClick={onStartCall}
            size="lg"
            className="gap-2"
            aria-label={`Start call with ${agentName}`}
          >
            <Phone className="w-5 h-5" aria-hidden="true" />
            Start Call
          </Button>
        ) : (
          <>
            {/* Mute button */}
            <Button
              onClick={onToggleMute}
              variant={callStatus.isMuted ? 'destructive' : 'outline'}
              size="icon-lg"
              aria-label={callStatus.isMuted ? 'Unmute microphone' : 'Mute microphone'}
              aria-pressed={callStatus.isMuted}
            >
              {callStatus.isMuted ? (
                <MicOff className="w-5 h-5" aria-hidden="true" />
              ) : (
                <Mic className="w-5 h-5" aria-hidden="true" />
              )}
              <span className="sr-only">
                {callStatus.isMuted ? 'Microphone is muted' : 'Microphone is on'}
              </span>
            </Button>

            {/* End call button */}
            <Button
              onClick={onEndCall}
              variant="destructive"
              size="lg"
              className="gap-2"
              aria-label={`End call with ${agentName}`}
            >
              <PhoneOff className="w-5 h-5" aria-hidden="true" />
              End Call
            </Button>

            {/* Speaker button */}
            <Button
              onClick={onToggleSpeaker}
              variant={!callStatus.isSpeakerOn ? 'destructive' : 'outline'}
              size="icon-lg"
              aria-label={callStatus.isSpeakerOn ? 'Turn off speaker' : 'Turn on speaker'}
              aria-pressed={callStatus.isSpeakerOn}
            >
              {callStatus.isSpeakerOn ? (
                <Volume2 className="w-5 h-5" aria-hidden="true" />
              ) : (
                <VolumeX className="w-5 h-5" aria-hidden="true" />
              )}
              <span className="sr-only">
                {callStatus.isSpeakerOn ? 'Speaker is on' : 'Speaker is off'}
              </span>
            </Button>
          </>
        )}
      </div>

      {/* Keyboard shortcuts help */}
      <div className="mt-6 text-center text-sm text-muted-foreground">
        <p className="sr-only">
          Keyboard shortcuts: Press Space or Enter to start or end call.
          Press M to toggle mute. Press S to toggle speaker.
        </p>
        <p aria-hidden="true">
          Press <kbd className="px-1 py-0.5 rounded bg-muted">Space</kbd> to{' '}
          {isActive ? 'end' : 'start'} call
        </p>
      </div>
    </div>
  );
}

/**
 * Visual status indicator with animation
 */
interface VoiceStatusIndicatorProps {
  status: VoiceCallStatus['status'];
  className?: string;
}

export function VoiceStatusIndicator({
  status,
  className,
}: VoiceStatusIndicatorProps) {
  const statusColors = {
    idle: 'bg-muted',
    connecting: 'bg-amber-500 animate-pulse',
    connected: 'bg-green-500',
    speaking: 'bg-primary animate-pulse',
    listening: 'bg-blue-500 animate-pulse',
    ended: 'bg-muted',
    error: 'bg-destructive',
  };

  return (
    <div
      className={cn('flex items-center justify-center', className)}
      role="img"
      aria-label={`Status: ${statusLabels[status]}`}
    >
      <div
        className={cn(
          'w-4 h-4 rounded-full transition-colors duration-300',
          statusColors[status]
        )}
        aria-hidden="true"
      />
    </div>
  );
}

/**
 * Transcript display with screen reader support
 */
interface TranscriptMessage {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  timestamp: Date;
}

interface AccessibleTranscriptProps {
  messages: TranscriptMessage[];
  className?: string;
}

export function AccessibleTranscript({
  messages,
  className,
}: AccessibleTranscriptProps) {
  const latestMessage = messages[messages.length - 1];

  return (
    <div
      className={cn('transcript-container', className)}
      role="log"
      aria-label="Call transcript"
      aria-live="polite"
      aria-relevant="additions"
    >
      {/* Announce latest message to screen readers */}
      {latestMessage && (
        <LiveRegion politeness="polite" visuallyHidden>
          {latestMessage.role === 'assistant'
            ? `Agent said: ${latestMessage.text}`
            : `You said: ${latestMessage.text}`}
        </LiveRegion>
      )}

      {/* Visible transcript */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {messages.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm">
            No messages yet
          </p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'p-3 rounded-lg',
                message.role === 'assistant'
                  ? 'bg-muted text-foreground'
                  : 'bg-primary/10 text-foreground ml-8'
              )}
            >
              <p className="text-xs text-muted-foreground mb-1">
                <span className="sr-only">
                  {message.role === 'assistant' ? 'Agent' : 'You'} at{' '}
                </span>
                {message.timestamp.toLocaleTimeString()}
              </p>
              <p>{message.text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/**
 * Format duration in seconds to mm:ss
 */
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
