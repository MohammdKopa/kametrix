'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Server,
  Database,
  Cpu,
  HardDrive,
  RefreshCw,
  Bell,
  TrendingUp,
  Zap,
} from 'lucide-react';

interface MonitoringData {
  health: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    uptime: number;
    services: Array<{
      name: string;
      status: 'healthy' | 'degraded' | 'unhealthy';
      responseTimeMs?: number;
      message?: string;
    }>;
    memory: {
      heapUsed: number;
      heapTotal: number;
      usagePercent: number;
    } | null;
  };
  uptime: {
    overall: {
      uptimePercent: number;
      status: string;
    };
    period: {
      start: string;
      end: string;
    };
  };
  analytics: {
    activeUsers: number;
    newSignups: number;
    totalCalls: number;
    totalEvents: number;
  };
  alerts: {
    active: number;
    critical: number;
    high: number;
  };
  performance: {
    errorRate: number;
    topErrors: Array<{ code: string; count: number }>;
    memory: {
      heapUsed: number;
      heapTotal: number;
      usagePercent: number;
    } | null;
    activeRequests: number;
  };
  timestamp: string;
}

interface AlertData {
  active: Array<{
    id: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
    title: string;
    message: string;
    source: string;
    triggeredAt: string;
  }>;
  history: Array<{
    id: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
    title: string;
    message: string;
    triggeredAt: string;
    resolvedAt?: string;
  }>;
}

const statusColors = {
  healthy: 'bg-green-500',
  degraded: 'bg-yellow-500',
  unhealthy: 'bg-red-500',
  HEALTHY: 'bg-green-500',
  DEGRADED: 'bg-yellow-500',
  UNHEALTHY: 'bg-red-500',
};

const statusIcons = {
  healthy: CheckCircle,
  degraded: AlertTriangle,
  unhealthy: XCircle,
};

const severityColors = {
  LOW: 'secondary',
  MEDIUM: 'outline',
  HIGH: 'default',
  CRITICAL: 'destructive',
} as const;

