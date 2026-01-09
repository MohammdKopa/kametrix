'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Users,
  Bot,
  Phone,
  CreditCard,
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Search,
  ArrowUpRight,
  Zap,
  UserPlus,
  PhoneCall,
  Settings,
  ChevronRight,
  BarChart3,
  Wallet,
  Bell,
  Eye,
  UserX,
} from 'lucide-react';

interface DashboardStats {
  users: {
    total: number;
    active: number;
    inactive: number;
    suspended: number;
    admins: number;
    newToday: number;
    newThisWeek: number;
    newThisMonth: number;
  };
  agents: {
    total: number;
    active: number;
    inactive: number;
    withPhoneNumbers: number;
  };
  calls: {
    total: number;
    completed: number;
    failed: number;
    escalated: number;
    inProgress: number;
    todayTotal: number;
    todayCompleted: number;
    thisWeekTotal: number;
    averageDuration: number;
  };
  credits: {
    totalBalance: number;
    totalPurchased: number;
    totalUsed: number;
    transactionsToday: number;
  };
  phoneNumbers: {
    total: number;
    assigned: number;
    available: number;
  };
  recentActivity: Array<{
    id: string;
    type: 'user_signup' | 'call_completed' | 'agent_created' | 'credit_purchase';
    description: string;
    timestamp: string;
    metadata?: Record<string, unknown>;
  }>;
  quickActions: {
    pendingUsers: number;
    activeAlerts: number;
    failedCalls24h: number;
    lowCreditUsers: number;
  };
}

interface AdminDashboardProps {
  onNavigate?: (section: string) => void;
}

