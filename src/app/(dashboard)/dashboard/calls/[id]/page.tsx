import { getCurrentUser } from '@/lib/auth-guard';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { CallStatus } from '@/generated/prisma/client';
import Link from 'next/link';
import { ArrowLeft, Phone, Clock, User } from 'lucide-react';

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

  // Fetch call with agent relation
  const call = await prisma.call.findUnique({
    where: { id },
    include: {
      agent: true,
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
    </div>
  );
}
