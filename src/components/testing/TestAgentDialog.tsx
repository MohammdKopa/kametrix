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
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useVapiCall, type TranscriptMessage, type CallStatus } from '@/hooks/useVapiCall';

interface TestAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export function TestAgentDialog({ open, onOpenChange, agentId, agentName }: TestAgentDialogProps) {
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

  // Fetch test token when dialog opens
  useEffect(() => {
    if (!open) return;

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

    setIsLoading(true);
    setInitError(null);
    fetchTestToken();
  }, [open, agentId]);

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

    if (publicKey && open) {
      checkSupport();
    }
  }, [publicKey, open, checkBrowserSupport, requestMicrophonePermission]);

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcript]);

  // Cleanup when dialog closes
  useEffect(() => {
    if (!open && isActive) {
      stopCall();
    }
  }, [open, isActive, stopCall]);

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

  // Handle close - stop call if active
  const handleClose = () => {
    if (isActive) {
      stopCall();
    }
    onOpenChange(false);
  };

  const statusConfig = getStatusConfig(status);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="glass sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" showCloseButton={false}>
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Test: {agentName}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleClose}
              className="rounded-full"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 min-h-0">
          {/* Loading state */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Initializing voice testing...</p>
            </div>
          )}

          {/* Error state */}
          {!isLoading && initError && !publicKey && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="p-3 rounded-full bg-destructive/10 mb-4">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Unable to Initialize Testing</h3>
              <p className="text-muted-foreground text-center max-w-md mb-4">{initError}</p>
              <Button variant="outline" onClick={() => window.location.reload()}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
          )}

          {/* Main content */}
          {!isLoading && publicKey && (
            <>
              {/* Status & Controls */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-muted/30 rounded-lg">
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

                  {/* Duration */}
                  {(isActive || status === 'ended') && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDuration(metrics.duration)}
                    </div>
                  )}
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2">
                  {!isActive && status !== 'connecting' && (
                    <Button
                      onClick={handleStartCall}
                      disabled={!publicKey || !assistantId}
                      size="sm"
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
                        size="icon-sm"
                        onClick={handleMuteToggle}
                        className={isMuted ? 'text-destructive' : ''}
                        title={isMuted ? 'Unmute' : 'Mute'}
                      >
                        {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      </Button>

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleStopCall}
                        className="gap-2"
                      >
                        <PhoneOff className="w-4 h-4" />
                        End
                      </Button>
                    </>
                  )}

                  {(status === 'ended' || status === 'error') && (
                    <Button variant="outline" size="sm" onClick={handleReset} className="gap-2">
                      <RotateCcw className="w-4 h-4" />
                      Reset
                    </Button>
                  )}
                </div>
              </div>

              {/* Error display */}
              {(error || initError) && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-destructive">{error || initError}</p>
                </div>
              )}

              {/* Microphone permission warning */}
              {permissionStatus === 'denied' && (
                <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    Microphone access is required. Please enable it in your browser settings.
                  </p>
                </div>
              )}

              {/* Transcript */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Transcript
                  </h4>
                  {transcript.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleExportTranscript}
                      className="gap-1.5 h-7"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export
                    </Button>
                  )}
                </div>
                <div className="bg-muted/30 rounded-lg p-4 h-[200px] overflow-y-auto">
                  {transcript.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                      <MessageSquare className="w-8 h-8 mb-2 opacity-30" />
                      <p className="text-sm">Conversation will appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {transcript
                        .filter(m => m.isFinal)
                        .map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
                          >
                            <div
                              className={`max-w-[80%] rounded-xl px-3 py-2 ${
                                message.role === 'assistant'
                                  ? 'bg-muted text-foreground rounded-bl-sm'
                                  : 'bg-primary text-primary-foreground rounded-br-sm'
                              }`}
                            >
                              <p className="text-sm">{message.text}</p>
                            </div>
                          </div>
                        ))}
                      <div ref={transcriptEndRef} />
                    </div>
                  )}
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-4 p-3 bg-muted/30 rounded-lg text-center">
                <div>
                  <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                    <Zap className="w-3.5 h-3.5" />
                    <span className="text-xs">Latency</span>
                  </div>
                  <p className="font-mono text-sm">{metrics.latency ? `${metrics.latency}ms` : '--'}</p>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span className="text-xs">Messages</span>
                  </div>
                  <p className="font-mono text-sm">{metrics.messageCount}</p>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                    <Volume2 className="w-3.5 h-3.5" />
                    <span className="text-xs">Status</span>
                  </div>
                  <p className="text-sm">
                    {isSpeaking ? 'Speaking' : isListening ? 'Listening' : 'Idle'}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
