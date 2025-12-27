'use client';

import { useState, useEffect } from 'react';
import { CallRow } from './call-row';
import { Phone } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
      <Card className="glass-card">
        <CardContent className="text-center py-12 px-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4">
            <Phone className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-medium text-foreground">
            No calls yet
          </h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
            Calls will appear here once your agents start receiving them.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Date
            </TableHead>
            <TableHead className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Agent
            </TableHead>
            <TableHead className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Phone
            </TableHead>
            <TableHead className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Duration
            </TableHead>
            <TableHead className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Status
            </TableHead>
            <TableHead className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Credits
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {calls.map((call) => (
            <CallRow key={call.id} call={call} />
          ))}
        </TableBody>
      </Table>

      {/* Pagination */}
      {(page > 1 || hasMore) && (
        <div className="bg-muted/30 px-6 py-3 flex items-center justify-between border-t border-border">
          <div className="text-sm text-muted-foreground">
            Page {page} {initialTotal > 0 && `of ${Math.ceil(initialTotal / 20)}`}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={page === 1 || isLoading}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={!hasMore || isLoading}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