export function MonitoringDashboard() {
  const [data, setData] = useState<MonitoringData | null>(null);
  const [alerts, setAlerts] = useState<AlertData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const [overviewRes, alertsRes] = await Promise.all([
        fetch('/api/admin/monitoring?section=overview'),
        fetch('/api/admin/monitoring?section=alerts'),
      ]);

      if (!overviewRes.ok || !alertsRes.ok) {
        throw new Error('Failed to fetch monitoring data');
      }

      const [overviewData, alertsData] = await Promise.all([
        overviewRes.json(),
        alertsRes.json(),
      ]);

      setData(overviewData);
      setAlerts(alertsData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await fetch('/api/admin/monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'acknowledge-alert', alertId }),
      });
      fetchData(true);
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      await fetch('/api/admin/monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resolve-alert', alertId }),
      });
      fetchData(true);
    } catch (err) {
      console.error('Failed to resolve alert:', err);
    }
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
          <Button onClick={() => fetchData()} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const StatusIcon = statusIcons[data.health.status] || AlertTriangle;
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatBytes = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    if (mb > 1024) return `${(mb / 1024).toFixed(1)} GB`;
    return `${mb.toFixed(0)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full ${statusColors[data.health.status]} animate-pulse`}
          />
          <span className="text-sm text-muted-foreground">
            Last updated: {new Date(data.timestamp).toLocaleTimeString()}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchData(true)}
          disabled={refreshing}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* System Status */}
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">System Status</p>
                <p className="text-2xl font-bold capitalize mt-1">{data.health.status}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Uptime: {formatUptime(data.health.uptime)}
                </p>
              </div>
              <div
                className={`p-3 rounded-xl ${
                  data.health.status === 'healthy'
                    ? 'bg-green-500/20 text-green-500'
                    : data.health.status === 'degraded'
                    ? 'bg-yellow-500/20 text-yellow-500'
                    : 'bg-red-500/20 text-red-500'
                }`}
              >
                <StatusIcon className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Alerts */}
        <Card className={`glass-card ${data.alerts.critical > 0 ? 'border-red-500/50' : ''}`}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Alerts</p>
                <p className="text-2xl font-bold mt-1">{data.alerts.active}</p>
                <div className="flex gap-2 mt-1">
                  {data.alerts.critical > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {data.alerts.critical} Critical
                    </Badge>
                  )}
                  {data.alerts.high > 0 && (
                    <Badge variant="default" className="text-xs">
                      {data.alerts.high} High
                    </Badge>
                  )}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/20 text-amber-500">
                <Bell className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Rate */}
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Error Rate</p>
                <p className="text-2xl font-bold mt-1">{data.performance.errorRate}/min</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {data.performance.activeRequests} active requests
                </p>
              </div>
              <div className="p-3 rounded-xl bg-primary/20 text-primary">
                <Zap className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Uptime */}
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Uptime (24h)</p>
                <p className="text-2xl font-bold mt-1">{data.uptime.overall.uptimePercent}%</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Status: {data.uptime.overall.status}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-green-500/20 text-green-500">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service Status & Memory */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Services */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Server className="w-5 h-5" />
              Service Status
            </CardTitle>
            <CardDescription>Health of connected services</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.health.services.map((service) => (
                <div
                  key={service.name}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${statusColors[service.status]}`}
                    />
                    <span className="font-medium capitalize">{service.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {service.responseTimeMs && (
                      <span className="text-sm text-muted-foreground">
                        {service.responseTimeMs}ms
                      </span>
                    )}
                    <Badge
                      variant={
                        service.status === 'healthy'
                          ? 'secondary'
                          : service.status === 'degraded'
                          ? 'outline'
                          : 'destructive'
                      }
                    >
                      {service.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Memory & Resources */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Cpu className="w-5 h-5" />
              System Resources
            </CardTitle>
            <CardDescription>Memory and resource usage</CardDescription>
          </CardHeader>
          <CardContent>
            {data.performance.memory ? (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Heap Memory</span>
                    <span className="text-sm font-medium">
                      {formatBytes(data.performance.memory.heapUsed)} /{' '}
                      {formatBytes(data.performance.memory.heapTotal)}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        data.performance.memory.usagePercent > 90
                          ? 'bg-red-500'
                          : data.performance.memory.usagePercent > 70
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${data.performance.memory.usagePercent}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {Math.round(data.performance.memory.usagePercent)}% used
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        {formatBytes(data.performance.memory.heapUsed)}
                      </p>
                      <p className="text-xs text-muted-foreground">Heap Used</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        {formatBytes(data.performance.memory.heapTotal)}
                      </p>
                      <p className="text-xs text-muted-foreground">Heap Total</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Memory data unavailable</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Analytics Summary */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Platform Analytics (24h)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold">{data.analytics.activeUsers}</p>
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <Users className="w-4 h-4" />
                Active Users
              </p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">{data.analytics.newSignups}</p>
              <p className="text-sm text-muted-foreground">New Signups</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">{data.analytics.totalCalls}</p>
              <p className="text-sm text-muted-foreground">Calls Made</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">{data.analytics.totalEvents}</p>
              <p className="text-sm text-muted-foreground">Events Tracked</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Alerts */}
      {alerts && alerts.active.length > 0 && (
        <Card className="glass-card border-amber-500/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.active.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start justify-between p-4 rounded-lg bg-muted/30 border border-border"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={severityColors[alert.severity]}>
                        {alert.severity}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {alert.source}
                      </span>
                    </div>
                    <h4 className="font-medium">{alert.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(alert.triggeredAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    {alert.status === 'ACTIVE' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAcknowledgeAlert(alert.id)}
                      >
                        Acknowledge
                      </Button>
                    )}
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleResolveAlert(alert.id)}
                    >
                      Resolve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Errors */}
      {data.performance.topErrors.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <XCircle className="w-5 h-5 text-destructive" />
              Top Errors
            </CardTitle>
            <CardDescription>Most frequent errors in the last 5 minutes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.performance.topErrors.map((error, index) => (
                <div
                  key={error.code}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono text-muted-foreground">
                      #{index + 1}
                    </span>
                    <span className="font-medium">{error.code}</span>
                  </div>
                  <Badge variant="outline">{error.count} occurrences</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
