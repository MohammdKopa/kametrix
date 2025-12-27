'use client';

import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import type { CreditTransaction } from '@/generated/prisma/client';
import { TransactionType } from '@/generated/prisma/client';

interface TransactionListProps {
  initialTransactions: CreditTransaction[];
  initialTotal: number;
  initialHasMore: boolean;
}

export function TransactionList({
  initialTransactions,
  initialTotal,
  initialHasMore,
}: TransactionListProps) {
  const [transactions, setTransactions] = useState<CreditTransaction[]>(initialTransactions);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);

  // Format credits (cents to dollars)
  const formatCredits = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get type badge styling
  const getTypeBadge = (type: TransactionType) => {
    const badges = {
      PURCHASE: 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400',
      CALL_USAGE: 'bg-gray-100 text-gray-800 dark:bg-[var(--muted)] dark:text-[var(--muted-foreground)]',
      ADMIN_ADJUSTMENT: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400',
      GRACE_USAGE: 'bg-yellow-100 text-yellow-800 dark:bg-amber-500/20 dark:text-amber-400',
    };
    return badges[type] || 'bg-gray-100 text-gray-800 dark:bg-[var(--muted)] dark:text-[var(--muted-foreground)]';
  };

  // Get type label
  const getTypeLabel = (type: TransactionType) => {
    const labels = {
      PURCHASE: 'Purchase',
      CALL_USAGE: 'Call Usage',
      ADMIN_ADJUSTMENT: 'Admin Adjustment',
      GRACE_USAGE: 'Grace Usage',
    };
    return labels[type] || type;
  };

  const loadPage = async (newPage: number) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: newPage.toString(),
        limit: '20',
      });

      const response = await fetch(`/api/credits/transactions?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const data = await response.json();
      setTransactions(data.transactions);
      setHasMore(data.hasMore);
      setPage(newPage);
    } catch (error) {
      console.error('Error loading transactions:', error);
      alert('Failed to load transactions');
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

  if (transactions.length === 0 && page === 1) {
    return (
      <div className="text-center py-12 bg-white border border-gray-200 rounded-xl dark:glass-card dark:border-[var(--border)]">
        <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 dark:bg-[var(--muted)] flex items-center justify-center mb-4">
          <svg
            className="h-8 w-8 text-gray-400 dark:text-[var(--muted-foreground)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-sm font-medium text-gray-900 dark:text-[var(--foreground)]">No transactions yet</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-[var(--muted-foreground)]">
          Transactions will appear here when you purchase or use credits.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden dark:glass-card dark:border-[var(--border)]">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-[var(--border)]">
          <thead className="bg-gray-50 dark:bg-[var(--muted)]">
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
                Type
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[var(--muted-foreground)] uppercase tracking-wider"
              >
                Amount
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[var(--muted-foreground)] uppercase tracking-wider"
              >
                Description
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[var(--muted-foreground)] uppercase tracking-wider"
              >
                Balance After
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 dark:bg-transparent dark:divide-[var(--border)]">
            {transactions.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-[var(--muted)]/50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-[var(--foreground)]">
                  {formatDate(transaction.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeBadge(
                      transaction.type
                    )}`}
                  >
                    {transaction.amount >= 0 ? (
                      <Plus className="w-3 h-3" />
                    ) : (
                      <Minus className="w-3 h-3" />
                    )}
                    {getTypeLabel(transaction.type)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span
                    className={
                      transaction.amount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }
                  >
                    {transaction.amount >= 0 ? '+' : ''}
                    {formatCredits(transaction.amount)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-[var(--muted-foreground)]">
                  {transaction.description || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-[var(--foreground)]">
                  {formatCredits(transaction.balanceAfter)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {(page > 1 || hasMore) && (
        <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200 dark:bg-[var(--muted)] dark:border-[var(--border)]">
          <div className="text-sm text-gray-700 dark:text-[var(--muted-foreground)]">
            Page {page} {initialTotal > 0 && `of ${Math.ceil(initialTotal / 20)}`}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrevious}
              disabled={page === 1 || isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-[var(--background)] dark:border-[var(--border)] dark:text-[var(--foreground)] dark:hover:bg-[var(--muted)]"
            >
              Previous
            </button>
            <button
              onClick={handleNext}
              disabled={!hasMore || isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-[var(--background)] dark:border-[var(--border)] dark:text-[var(--foreground)] dark:hover:bg-[var(--muted)]"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
