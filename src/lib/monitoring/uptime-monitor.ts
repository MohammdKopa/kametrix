/**
 * Uptime Monitoring Service
 *
 * Tracks service availability over time and provides uptime statistics.
 * Stores records in the database for historical analysis.
 */

import { prisma } from '@/lib/prisma';
import { ServiceStatus } from '@/generated/prisma/client';
import { performHealthCheck, type HealthStatus } from './health-check';
import { logger } from '@/lib/errors/logger';

// Map our health status to database enum
function mapToServiceStatus(status: HealthStatus): ServiceStatus {
  switch (status) {
    case 'healthy':
      return 'HEALTHY';
    case 'degraded':
      return 'DEGRADED';
    case 'unhealthy':
      return 'UNHEALTHY';
    default:
      return 'UNKNOWN';
  }
}

export interface UptimeStats {
  serviceName: string;
  uptimePercent: number;
  totalChecks: number;
  healthyChecks: number;
  degradedChecks: number;
  unhealthyChecks: number;
  avgResponseTimeMs: number;
  lastStatus: ServiceStatus;
  lastCheckedAt: Date;
}

export interface UptimeSummary {
  overall: {
    uptimePercent: number;
    status: ServiceStatus;
  };
  services: UptimeStats[];
  period: {
    start: Date;
    end: Date;
  };
}

/**
 * Record a health check result to the database
 */
export async function recordHealthCheck(): Promise<void> {
  try {
    const health = await performHealthCheck(true);

    // Record each service status
    const records = health.services.map(service => ({
      serviceName: service.name,
      status: mapToServiceStatus(service.status),
      responseTimeMs: service.responseTimeMs ?? null,
      errorMessage: service.message ?? null,
    }));

    // Also record overall API status
    records.push({
      serviceName: 'api',
      status: mapToServiceStatus(health.status),
      responseTimeMs: null,
      errorMessage: null,
    });

    await prisma.uptimeRecord.createMany({
      data: records,
    });

    logger.debug('Health check recorded', {
      status: health.status,
      services: health.services.length,
    });
  } catch (error) {
    logger.error('Failed to record health check', error);
  }
}

/**
 * Get uptime statistics for a time period
 */
export async function getUptimeStats(
  hoursBack = 24
): Promise<UptimeSummary> {
  const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

  // Get all records in the time period
  const records = await prisma.uptimeRecord.findMany({
    where: {
      checkedAt: { gte: since },
    },
    orderBy: { checkedAt: 'desc' },
  });

  // Group by service
  const serviceMap = new Map<string, {
    total: number;
    healthy: number;
    degraded: number;
    unhealthy: number;
    totalResponseTime: number;
    responseTimeCount: number;
    lastStatus: ServiceStatus;
    lastCheckedAt: Date;
  }>();

  for (const record of records) {
    let stats = serviceMap.get(record.serviceName);
    if (!stats) {
      stats = {
        total: 0,
        healthy: 0,
        degraded: 0,
        unhealthy: 0,
        totalResponseTime: 0,
        responseTimeCount: 0,
        lastStatus: record.status,
        lastCheckedAt: record.checkedAt,
      };
      serviceMap.set(record.serviceName, stats);
    }

    stats.total++;
    if (record.status === 'HEALTHY') stats.healthy++;
    else if (record.status === 'DEGRADED') stats.degraded++;
    else if (record.status === 'UNHEALTHY') stats.unhealthy++;

    if (record.responseTimeMs !== null) {
      stats.totalResponseTime += record.responseTimeMs;
      stats.responseTimeCount++;
    }
  }

  // Calculate stats for each service
  const services: UptimeStats[] = [];
  let totalUptime = 0;
  let serviceCount = 0;

  for (const [serviceName, stats] of serviceMap) {
    const uptimePercent = stats.total > 0
      ? ((stats.healthy + stats.degraded * 0.5) / stats.total) * 100
      : 100;

    services.push({
      serviceName,
      uptimePercent: Math.round(uptimePercent * 100) / 100,
      totalChecks: stats.total,
      healthyChecks: stats.healthy,
      degradedChecks: stats.degraded,
      unhealthyChecks: stats.unhealthy,
      avgResponseTimeMs: stats.responseTimeCount > 0
        ? Math.round(stats.totalResponseTime / stats.responseTimeCount)
        : 0,
      lastStatus: stats.lastStatus,
      lastCheckedAt: stats.lastCheckedAt,
    });

    totalUptime += uptimePercent;
    serviceCount++;
  }

  // Sort by service name for consistency
  services.sort((a, b) => a.serviceName.localeCompare(b.serviceName));

  // Get overall status from API service or calculate
  const apiStats = serviceMap.get('api');
  const overallStatus = apiStats?.lastStatus ?? 'UNKNOWN';
  const overallUptime = serviceCount > 0 ? totalUptime / serviceCount : 100;

  return {
    overall: {
      uptimePercent: Math.round(overallUptime * 100) / 100,
      status: overallStatus,
    },
    services,
    period: {
      start: since,
      end: new Date(),
    },
  };
}

