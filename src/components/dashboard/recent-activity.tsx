import { Phone } from 'lucide-react';
import Link from 'next/link';
import type { Call, Agent } from '@/generated/prisma/client';
import { CallStatus } from '@/generated/prisma/client';

type CallWithAgent = Call & { agent: Agent };

interface RecentActivityProps {
  calls: CallWithAgent[];
}

// Get status dot color
const getStatusDot = (status: CallStatus) => {
  const dots: Record<CallStatus, string> = {
    COMPLETED: 'bg-green-500',
    FAILED: 'bg-red-500',
    IN_PROGRESS: 'bg-yellow-500',
    RINGING: 'bg-blue-500',
    NO_ANSWER: 'bg-gray-400',
  };
  return dots[status] || 'bg-gray-400';
};

// Format duration
const formatDuration = (seconds: number | null) => {
  if (!seconds) return '-';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) {
    return `${secs}s`;
  }
  return `${mins}m ${secs}s`;
};

// Format relative time
const formatRelativeTime = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export function RecentActivity({ calls }: RecentActivityProps) {
  if (calls.length === 0) {
    return (
      <div className="glass-card">
        <div className="p-6 border-b border-gray-200 dark:border-[var(--border)]">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-[var(--foreground)]">Recent Activity</h2>
        </div>
        <div className="p-12 text-center">
          <div className="text-gray-400 dark:text-[var(--muted-foreground)] mb-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 dark:bg-[var(--muted)] flex items-center justify-center">
              <Phone className="h-8 w-8" />
            </div>
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-[var(--foreground)] mb-1">No recent activity</p>
          <p className="text-sm text-gray-500 dark:text-[var(--muted-foreground)]">
            Call activity will appear here once you have active agents
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card">
      <div className="p-6 border-b border-gray-200 dark:border-[var(--border)] flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-[var(--foreground)]">Recent Activity</h2>
        <Link
          href="/dashboard/calls"
          className="text-sm text-[var(--accent)] hover:text-[var(--accent-secondary)] transition-colors"
        >
          View all
        </Link>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-[var(--border)]">
        {calls.map((call) => (
          <Link
            key={call.id}
            href={`/dashboard/calls/${call.id}`}
            className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            {/* Status indicator */}
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[var(--accent)]/20 flex items-center justify-center">
                <Phone className="w-5 h-5 text-gray-500 dark:text-[var(--accent)]" />
              </div>
            </div>

            {/* Call info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-gray-900 dark:text-[var(--foreground)] truncate">
                  {call.agent.name}
                </p>
                <span className={`w-2 h-2 rounded-full ${getStatusDot(call.status)}`} />
              </div>
              <p className="text-sm text-gray-500 dark:text-[var(--muted-foreground)] truncate">
                {call.phoneNumber}
              </p>
            </div>

            {/* Duration and time */}
            <div className="flex-shrink-0 text-right">
              <p className="text-sm font-medium text-gray-900 dark:text-[var(--foreground)]">
                {formatDuration(call.durationSeconds)}
              </p>
              <p className="text-xs text-gray-500 dark:text-[var(--muted-foreground)]">
                {formatRelativeTime(new Date(call.startedAt))}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
