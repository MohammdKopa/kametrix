'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  PhoneForwarded,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  AlertTriangle,
  BarChart3,
} from 'lucide-react';
import type { EscalationAnalytics } from '@/types/escalation';

interface EscalationStatsProps {
  agentId?: string;
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
}

const REASON_LABELS: Record<string, string> = {
  USER_REQUEST: 'Customer Request',
  LOW_CONFIDENCE: 'Low Confidence',
  REPEATED_CLARIFICATION: 'Repeated Clarification',
  UNRECOGNIZED_INTENT: 'Unrecognized Intent',
  COMPLEX_ISSUE: 'Complex Issue',
  SENTIMENT_NEGATIVE: 'Negative Sentiment',
  MAX_DURATION: 'Max Duration',
  EXPLICIT_TRIGGER: 'Trigger Phrase',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  IN_QUEUE: 'In Queue',
  CONNECTED: 'Connected',
  FAILED: 'Failed',
  NO_OPERATORS: 'No Operators',
  TIMEOUT: 'Timeout',
  CANCELLED: 'Cancelled',
};

export function EscalationStats({ agentId, dateRange }: EscalationStatsProps) {
  const [analytics, setAnalytics] = useState<EscalationAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          analytics: 'true',
          startDate: dateRange?.startDate.toISOString() || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: dateRange?.endDate.toISOString() || new Date().toISOString(),
        });

        if (agentId) {
          params.set('agentId', agentId);
        }

        const response = await fetch(`/api/escalation?${params}`);

        if (!response.ok) {
          throw new Error('Failed to fetch analytics');
        }

        const data = await response.json();
        setAnalytics(data.analytics);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    fetchAnalytics();
  }, [agentId, dateRange]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="glass-card animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
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

  if (!analytics) {
    return (
      <Card className="glass-card">
        <CardContent className="p-6 text-center">
          <BarChart3 className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">No escalation data available</p>
        </CardContent>
      </Card>
    );
  }

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    return `${Math.round(seconds / 60)}m ${Math.round(seconds % 60)}s`;
  };

  const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`;

  // Get top reasons
  const topReasons = Object.entries(analytics.byReason)
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-orange-500/10">
                <PhoneForwarded className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{analytics.totalEscalations}</p>
                <p className="text-sm text-muted-foreground">Total Escalations</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-500/10">
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{formatPercentage(analytics.successRate)}</p>
                <p className="text-sm text-muted-foreground">Success Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-500/10">
                <Clock className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{formatDuration(analytics.averageWaitTime)}</p>
                <p className="text-sm text-muted-foreground">Avg Wait Time</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-500/10">
                <CheckCircle className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{formatPercentage(analytics.resolutionRate)}</p>
                <p className="text-sm text-muted-foreground">Resolution Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Reason */}
        <Card className="glass-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              Escalation Reasons
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topReasons.length > 0 ? (
              <div className="space-y-3">
                {topReasons.map(([reason, count]) => (
                  <div key={reason} className="flex items-center justify-between">
                    <span className="text-sm text-foreground">
                      {REASON_LABELS[reason] || reason}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-orange-500 rounded-full"
                          style={{
                            width: `${(count / analytics.totalEscalations) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-10 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
            )}
          </CardContent>
        </Card>

        {/* By Status */}
        <Card className="glass-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="w-4 h-4 text-blue-500" />
              Transfer Outcomes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analytics.byStatus)
                .filter(([, count]) => count > 0)
                .sort(([, a], [, b]) => b - a)
                .map(([status, count]) => {
                  const isSuccess = status === 'CONNECTED';
                  const isFailure = ['FAILED', 'TIMEOUT', 'NO_OPERATORS'].includes(status);
                  return (
                    <div key={status} className="flex items-center justify-between">
                      <span className={`text-sm ${isSuccess ? 'text-green-500' : isFailure ? 'text-red-500' : 'text-foreground'}`}>
                        {STATUS_LABELS[status] || status}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isSuccess ? 'bg-green-500' : isFailure ? 'bg-red-500' : 'bg-blue-500'
                            }`}
                            style={{
                              width: `${(count / analytics.totalEscalations) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-10 text-right">{count}</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="glass-card border-0">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Avg Call Duration Before Escalation</p>
            <p className="text-xl font-semibold text-foreground">
              {formatDuration(analytics.averageCallDurationBeforeEscalation)}
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-0">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Peak Escalation Hours</p>
            <p className="text-xl font-semibold text-foreground">
              {analytics.peakEscalationHours.length > 0
                ? analytics.peakEscalationHours.map((h) => `${h}:00`).join(', ')
                : 'N/A'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Common Trigger Phrases */}
      {analytics.commonTriggerPhrases.length > 0 && (
        <Card className="glass-card border-0">
          <CardHeader>
            <CardTitle className="text-base">Common Trigger Phrases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {analytics.commonTriggerPhrases.map(({ phrase, count }) => (
                <span
                  key={phrase}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-sm text-primary"
                >
                  &ldquo;{phrase}&rdquo;
                  <span className="text-xs text-primary/70">({count})</span>
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
