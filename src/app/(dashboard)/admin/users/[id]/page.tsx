'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { StatsCard } from '@/components/dashboard/stats-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  ArrowLeft,
  DollarSign,
  CreditCard,
  Bot,
  Phone,
  Loader2,
  Save,
  Key,
  History,
  UserCheck,
  UserX,
  Ban,
  Shield,
} from 'lucide-react';

type Role = 'USER' | 'ADMIN';
type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

interface AuditLog {
  id: string;
  action: string;
  description: string;
  previousValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  createdAt: string;
  admin: {
    id: string;
    email: string;
    name: string | null;
  };
}

interface User {
  id: string;
  email: string;
  name: string | null;
  username: string | null;
  role: Role;
  status: UserStatus;
  creditBalance: number;
  graceCreditsUsed: number;
  createdAt: string;
  updatedAt: string;
  lastPasswordReset: string | null;
  deactivatedAt: string | null;
  deactivatedBy: string | null;
  agents: Array<{
    id: string;
    name: string;
    isActive: boolean;
    createdAt: string;
    phoneNumber: {
      id: string;
      number: string;
      status: string;
    } | null;
  }>;
  calls: Array<{
    id: string;
    phoneNumber: string;
    status: string;
    startedAt: string;
    endedAt: string | null;
    durationSeconds: number | null;
    creditsUsed: number;
    summary: string | null;
    agent: {
      id: string;
      name: string;
    };
  }>;
  creditTransactions: Array<{
    id: string;
    type: string;
    amount: number;
    balanceAfter: number;
    description: string | null;
    createdAt: string;
  }>;
  userAuditLogs: AuditLog[];
  _count: {
    agents: number;
    calls: number;
  };
}

