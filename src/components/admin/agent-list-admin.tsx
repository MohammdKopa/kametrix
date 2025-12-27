'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Eye, Loader2 } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  phoneNumber: {
    id: string;
    number: string;
    status: string;
  } | null;
  _count: {
    calls: number;
  };
}

export function AgentListAdmin() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [filterActive, setFilterActive] = useState<string>('all');
  const limit = 20;

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (filterActive !== 'all') {
        params.set('isActive', filterActive);
      }

      const response = await fetch(`/api/admin/agents?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch agents');
      }

      const data = await response.json();
      setAgents(data.agents);
      setTotal(data.total);
      setHasMore(data.hasMore);
    } catch (error) {
      console.error('Error fetching agents:', error);
    } finally {
      setLoading(false);
    }
  }, [page, filterActive]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      {/* Filter */}
      <div className="mb-6">
        <Select
          value={filterActive}
          onValueChange={(value) => {
            setFilterActive(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Agents</SelectItem>
            <SelectItem value="true">Active Only</SelectItem>
            <SelectItem value="false">Inactive Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Agent
              </TableHead>
              <TableHead className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                User
              </TableHead>
              <TableHead className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Phone
              </TableHead>
              <TableHead className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Status
              </TableHead>
              <TableHead className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Calls
              </TableHead>
              <TableHead className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Created
              </TableHead>
              <TableHead className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading agents...
                  </div>
                </TableCell>
              </TableRow>
            ) : agents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                  No agents found
                </TableCell>
              </TableRow>
            ) : (
              agents.map((agent) => (
                <TableRow key={agent.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="px-6 py-4">
                    <span className="text-sm font-medium text-foreground">
                      {agent.name}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <Link
                      href={`/admin/users/${agent.user.id}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {agent.user.email}
                    </Link>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm text-muted-foreground">
                    {agent.phoneNumber?.number || '-'}
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <Badge
                      variant="outline"
                      className={
                        agent.isActive
                          ? 'bg-green-500/20 text-green-400 border-green-500/30'
                          : 'bg-muted text-muted-foreground border-border'
                      }
                    >
                      {agent.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm text-muted-foreground">
                    {agent._count.calls}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm text-muted-foreground">
                    {new Date(agent.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/admin/users/${agent.user.id}`}>
                        <Eye className="w-4 h-4" />
                        <span className="sr-only">View user</span>
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} agents
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="px-3 py-1 text-sm text-muted-foreground flex items-center">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasMore}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
