'use client';

import { useState, useEffect } from 'react';
import { CallRow } from './call-row';
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
      <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No calls yet</h3>
        <p className="mt-1 text-sm text-gray-500">
          Calls will appear here once your agents start receiving them.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Date
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Agent
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Phone
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Duration
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Credits
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {calls.map((call) => (
              <CallRow key={call.id} call={call} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {(page > 1 || hasMore) && (
        <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
          <div className="text-sm text-gray-700">
            Page {page} {initialTotal > 0 && `of ${Math.ceil(initialTotal / 20)}`}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrevious}
              disabled={page === 1 || isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={handleNext}
              disabled={!hasMore || isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
