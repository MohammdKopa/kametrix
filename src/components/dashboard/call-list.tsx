'use client';

import { useState, useEffect } from 'react';
import { CallRow } from './call-row';
import { Phone } from 'lucide-react';
import type { Call, Agent } from '@/generated/prisma/client';

type CallWithAgent = Call & { agent: Agent };

interface CallListProps {
  initialCalls: CallWithAgent[];
  initialTotal: number;
  initialHasMore: boolean;
  statusFilter?: string;
}

export function CallList({
  initialCalls,
  initialTotal,
  initialHasMore,
  statusFilter,
}: CallListProps) {
  const [calls, setCalls] = useState<CallWithAgent[]>(initialCalls);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);

  // Reset when filter changes
  useEffect(() => {
    setCalls(initialCalls);
    setPage(1);
    setHasMore(initialHasMore);
  }, [initialCalls, initialHasMore, statusFilter]);

  const loadPage = async (newPage: number) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: newPage.toString(),
        limit: '20',
      });

      if (statusFilter) {
        params.append('status', statusFilter);
      }

      const response = await fetch(`/api/calls?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch calls');
      }

      const data = await response.json();
      setCalls(data.calls);
      setHasMore(data.hasMore);
      setPage(newPage);
    } catch (error) {
      console.error('Error loading calls:', error);
      alert('Failed to load calls');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevious = () => {
    if (page > 1) {
      loadPage(page - 1);
    }
  };

  const handleNext = () => {
    if (hasMore) {
      loadPage(page + 1);
    }
  };

  if (calls.length === 0 && page === 1) {
    return (
      <div className="glass-card text-center py-12 px-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 dark:bg-[var(--accent)]/20 flex items-center justify-center mb-4">
          <Phone className="w-8 h-8 text-gray-400 dark:text-[var(--accent)]" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-[var(--foreground)]">
          No calls yet
        </h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-[var(--muted-foreground)] max-w-sm mx-auto">
          Calls will appear here once your agents start receiving them.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-[var(--border)]">
          <thead className="bg-gray-50 dark:bg-white/5">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[var(--muted-foreground)] uppercase tracking-wider"
              >
                Date
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[var(--muted-foreground)] uppercase tracking-wider"
              >
                Agent
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[var(--muted-foreground)] uppercase tracking-wider"
              >
                Phone
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[var(--muted-foreground)] uppercase tracking-wider"
              >
                Duration
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[var(--muted-foreground)] uppercase tracking-wider"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[var(--muted-foreground)] uppercase tracking-wider"
              >
                Credits
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-[var(--border)]">
            {calls.map((call) => (
              <CallRow key={call.id} call={call} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {(page > 1 || hasMore) && (
        <div className="bg-gray-50 dark:bg-white/5 px-6 py-3 flex items-center justify-between border-t border-gray-200 dark:border-[var(--border)]">
          <div className="text-sm text-gray-700 dark:text-[var(--muted-foreground)]">
            Page {page} {initialTotal > 0 && `of ${Math.ceil(initialTotal / 20)}`}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrevious}
              disabled={page === 1 || isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-[var(--foreground)] bg-white dark:bg-white/10 border border-gray-300 dark:border-[var(--border)] rounded-xl hover:bg-gray-50 dark:hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              onClick={handleNext}
              disabled={!hasMore || isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-[var(--foreground)] bg-white dark:bg-white/10 border border-gray-300 dark:border-[var(--border)] rounded-xl hover:bg-gray-50 dark:hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