/**
 * Get uptime history for charting
 */
export async function getUptimeHistory(
  serviceName: string,
  hoursBack = 24,
  resolution: 'minute' | 'hour' = 'hour'
): Promise<Array<{ timestamp: Date; status: ServiceStatus; responseTimeMs: number | null }>> {
  const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

  const records = await prisma.uptimeRecord.findMany({
    where: {
      serviceName,
      checkedAt: { gte: since },
    },
    orderBy: { checkedAt: 'asc' },
    select: {
      checkedAt: true,
      status: true,
      responseTimeMs: true,
    },
  });

  if (resolution === 'minute') {
    return records.map(r => ({
      timestamp: r.checkedAt,
      status: r.status,
      responseTimeMs: r.responseTimeMs,
    }));
  }

  // Aggregate by hour
  const hourlyMap = new Map<string, {
    timestamp: Date;
    statuses: ServiceStatus[];
    responseTimes: number[];
  }>();

  for (const record of records) {
    const hourKey = record.checkedAt.toISOString().slice(0, 13); // "2024-01-15T14"
    let entry = hourlyMap.get(hourKey);
    if (!entry) {
      entry = {
        timestamp: new Date(hourKey + ':00:00.000Z'),
        statuses: [],
        responseTimes: [],
      };
      hourlyMap.set(hourKey, entry);
    }
    entry.statuses.push(record.status);
    if (record.responseTimeMs !== null) {
      entry.responseTimes.push(record.responseTimeMs);
    }
  }

  // Determine worst status per hour
  const result: Array<{ timestamp: Date; status: ServiceStatus; responseTimeMs: number | null }> = [];
  for (const [, entry] of hourlyMap) {
    let worstStatus: ServiceStatus = 'HEALTHY';
    if (entry.statuses.includes('UNHEALTHY')) worstStatus = 'UNHEALTHY';
    else if (entry.statuses.includes('DEGRADED')) worstStatus = 'DEGRADED';

    result.push({
      timestamp: entry.timestamp,
      status: worstStatus,
      responseTimeMs: entry.responseTimes.length > 0
        ? Math.round(entry.responseTimes.reduce((a, b) => a + b, 0) / entry.responseTimes.length)
        : null,
    });
  }

  return result.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

/**
 * Clean up old uptime records (keep last 30 days)
 */
export async function cleanupOldUptimeRecords(): Promise<number> {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const result = await prisma.uptimeRecord.deleteMany({
    where: {
      checkedAt: { lt: cutoff },
    },
  });

  logger.info('Cleaned up old uptime records', { deleted: result.count });
  return result.count;
}

// Start periodic health checks if in Node.js environment
let healthCheckInterval: ReturnType<typeof setInterval> | null = null;

export function startUptimeMonitoring(intervalMs = 60000): void {
  if (healthCheckInterval) {
    return; // Already running
  }

  healthCheckInterval = setInterval(() => {
    recordHealthCheck().catch(err => {
      logger.error('Periodic health check failed', err);
    });
  }, intervalMs);

  logger.info('Uptime monitoring started', { intervalMs });
}

export function stopUptimeMonitoring(): void {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
    logger.info('Uptime monitoring stopped');
  }
}
