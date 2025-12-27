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
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import {
  ArrowLeft,
  DollarSign,
  CreditCard,
  Bot,
  Phone,
  Loader2,
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: 'USER' | 'ADMIN';
  creditBalance: number;
  graceCreditsUsed: number;
  createdAt: string;
  updatedAt: string;
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

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch(`/api/admin/users/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch user');
        }
        const data = await response.json();
        setUser(data.user);
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [id]);

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
          {user.name && <p className="text-muted-foreground">{user.name}</p>}
        </div>
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Credit Balance"
          value={`$${creditDollars}`}
          subtitle="Current balance"
          icon={DollarSign}
        />
        <StatsCard
          title="Grace Credits Used"
          value={`$${graceDollars}`}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Credit Adjustment */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-foreground">Adjust Credits</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreditAdjustment} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (in dollars)</Label>
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
                      {tx.amount >= 0 ? '+' : ''}${(tx.amount / 100).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
                        ${(call.creditsUsed / 100).toFixed(2)}
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
    </div>
  );
}
