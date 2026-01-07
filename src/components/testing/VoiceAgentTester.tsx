'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  RotateCcw,
  Download,
  AlertCircle,
  Clock,
  Zap,
  MessageSquare,
  Volume2,
  Loader2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useVapiCall, type TranscriptMessage, type CallStatus } from '@/hooks/useVapiCall';

interface VoiceAgentTesterProps {
  agentId: string;
  agentName: string;
}

/**
 * Format duration in MM:SS format
 */
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get status badge styling based on call status
 */
function getStatusConfig(status: CallStatus): {
  label: string;
  variant: 'default' | 'secondary' | 'destructive';
  className: string;
  icon: React.ReactNode;
} {
  const configs: Record<CallStatus, ReturnType<typeof getStatusConfig>> = {
    idle: {
      label: 'Ready',
      variant: 'secondary',
      className: '',
      icon: <CheckCircle2 className="w-3 h-3" />,
    },
    connecting: {
      label: 'Connecting...',
      variant: 'secondary',
      className: 'animate-pulse',
      icon: <Loader2 className="w-3 h-3 animate-spin" />,
    },
    connected: {
      label: 'Connected',
      variant: 'default',
      className: 'bg-green-500/20 text-green-500 border-green-500/30',
      icon: <CheckCircle2 className="w-3 h-3" />,
    },
    speaking: {
      label: 'Agent Speaking',
      variant: 'default',
      className: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
      icon: <Volume2 className="w-3 h-3" />,
    },
    listening: {
      label: 'Listening',
      variant: 'default',
      className: 'bg-purple-500/20 text-purple-500 border-purple-500/30',
      icon: <Mic className="w-3 h-3" />,
    },
    ended: {
      label: 'Call Ended',
      variant: 'secondary',
      className: '',
      icon: <PhoneOff className="w-3 h-3" />,
    },
    error: {
      label: 'Error',
      variant: 'destructive',
      className: '',
      icon: <XCircle className="w-3 h-3" />,
    },
  };

  return configs[status];
}

