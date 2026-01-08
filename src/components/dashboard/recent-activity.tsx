import { Phone } from 'lucide-react';
import Link from 'next/link';
import type { Call, Agent } from '@/generated/prisma/client';
import { CallStatus } from '@/generated/prisma/client';
import { Card, CardHeader, CardTitle, CardContent, CardAction } from '@/components/ui/card';

type CallWithAgent = Call & { agent: Agent };

interface RecentActivityProps {
  calls: CallWithAgent[];
}

// Get status dot color with glow effect
const getStatusStyles = (status: CallStatus) => {
  const styles: Record<CallStatus, { dot: string; glow: string }> = {
    COMPLETED: {
      dot: 'bg-green-500',
      glow: 'shadow-[0_0_8px_oklch(0.72_0.19_142/0.5)]',
    },
    FAILED: {
      dot: 'bg-destructive',
      glow: 'shadow-[0_0_8px_oklch(0.55_0.2_25/0.5)]',
    },
    IN_PROGRESS: {
      dot: 'bg-amber-500',
      glow: 'shadow-[0_0_8px_oklch(0.7_0.15_85/0.5)]',
    },
    RINGING: {
      dot: 'bg-blue-500',
      glow: 'shadow-[0_0_8px_oklch(0.6_0.2_250/0.5)]',
    },
    NO_ANSWER: {
      dot: 'bg-muted-foreground',
      glow: '',
    },
    ESCALATED: {
      dot: 'bg-orange-500',
      glow: 'shadow-[0_0_8px_oklch(0.7_0.2_50/0.5)]',
    },
    TRANSFERRED: {
      dot: 'bg-purple-500',
      glow: 'shadow-[0_0_8px_oklch(0.6_0.2_300/0.5)]',
    },
  };
  return styles[status] || { dot: 'bg-muted-foreground', glow: '' };
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
      <Card className="glass-card border-0 py-0">
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="py-12">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4">
              <Phone className="h-8 w-8 text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">No recent activity</p>
            <p className="text-sm text-muted-foreground">
              Call activity will appear here once you have active agents
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-0 py-0">
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="text-lg">Recent Activity</CardTitle>
        <CardAction>
          <Link
            href="/dashboard/calls"
            className="text-sm text-primary hover:text-primary/80 transition-colors"
          >
            View all
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {calls.map((call) => {
            const statusStyles = getStatusStyles(call.status);
            return (
              <Link
                key={call.id}
                href={`/dashboard/calls/${call.id}`}
                className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors group"
              >
                {/* Status indicator */}
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Phone className="w-5 h-5 text-primary" />
                  </div>
                </div>

                {/* Call info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">
                      {call.agent.name}
                    </p>
                    <span
                      className={`w-2 h-2 rounded-full ${statusStyles.dot} ${statusStyles.glow}`}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {call.phoneNumber}
                  </p>
                </div>

                {/* Duration and time */}
                <div className="flex-shrink-0 text-right">
                  <p className="text-sm font-medium text-foreground">
                    {formatDuration(call.durationSeconds)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatRelativeTime(new Date(call.startedAt))}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
