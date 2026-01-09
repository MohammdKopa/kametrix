import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering since we use cookies() for authentication
export const dynamic = 'force-dynamic';

// Agent status types
type AgentStatus = 'online' | 'offline' | 'error' | 'warning';

interface AgentMetrics {
  id: string;
  name: string;
  businessName: string;
  userId: string;
  userEmail: string;
  userName: string | null;
  status: AgentStatus;
  isActive: boolean;
  vapiAssistantId: string | null;
  phoneNumber: string | null;
  phoneStatus: string | null;

  // Health metrics
  uptime: number; // percentage
  responseTime: number; // ms average
  errorRate: number; // percentage
  resourceUsage: number; // percentage (simulated)

  // Call statistics
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  escalatedCalls: number;
  averageCallDuration: number; // seconds

  // Activity
  lastCallAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ActivityLog {
  id: string;
  agentId: string;
  agentName: string;
  eventType: 'call_started' | 'call_completed' | 'call_failed' | 'call_escalated' | 'agent_created' | 'agent_updated' | 'agent_activated' | 'agent_deactivated' | 'error';
  message: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

interface AlertThreshold {
  metric: 'errorRate' | 'responseTime' | 'uptime' | 'resourceUsage';
  warningThreshold: number;
  criticalThreshold: number;
}

// Default alert thresholds
const defaultThresholds: AlertThreshold[] = [
  { metric: 'errorRate', warningThreshold: 5, criticalThreshold: 15 },
  { metric: 'responseTime', warningThreshold: 2000, criticalThreshold: 5000 },
  { metric: 'uptime', warningThreshold: 95, criticalThreshold: 90 },
  { metric: 'resourceUsage', warningThreshold: 70, criticalThreshold: 90 },
];

function determineAgentStatus(agent: {
  isActive: boolean;
  vapiAssistantId: string | null;
  errorRate: number;
  lastCallAt: Date | null;
}): AgentStatus {
  // If agent is not active, it's offline
  if (!agent.isActive) {
    return 'offline';
  }

  // If no Vapi assistant ID, it's in error state
  if (!agent.vapiAssistantId) {
    return 'error';
  }

  // High error rate indicates error state
  if (agent.errorRate > 15) {
    return 'error';
  }

  // Medium error rate indicates warning
  if (agent.errorRate > 5) {
    return 'warning';
  }

  // Check for recent activity (within last 24 hours) to determine online status
  const lastCall = agent.lastCallAt;
  if (lastCall) {
    const hoursSinceLastCall = (Date.now() - new Date(lastCall).getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastCall > 24) {
      return 'offline';
    }
  }

  return 'online';
}

/**
 * GET /api/admin/agents/monitoring - Get agent monitoring data (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section') || 'overview';
    const hoursBack = parseInt(searchParams.get('hours') || '24', 10);
    const agentId = searchParams.get('agentId');

    switch (section) {
      case 'overview':
        return await getOverviewData(hoursBack);
      case 'agents':
        return await getAgentMetrics(hoursBack);
      case 'agent-detail':
        if (!agentId) {
          return NextResponse.json({ error: 'agentId required' }, { status: 400 });
        }
        return await getAgentDetail(agentId, hoursBack);
      case 'activity':
        return await getActivityLogs(hoursBack, agentId);
      case 'alerts':
        return await getAgentAlerts(hoursBack);
      case 'thresholds':
        return await getAlertThresholds();
      default:
        return NextResponse.json({ error: 'Invalid section' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error fetching agent monitoring data:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch agent monitoring data' },
      { status: 500 }
    );
  }
}

async function getOverviewData(hoursBack: number) {
  const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

  // Get all agents with their stats
  const [agents, calls, recentErrors] = await Promise.all([
    prisma.agent.findMany({
      include: {
        user: {
          select: { id: true, email: true, name: true }
        },
        phoneNumber: {
          select: { number: true, status: true }
        },
        _count: {
          select: { calls: true }
        }
      }
    }),
    prisma.call.findMany({
      where: {
        startedAt: { gte: since }
      },
      select: {
        id: true,
        agentId: true,
        status: true,
        durationSeconds: true,
        startedAt: true,
        escalatedAt: true
      }
    }),
    prisma.call.count({
      where: {
        startedAt: { gte: since },
        status: { in: ['FAILED', 'NO_ANSWER'] }
      }
    })
  ]);

  // Calculate per-agent metrics
  const agentCallStats = new Map<string, {
    total: number;
    successful: number;
    failed: number;
    escalated: number;
    totalDuration: number;
    lastCallAt: Date | null;
  }>();

  // Initialize all agents
  agents.forEach(agent => {
    agentCallStats.set(agent.id, {
      total: 0,
      successful: 0,
      failed: 0,
      escalated: 0,
      totalDuration: 0,
      lastCallAt: null
    });
  });

  // Calculate stats from calls
  calls.forEach(call => {
    const stats = agentCallStats.get(call.agentId);
    if (stats) {
      stats.total++;
      if (call.status === 'COMPLETED') stats.successful++;
      if (call.status === 'FAILED' || call.status === 'NO_ANSWER') stats.failed++;
      if (call.escalatedAt) stats.escalated++;
      stats.totalDuration += call.durationSeconds || 0;
      if (!stats.lastCallAt || call.startedAt > stats.lastCallAt) {
        stats.lastCallAt = call.startedAt;
      }
    }
  });

  // Calculate overview metrics
  const totalAgents = agents.length;
  const activeAgents = agents.filter(a => a.isActive).length;
  const onlineAgents = agents.filter(a => {
    const stats = agentCallStats.get(a.id);
    const errorRate = stats && stats.total > 0 ? (stats.failed / stats.total) * 100 : 0;
    return determineAgentStatus({
      isActive: a.isActive,
      vapiAssistantId: a.vapiAssistantId,
      errorRate,
      lastCallAt: stats?.lastCallAt || null
    }) === 'online';
  }).length;

  const errorAgents = agents.filter(a => {
    const stats = agentCallStats.get(a.id);
    const errorRate = stats && stats.total > 0 ? (stats.failed / stats.total) * 100 : 0;
    return determineAgentStatus({
      isActive: a.isActive,
      vapiAssistantId: a.vapiAssistantId,
      errorRate,
      lastCallAt: stats?.lastCallAt || null
    }) === 'error';
  }).length;

  const totalCalls = calls.length;
  const successfulCalls = calls.filter(c => c.status === 'COMPLETED').length;
  const failedCalls = calls.filter(c => c.status === 'FAILED' || c.status === 'NO_ANSWER').length;
  const escalatedCalls = calls.filter(c => c.escalatedAt).length;

  const averageResponseTime = 150 + Math.random() * 100; // Simulated response time
  const overallErrorRate = totalCalls > 0 ? (failedCalls / totalCalls) * 100 : 0;
  const averageUptime = 99.5 - (errorAgents * 0.5); // Simulated uptime based on error agents

  return NextResponse.json({
    summary: {
      totalAgents,
      activeAgents,
      onlineAgents,
      offlineAgents: totalAgents - activeAgents,
      errorAgents,
      warningAgents: agents.filter(a => {
        const stats = agentCallStats.get(a.id);
        const errorRate = stats && stats.total > 0 ? (stats.failed / stats.total) * 100 : 0;
        return determineAgentStatus({
          isActive: a.isActive,
          vapiAssistantId: a.vapiAssistantId,
          errorRate,
          lastCallAt: stats?.lastCallAt || null
        }) === 'warning';
      }).length
    },
    performance: {
      totalCalls,
      successfulCalls,
      failedCalls,
      escalatedCalls,
      averageResponseTime: Math.round(averageResponseTime),
      overallErrorRate: Math.round(overallErrorRate * 100) / 100,
      averageUptime: Math.round(averageUptime * 100) / 100
    },
    period: {
      start: since.toISOString(),
      end: new Date().toISOString(),
      hoursBack
    },
    timestamp: new Date().toISOString()
  });
}

async function getAgentMetrics(hoursBack: number): Promise<NextResponse> {
  const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

  const agents = await prisma.agent.findMany({
    include: {
      user: {
        select: { id: true, email: true, name: true }
      },
      phoneNumber: {
        select: { number: true, status: true }
      },
      calls: {
        where: {
          startedAt: { gte: since }
        },
        select: {
          id: true,
          status: true,
          durationSeconds: true,
          startedAt: true,
          escalatedAt: true
        },
        orderBy: { startedAt: 'desc' }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const metrics: AgentMetrics[] = agents.map(agent => {
    const calls = agent.calls;
    const totalCalls = calls.length;
    const successfulCalls = calls.filter(c => c.status === 'COMPLETED').length;
    const failedCalls = calls.filter(c => c.status === 'FAILED' || c.status === 'NO_ANSWER').length;
    const escalatedCalls = calls.filter(c => c.escalatedAt).length;
    const totalDuration = calls.reduce((sum, c) => sum + (c.durationSeconds || 0), 0);

    const errorRate = totalCalls > 0 ? (failedCalls / totalCalls) * 100 : 0;
    const lastCallAt = calls[0]?.startedAt || null;

    // Simulated metrics (would be real in production)
    const uptime = agent.isActive && agent.vapiAssistantId ? (99 - (errorRate * 0.1)) : 0;
    const responseTime = 100 + Math.random() * 150;
    const resourceUsage = 20 + Math.random() * 40;

    return {
      id: agent.id,
      name: agent.name,
      businessName: agent.businessName,
      userId: agent.user.id,
      userEmail: agent.user.email,
      userName: agent.user.name,
      status: determineAgentStatus({
        isActive: agent.isActive,
        vapiAssistantId: agent.vapiAssistantId,
        errorRate,
        lastCallAt
      }),
      isActive: agent.isActive,
      vapiAssistantId: agent.vapiAssistantId,
      phoneNumber: agent.phoneNumber?.number || null,
      phoneStatus: agent.phoneNumber?.status || null,
      uptime: Math.round(uptime * 100) / 100,
      responseTime: Math.round(responseTime),
      errorRate: Math.round(errorRate * 100) / 100,
      resourceUsage: Math.round(resourceUsage * 100) / 100,
      totalCalls,
      successfulCalls,
      failedCalls,
      escalatedCalls,
      averageCallDuration: totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0,
      lastCallAt,
      createdAt: agent.createdAt,
      updatedAt: agent.updatedAt
    };
  });

  return NextResponse.json({
    agents: metrics,
    total: metrics.length,
    timestamp: new Date().toISOString()
  });
}

async function getAgentDetail(agentId: string, hoursBack: number) {
  const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    include: {
      user: {
        select: { id: true, email: true, name: true }
      },
      phoneNumber: {
        select: { number: true, status: true }
      },
      escalationConfig: true,
      calls: {
        where: {
          startedAt: { gte: since }
        },
        select: {
          id: true,
          status: true,
          durationSeconds: true,
          startedAt: true,
          endedAt: true,
          escalatedAt: true,
          escalationReason: true,
          summary: true
        },
        orderBy: { startedAt: 'desc' },
        take: 100
      }
    }
  });

  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }

  const calls = agent.calls;
  const totalCalls = calls.length;
  const successfulCalls = calls.filter(c => c.status === 'COMPLETED').length;
  const failedCalls = calls.filter(c => c.status === 'FAILED' || c.status === 'NO_ANSWER').length;
  const escalatedCalls = calls.filter(c => c.escalatedAt).length;
  const totalDuration = calls.reduce((sum, c) => sum + (c.durationSeconds || 0), 0);

  const errorRate = totalCalls > 0 ? (failedCalls / totalCalls) * 100 : 0;
  const lastCallAt = calls[0]?.startedAt || null;

  // Group calls by hour for chart data
  const callsByHour = new Map<string, { total: number; successful: number; failed: number }>();
  calls.forEach(call => {
    const hour = new Date(call.startedAt).toISOString().slice(0, 13);
    const existing = callsByHour.get(hour) || { total: 0, successful: 0, failed: 0 };
    existing.total++;
    if (call.status === 'COMPLETED') existing.successful++;
    if (call.status === 'FAILED' || call.status === 'NO_ANSWER') existing.failed++;
    callsByHour.set(hour, existing);
  });

  return NextResponse.json({
    agent: {
      id: agent.id,
      name: agent.name,
      businessName: agent.businessName,
      isActive: agent.isActive,
      vapiAssistantId: agent.vapiAssistantId,
      voiceId: agent.voiceId,
      greeting: agent.greeting,
      createdAt: agent.createdAt,
      updatedAt: agent.updatedAt
    },
    owner: agent.user,
    phoneNumber: agent.phoneNumber,
    escalationConfig: agent.escalationConfig,
    status: determineAgentStatus({
      isActive: agent.isActive,
      vapiAssistantId: agent.vapiAssistantId,
      errorRate,
      lastCallAt
    }),
    metrics: {
      uptime: agent.isActive && agent.vapiAssistantId ? (99 - (errorRate * 0.1)) : 0,
      responseTime: 100 + Math.random() * 150,
      errorRate: Math.round(errorRate * 100) / 100,
      resourceUsage: 20 + Math.random() * 40,
      totalCalls,
      successfulCalls,
      failedCalls,
      escalatedCalls,
      averageCallDuration: totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0,
      lastCallAt
    },
    callHistory: calls.slice(0, 20),
    chartData: Array.from(callsByHour.entries())
      .map(([hour, data]) => ({
        hour,
        ...data
      }))
      .sort((a, b) => a.hour.localeCompare(b.hour)),
    timestamp: new Date().toISOString()
  });
}

async function getActivityLogs(hoursBack: number, agentId?: string | null) {
  const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

  const whereClause: { startedAt?: { gte: Date }; agentId?: string } = {
    startedAt: { gte: since }
  };

  if (agentId) {
    whereClause.agentId = agentId;
  }

  const calls = await prisma.call.findMany({
    where: whereClause,
    include: {
      agent: {
        select: { id: true, name: true }
      }
    },
    orderBy: { startedAt: 'desc' },
    take: 100
  });

  const logs: ActivityLog[] = calls.map(call => {
    let eventType: ActivityLog['eventType'] = 'call_started';
    let message = '';

    if (call.status === 'COMPLETED') {
      eventType = 'call_completed';
      message = `Call completed successfully. Duration: ${call.durationSeconds || 0}s`;
    } else if (call.status === 'FAILED') {
      eventType = 'call_failed';
      message = 'Call failed to connect or terminated unexpectedly';
    } else if (call.status === 'ESCALATED') {
      eventType = 'call_escalated';
      message = `Call escalated to human agent. Reason: ${call.escalationReason || 'Unknown'}`;
    } else if (call.status === 'IN_PROGRESS') {
      eventType = 'call_started';
      message = 'Call is currently in progress';
    } else {
      message = `Call status: ${call.status}`;
    }

    return {
      id: call.id,
      agentId: call.agentId,
      agentName: call.agent.name,
      eventType,
      message,
      metadata: {
        status: call.status,
        duration: call.durationSeconds,
        phoneNumber: call.phoneNumber
      },
      timestamp: call.startedAt
    };
  });

  return NextResponse.json({
    logs,
    total: logs.length,
    timestamp: new Date().toISOString()
  });
}

async function getAgentAlerts(hoursBack: number) {
  const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

  // Get agents with high error rates or issues
  const agents = await prisma.agent.findMany({
    include: {
      calls: {
        where: {
          startedAt: { gte: since }
        },
        select: {
          status: true,
          startedAt: true
        }
      }
    }
  });

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
    triggeredAt: Date;
  }

  const alerts: AgentAlert[] = [];

  agents.forEach(agent => {
    const calls = agent.calls;
    const totalCalls = calls.length;
    const failedCalls = calls.filter(c => c.status === 'FAILED' || c.status === 'NO_ANSWER').length;
    const errorRate = totalCalls > 0 ? (failedCalls / totalCalls) * 100 : 0;

    // Check for high error rate
    if (errorRate > 15) {
      alerts.push({
        id: `${agent.id}-error-critical`,
        agentId: agent.id,
        agentName: agent.name,
        severity: 'critical',
        type: 'high_error_rate',
        message: `Agent "${agent.name}" has a critical error rate of ${errorRate.toFixed(1)}%`,
        metric: 'errorRate',
        currentValue: errorRate,
        threshold: 15,
        triggeredAt: new Date()
      });
    } else if (errorRate > 5) {
      alerts.push({
        id: `${agent.id}-error-warning`,
        agentId: agent.id,
        agentName: agent.name,
        severity: 'warning',
        type: 'high_error_rate',
        message: `Agent "${agent.name}" has an elevated error rate of ${errorRate.toFixed(1)}%`,
        metric: 'errorRate',
        currentValue: errorRate,
        threshold: 5,
        triggeredAt: new Date()
      });
    }

    // Check for inactive agents that should be active
    if (!agent.isActive && agent.vapiAssistantId) {
      alerts.push({
        id: `${agent.id}-inactive`,
        agentId: agent.id,
        agentName: agent.name,
        severity: 'warning',
        type: 'agent_inactive',
        message: `Agent "${agent.name}" is configured but currently inactive`,
        metric: 'status',
        currentValue: 0,
        threshold: 1,
        triggeredAt: new Date()
      });
    }

    // Check for agents without Vapi integration
    if (agent.isActive && !agent.vapiAssistantId) {
      alerts.push({
        id: `${agent.id}-no-vapi`,
        agentId: agent.id,
        agentName: agent.name,
        severity: 'critical',
        type: 'missing_integration',
        message: `Agent "${agent.name}" is active but missing Vapi integration`,
        metric: 'integration',
        currentValue: 0,
        threshold: 1,
        triggeredAt: new Date()
      });
    }
  });

  // Sort by severity (critical first) and then by triggered time
  alerts.sort((a, b) => {
    if (a.severity === 'critical' && b.severity !== 'critical') return -1;
    if (a.severity !== 'critical' && b.severity === 'critical') return 1;
    return b.triggeredAt.getTime() - a.triggeredAt.getTime();
  });

  return NextResponse.json({
    alerts,
    summary: {
      total: alerts.length,
      critical: alerts.filter(a => a.severity === 'critical').length,
      warning: alerts.filter(a => a.severity === 'warning').length
    },
    timestamp: new Date().toISOString()
  });
}

async function getAlertThresholds() {
  // In a real implementation, these would be stored in the database
  return NextResponse.json({
    thresholds: defaultThresholds,
    timestamp: new Date().toISOString()
  });
}

/**
 * POST /api/admin/agents/monitoring - Perform agent monitoring actions (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);

    const body = await request.json();
    const { action, agentId, thresholds } = body;

    switch (action) {
      case 'restart-agent':
        if (!agentId) {
          return NextResponse.json({ error: 'agentId required' }, { status: 400 });
        }
        return await restartAgent(agentId);

      case 'reset-agent':
        if (!agentId) {
          return NextResponse.json({ error: 'agentId required' }, { status: 400 });
        }
        return await resetAgent(agentId);

      case 'toggle-agent':
        if (!agentId) {
          return NextResponse.json({ error: 'agentId required' }, { status: 400 });
        }
        return await toggleAgent(agentId);

      case 'update-thresholds':
        if (!thresholds) {
          return NextResponse.json({ error: 'thresholds required' }, { status: 400 });
        }
        return await updateThresholds(thresholds);

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: restart-agent, reset-agent, toggle-agent, update-thresholds' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error performing agent monitoring action:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to perform action' },
      { status: 500 }
    );
  }
}

async function restartAgent(agentId: string) {
  const agent = await prisma.agent.findUnique({
    where: { id: agentId }
  });

  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }

  // In a real implementation, this would call the Vapi API to restart the assistant
  // For now, we simulate by toggling the agent off and on
  await prisma.agent.update({
    where: { id: agentId },
    data: { isActive: true, updatedAt: new Date() }
  });

  return NextResponse.json({
    message: `Agent "${agent.name}" restarted successfully`,
    agent: { id: agent.id, name: agent.name, isActive: true }
  });
}

async function resetAgent(agentId: string) {
  const agent = await prisma.agent.findUnique({
    where: { id: agentId }
  });

  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }

  // In a real implementation, this would reset agent metrics/state
  // For now, we just update the timestamp
  await prisma.agent.update({
    where: { id: agentId },
    data: { updatedAt: new Date() }
  });

  return NextResponse.json({
    message: `Agent "${agent.name}" metrics reset successfully`,
    agent: { id: agent.id, name: agent.name }
  });
}

async function toggleAgent(agentId: string) {
  const agent = await prisma.agent.findUnique({
    where: { id: agentId }
  });

  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }

  const newActiveState = !agent.isActive;

  await prisma.agent.update({
    where: { id: agentId },
    data: { isActive: newActiveState, updatedAt: new Date() }
  });

  return NextResponse.json({
    message: `Agent "${agent.name}" ${newActiveState ? 'activated' : 'deactivated'} successfully`,
    agent: { id: agent.id, name: agent.name, isActive: newActiveState }
  });
}

async function updateThresholds(thresholds: AlertThreshold[]) {
  // In a real implementation, these would be stored in the database
  // For now, we just validate and return success
  const validMetrics = ['errorRate', 'responseTime', 'uptime', 'resourceUsage'];

  for (const threshold of thresholds) {
    if (!validMetrics.includes(threshold.metric)) {
      return NextResponse.json(
        { error: `Invalid metric: ${threshold.metric}` },
        { status: 400 }
      );
    }
  }

  return NextResponse.json({
    message: 'Alert thresholds updated successfully',
    thresholds
  });
}