export function VoiceAgentTester({ agentId, agentName }: VoiceAgentTesterProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [assistantId, setAssistantId] = useState<string | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'unknown' | 'granted' | 'denied'>('unknown');

  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Initialize Vapi call hook
  const {
    status,
    isConnecting,
    isActive,
    isSpeaking,
    isListening,
    transcript,
    metrics,
    error,
    volumeLevel,
    startCall,
    stopCall,
    reset,
    setMuted,
    checkBrowserSupport,
    requestMicrophonePermission,
  } = useVapiCall({
    publicKey: publicKey || '',
    onCallStart: () => {
      console.log('Call started');
    },
    onCallEnd: () => {
      console.log('Call ended');
    },
    onMessage: (message) => {
      console.log('New message:', message);
    },
    onError: (error) => {
      console.error('Call error:', error);
    },
  });

  // Fetch test token on mount
  useEffect(() => {
    async function fetchTestToken() {
      try {
        const response = await fetch(`/api/agents/${agentId}/test-token`);

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to get test configuration');
        }

        const data = await response.json();
        setPublicKey(data.publicKey);
        setAssistantId(data.assistantId);
      } catch (err) {
        setInitError(err instanceof Error ? err.message : 'Failed to initialize testing');
      } finally {
        setIsLoading(false);
      }
    }

    fetchTestToken();
  }, [agentId]);

  // Check browser support and permissions
  useEffect(() => {
    async function checkSupport() {
      const { supported, issues } = await checkBrowserSupport();
      if (!supported) {
        setInitError(issues.join('. '));
        return;
      }

      // Check microphone permission
      const { granted, error: permError } = await requestMicrophonePermission();
      setPermissionStatus(granted ? 'granted' : 'denied');
      if (!granted && permError) {
        setInitError(permError);
      }
    }

    if (publicKey) {
      checkSupport();
    }
  }, [publicKey, checkBrowserSupport, requestMicrophonePermission]);

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcript]);

  // Handle start call
  const handleStartCall = async () => {
    if (!assistantId) {
      setInitError('No assistant configured');
      return;
    }

    // Request permission if not granted
    if (permissionStatus !== 'granted') {
      const { granted, error: permError } = await requestMicrophonePermission();
      if (!granted) {
        setInitError(permError || 'Microphone access is required');
        return;
      }
      setPermissionStatus('granted');
    }

    try {
      await startCall(assistantId);
    } catch (err) {
      console.error('Failed to start call:', err);
    }
  };

  // Handle stop call
  const handleStopCall = () => {
    stopCall();
  };

  // Handle reset
  const handleReset = () => {
    reset();
    setInitError(null);
  };

  // Handle mute toggle
  const handleMuteToggle = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    setMuted(newMuted);
  };

  // Export transcript
  const handleExportTranscript = () => {
    if (transcript.length === 0) return;

    const content = transcript
      .filter(m => m.isFinal)
      .map(m => `[${m.timestamp.toLocaleTimeString()}] ${m.role.toUpperCase()}: ${m.text}`)
      .join('\n\n');

    const header = `Conversation Transcript - ${agentName}\nDate: ${new Date().toLocaleString()}\nDuration: ${formatDuration(metrics.duration)}\n${'='.repeat(50)}\n\n`;

    const blob = new Blob([header + content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${agentName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const statusConfig = getStatusConfig(status);

  // Loading state
  if (isLoading) {
    return (
      <Card className="glass-card border-0">
        <CardContent className="p-8 flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Initializing voice testing...</p>
        </CardContent>
      </Card>
    );
  }

  // Error state (initialization error)
  if (initError && !publicKey) {
    return (
      <Card className="glass-card border-0">
        <CardContent className="p-8 flex flex-col items-center justify-center min-h-[400px]">
          <div className="p-3 rounded-full bg-destructive/10 mb-4">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Unable to Initialize Testing</h3>
          <p className="text-muted-foreground text-center max-w-md mb-4">{initError}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status & Controls Header */}
      <Card className="glass-card border-0">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Status */}
            <div className="flex items-center gap-3">
              <Badge
                variant={statusConfig.variant}
                className={`gap-1.5 ${statusConfig.className}`}
              >
                {statusConfig.icon}
                {statusConfig.label}
              </Badge>

              {/* Volume indicator when active */}
              {isActive && (
                <div className="flex items-center gap-1">
                  <div className="flex items-end gap-0.5 h-4">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-1 rounded-full transition-all duration-100 ${
                          volumeLevel > i * 0.2
                            ? 'bg-primary'
                            : 'bg-muted'
                        }`}
                        style={{ height: `${(i + 1) * 4}px` }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              {!isActive && status !== 'connecting' && (
                <Button
                  onClick={handleStartCall}
                  disabled={!publicKey || !assistantId}
                  className="gap-2"
                >
                  <Phone className="w-4 h-4" />
                  Start Test Call
                </Button>
              )}

              {(isActive || status === 'connecting') && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleMuteToggle}
                    className={isMuted ? 'text-destructive' : ''}
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </Button>

                  <Button
                    variant="destructive"
                    onClick={handleStopCall}
                    className="gap-2"
                  >
                    <PhoneOff className="w-4 h-4" />
                    End Call
                  </Button>
                </>
              )}

              {(status === 'ended' || status === 'error') && (
                <Button variant="outline" onClick={handleReset} className="gap-2">
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </Button>
              )}
            </div>
          </div>

          {/* Error display */}
          {(error || initError) && (
            <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
              <p className="text-sm text-destructive">{error || initError}</p>
            </div>
          )}

          {/* Microphone permission warning */}
          {permissionStatus === 'denied' && (
            <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                Microphone access is required for voice testing. Please enable microphone permissions in your browser settings.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transcript - Takes 2 columns on large screens */}
        <Card className="glass-card border-0 lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Conversation Transcript
              </h3>
              {transcript.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExportTranscript}
                  className="gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="bg-muted/30 rounded-xl p-4 h-[400px] overflow-y-auto">
              {transcript.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mb-3 opacity-30" />
                  <p>Conversation transcript will appear here</p>
                  <p className="text-sm mt-1">Start a test call to begin</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transcript
                    .filter(m => m.isFinal)
                    .map((message) => (
                      <TranscriptBubble key={message.id} message={message} />
                    ))}
                  <div ref={transcriptEndRef} />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Metrics Panel */}
        <Card className="glass-card border-0">
          <CardHeader className="pb-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Call Metrics
            </h3>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4">
              {/* Duration */}
              <MetricItem
                icon={<Clock className="w-4 h-4" />}
                label="Duration"
                value={formatDuration(metrics.duration)}
                active={isActive}
              />

              {/* Response Latency */}
              <MetricItem
                icon={<Zap className="w-4 h-4" />}
                label="Response Latency"
                value={metrics.latency ? `${metrics.latency}ms` : '--'}
              />

              {/* Message Count */}
              <MetricItem
                icon={<MessageSquare className="w-4 h-4" />}
                label="Messages"
                value={metrics.messageCount.toString()}
              />

              {/* Connection Status */}
              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Connection</span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isActive
                          ? 'bg-green-500 shadow-[0_0_6px_oklch(0.72_0.19_142)]'
                          : 'bg-muted'
                      }`}
                    />
                    <span className="text-sm">
                      {isActive ? 'Active' : status === 'connecting' ? 'Connecting' : 'Disconnected'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Voice Activity */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Voice Activity</span>
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isSpeaking
                        ? 'bg-blue-500 shadow-[0_0_6px_oklch(0.62_0.21_255)]'
                        : isListening
                        ? 'bg-purple-500 shadow-[0_0_6px_oklch(0.55_0.25_300)]'
                        : 'bg-muted'
                    }`}
                  />
                  <span className="text-sm">
                    {isSpeaking ? 'Speaking' : isListening ? 'Listening' : 'Idle'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Testing Tips */}
      <Card className="glass-card border-0">
        <CardContent className="p-6">
          <h4 className="font-medium mb-3">Testing Tips</h4>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">&#x2022;</span>
              <span>Speak clearly and at a normal pace for best transcription results</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">&#x2022;</span>
              <span>Try different scenarios like booking appointments, asking about services, or general inquiries</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">&#x2022;</span>
              <span>Use the export feature to save transcripts for review or documentation</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">&#x2022;</span>
              <span>Response latency below 500ms indicates good performance</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Transcript message bubble component
 */
function TranscriptBubble({ message }: { message: TranscriptMessage }) {
  const isAssistant = message.role === 'assistant';

  return (
    <div className={`flex ${isAssistant ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2 ${
          isAssistant
            ? 'bg-muted text-foreground rounded-bl-sm'
            : 'bg-primary text-primary-foreground rounded-br-sm'
        }`}
      >
        <p className="text-sm">{message.text}</p>
        <p className={`text-xs mt-1 ${isAssistant ? 'text-muted-foreground' : 'opacity-70'}`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

/**
 * Metric item component
 */
function MetricItem({
  icon,
  label,
  value,
  active = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  active?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <span className={`text-lg font-mono ${active ? 'text-primary' : ''}`}>{value}</span>
    </div>
  );
}
