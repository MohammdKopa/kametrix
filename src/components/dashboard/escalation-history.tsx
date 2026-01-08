'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  PhoneForwarded,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
  Loader2,
  AlertTriangle,
  User,
  Phone,
} from 'lucide-react';
import type { EscalationLog, EscalationReason, EscalationStatus } from '@/generated/prisma/client';

interface EscalationHistoryProps {
  agentId?: string;
  limit?: number;
  showViewAll?: boolean;
}

const REASON_LABELS: Record<EscalationReason, string> = {
  USER_REQUEST: 'Customer Request',
  LOW_CONFIDENCE: 'Low Confidence',
  REPEATED_CLARIFICATION: 'Repeated Clarification',
  UNRECOGNIZED_INTENT: 'Unrecognized Intent',
  COMPLEX_ISSUE: 'Complex Issue',
  SENTIMENT_NEGATIVE: 'Negative Sentiment',
  MAX_DURATION: 'Max Duration',
  EXPLICIT_TRIGGER: 'Trigger Phrase',
};

const STATUS_CONFIG: Record<EscalationStatus, { icon: typeof CheckCircle; color: string; label: string }> = {
  PENDING: { icon: Clock, color: 'text-yellow-500', label: 'Pending' },
  IN_QUEUE: { icon: Clock, color: 'text-blue-500', label: 'In Queue' },
  CONNECTED: { icon: CheckCircle, color: 'text-green-500', label: 'Connected' },
  FAILED: { icon: XCircle, color: 'text-red-500', label: 'Failed' },
  NO_OPERATORS: { icon: User, color: 'text-gray-500', label: 'No Operators' },
  TIMEOUT: { icon: Clock, color: 'text-orange-500', label: 'Timeout' },
  CANCELLED: { icon: XCircle, color: 'text-gray-500', label: 'Cancelled' },
};

export function EscalationHistory({ agentId, limit = 10, showViewAll = true }: EscalationHistoryProps) {
  const [escalations, setEscalations] = useState<EscalationLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    async function fetchEscalations() {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({ limit: String(limit) });
        if (agentId) {
          params.set('agentId', agentId);
        }

        const response = await fetch(`/api/escalation?${params}`);

        if (!response.ok) {
          throw new Error('Failed to fetch escalations');
        }

        const data = await response.json();
        setEscalations(data.escalations);
        setTotal(data.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    fetchEscalations();
  }, [agentId, limit]);

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <Card className="glass-card border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="glass-card border-red-500/30">
        <CardContent className="p-6 text-center">
          <XCircle className="w-8 h-8 mx-auto text-red-500 mb-2" />
          <p className="text-red-500">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (escalations.length === 0) {
    return (
      <Card className="glass-card border-0">
        <CardContent className="p-6 text-center py-12">
          <PhoneForwarded className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No Escalations Yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            When calls are escalated to human operators, they will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-0">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <PhoneForwarded className="w-5 h-5 text-orange-500" />
          Recent Escalations
        </CardTitle>
        {showViewAll && total > limit && (
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/escalations">
              View All ({total})
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {escalations.map((escalation) => {
            const statusConfig = STATUS_CONFIG[escalation.status];
            const StatusIcon = statusConfig.icon;

            return (
              <Link
                key={escalation.id}
                href={`/dashboard/calls/${escalation.callId}`}
                className="block"
              >
                <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  {/* Status Icon */}
                  <div className={`p-2 rounded-full bg-opacity-20 ${statusConfig.color.replace('text-', 'bg-')}/10`}>
                    <StatusIcon className={`w-5 h-5 ${statusConfig.color}`} />
                  </div>

                  {/* Main Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {REASON_LABELS[escalation.reason]}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusConfig.color.replace('text-', 'bg-')}/20 ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 truncate">
                      {escalation.conversationSummary || escalation.lastUserMessage || 'No summary available'}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(escalation.triggeredAt)}
                      </span>
                      {escalation.transferNumber && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {escalation.transferNumber}
                        </span>
                      )}
                      {escalation.waitTimeSeconds !== null && (
                        <span className="flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {escalation.waitTimeSeconds}s wait
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
