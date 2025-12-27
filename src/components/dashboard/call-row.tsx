import type { Call, Agent } from '@/generated/prisma/client';
import { CallStatus } from '@/generated/prisma/client';
import Link from 'next/link';
import { formatCallCost } from '@/lib/credits-utils';

interface CallRowProps {
  call: Call & { agent: Agent };
}

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

  // Get status badge styling
  const getStatusBadge = (status: CallStatus) => {
    const badges = {
      COMPLETED: 'bg-green-100 text-green-800',
      FAILED: 'bg-red-100 text-red-800',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
      RINGING: 'bg-blue-100 text-blue-800',
      NO_ANSWER: 'bg-gray-100 text-gray-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  // Format credits (cents to dollars)
  const formatCredits = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  // Truncate transcript for preview
  const truncateTranscript = (text: string | null, maxLength: number = 100) => {
    if (!text) return '-';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <Link href={`/dashboard/calls/${call.id}`} className="block">
          <div className="text-sm text-gray-900">{formattedDate}</div>
          <div className="text-sm text-gray-500">{formattedTime}</div>
        </Link>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Link href={`/dashboard/calls/${call.id}`} className="block">
          <div className="text-sm font-medium text-gray-900">{call.agent.name}</div>
        </Link>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Link href={`/dashboard/calls/${call.id}`} className="block">
          <div className="text-sm text-gray-900">{call.phoneNumber}</div>
        </Link>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Link href={`/dashboard/calls/${call.id}`} className="block">
          <div className="text-sm text-gray-900">
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
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
              call.status
            )}`}
          >
            {call.status.replace('_', ' ')}
          </span>
        </Link>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        <Link href={`/dashboard/calls/${call.id}`} className="block">
          {formatCredits(call.creditsUsed)}
        </Link>
      </td>
    </tr>
  );
}
