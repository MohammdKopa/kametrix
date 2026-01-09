'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserRow } from './user-row';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Search,
  Loader2,
  Filter,
  CheckSquare,
  Square,
  UserCheck,
  UserX,
  Shield,
  Trash2,
  X,
} from 'lucide-react';

type Role = 'USER' | 'ADMIN';
type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
type BulkAction = 'activate' | 'deactivate' | 'suspend' | 'change_role' | 'delete';

interface User {
  id: string;
  email: string;
  name: string | null;
  username: string | null;
  role: Role;
  status: UserStatus;
  creditBalance: number;
  createdAt: string;
  updatedAt: string;
  deactivatedAt: string | null;
  lastPasswordReset: string | null;
  _count: {
    agents: number;
    calls: number;
  };
}

interface UserListProps {
  onUserUpdated?: () => void;
}

export function UserList({ onUserUpdated }: UserListProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const limit = 20;

  // Selection state
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Bulk action dialog state
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [pendingBulkAction, setPendingBulkAction] = useState<BulkAction | null>(null);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [bulkRoleValue, setBulkRoleValue] = useState<Role>('USER');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (search) {
        params.set('search', search);
      }
      if (roleFilter !== 'all') {
        params.set('role', roleFilter);
      }
      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }

      const response = await fetch(`/api/admin/users?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users);
      setTotal(data.total);
      setHasMore(data.hasMore);
      setTotalPages(data.totalPages);
      // Clear selection when data changes
      setSelectedUsers(new Set());
      setSelectAll(false);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const handleFilterChange = (type: 'role' | 'status', value: string) => {
    if (type === 'role') {
      setRoleFilter(value as Role | 'all');
    } else {
      setStatusFilter(value as UserStatus | 'all');
    }
    setPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setRoleFilter('all');
    setStatusFilter('all');
    setPage(1);
  };

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map((u) => u.id)));
    }
    setSelectAll(!selectAll);
  };

  const toggleUserSelection = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
    setSelectAll(newSelected.size === users.length);
  };

  // Bulk action handlers
  const handleBulkAction = (action: BulkAction) => {
    if (selectedUsers.size === 0) return;
    setPendingBulkAction(action);
    setBulkDialogOpen(true);
  };

  const confirmBulkAction = async () => {
    if (!pendingBulkAction || selectedUsers.size === 0) return;

    setBulkActionLoading(true);
    try {
      const body: { userIds: string[]; action: BulkAction; role?: Role } = {
        userIds: Array.from(selectedUsers),
        action: pendingBulkAction,
      };

      if (pendingBulkAction === 'change_role') {
        body.role = bulkRoleValue;
      }

      const response = await fetch('/api/admin/users/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to perform bulk action');
      }

      const data = await response.json();
      alert(data.message);

      // Refresh the list
      fetchUsers();
      onUserUpdated?.();
    } catch (error) {
      console.error('Bulk action error:', error);
      alert(error instanceof Error ? error.message : 'Failed to perform bulk action');
    } finally {
      setBulkActionLoading(false);
      setBulkDialogOpen(false);
      setPendingBulkAction(null);
    }
  };

  const getBulkActionDescription = () => {
    const count = selectedUsers.size;
    switch (pendingBulkAction) {
      case 'activate':
        return `This will activate ${count} user${count > 1 ? 's' : ''}, allowing them to log in and use the platform.`;
      case 'deactivate':
        return `This will deactivate ${count} user${count > 1 ? 's' : ''} and log them out of all sessions.`;
      case 'suspend':
        return `This will suspend ${count} user${count > 1 ? 's' : ''} and log them out of all sessions.`;
      case 'change_role':
        return `This will change the role of ${count} user${count > 1 ? 's' : ''} to ${bulkRoleValue}.`;
      case 'delete':
        return `This will permanently delete ${count} user${count > 1 ? 's' : ''} and all their data. This action cannot be undone.`;
      default:
        return '';
    }
  };

  const hasActiveFilters = search || roleFilter !== 'all' || statusFilter !== 'all';

  return (
    <div>
      {/* Search and Filters */}
      <form onSubmit={handleSearchSubmit} className="mb-6 space-y-4">
        <div className="flex gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by email, name, or username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={roleFilter} onValueChange={(v) => handleFilterChange('role', v)}>
            <SelectTrigger className="w-[140px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="USER">User</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(v) => handleFilterChange('status', v)}>
            <SelectTrigger className="w-[160px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
              <SelectItem value="SUSPENDED">Suspended</SelectItem>
            </SelectContent>
          </Select>

          <Button type="submit">Search</Button>

          {hasActiveFilters && (
            <Button type="button" variant="outline" onClick={clearFilters}>
              <X className="w-4 h-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
      </form>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mb-4">
          {search && (
            <Badge variant="secondary" className="gap-1">
              Search: {search}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => setSearch('')}
              />
            </Badge>
          )}
          {roleFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Role: {roleFilter}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => setRoleFilter('all')}
              />
            </Badge>
          )}
          {statusFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Status: {statusFilter}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => setStatusFilter('all')}
              />
            </Badge>
          )}
        </div>
      )}

      {/* Bulk Actions Bar */}
      {selectedUsers.size > 0 && (
        <div className="mb-4 p-3 bg-muted/50 rounded-lg border border-border flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">
            {selectedUsers.size} user{selectedUsers.size > 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('activate')}
              className="gap-1"
            >
              <UserCheck className="w-4 h-4" />
              Activate
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('deactivate')}
              className="gap-1"
            >
              <UserX className="w-4 h-4" />
              Deactivate
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('change_role')}
              className="gap-1"
            >
              <Shield className="w-4 h-4" />
              Change Role
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleBulkAction('delete')}
              className="gap-1"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="px-4 py-3 w-10">
                <button
                  onClick={toggleSelectAll}
                  className="p-1 hover:bg-muted rounded"
                  disabled={loading || users.length === 0}
                >
                  {selectAll ? (
                    <CheckSquare className="w-4 h-4 text-primary" />
                  ) : (
                    <Square className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              </TableHead>
              <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                User
              </TableHead>
              <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Role
              </TableHead>
              <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Status
              </TableHead>
              <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Credits
              </TableHead>
              <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Agents
              </TableHead>
              <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Calls
              </TableHead>
              <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Created
              </TableHead>
              <TableHead className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="px-6 py-12 text-center text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading users...
                  </div>
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="px-6 py-12 text-center text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  selected={selectedUsers.has(user.id)}
                  onSelect={() => toggleUserSelection(user.id)}
                  onUserUpdated={() => {
                    fetchUsers();
                    onUserUpdated?.();
                  }}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} users
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

      {/* Bulk Action Confirmation Dialog */}
      <AlertDialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Confirm Bulk {pendingBulkAction?.replace('_', ' ').replace(/^\w/, (c) => c.toUpperCase())}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {getBulkActionDescription()}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {pendingBulkAction === 'change_role' && (
            <div className="py-4">
              <label className="text-sm font-medium text-foreground mb-2 block">
                Select new role:
              </label>
              <Select value={bulkRoleValue} onValueChange={(v) => setBulkRoleValue(v as Role)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">User</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkActionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkAction}
              disabled={bulkActionLoading}
              className={pendingBulkAction === 'delete' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {bulkActionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Confirm'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
