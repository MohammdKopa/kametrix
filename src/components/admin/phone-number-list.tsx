'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { RefreshCw, Plus, Loader2, CheckCircle } from 'lucide-react';

interface PhoneNumber {
  id: string;
  number: string;
  status: 'AVAILABLE' | 'ASSIGNED' | 'RELEASED';
  twilioSid: string | null;
  vapiPhoneId: string | null;
  createdAt: string;
  agent: {
    id: string;
    name: string;
    user: {
      id: string;
      email: string;
    };
  } | null;
}

export function PhoneNumberList() {
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newNumber, setNewNumber] = useState('');
  const [adding, setAdding] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ added: number; updated: number; released: number } | null>(null);
  const limit = 20;

  const fetchPhoneNumbers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (filterStatus !== 'all') {
        params.set('status', filterStatus);
      }

      const response = await fetch(`/api/admin/phone-numbers?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch phone numbers');
      }

      const data = await response.json();
      setPhoneNumbers(data.phoneNumbers);
      setTotal(data.total);
      setHasMore(data.hasMore);
    } catch (error) {
      console.error('Error fetching phone numbers:', error);
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus]);

  useEffect(() => {
    fetchPhoneNumbers();
  }, [fetchPhoneNumbers]);

  const handleAddNumber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNumber.trim()) return;

    setAdding(true);
    try {
      const response = await fetch('/api/admin/phone-numbers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: newNumber.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || 'Failed to add phone number');
        return;
      }

      setNewNumber('');
      setShowAddModal(false);
      fetchPhoneNumbers();
    } catch (error) {
      console.error('Error adding phone number:', error);
      alert('Failed to add phone number');
    } finally {
      setAdding(false);
    }
  };

  const handleRelease = async (id: string) => {
    if (!confirm('Release this phone number from its agent?')) return;

    try {
      const response = await fetch(`/api/admin/phone-numbers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: null }),
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || 'Failed to release phone number');
        return;
      }

      fetchPhoneNumbers();
    } catch (error) {
      console.error('Error releasing phone number:', error);
      alert('Failed to release phone number');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this phone number? This action cannot be undone.')) return;

    try {
      const response = await fetch(`/api/admin/phone-numbers/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || 'Failed to delete phone number');
        return;
      }

      fetchPhoneNumbers();
    } catch (error) {
      console.error('Error deleting phone number:', error);
      alert('Failed to delete phone number');
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);

    try {
      const response = await fetch('/api/admin/phone-numbers/sync', {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || 'Failed to sync phone numbers from Vapi');
        return;
      }

      const data = await response.json();
      setSyncResult(data.summary);
      fetchPhoneNumbers();
    } catch (error) {
      console.error('Error syncing phone numbers:', error);
      alert('Failed to sync phone numbers from Vapi');
    } finally {
      setSyncing(false);
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'ASSIGNED':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'RELEASED':
        return 'bg-muted text-muted-foreground border-border';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      {/* Sync Result Banner */}
      {syncResult && (
        <div className="mb-4 p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <p className="text-sm text-green-400">
            Sync complete: {syncResult.added} added, {syncResult.updated} updated, {syncResult.released} released
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="mb-6 flex items-center justify-between">
        <Select
          value={filterStatus}
          onValueChange={(value) => {
            setFilterStatus(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="AVAILABLE">Available</SelectItem>
            <SelectItem value="ASSIGNED">Assigned</SelectItem>
            <SelectItem value="RELEASED">Released</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleSync}
            disabled={syncing}
          >
            {syncing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            {syncing ? 'Syncing...' : 'Sync from Vapi'}
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Number
          </Button>
        </div>
      </div>

      {/* Add Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="glass">
          <DialogHeader>
            <DialogTitle>Add Phone Number</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddNumber}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number (E.164 format)</Label>
                <Input
                  id="phone"
                  type="text"
                  value={newNumber}
                  onChange={(e) => setNewNumber(e.target.value)}
                  placeholder="+14155551234"
                />
                <p className="text-xs text-muted-foreground">
                  Must start with + followed by country code and number
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={adding || !newNumber.trim()}
              >
                {adding ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Number
              </TableHead>
              <TableHead className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Status
              </TableHead>
              <TableHead className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Assigned To
              </TableHead>
              <TableHead className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                User
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
                <TableCell colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading phone numbers...
                  </div>
                </TableCell>
              </TableRow>
            ) : phoneNumbers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                  No phone numbers found
                </TableCell>
              </TableRow>
            ) : (
              phoneNumbers.map((phone) => (
                <TableRow key={phone.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="px-6 py-4">
                    <span className="text-sm font-medium text-foreground">
                      {phone.number}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <Badge
                      variant="outline"
                      className={getStatusBadgeStyle(phone.status)}
                    >
                      {phone.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm text-muted-foreground">
                    {phone.agent?.name || '-'}
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    {phone.agent ? (
                      <Link
                        href={`/admin/users/${phone.agent.user.id}`}
                        className="text-sm text-primary hover:underline"
                      >
                        {phone.agent.user.email}
                      </Link>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm text-muted-foreground">
                    {new Date(phone.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {phone.status === 'ASSIGNED' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRelease(phone.id)}
                          className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                        >
                          Release
                        </Button>
                      )}
                      {phone.status !== 'ASSIGNED' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(phone.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          Delete
                        </Button>
                      )}
                    </div>
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
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} phone numbers
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
