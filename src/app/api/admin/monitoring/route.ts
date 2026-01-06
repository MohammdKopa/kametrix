import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-guard';
import { performHealthCheck } from '@/lib/monitoring/health-check';
import { getUptimeStats, getUptimeHistory, recordHealthCheck } from '@/lib/monitoring/uptime-monitor';
import { getPlatformAnalytics, getRecentEvents, getTopUsersByActivity } from '@/lib/monitoring/analytics';
import { getActiveAlerts, getAlertHistory, acknowledgeAlert, resolveAlert } from '@/lib/monitoring/anomaly-detector';
import { getAggregatedMetrics, getMetricHistory } from '@/lib/monitoring/metrics-persistence';
import { metrics } from '@/lib/performance';
import { errorMonitor } from '@/lib/errors/monitoring';

/**
 * GET /api/admin/monitoring - Get comprehensive monitoring data (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section') || 'overview';
    const hoursBack = parseInt(searchParams.get('hours') || '24', 10);

    switch (section) {
      case 'overview':
        return await getOverviewData(hoursBack);
      case 'uptime':
        return await getUptimeData(hoursBack);
      case 'analytics':
        return await getAnalyticsData(hoursBack);
      case 'alerts':
        return await getAlertsData();
      case 'metrics':
        return await getMetricsData(hoursBack, searchParams.get('metric') || undefined);
      default:
        return NextResponse.json({ error: 'Invalid section' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error fetching monitoring data:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch monitoring data' },
      { status: 500 }
    );
  }
}

async function getOverviewData(hoursBack: number) {
  const [health, uptime, analytics, alerts, metricsReport] = await Promise.all([
    performHealthCheck(true),
    getUptimeStats(hoursBack),
    getPlatformAnalytics(hoursBack),
    getActiveAlerts(),
    Promise.resolve(metrics.generateReport()),
  ]);

  const errorStats = errorMonitor.getStats();

  return NextResponse.json({
    health,
    uptime: {
      overall: uptime.overall,
      period: uptime.period,
    },
    analytics: {
      activeUsers: analytics.users.activeUsers,
      newSignups: analytics.users.newSignups,
      totalCalls: analytics.calls.total,
      totalEvents: analytics.events.total,
    },
    alerts: {
      active: alerts.length,
      critical: alerts.filter(a => a.severity === 'CRITICAL').length,
      high: alerts.filter(a => a.severity === 'HIGH').length,
    },
    performance: {
      errorRate: errorStats.errorRate.perMinute,
      topErrors: errorStats.topErrors.slice(0, 5),
      memory: metricsReport.memory,
      activeRequests: metricsReport.gauges['api.active_requests'] ?? 0,
    },
    timestamp: new Date().toISOString(),
  });
}

async function getUptimeData(hoursBack: number) {
  const [stats, apiHistory, dbHistory] = await Promise.all([
    getUptimeStats(hoursBack),
    getUptimeHistory('api', hoursBack, 'hour'),
    getUptimeHistory('database', hoursBack, 'hour'),
  ]);

  return NextResponse.json({
    stats,
    history: {
      api: apiHistory,
      database: dbHistory,
    },
    timestamp: new Date().toISOString(),
  });
}

async function getAnalyticsData(hoursBack: number) {
  const [platformAnalytics, recentEvents, topUsers] = await Promise.all([
    getPlatformAnalytics(hoursBack),
    getRecentEvents(50),
    getTopUsersByActivity(10),
  ]);

  return NextResponse.json({
    platform: platformAnalytics,
    recentEvents,
    topUsers,
    timestamp: new Date().toISOString(),
  });
}

async function getAlertsData() {
  const [active, history] = await Promise.all([
    getActiveAlerts(),
    getAlertHistory(50),
  ]);

  return NextResponse.json({
    active,
    history,
    timestamp: new Date().toISOString(),
  });
}

async function getMetricsData(hoursBack: number, metricName?: string) {
  if (metricName) {
    const history = await getMetricHistory(metricName, hoursBack);
    return NextResponse.json({
      metric: metricName,
      history,
      timestamp: new Date().toISOString(),
    });
  }

  const [hourlyAggregates, currentMetrics] = await Promise.all([
    getAggregatedMetrics('hourly', Math.ceil(hoursBack / 24)),
    Promise.resolve(metrics.generateReport()),
  ]);

  return NextResponse.json({
    current: currentMetrics,
    aggregates: hourlyAggregates,
    timestamp: new Date().toISOString(),
  });
}

/**
 * POST /api/admin/monitoring - Perform monitoring actions (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);

    const body = await request.json();
    const { action, alertId, resolvedBy } = body;

    switch (action) {
      case 'record-health-check':
        await recordHealthCheck();
        return NextResponse.json({ message: 'Health check recorded' });

      case 'acknowledge-alert':
        if (!alertId) {
          return NextResponse.json({ error: 'alertId required' }, { status: 400 });
        }
        await acknowledgeAlert(alertId);
        return NextResponse.json({ message: 'Alert acknowledged' });

      case 'resolve-alert':
        if (!alertId) {
          return NextResponse.json({ error: 'alertId required' }, { status: 400 });
        }
        await resolveAlert(alertId, resolvedBy);
        return NextResponse.json({ message: 'Alert resolved' });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: record-health-check, acknowledge-alert, resolve-alert' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error performing monitoring action:', error);

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
