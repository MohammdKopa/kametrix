import type { Call, Agent } from '@/generated/prisma/client';
import { CallStatus } from '@/generated/prisma/client';
import Link from 'next/link';
import { formatCallCost } from '@/lib/credits-utils';
import { TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface CallRowProps {
  call: Call & { agent: Agent };
}

// Get status badge styling with OKLCH colors for dark mode
const getStatusBadgeStyle = (status: CallStatus) => {
  const styles: Record<CallStatus, string> = {
    COMPLETED: 'bg-green-500/20 text-green-400 border-green-500/30',
    FAILED: 'bg-red-500/20 text-red-400 border-red-500/30',
    IN_PROGRESS: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    RINGING: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    NO_ANSWER: 'bg-muted text-muted-foreground border-border',
    ESCALATED: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    TRANSFERRED: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  };
  return styles[status] || 'bg-muted text-muted-foreground border-border';
};

// Get status dot with OKLCH glow
const getStatusDotStyle = (status: CallStatus) => {
  const dots: Record<CallStatus, string> = {
    COMPLETED: 'bg-green-500 shadow-[0_0_6px_oklch(0.7_0.2_142)]',
    FAILED: 'bg-red-500 shadow-[0_0_6px_oklch(0.6_0.25_25)]',
    IN_PROGRESS: 'bg-amber-500 shadow-[0_0_6px_oklch(0.75_0.18_85)]',
    RINGING: 'bg-blue-500 shadow-[0_0_6px_oklch(0.6_0.2_250)]',
    NO_ANSWER: 'bg-muted-foreground',
    ESCALATED: 'bg-orange-500 shadow-[0_0_6px_oklch(0.7_0.2_50)]',
    TRANSFERRED: 'bg-purple-500 shadow-[0_0_6px_oklch(0.6_0.2_300)]',
  };
  return dots[status] || 'bg-muted-foreground';
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

  // Format credits (cents to euros)
  const formatCredits = (cents: number) => {
    return `€${(cents / 100).toFixed(2)}`;
  };

  return (
    <TableRow className="hover:bg-muted/50 transition-colors">
      <TableCell className="px-6 py-4">
        <Link href={`/dashboard/calls/${call.id}`} className="block">
          <div className="text-sm text-foreground">{formattedDate}</div>
          <div className="text-sm text-muted-foreground">{formattedTime}</div>
        </Link>
      </TableCell>
      <TableCell className="px-6 py-4">
        <Link href={`/dashboard/calls/${call.id}`} className="block">
          <div className="text-sm font-medium text-foreground">{call.agent.name}</div>
        </Link>
      </TableCell>
      <TableCell className="px-6 py-4">
        <Link href={`/dashboard/calls/${call.id}`} className="block">
          <div className="text-sm text-muted-foreground">{call.phoneNumber}</div>
        </Link>
      </TableCell>
      <TableCell className="px-6 py-4">
        <Link href={`/dashboard/calls/${call.id}`} className="block">
          <div className="text-sm text-foreground">
            {call.durationSeconds !== null && call.durationSeconds > 0
              ? (call.creditsUsed > 0
                  ? formatCallCost(call.durationSeconds, call.creditsUsed)
                  : formatDuration(call.durationSeconds))
              : '-'}
          </div>
        </Link>
      </TableCell>
      <TableCell className="px-6 py-4">
        <Link href={`/dashboard/calls/${call.id}`} className="block">
          <Badge
            variant="outline"
            className={`${getStatusBadgeStyle(call.status)} inline-flex items-center gap-1.5`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${getStatusDotStyle(call.status)}`} />
            {call.status.replace('_', ' ')}
          </Badge>
        </Link>
      </TableCell>
      <TableCell className="px-6 py-4 text-sm text-foreground">
        <Link href={`/dashboard/calls/${call.id}`} className="block">
          {formatCredits(call.creditsUsed)}
        </Link>
      </TableCell>
    </TableRow>
  );
}
