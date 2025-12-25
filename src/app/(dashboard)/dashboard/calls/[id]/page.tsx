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

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/dashboard/calls"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to calls
        </Link>
      </div>

      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Call Details</h1>
            <p className="text-gray-500 mt-1">
              {formattedDate} at {formattedTime}
            </p>
          </div>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(
              call.status
            )}`}
          >
            {call.status.replace('_', ' ')}
          </span>
        </div>

        {/* Call metadata */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Agent */}
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <User className="w-5 h-5 text-gray-400 mt-0.5" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Agent</p>
              <p className="text-base text-gray-900 mt-1">{call.agent.name}</p>
            </div>
          </div>

          {/* Phone number */}
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Phone Number</p>
              <p className="text-base text-gray-900 mt-1">{call.phoneNumber}</p>
            </div>
          </div>

          {/* Duration */}
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Duration</p>
              <p className="text-base text-gray-900 mt-1">
                {formatDuration(call.durationSeconds)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Transcript section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Transcript</h2>
        {call.transcript ? (
          <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {call.transcript}
            </p>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <p className="text-gray-500">Transcript not available</p>
            <p className="text-sm text-gray-400 mt-1">
              This can happen for very short or failed calls
            </p>
          </div>
        )}
      </div>

      {/* Summary section (placeholder for future) */}
      {call.summary && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Summary</h2>
          <p className="text-sm text-gray-700">{call.summary}</p>
        </div>
      )}
    </div>
  );
}
