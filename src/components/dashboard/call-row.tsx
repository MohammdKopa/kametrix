import type { Call, Agent } from '@/generated/prisma/client';
import { CallStatus } from '@/generated/prisma/client';
import Link from 'next/link';
import { formatCallCost } from '@/lib/credits-utils';

interface CallRowProps {
  call: Call & { agent: Agent };
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

// Get status badge styling with dark mode
const getStatusBadge = (status: CallStatus) => {
  const badges: Record<CallStatus, string> = {
    COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400',
    FAILED: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400',
    RINGING: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400',
    NO_ANSWER: 'bg-gray-100 text-gray-800 dark:bg-white/10 dark:text-[var(--muted-foreground)]',
  };
  return badges[status] || 'bg-gray-100 text-gray-800 dark:bg-white/10 dark:text-[var(--muted-foreground)]';
};

export function CallRow({ call }: CallRowProps) {
  // Format date and time
  const formattedDate = new Date(call.startedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const formattedTime = new Date(call.startedAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

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

  // Format credits (cents to dollars)
  const formatCredits = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <Link href={`/dashboard/calls/${call.id}`} className="block">
          <div className="text-sm text-gray-900 dark:text-[var(--foreground)]">{formattedDate}</div>
          <div className="text-sm text-gray-500 dark:text-[var(--muted-foreground)]">{formattedTime}</div>
        </Link>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Link href={`/dashboard/calls/${call.id}`} className="block">
          <div className="text-sm font-medium text-gray-900 dark:text-[var(--foreground)]">{call.agent.name}</div>
        </Link>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Link href={`/dashboard/calls/${call.id}`} className="block">
          <div className="text-sm text-gray-900 dark:text-[var(--foreground)]">{call.phoneNumber}</div>
        </Link>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Link href={`/dashboard/calls/${call.id}`} className="block">
          <div className="text-sm text-gray-900 dark:text-[var(--foreground)]">
            {call.durationSeconds !== null && call.durationSeconds > 0
              ? (call.creditsUsed > 0
                  ? formatCallCost(call.durationSeconds, call.creditsUsed)
                  : formatDuration(call.durationSeconds))
              : '-'}
          </div>
        </Link>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Link href={`/dashboard/calls/${call.id}`} className="block">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(
              call.status
            )}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(call.status)}`} />
            {call.status.replace('_', ' ')}
          </span>
        </Link>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-[var(--foreground)]">
        <Link href={`/dashboard/calls/${call.id}`} className="block">
          {formatCredits(call.creditsUsed)}
        </Link>
      </td>
    </tr>
  );
}
