'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Bot,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Power,
  RotateCcw,
  Settings,
  ChevronDown,
  ChevronUp,
  Phone,
  TrendingUp,
  TrendingDown,
  Gauge,
  History,
  AlertCircle,
  Wifi,
  WifiOff,
  Zap,
} from 'lucide-react';

// Types
interface AgentMetrics {
  id: string;
  name: string;
  businessName: string;
  userId: string;
  userEmail: string;
  userName: string | null;
  status: 'online' | 'offline' | 'error' | 'warning';
  isActive: boolean;
  vapiAssistantId: string | null;
  phoneNumber: string | null;
  phoneStatus: string | null;
  uptime: number;
  responseTime: number;
  errorRate: number;
  resourceUsage: number;
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  escalatedCalls: number;
  averageCallDuration: number;
  lastCallAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface OverviewData {
  summary: {
    totalAgents: number;
    activeAgents: number;
    onlineAgents: number;
    offlineAgents: number;
    errorAgents: number;
    warningAgents: number;
  };
  performance: {
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    escalatedCalls: number;
    averageResponseTime: number;
    overallErrorRate: number;
    averageUptime: number;
  };
  period: {
    start: string;
    end: string;
    hoursBack: number;
  };
  timestamp: string;
}

interface ActivityLog {
  id: string;
  agentId: string;
  agentName: string;
  eventType: string;
  message: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

interface AgentAlert {
  id: string;
  agentId: string;
  agentName: string;
  severity: 'warning' | 'critical';
  type: string;
  message: string;
  metric: string;
  currentValue: number;
  threshold: number;
  triggeredAt: string;
}

interface AlertThreshold {
  metric: 'errorRate' | 'responseTime' | 'uptime' | 'resourceUsage';
  warningThreshold: number;
  criticalThreshold: number;
}

// Status colors and icons
const statusConfig = {
  online: { color: 'bg-green-500', icon: Wifi, text: 'Online', badge: 'secondary' as const },
  offline: { color: 'bg-gray-500', icon: WifiOff, text: 'Offline', badge: 'outline' as const },
  error: { color: 'bg-red-500', icon: XCircle, text: 'Error', badge: 'destructive' as const },
  warning: { color: 'bg-yellow-500', icon: AlertTriangle, text: 'Warning', badge: 'default' as const },
};

export function AgentMonitoringDashboard() {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [agents, setAgents] = useState<AgentMetrics[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [alerts, setAlerts] = useState<AgentAlert[]>([]);
  const [thresholds, setThresholds] = useState<AlertThreshold[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showThresholdSettings, setShowThresholdSettings] = useState(false);
  const [hoursBack, setHoursBack] = useState(24);

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const [overviewRes, agentsRes, activityRes, alertsRes, thresholdsRes] = await Promise.all([
        fetch(`/api/admin/agents/monitoring?section=overview&hours=${hoursBack}`),
        fetch(`/api/admin/agents/monitoring?section=agents&hours=${hoursBack}`),
        fetch(`/api/admin/agents/monitoring?section=activity&hours=${hoursBack}`),
        fetch(`/api/admin/agents/monitoring?section=alerts&hours=${hoursBack}`),
        fetch('/api/admin/agents/monitoring?section=thresholds'),
      ]);

      if (!overviewRes.ok || !agentsRes.ok || !activityRes.ok || !alertsRes.ok || !thresholdsRes.ok) {
        throw new Error('Failed to fetch monitoring data');
      }

      const [overviewData, agentsData, activityData, alertsData, thresholdsData] = await Promise.all([
        overviewRes.json(),
        agentsRes.json(),
        activityRes.json(),
        alertsRes.json(),
        thresholdsRes.json(),
      ]);

      setOverview(overviewData);
      setAgents(agentsData.agents);
      setActivityLogs(activityData.logs);
      setAlerts(alertsData.alerts);
      setThresholds(thresholdsData.thresholds);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [hoursBack]);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleAgentAction = async (action: string, agentId: string) => {
    try {
      setActionLoading(`${action}-${agentId}`);
      const response = await fetch('/api/admin/agents/monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, agentId }),
      });

      if (!response.ok) {
        throw new Error('Action failed');
      }

      // Refresh data after action
      await fetchData(true);
    } catch (err) {
      console.error('Failed to perform agent action:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getEventTypeIcon = (eventType: string) => {
    switch (eventType) {
      case 'call_completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'call_failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'call_escalated':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'call_started':
        return <Phone className="w-4 h-4 text-blue-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
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

  if (!overview) return null;

  return (
    <div className="space-y-6">
      {/* Header with Refresh and Time Range */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <select
              value={hoursBack}
              onChange={(e) => setHoursBack(Number(e.target.value))}
              className="bg-muted border border-border rounded-md px-3 py-1.5 text-sm"
            >
              <option value={1}>Last 1 hour</option>
              <option value={6}>Last 6 hours</option>
              <option value={24}>Last 24 hours</option>
              <option value={48}>Last 48 hours</option>
              <option value={168}>Last 7 days</option>
            </select>
          </div>
          <span className="text-sm text-muted-foreground">
            Last updated: {overview.timestamp ? new Date(overview.timestamp).toLocaleTimeString() : 'N/A'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowThresholdSettings(!showThresholdSettings)}
          >
            <Settings className="w-4 h-4 mr-2" />
            Thresholds
          </Button>
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
      </div>

      {/* Threshold Settings Panel */}
      {showThresholdSettings && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Alert Thresholds
            </CardTitle>
            <CardDescription>Configure warning and critical thresholds for proactive failure detection</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {thresholds.map((threshold) => (
                <div key={threshold.metric} className="p-4 rounded-lg bg-muted/30">
                  <h4 className="font-medium capitalize mb-3">{threshold.metric.replace(/([A-Z])/g, ' $1').trim()}</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Warning:</span>
                      <span className="text-sm font-medium text-yellow-500">
                        {threshold.metric === 'responseTime' ? `${threshold.warningThreshold}ms` :
                         threshold.metric === 'uptime' ? `<${threshold.warningThreshold}%` :
                         `>${threshold.warningThreshold}%`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Critical:</span>
                      <span className="text-sm font-medium text-red-500">
                        {threshold.metric === 'responseTime' ? `${threshold.criticalThreshold}ms` :
                         threshold.metric === 'uptime' ? `<${threshold.criticalThreshold}%` :
                         `>${threshold.criticalThreshold}%`}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Agents */}
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Agents</p>
                <p className="text-2xl font-bold mt-1">{overview.summary.totalAgents}</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="secondary" className="text-xs">
                    {overview.summary.activeAgents} Active
                  </Badge>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-primary/20 text-primary">
                <Bot className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Agent Status */}
        <Card className={`glass-card ${overview.summary.errorAgents > 0 ? 'border-red-500/50' : ''}`}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Agent Status</p>
                <p className="text-2xl font-bold mt-1">{overview.summary.onlineAgents} Online</p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {overview.summary.errorAgents > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {overview.summary.errorAgents} Error
                    </Badge>
                  )}
                  {overview.summary.warningAgents > 0 && (
                    <Badge variant="default" className="text-xs">
                      {overview.summary.warningAgents} Warning
                    </Badge>
                  )}
                  {overview.summary.offlineAgents > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {overview.summary.offlineAgents} Offline
                    </Badge>
                  )}
                </div>
              </div>
              <div className={`p-3 rounded-xl ${overview.summary.errorAgents > 0 ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>
                {overview.summary.errorAgents > 0 ? <AlertCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Rate */}
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overall Error Rate</p>
                <p className="text-2xl font-bold mt-1">{overview.performance.overallErrorRate}%</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {overview.performance.failedCalls} / {overview.performance.totalCalls} calls
                </p>
              </div>
              <div className={`p-3 rounded-xl ${overview.performance.overallErrorRate > 5 ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>
                {overview.performance.overallErrorRate > 5 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Average Uptime */}
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average Uptime</p>
                <p className="text-2xl font-bold mt-1">{overview.performance.averageUptime}%</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Avg response: {overview.performance.averageResponseTime}ms
                </p>
              </div>
              <div className="p-3 rounded-xl bg-green-500/20 text-green-500">
                <Gauge className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <Card className="glass-card border-amber-500/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Active Alerts ({alerts.length})
            </CardTitle>
            <CardDescription>Proactive failure detection alerts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.slice(0, 5).map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-start justify-between p-4 rounded-lg border ${
                    alert.severity === 'critical'
                      ? 'bg-red-500/10 border-red-500/30'
                      : 'bg-yellow-500/10 border-yellow-500/30'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={alert.severity === 'critical' ? 'destructive' : 'default'}>
                        {alert.severity.toUpperCase()}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{alert.type}</span>
                    </div>
                    <p className="font-medium">{alert.message}</p>
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDateTime(alert.triggeredAt)}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setExpandedAgent(alert.agentId)}
                  >
                    View Agent
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Agent List */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bot className="w-5 h-5" />
            Agent Status & Metrics
          </CardTitle>
          <CardDescription>Real-time monitoring of all agents</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {agents.map((agent) => {
              const StatusIcon = statusConfig[agent.status].icon;
              const isExpanded = expandedAgent === agent.id;

              return (
                <div
                  key={agent.id}
                  className={`rounded-lg border transition-all ${
                    agent.status === 'error'
                      ? 'border-red-500/30 bg-red-500/5'
                      : agent.status === 'warning'
                      ? 'border-yellow-500/30 bg-yellow-500/5'
                      : 'border-border bg-muted/20'
                  }`}
                >
                  {/* Agent Header */}
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer"
                    onClick={() => setExpandedAgent(isExpanded ? null : agent.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${statusConfig[agent.status].color} animate-pulse`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{agent.name}</span>
                          <Badge variant={statusConfig[agent.status].badge}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusConfig[agent.status].text}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {agent.businessName} | {agent.userEmail}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      {/* Quick Metrics */}
                      <div className="hidden md:flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <p className="font-medium">{agent.uptime}%</p>
                          <p className="text-xs text-muted-foreground">Uptime</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium">{agent.responseTime}ms</p>
                          <p className="text-xs text-muted-foreground">Response</p>
                        </div>
                        <div className="text-center">
                          <p className={`font-medium ${agent.errorRate > 5 ? 'text-red-500' : ''}`}>
                            {agent.errorRate}%
                          </p>
                          <p className="text-xs text-muted-foreground">Error Rate</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium">{agent.totalCalls}</p>
                          <p className="text-xs text-muted-foreground">Calls</p>
                        </div>
                      </div>

                      {/* Expand Icon */}
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-border pt-4">
                      {/* Detailed Metrics */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="p-3 rounded-lg bg-muted/30">
                          <div className="flex items-center gap-2 mb-1">
                            <Gauge className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Uptime</span>
                          </div>
                          <p className="text-xl font-bold">{agent.uptime}%</p>
                          <div className="h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                agent.uptime >= 99
                                  ? 'bg-green-500'
                                  : agent.uptime >= 95
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                              }`}
                              style={{ width: `${agent.uptime}%` }}
                            />
                          </div>
                        </div>

                        <div className="p-3 rounded-lg bg-muted/30">
                          <div className="flex items-center gap-2 mb-1">
                            <Zap className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Response Time</span>
                          </div>
                          <p className="text-xl font-bold">{agent.responseTime}ms</p>
                          <p className="text-xs text-muted-foreground mt-1">Average latency</p>
                        </div>

                        <div className="p-3 rounded-lg bg-muted/30">
                          <div className="flex items-center gap-2 mb-1">
                            <AlertCircle className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Error Rate</span>
                          </div>
                          <p className={`text-xl font-bold ${agent.errorRate > 5 ? 'text-red-500' : ''}`}>
                            {agent.errorRate}%
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {agent.failedCalls} failed calls
                          </p>
                        </div>

                        <div className="p-3 rounded-lg bg-muted/30">
                          <div className="flex items-center gap-2 mb-1">
                            <Activity className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Resource Usage</span>
                          </div>
                          <p className="text-xl font-bold">{agent.resourceUsage}%</p>
                          <div className="h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                agent.resourceUsage < 70
                                  ? 'bg-green-500'
                                  : agent.resourceUsage < 90
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                              }`}
                              style={{ width: `${agent.resourceUsage}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Call Statistics */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4 p-4 rounded-lg bg-muted/20">
                        <div className="text-center">
                          <p className="text-2xl font-bold">{agent.totalCalls}</p>
                          <p className="text-xs text-muted-foreground">Total Calls</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-500">{agent.successfulCalls}</p>
                          <p className="text-xs text-muted-foreground">Successful</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-red-500">{agent.failedCalls}</p>
                          <p className="text-xs text-muted-foreground">Failed</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-yellow-500">{agent.escalatedCalls}</p>
                          <p className="text-xs text-muted-foreground">Escalated</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold">{formatDuration(agent.averageCallDuration)}</p>
                          <p className="text-xs text-muted-foreground">Avg Duration</p>
                        </div>
                      </div>

                      {/* Agent Info & Actions */}
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          {agent.phoneNumber && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-4 h-4" />
                              {agent.phoneNumber}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Last call: {agent.lastCallAt ? formatDateTime(agent.lastCallAt) : 'Never'}
                          </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAgentAction('restart-agent', agent.id);
                            }}
                            disabled={actionLoading === `restart-agent-${agent.id}`}
                          >
                            {actionLoading === `restart-agent-${agent.id}` ? (
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <RotateCcw className="w-4 h-4 mr-2" />
                            )}
                            Restart
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAgentAction('reset-agent', agent.id);
                            }}
                            disabled={actionLoading === `reset-agent-${agent.id}`}
                          >
                            {actionLoading === `reset-agent-${agent.id}` ? (
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <RefreshCw className="w-4 h-4 mr-2" />
                            )}
                            Reset Metrics
                          </Button>
                          <Button
                            variant={agent.isActive ? 'destructive' : 'default'}
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAgentAction('toggle-agent', agent.id);
                            }}
                            disabled={actionLoading === `toggle-agent-${agent.id}`}
                          >
                            {actionLoading === `toggle-agent-${agent.id}` ? (
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Power className="w-4 h-4 mr-2" />
                            )}
                            {agent.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {agents.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No agents found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Activity Logs */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="w-5 h-5" />
            Historical Activity Logs
          </CardTitle>
          <CardDescription>Recent agent activity and events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {activityLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors"
              >
                {getEventTypeIcon(log.eventType)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{log.agentName}</span>
                    <Badge variant="outline" className="text-xs">
                      {log.eventType.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{log.message}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDateTime(log.timestamp)}
                </span>
              </div>
            ))}

            {activityLogs.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No activity logs found for this period</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