export default function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustDescription, setAdjustDescription] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  // Edit form state
  const [editEmail, setEditEmail] = useState('');
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editRole, setEditRole] = useState<Role>('USER');
  const [editStatus, setEditStatus] = useState<UserStatus>('ACTIVE');
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Password reset state
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch(`/api/admin/users/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch user');
        }
        const data = await response.json();
        setUser(data.user);
        // Initialize edit form with current values
        setEditEmail(data.user.email);
        setEditName(data.user.name || '');
        setEditUsername(data.user.username || '');
        setEditRole(data.user.role);
        setEditStatus(data.user.status);
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [id]);

  // Track changes
  useEffect(() => {
    if (!user) return;
    const changed =
      editEmail !== user.email ||
      editName !== (user.name || '') ||
      editUsername !== (user.username || '') ||
      editRole !== user.role ||
      editStatus !== user.status;
    setHasChanges(changed);
  }, [user, editEmail, editName, editUsername, editRole, editStatus]);

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !hasChanges) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: editEmail !== user.email ? editEmail : undefined,
          name: editName !== (user.name || '') ? (editName || null) : undefined,
          username: editUsername !== (user.username || '') ? (editUsername || null) : undefined,
          role: editRole !== user.role ? editRole : undefined,
          status: editStatus !== user.status ? editStatus : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update user');
      }

      const data = await response.json();
      // Refresh user data
      const refreshResponse = await fetch(`/api/admin/users/${id}`);
      const refreshData = await refreshResponse.json();
      setUser(refreshData.user);
      alert('User updated successfully');
    } catch (error) {
      console.error('Error updating user:', error);
      alert(error instanceof Error ? error.message : 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    setResettingPassword(true);
    try {
      const response = await fetch(`/api/admin/users/${id}/reset-password`, {
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
      }
    } catch (error) {
      console.error('Password reset error:', error);
      alert(error instanceof Error ? error.message : 'Failed to reset password');
    } finally {
      setResettingPassword(false);
    }
  };

  const handleCreditAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustAmount || !user) return;

    // Convert dollars to cents
    const amountInCents = Math.round(parseFloat(adjustAmount) * 100);
    if (isNaN(amountInCents) || amountInCents === 0) {
      alert('Please enter a valid non-zero amount');
      return;
    }

    setAdjusting(true);
    try {
      const response = await fetch('/api/admin/credits/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          amount: amountInCents,
          description: adjustDescription || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || 'Failed to adjust credits');
        return;
      }

      const data = await response.json();
      // Update local user state with new balance
      setUser((prev) => (prev ? { ...prev, creditBalance: data.newBalance } : null));
      setAdjustAmount('');
      setAdjustDescription('');
      alert('Credits adjusted successfully');
    } catch (error) {
      console.error('Error adjusting credits:', error);
      alert('Failed to adjust credits');
    } finally {
      setAdjusting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading user...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">User not found</p>
      </div>
    );
  }

  const creditDollars = (user.creditBalance / 100).toFixed(2);
  const graceDollars = (user.graceCreditsUsed / 100).toFixed(2);

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

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
            <Link href="/admin">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Users
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-foreground">{user.email}</h1>
          <div className="flex items-center gap-2 mt-1">
            {user.name && <span className="text-muted-foreground">{user.name}</span>}
            {user.username && <span className="text-muted-foreground">(@{user.username})</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={getStatusBadgeClass(user.status)}>
            {user.status}
          </Badge>
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
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Credit Balance"
          value={`€${creditDollars}`}
          subtitle="Current balance"
          icon={DollarSign}
        />
        <StatsCard
          title="Grace Credits Used"
          value={`€${graceDollars}`}
          subtitle="Owed amount"
          icon={CreditCard}
        />
        <StatsCard
          title="Agents"
          value={user._count.agents}
          subtitle="Total agents"
          icon={Bot}
        />
        <StatsCard
          title="Calls"
          value={user._count.calls}
          subtitle="Total calls"
          icon={Phone}
        />
      </div>

      {/* Edit User Details */}
      <Card className="glass-card mb-8">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-foreground flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Edit User Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveChanges} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="user@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-username">Username</Label>
                <Input
                  id="edit-username"
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  placeholder="johndoe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">Role</Label>
                <Select value={editRole} onValueChange={(v) => setEditRole(v as Role)}>
                  <SelectTrigger id="edit-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">User</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select value={editStatus} onValueChange={(v) => setEditStatus(v as UserStatus)}>
                  <SelectTrigger id="edit-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-green-400" />
                        Active
                      </div>
                    </SelectItem>
                    <SelectItem value="INACTIVE">
                      <div className="flex items-center gap-2">
                        <UserX className="w-4 h-4 text-muted-foreground" />
                        Inactive
                      </div>
                    </SelectItem>
                    <SelectItem value="SUSPENDED">
                      <div className="flex items-center gap-2">
                        <Ban className="w-4 h-4 text-red-400" />
                        Suspended
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setResetPasswordDialogOpen(true)}
                  className="gap-2"
                >
                  <Key className="w-4 h-4" />
                  Reset Password
                </Button>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <Button
                type="submit"
                disabled={saving || !hasChanges}
                className="gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Credit Adjustment */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-foreground">Adjust Credits</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreditAdjustment} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (in euros)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder="e.g., 10.00 or -5.00"
                />
                <p className="text-xs text-muted-foreground">
                  Use positive for adding credits, negative for deducting
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Input
                  id="description"
                  type="text"
                  value={adjustDescription}
                  onChange={(e) => setAdjustDescription(e.target.value)}
                  placeholder="e.g., Refund for issue #123"
                />
              </div>
              <Button
                type="submit"
                disabled={adjusting || !adjustAmount}
                className="w-full"
              >
                {adjusting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adjusting...
                  </>
                ) : (
                  'Adjust Credits'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-foreground">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {user.creditTransactions.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No transactions yet</p>
            ) : (
              <div className="space-y-3">
                {user.creditTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {tx.type.replace('_', ' ')}
                      </p>
                      {tx.description && (
                        <p className="text-xs text-muted-foreground">{tx.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        tx.amount >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {tx.amount >= 0 ? '+' : ''}€{(tx.amount / 100).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Audit Log */}
      <Card className="glass-card mt-8">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-foreground flex items-center gap-2">
            <History className="w-5 h-5" />
            Audit Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          {user.userAuditLogs.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No audit entries yet</p>
          ) : (
            <div className="space-y-3">
              {user.userAuditLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start justify-between py-3 border-b border-border last:border-0"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {log.action.replace(/_/g, ' ')}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        by {log.admin.name || log.admin.email}
                      </span>
                    </div>
                    <p className="text-sm text-foreground">{log.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Agents */}
      <Card className="glass-card mt-8">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-foreground">Agents</CardTitle>
        </CardHeader>
        <CardContent>
          {user.agents.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No agents yet</p>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase">
                      Name
                    </TableHead>
                    <TableHead className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase">
                      Phone
                    </TableHead>
                    <TableHead className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase">
                      Status
                    </TableHead>
                    <TableHead className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase">
                      Created
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {user.agents.map((agent) => (
                    <TableRow key={agent.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="px-6 py-4 text-sm font-medium text-foreground">
                        {agent.name}
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
                        {new Date(agent.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Calls */}
      <Card className="glass-card mt-8">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-foreground">Recent Calls</CardTitle>
        </CardHeader>
        <CardContent>
          {user.calls.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No calls yet</p>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase">
                      Agent
                    </TableHead>
                    <TableHead className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase">
                      Phone
                    </TableHead>
                    <TableHead className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase">
                      Status
                    </TableHead>
                    <TableHead className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase">
                      Duration
                    </TableHead>
                    <TableHead className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase">
                      Credits
                    </TableHead>
                    <TableHead className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase">
                      Date
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {user.calls.map((call) => (
                    <TableRow key={call.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="px-6 py-4 text-sm font-medium text-foreground">
                        {call.agent.name}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-sm text-muted-foreground">
                        {call.phoneNumber}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <Badge
                          variant="outline"
                          className={
                            call.status === 'COMPLETED'
                              ? 'bg-green-500/20 text-green-400 border-green-500/30'
                              : call.status === 'FAILED'
                              ? 'bg-red-500/20 text-red-400 border-red-500/30'
                              : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          }
                        >
                          {call.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-sm text-muted-foreground">
                        {call.durationSeconds
                          ? `${Math.floor(call.durationSeconds / 60)}:${String(
                              call.durationSeconds % 60
                            ).padStart(2, '0')}`
                          : '-'}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-sm text-muted-foreground">
                        €{(call.creditsUsed / 100).toFixed(2)}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-sm text-muted-foreground">
                        {new Date(call.startedAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reset Password Dialog */}
      <AlertDialog
        open={resetPasswordDialogOpen}
        onOpenChange={(open) => {
          setResetPasswordDialogOpen(open);
          if (!open) setGeneratedPassword(null);
        }}
      >
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
              <AlertDialogAction
                onClick={() => {
                  navigator.clipboard.writeText(generatedPassword);
                  setResetPasswordDialogOpen(false);
                  setGeneratedPassword(null);
                }}
              >
                Copy & Close
              </AlertDialogAction>
            ) : (
              <>
                <AlertDialogCancel disabled={resettingPassword}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleResetPassword} disabled={resettingPassword}>
                  {resettingPassword ? (
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
    </div>
  );
}
