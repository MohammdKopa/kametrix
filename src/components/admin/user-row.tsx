'use client';

import { useState } from 'react';
import Link from 'next/link';
import { TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  Eye,
  MoreHorizontal,
  Pencil,
  UserCheck,
  UserX,
  Key,
  Trash2,
  CheckSquare,
  Square,
  Shield,
  Ban,
  Loader2,
} from 'lucide-react';

type Role = 'USER' | 'ADMIN';
type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

interface UserRowProps {
  user: {
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
  };
  selected?: boolean;
  onSelect?: () => void;
  onUserUpdated?: () => void;
}

export function UserRow({ user, selected, onSelect, onUserUpdated }: UserRowProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<UserStatus | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);

  const formattedDate = new Date(user.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  // Convert cents to dollars for display
  const creditDollars = (user.creditBalance / 100).toFixed(2);

  const getStatusBadgeClass = (status: UserStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'INACTIVE':
        return 'bg-muted text-muted-foreground border-border';
      case 'SUSPENDED':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const handleStatusChange = async (newStatus: UserStatus) => {
    setPendingStatus(newStatus);
    setStatusDialogOpen(true);
  };

  const confirmStatusChange = async () => {
    if (!pendingStatus) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: pendingStatus }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update status');
      }

      onUserUpdated?.();
    } catch (error) {
      console.error('Status change error:', error);
      alert(error instanceof Error ? error.message : 'Failed to update status');
    } finally {
      setActionLoading(false);
      setStatusDialogOpen(false);
      setPendingStatus(null);
    }
  };

  const handleResetPassword = async () => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${user.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reset password');
      }

      const data = await response.json();
      if (data.generatedPassword) {
        setGeneratedPassword(data.generatedPassword);
      } else {
        alert(data.message);
        setResetPasswordDialogOpen(false);
      }
      onUserUpdated?.();
    } catch (error) {
      console.error('Password reset error:', error);
      alert(error instanceof Error ? error.message : 'Failed to reset password');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete user');
      }

      onUserUpdated?.();
    } catch (error) {
      console.error('Delete error:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete user');
    } finally {
      setActionLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <>
      <TableRow className="hover:bg-muted/50 transition-colors">
        <TableCell className="px-4 py-4 w-10">
          <button
            onClick={onSelect}
            className="p-1 hover:bg-muted rounded"
          >
            {selected ? (
              <CheckSquare className="w-4 h-4 text-primary" />
            ) : (
              <Square className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        </TableCell>
        <TableCell className="px-4 py-4">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">{user.email}</span>
            {(user.name || user.username) && (
              <span className="text-sm text-muted-foreground">
                {user.name}{user.username ? ` (@${user.username})` : ''}
              </span>
            )}
          </div>
        </TableCell>
        <TableCell className="px-4 py-4">
          <Badge
            variant="outline"
            className={
              user.role === 'ADMIN'
                ? 'bg-primary/20 text-primary border-primary/30'
                : 'bg-muted text-muted-foreground border-border'
            }
          >
            {user.role}
          </Badge>
        </TableCell>
        <TableCell className="px-4 py-4">
          <Badge variant="outline" className={getStatusBadgeClass(user.status)}>
            {user.status}
          </Badge>
        </TableCell>
        <TableCell className="px-4 py-4 text-sm text-foreground">
          €{creditDollars}
        </TableCell>
        <TableCell className="px-4 py-4 text-sm text-muted-foreground">
          {user._count.agents}
        </TableCell>
        <TableCell className="px-4 py-4 text-sm text-muted-foreground">
          {user._count.calls}
        </TableCell>
        <TableCell className="px-4 py-4 text-sm text-muted-foreground">
          {formattedDate}
        </TableCell>
        <TableCell className="px-4 py-4 text-right">
          <div className="flex items-center justify-end gap-1">
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/admin/users/${user.id}`}>
                <Eye className="w-4 h-4" />
                <span className="sr-only">View user</span>
              </Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="w-4 h-4" />
                  <span className="sr-only">More actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/admin/users/${user.id}`} className="flex items-center">
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit Details
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {user.status !== 'ACTIVE' && (
                  <DropdownMenuItem onClick={() => handleStatusChange('ACTIVE')}>
                    <UserCheck className="w-4 h-4 mr-2" />
                    Activate Account
                  </DropdownMenuItem>
                )}
                {user.status !== 'INACTIVE' && (
                  <DropdownMenuItem onClick={() => handleStatusChange('INACTIVE')}>
                    <UserX className="w-4 h-4 mr-2" />
                    Deactivate Account
                  </DropdownMenuItem>
                )}
                {user.status !== 'SUSPENDED' && (
                  <DropdownMenuItem onClick={() => handleStatusChange('SUSPENDED')}>
                    <Ban className="w-4 h-4 mr-2" />
                    Suspend Account
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setResetPasswordDialogOpen(true)}>
                  <Key className="w-4 h-4 mr-2" />
                  Reset Password
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete User
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TableCell>
      </TableRow>

      {/* Status Change Dialog */}
      <AlertDialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingStatus === 'ACTIVE' ? 'Activate' : pendingStatus === 'INACTIVE' ? 'Deactivate' : 'Suspend'} User Account
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingStatus === 'ACTIVE' ? (
                `This will activate the account for ${user.email}, allowing them to log in and use the platform.`
              ) : pendingStatus === 'INACTIVE' ? (
                `This will deactivate the account for ${user.email}. They will be logged out and unable to access the platform.`
              ) : (
                `This will suspend the account for ${user.email}. They will be logged out immediately and unable to access the platform until reactivated.`
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmStatusChange}
              disabled={actionLoading}
              className={pendingStatus === 'SUSPENDED' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {actionLoading ? (
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

      {/* Reset Password Dialog */}
      <AlertDialog open={resetPasswordDialogOpen} onOpenChange={(open) => {
        setResetPasswordDialogOpen(open);
        if (!open) setGeneratedPassword(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {generatedPassword ? 'Password Reset Successful' : 'Reset User Password'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {generatedPassword ? (
                <div className="space-y-3">
                  <p>A new password has been generated for {user.email}.</p>
                  <div className="p-3 bg-muted rounded-md font-mono text-sm break-all">
                    {generatedPassword}
                  </div>
                  <p className="text-xs text-amber-500">
                    Make sure to copy this password now. It will not be shown again.
                  </p>
                </div>
              ) : (
                `This will reset the password for ${user.email} and generate a new temporary password. The user will be logged out of all sessions.`
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {generatedPassword ? (
              <AlertDialogAction onClick={() => {
                navigator.clipboard.writeText(generatedPassword);
                setResetPasswordDialogOpen(false);
                setGeneratedPassword(null);
              }}>
                Copy & Close
              </AlertDialogAction>
            ) : (
              <>
                <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleResetPassword} disabled={actionLoading}>
                  {actionLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </AlertDialogAction>
              </>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete User Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User Account</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the account for <strong>{user.email}</strong> and all their data including agents, calls, and transactions.
              <br /><br />
              <span className="text-destructive font-medium">This action cannot be undone.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={actionLoading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete User'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
