import { getCurrentUser } from '@/lib/auth-guard';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { CallStatus, EscalationReason, EscalationStatus } from '@/generated/prisma/client';
import Link from 'next/link';
import { ArrowLeft, Phone, Clock, User, PhoneForwarded, AlertTriangle } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface CallDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CallDetailPage({ params }: CallDetailPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // Await params
  const { id } = await params;

  // Fetch call with agent relation and escalation log
  const call = await prisma.call.findUnique({
    where: { id },
    include: {
      agent: true,
      escalationLog: true,
    },
  });

  // Check if call exists and user owns it
  if (!call || call.userId !== user.id) {
    redirect('/dashboard/calls');
  }

  // Format date and time
  const formattedDate = new Date(call.startedAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = new Date(call.startedAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Format duration
  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) {
      return `${secs} seconds`;
    }
    return `${mins} min ${secs} sec`;
  };

  // Get status dot color
  const getStatusDot = (status: CallStatus) => {
    const dots: Record<CallStatus, string> = {
      COMPLETED: 'bg-green-500',
      FAILED: 'bg-red-500',
      IN_PROGRESS: 'bg-yellow-500',
      RINGING: 'bg-blue-500',
      NO_ANSWER: 'bg-gray-400',
      ESCALATED: 'bg-orange-500',
      TRANSFERRED: 'bg-purple-500',
    };
    return dots[status] || 'bg-gray-400';
  };

  // Get status badge styling with dark mode
  const getStatusBadge = (status: CallStatus) => {
    const badges: Record<CallStatus, string> = {
      COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400',
      FAILED: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400',
      RINGING: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400',
      NO_ANSWER: 'bg-gray-100 text-gray-800 dark:bg-white/10 dark:text-[var(--muted-foreground)]',
      ESCALATED: 'bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-400',
      TRANSFERRED: 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-400',
    };
    return badges[status] || 'bg-gray-100 text-gray-800 dark:bg-white/10 dark:text-[var(--muted-foreground)]';
  };

  // Get escalation reason label
  const getEscalationReasonLabel = (reason: EscalationReason) => {
    const labels: Record<EscalationReason, string> = {
      USER_REQUEST: 'Customer requested human agent',
      LOW_CONFIDENCE: 'AI had low confidence',
      REPEATED_CLARIFICATION: 'Multiple clarification attempts',
      UNRECOGNIZED_INTENT: 'Could not understand intent',
      COMPLEX_ISSUE: 'Complex issue requiring human',
      SENTIMENT_NEGATIVE: 'Negative customer sentiment',
      MAX_DURATION: 'Maximum call duration reached',
      EXPLICIT_TRIGGER: 'Trigger phrase detected',
    };
    return labels[reason] || reason;
  };

  // Get escalation status badge
  const getEscalationStatusBadge = (status: EscalationStatus) => {
    const badges: Record<EscalationStatus, { bg: string; text: string }> = {
      PENDING: { bg: 'bg-yellow-500/20', text: 'text-yellow-500' },
      IN_QUEUE: { bg: 'bg-blue-500/20', text: 'text-blue-500' },
      CONNECTED: { bg: 'bg-green-500/20', text: 'text-green-500' },
      FAILED: { bg: 'bg-red-500/20', text: 'text-red-500' },
      NO_OPERATORS: { bg: 'bg-gray-500/20', text: 'text-gray-500' },
      TIMEOUT: { bg: 'bg-orange-500/20', text: 'text-orange-500' },
      CANCELLED: { bg: 'bg-gray-500/20', text: 'text-gray-500' },
    };
    return badges[status] || { bg: 'bg-gray-500/20', text: 'text-gray-500' };
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/dashboard/calls"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-[var(--muted-foreground)] dark:hover:text-[var(--foreground)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to calls
        </Link>
      </div>

      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-[var(--foreground)]">
              Call Details
            </h1>
            <p className="text-gray-500 dark:text-[var(--muted-foreground)] mt-1">
              {formattedDate} at {formattedTime}
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${getStatusBadge(
              call.status
            )}`}
          >
            <span className={`w-2 h-2 rounded-full ${getStatusDot(call.status)}`} />
            {call.status.replace('_', ' ')}
          </span>
        </div>

        {/* Call metadata */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Agent */}
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-[var(--accent)]/20">
                <User className="w-5 h-5 text-gray-500 dark:text-[var(--accent)]" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-[var(--muted-foreground)]">Agent</p>
              <p className="text-base text-gray-900 dark:text-[var(--foreground)] mt-1">{call.agent.name}</p>
            </div>
          </div>

          {/* Phone number */}
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-[var(--accent)]/20">
                <Phone className="w-5 h-5 text-gray-500 dark:text-[var(--accent)]" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-[var(--muted-foreground)]">Phone Number</p>
              <p className="text-base text-gray-900 dark:text-[var(--foreground)] mt-1">{call.phoneNumber}</p>
            </div>
          </div>

          {/* Duration */}
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-[var(--accent)]/20">
                <Clock className="w-5 h-5 text-gray-500 dark:text-[var(--accent)]" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-[var(--muted-foreground)]">Duration</p>
              <p className="text-base text-gray-900 dark:text-[var(--foreground)] mt-1">
                {formatDuration(call.durationSeconds)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Transcript section */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-[var(--foreground)] mb-4">
          Transcript
        </h2>
        {call.transcript ? (
          <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 max-h-96 overflow-y-auto border border-gray-100 dark:border-[var(--border)]">
            <p className="text-sm text-gray-700 dark:text-[var(--foreground)] whitespace-pre-wrap leading-relaxed">
              {call.transcript}
            </p>
          </div>
        ) : (
          <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-8 text-center border border-gray-100 dark:border-[var(--border)]">
            <p className="text-gray-500 dark:text-[var(--muted-foreground)]">Transcript not available</p>
            <p className="text-sm text-gray-400 dark:text-[var(--muted-foreground)] mt-1">
              This can happen for very short or failed calls
            </p>
          </div>
        )}
      </div>

      {/* Summary section */}
      {call.summary && (
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-[var(--foreground)] mb-4">
            Summary
          </h2>
          <p className="text-sm text-gray-700 dark:text-[var(--foreground)]">{call.summary}</p>
        </div>
      )}

      {/* Escalation section */}
      {(call.escalationReason || call.escalationLog) && (
        <div className="glass-card p-6 border-l-4 border-orange-500">
          <div className="flex items-center gap-2 mb-4">
            <PhoneForwarded className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-[var(--foreground)]">
              Call Escalation
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Reason */}
            {call.escalationReason && (
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="p-2 rounded-lg bg-orange-500/10">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-[var(--muted-foreground)]">
                    Escalation Reason
                  </p>
                  <p className="text-base text-gray-900 dark:text-[var(--foreground)] mt-1">
                    {getEscalationReasonLabel(call.escalationReason)}
                  </p>
                </div>
              </div>
            )}

            {/* Status */}
            {call.escalationStatus && (
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="p-2 rounded-lg bg-gray-100 dark:bg-[var(--accent)]/20">
                    <PhoneForwarded className="w-5 h-5 text-gray-500 dark:text-[var(--accent)]" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-[var(--muted-foreground)]">
                    Transfer Status
                  </p>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                      getEscalationStatusBadge(call.escalationStatus).bg
                    } ${getEscalationStatusBadge(call.escalationStatus).text}`}
                  >
                    {call.escalationStatus.replace('_', ' ')}
                  </span>
                </div>
              </div>
            )}

            {/* Transferred To */}
            {call.escalatedToNumber && (
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="p-2 rounded-lg bg-gray-100 dark:bg-[var(--accent)]/20">
                    <Phone className="w-5 h-5 text-gray-500 dark:text-[var(--accent)]" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-[var(--muted-foreground)]">
                    Transferred To
                  </p>
                  <p className="text-base text-gray-900 dark:text-[var(--foreground)] mt-1">
                    {call.escalatedToNumber}
                  </p>
                </div>
              </div>
            )}

            {/* Escalation Time */}
            {call.escalatedAt && (
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="p-2 rounded-lg bg-gray-100 dark:bg-[var(--accent)]/20">
                    <Clock className="w-5 h-5 text-gray-500 dark:text-[var(--accent)]" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-[var(--muted-foreground)]">
                    Escalated At
                  </p>
                  <p className="text-base text-gray-900 dark:text-[var(--foreground)] mt-1">
                    {new Date(call.escalatedAt).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            )}

            {/* Human Connected */}
            {call.humanConnectedAt && (
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <User className="w-5 h-5 text-green-500" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-[var(--muted-foreground)]">
                    Human Connected At
                  </p>
                  <p className="text-base text-gray-900 dark:text-[var(--foreground)] mt-1">
                    {new Date(call.humanConnectedAt).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            )}

            {/* Transfer Attempts */}
            {call.transferAttempts > 0 && (
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="p-2 rounded-lg bg-gray-100 dark:bg-[var(--accent)]/20">
                    <PhoneForwarded className="w-5 h-5 text-gray-500 dark:text-[var(--accent)]" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-[var(--muted-foreground)]">
                    Transfer Attempts
                  </p>
                  <p className="text-base text-gray-900 dark:text-[var(--foreground)] mt-1">
                    {call.transferAttempts}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Escalation Notes */}
          {call.escalationNotes && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-[var(--muted-foreground)] mb-2">
                Escalation Notes
              </h3>
              <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 border border-gray-100 dark:border-[var(--border)]">
                <p className="text-sm text-gray-700 dark:text-[var(--foreground)] whitespace-pre-wrap">
                  {call.escalationNotes}
                </p>
              </div>
            </div>
          )}

          {/* Detailed Escalation Log */}
          {call.escalationLog && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-[var(--border)]">
              <h3 className="text-sm font-medium text-gray-500 dark:text-[var(--muted-foreground)] mb-4">
                Detailed Escalation Log
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {call.escalationLog.waitTimeSeconds !== null && (
                  <div>
                    <span className="text-gray-500 dark:text-[var(--muted-foreground)]">Wait Time: </span>
                    <span className="text-gray-900 dark:text-[var(--foreground)]">
                      {call.escalationLog.waitTimeSeconds} seconds
                    </span>
                  </div>
                )}
                {call.escalationLog.clarificationCount > 0 && (
                  <div>
                    <span className="text-gray-500 dark:text-[var(--muted-foreground)]">Clarifications: </span>
                    <span className="text-gray-900 dark:text-[var(--foreground)]">
                      {call.escalationLog.clarificationCount}
                    </span>
                  </div>
                )}
                {call.escalationLog.callerSentiment && (
                  <div>
                    <span className="text-gray-500 dark:text-[var(--muted-foreground)]">Caller Sentiment: </span>
                    <span className="text-gray-900 dark:text-[var(--foreground)]">
                      {call.escalationLog.callerSentiment}
                      {call.escalationLog.sentimentScore !== null && ` (${call.escalationLog.sentimentScore.toFixed(2)})`}
                    </span>
                  </div>
                )}
                {call.escalationLog.wasResolved !== null && (
                  <div>
                    <span className="text-gray-500 dark:text-[var(--muted-foreground)]">Resolved: </span>
                    <span className={call.escalationLog.wasResolved ? 'text-green-500' : 'text-red-500'}>
                      {call.escalationLog.wasResolved ? 'Yes' : 'No'}
                    </span>
                  </div>
                )}
                {call.escalationLog.customerSatisfied !== null && (
                  <div>
                    <span className="text-gray-500 dark:text-[var(--muted-foreground)]">Customer Satisfied: </span>
                    <span className={call.escalationLog.customerSatisfied ? 'text-green-500' : 'text-red-500'}>
                      {call.escalationLog.customerSatisfied ? 'Yes' : 'No'}
                    </span>
                  </div>
                )}
                {call.escalationLog.failureReason && (
                  <div className="col-span-2">
                    <span className="text-gray-500 dark:text-[var(--muted-foreground)]">Failure Reason: </span>
                    <span className="text-red-500">{call.escalationLog.failureReason}</span>
                  </div>
                )}
              </div>

              {/* Resolution Notes */}
              {call.escalationLog.resolutionNotes && (
                <div className="mt-4">
                  <span className="text-sm text-gray-500 dark:text-[var(--muted-foreground)]">Resolution Notes:</span>
                  <p className="text-sm text-gray-700 dark:text-[var(--foreground)] mt-1">
                    {call.escalationLog.resolutionNotes}
                  </p>
                </div>
              )}

              {/* Last User Message */}
              {call.escalationLog.lastUserMessage && (
                <div className="mt-4">
                  <span className="text-sm text-gray-500 dark:text-[var(--muted-foreground)]">
                    Last User Message Before Escalation:
                  </span>
                  <p className="text-sm text-gray-700 dark:text-[var(--foreground)] mt-1 italic">
                    &ldquo;{call.escalationLog.lastUserMessage}&rdquo;
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
