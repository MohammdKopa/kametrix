'use client';

import { useState } from 'react';
import { Plus, Minus, DollarSign, Loader2 } from 'lucide-react';
import type { CreditTransaction } from '@/generated/prisma/client';
import { TransactionType } from '@/generated/prisma/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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

  // Format credits (cents to euros)
  const formatCredits = (cents: number) => {
    return `€${(cents / 100).toFixed(2)}`;
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

  // Get type badge variant and styling
  const getTypeBadgeConfig = (type: TransactionType) => {
    const configs = {
      PURCHASE: {
        className: 'bg-green-500/20 text-green-400 border-green-500/30',
        label: 'Purchase',
        icon: Plus,
      },
      CALL_USAGE: {
        className: 'bg-muted text-muted-foreground border-border',
        label: 'Call Usage',
        icon: Minus,
      },
      ADMIN_ADJUSTMENT: {
        className: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        label: 'Admin Adjustment',
        icon: Plus,
      },
      GRACE_USAGE: {
        className: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        label: 'Grace Usage',
        icon: Minus,
      },
    };
    return configs[type] || configs.CALL_USAGE;
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
      <div className="text-center py-12 px-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4">
          <DollarSign className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-sm font-medium text-foreground">No transactions yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Transactions will appear here when you purchase or use credits.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >
                Date
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >
                Type
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >
                Amount
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >
                Description
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >
                Balance After
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {transactions.map((transaction) => {
              const badgeConfig = getTypeBadgeConfig(transaction.type);
              const IconComponent = badgeConfig.icon;
              return (
                <tr
                  key={transaction.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {formatDate(transaction.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge
                      variant="outline"
                      className={`${badgeConfig.className} gap-1`}
                    >
                      <IconComponent className="w-3 h-3" />
                      {badgeConfig.label}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`font-medium ${
                        transaction.amount >= 0
                          ? 'text-green-400'
                          : 'text-red-400'
                      }`}
                    >
                      {transaction.amount >= 0 ? '+' : ''}
                      {formatCredits(transaction.amount)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground max-w-xs truncate">
                    {transaction.description || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground font-medium">
                    {formatCredits(transaction.balanceAfter)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {(page > 1 || hasMore) && (
        <div className="px-6 py-4 flex items-center justify-between border-t border-border bg-muted/30">
          <p className="text-sm text-muted-foreground">
            Page {page} {initialTotal > 0 && `of ${Math.ceil(initialTotal / 20)}`}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={page === 1 || isLoading}
            >
              {isLoading && page > 1 ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : null}
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={!hasMore || isLoading}
            >
              Next
              {isLoading && hasMore ? (
                <Loader2 className="h-4 w-4 animate-spin ml-1" />
              ) : null}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