export function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStats = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const response = await fetch('/api/admin/dashboard');
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      setStats(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();

    // Auto-refresh every 60 seconds
    const interval = setInterval(() => fetchStats(true), 60000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatCurrency = (cents: number): string => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(cents / 100);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_signup':
        return <UserPlus className="w-4 h-4 text-green-500" />;
      case 'call_completed':
        return <PhoneCall className="w-4 h-4 text-blue-500" />;
      case 'agent_created':
        return <Bot className="w-4 h-4 text-purple-500" />;
      case 'credit_purchase':
        return <CreditCard className="w-4 h-4 text-amber-500" />;
      default:
        return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const formatTimeAgo = (date: string): string => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="glass-card border-destructive">
        <CardContent className="py-12 text-center">
          <XCircle className="w-12 h-12 mx-auto text-destructive mb-4" />
          <p className="text-destructive font-medium">{error}</p>
          <Button onClick={() => fetchStats()} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Header with Search and Refresh */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Platform overview and quick actions
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search users, agents, calls..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  // Navigate to users with search
                  window.location.href = `/admin/users?search=${encodeURIComponent(searchQuery)}`;
                }
              }}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchStats(true)}
            disabled={refreshing}
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Last Updated */}
      {lastUpdated && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      )}

      {/* Quick Action Alerts */}
      {(stats.quickActions.activeAlerts > 0 ||
        stats.quickActions.failedCalls24h > 0 ||
        stats.quickActions.lowCreditUsers > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.quickActions.activeAlerts > 0 && (
            <Link href="/admin/monitoring">
              <Card className="glass-card border-amber-500/50 hover:border-amber-500 transition-colors cursor-pointer">
                <CardContent className="py-4 flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-amber-500/20">
                    <Bell className="w-5 h-5 text-amber-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">
                      {stats.quickActions.activeAlerts} Active Alert{stats.quickActions.activeAlerts !== 1 ? 's' : ''}
                    </p>
                    <p className="text-sm text-muted-foreground">Requires attention</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          )}

          {stats.quickActions.failedCalls24h > 0 && (
            <Link href="/admin/monitoring">
              <Card className="glass-card border-red-500/50 hover:border-red-500 transition-colors cursor-pointer">
                <CardContent className="py-4 flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-red-500/20">
                    <XCircle className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">
                      {stats.quickActions.failedCalls24h} Failed Call{stats.quickActions.failedCalls24h !== 1 ? 's' : ''}
                    </p>
                    <p className="text-sm text-muted-foreground">In the last 24h</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          )}

          {stats.quickActions.lowCreditUsers > 0 && (
            <Link href="/admin/users?filter=low_credits">
              <Card className="glass-card border-orange-500/50 hover:border-orange-500 transition-colors cursor-pointer">
                <CardContent className="py-4 flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-orange-500/20">
                    <Wallet className="w-5 h-5 text-orange-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">
                      {stats.quickActions.lowCreditUsers} Low Credit User{stats.quickActions.lowCreditUsers !== 1 ? 's' : ''}
                    </p>
                    <p className="text-sm text-muted-foreground">Balance below 100 credits</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          )}
        </div>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <Card className="glass-card hover:shadow-[0_0_30px_oklch(0.55_0.25_300/0.15)] transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-3xl font-bold mt-1">{formatNumber(stats.users.total)}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className="text-xs">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +{stats.users.newToday} today
                  </Badge>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 text-primary">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border/50">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Active</span>
                <span className="font-medium text-green-500">{stats.users.active}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-muted-foreground">Suspended</span>
                <span className="font-medium text-red-500">{stats.users.suspended}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Agents */}
        <Card className="glass-card hover:shadow-[0_0_30px_oklch(0.55_0.25_300/0.15)] transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Agents</p>
                <p className="text-3xl font-bold mt-1">{formatNumber(stats.agents.total)}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className="text-xs">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {stats.agents.active} active
                  </Badge>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 text-purple-500">
                <Bot className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border/50">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">With phone</span>
                <span className="font-medium">{stats.agents.withPhoneNumbers}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-muted-foreground">Inactive</span>
                <span className="font-medium text-muted-foreground">{stats.agents.inactive}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calls Today */}
        <Card className="glass-card hover:shadow-[0_0_30px_oklch(0.55_0.25_300/0.15)] transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Calls Today</p>
                <p className="text-3xl font-bold mt-1">{formatNumber(stats.calls.todayTotal)}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className="text-xs">
                    <Activity className="w-3 h-3 mr-1" />
                    {stats.calls.inProgress} in progress
                  </Badge>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 text-blue-500">
                <Phone className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border/50">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Completed</span>
                <span className="font-medium text-green-500">{stats.calls.todayCompleted}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-muted-foreground">Avg duration</span>
                <span className="font-medium">{formatDuration(stats.calls.averageDuration)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Credits Balance */}
        <Card className="glass-card hover:shadow-[0_0_30px_oklch(0.55_0.25_300/0.15)] transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Credits</p>
                <p className="text-3xl font-bold mt-1">{formatNumber(stats.credits.totalBalance)}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className="text-xs">
                    <Zap className="w-3 h-3 mr-1" />
                    {stats.credits.transactionsToday} txns today
                  </Badge>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-500">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border/50">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total purchased</span>
                <span className="font-medium text-green-500">{formatNumber(stats.credits.totalPurchased)}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-muted-foreground">Total used</span>
                <span className="font-medium text-muted-foreground">{formatNumber(stats.credits.totalUsed)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Call Statistics */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Call Statistics
            </CardTitle>
            <CardDescription>Platform-wide call metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm text-muted-foreground">Completed</span>
                </div>
                <span className="font-medium">{formatNumber(stats.calls.completed)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-sm text-muted-foreground">Escalated</span>
                </div>
                <span className="font-medium">{formatNumber(stats.calls.escalated)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-sm text-muted-foreground">Failed</span>
                </div>
                <span className="font-medium">{formatNumber(stats.calls.failed)}</span>
              </div>
              <div className="pt-4 border-t border-border/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Total Calls</span>
                  <span className="text-lg font-bold">{formatNumber(stats.calls.total)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Phone Numbers */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Phone Numbers
            </CardTitle>
            <CardDescription>Twilio phone number allocation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total numbers</span>
                <span className="font-medium">{stats.phoneNumbers.total}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Assigned</span>
                <span className="font-medium text-blue-500">{stats.phoneNumbers.assigned}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Available</span>
                <span className="font-medium text-green-500">{stats.phoneNumbers.available}</span>
              </div>
              <div className="pt-4">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{
                      width: `${stats.phoneNumbers.total > 0
                        ? (stats.phoneNumbers.assigned / stats.phoneNumbers.total) * 100
                        : 0}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.phoneNumbers.total > 0
                    ? Math.round((stats.phoneNumbers.assigned / stats.phoneNumbers.total) * 100)
                    : 0}% allocated
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Growth */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              User Growth
            </CardTitle>
            <CardDescription>New user registrations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Today</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{stats.users.newToday}</span>
                  <Badge variant="secondary" className="text-xs">
                    <TrendingUp className="w-3 h-3" />
                  </Badge>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">This week</span>
                <span className="font-medium">{stats.users.newThisWeek}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">This month</span>
                <span className="font-medium">{stats.users.newThisMonth}</span>
              </div>
              <div className="pt-4 border-t border-border/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Admin users</span>
                  <Badge variant="outline">{stats.users.admins}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="glass-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest platform events</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentActivity.length > 0 ? (
              <div className="space-y-3">
                {stats.recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="mt-0.5">{getActivityIcon(activity.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{activity.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTimeAgo(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Quick Links
            </CardTitle>
            <CardDescription>Common admin actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link href="/admin/users">
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <Users className="w-4 h-4" />
                  Manage Users
                  <ArrowUpRight className="w-3 h-3 ml-auto" />
                </Button>
              </Link>
              <Link href="/admin/agents">
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <Bot className="w-4 h-4" />
                  Manage Agents
                  <ArrowUpRight className="w-3 h-3 ml-auto" />
                </Button>
              </Link>
              <Link href="/admin/phone-numbers">
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <Phone className="w-4 h-4" />
                  Phone Numbers
                  <ArrowUpRight className="w-3 h-3 ml-auto" />
                </Button>
              </Link>
              <Link href="/admin/monitoring">
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <Activity className="w-4 h-4" />
                  System Monitoring
                  <ArrowUpRight className="w-3 h-3 ml-auto" />
                </Button>
              </Link>
              <Link href="/admin/audit-logs">
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <Eye className="w-4 h-4" />
                  Audit Logs
                  <ArrowUpRight className="w-3 h-3 ml-auto" />
                </Button>
              </Link>
              <Link href="/admin/settings">
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <Settings className="w-4 h-4" />
                  System Settings
                  <ArrowUpRight className="w-3 h-3 ml-auto" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
