/**
 * Anomaly Detection Service
 *
 * Detects anomalies in system metrics and triggers alerts:
 * - Error rate spikes
 * - Latency degradation
 * - Memory leaks
 * - Traffic anomalies
 */

import { prisma } from '@/lib/prisma';
import { AlertSeverity, AlertStatus } from '@/generated/prisma/client';
import { metrics } from '@/lib/performance';
import { errorMonitor } from '@/lib/errors/monitoring';
import { logger } from '@/lib/errors/logger';

export interface AnomalyThresholds {
  errorRatePerMinute: { warning: number; critical: number };
  latencyP95Ms: { warning: number; critical: number };
  memoryUsagePercent: { warning: number; critical: number };
  activeRequests: { warning: number; critical: number };
}

const DEFAULT_THRESHOLDS: AnomalyThresholds = {
  errorRatePerMinute: { warning: 5, critical: 20 },
  latencyP95Ms: { warning: 1000, critical: 5000 },
  memoryUsagePercent: { warning: 80, critical: 95 },
  activeRequests: { warning: 100, critical: 500 },
};

/**
 * Check for anomalies and create alerts
 */
export async function checkForAnomalies(
  thresholds: AnomalyThresholds = DEFAULT_THRESHOLDS
): Promise<void> {
  const anomalies: Array<{
    source: string;
    severity: AlertSeverity;
    title: string;
    message: string;
    metadata: Record<string, unknown>;
  }> = [];

  // Check error rate
  const errorStats = errorMonitor.getStats();
  const errorRate = errorStats.errorRate.perMinute;

  if (errorRate >= thresholds.errorRatePerMinute.critical) {
    anomalies.push({
      source: 'error_rate',
      severity: 'CRITICAL',
      title: 'Critical Error Rate Detected',
      message: `Error rate is at ${errorRate} errors/minute, exceeding critical threshold of ${thresholds.errorRatePerMinute.critical}`,
      metadata: {
        currentRate: errorRate,
        threshold: thresholds.errorRatePerMinute.critical,
        topErrors: errorStats.topErrors.slice(0, 5),
      },
    });
  } else if (errorRate >= thresholds.errorRatePerMinute.warning) {
    anomalies.push({
      source: 'error_rate',
      severity: 'HIGH',
      title: 'Elevated Error Rate Detected',
      message: `Error rate is at ${errorRate} errors/minute, exceeding warning threshold of ${thresholds.errorRatePerMinute.warning}`,
      metadata: {
        currentRate: errorRate,
        threshold: thresholds.errorRatePerMinute.warning,
        topErrors: errorStats.topErrors.slice(0, 5),
      },
    });
  }

  // Check latency
  const apiMetrics = metrics.getAllMetrics().filter(m => m.name.startsWith('api.'));
  for (const metric of apiMetrics) {
    const p95 = metrics.getPercentile(metric.name, 95);
    if (p95 !== null) {
      if (p95 >= thresholds.latencyP95Ms.critical) {
        anomalies.push({
          source: 'latency',
          severity: 'CRITICAL',
          title: `Critical Latency on ${metric.name}`,
          message: `P95 latency is ${Math.round(p95)}ms, exceeding critical threshold of ${thresholds.latencyP95Ms.critical}ms`,
          metadata: {
            metricName: metric.name,
            p95Latency: Math.round(p95),
            avgLatency: Math.round(metric.avgMs),
            maxLatency: Math.round(metric.maxMs),
            threshold: thresholds.latencyP95Ms.critical,
          },
        });
      } else if (p95 >= thresholds.latencyP95Ms.warning) {
        anomalies.push({
          source: 'latency',
          severity: 'MEDIUM',
          title: `High Latency on ${metric.name}`,
          message: `P95 latency is ${Math.round(p95)}ms, exceeding warning threshold of ${thresholds.latencyP95Ms.warning}ms`,
          metadata: {
            metricName: metric.name,
            p95Latency: Math.round(p95),
            avgLatency: Math.round(metric.avgMs),
            threshold: thresholds.latencyP95Ms.warning,
          },
        });
      }
    }
  }

  // Check memory usage
  const memoryUsage = metrics.getMemoryUsage();
  if (memoryUsage) {
    if (memoryUsage.usagePercent >= thresholds.memoryUsagePercent.critical) {
      anomalies.push({
        source: 'memory',
        severity: 'CRITICAL',
        title: 'Critical Memory Usage',
        message: `Memory usage is at ${Math.round(memoryUsage.usagePercent)}%, exceeding critical threshold of ${thresholds.memoryUsagePercent.critical}%`,
        metadata: {
          usagePercent: Math.round(memoryUsage.usagePercent),
          heapUsedMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          heapTotalMB: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          threshold: thresholds.memoryUsagePercent.critical,
        },
      });
    } else if (memoryUsage.usagePercent >= thresholds.memoryUsagePercent.warning) {
      anomalies.push({
        source: 'memory',
        severity: 'MEDIUM',
        title: 'High Memory Usage',
        message: `Memory usage is at ${Math.round(memoryUsage.usagePercent)}%, exceeding warning threshold of ${thresholds.memoryUsagePercent.warning}%`,
        metadata: {
          usagePercent: Math.round(memoryUsage.usagePercent),
          heapUsedMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          threshold: thresholds.memoryUsagePercent.warning,
        },
      });
    }
  }

  // Check active requests
  const activeRequests = metrics.getGauge('api.active_requests');
  if (activeRequests >= thresholds.activeRequests.critical) {
    anomalies.push({
      source: 'traffic',
      severity: 'HIGH',
      title: 'Very High Traffic',
      message: `${activeRequests} concurrent requests, exceeding critical threshold of ${thresholds.activeRequests.critical}`,
      metadata: {
        activeRequests,
        threshold: thresholds.activeRequests.critical,
      },
    });
  } else if (activeRequests >= thresholds.activeRequests.warning) {
    anomalies.push({
      source: 'traffic',
      severity: 'MEDIUM',
      title: 'High Traffic',
      message: `${activeRequests} concurrent requests, exceeding warning threshold of ${thresholds.activeRequests.warning}`,
      metadata: {
        activeRequests,
        threshold: thresholds.activeRequests.warning,
      },
    });
  }

  // Create alerts for detected anomalies (avoid duplicates)
  for (const anomaly of anomalies) {
    await createAlertIfNew(anomaly);
  }
}

/**
 * Create an alert if there isn't an active one for the same source
 */
async function createAlertIfNew(anomaly: {
  source: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  metadata: Record<string, unknown>;
}): Promise<void> {
  try {
    // Check for existing active alert from same source
    const existingAlert = await prisma.monitoringAlert.findFirst({
      where: {
        source: anomaly.source,
        status: 'ACTIVE',
        triggeredAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000), // Within last 5 minutes
        },
      },
    });

    if (existingAlert) {
      // Update existing alert if severity changed
      if (existingAlert.severity !== anomaly.severity) {
        await prisma.monitoringAlert.update({
          where: { id: existingAlert.id },
          data: {
            severity: anomaly.severity,
            message: anomaly.message,
            metadata: JSON.parse(JSON.stringify(anomaly.metadata)),
          },
        });
      }
      return;
    }

    // Create new alert
    await prisma.monitoringAlert.create({
      data: {
        severity: anomaly.severity,
        title: anomaly.title,
        message: anomaly.message,
        source: anomaly.source,
        metadata: JSON.parse(JSON.stringify(anomaly.metadata)),
      },
    });

    logger.warn('Anomaly alert created', {
      source: anomaly.source,
      severity: anomaly.severity,
      title: anomaly.title,
    });
  } catch (error) {
    logger.error('Failed to create anomaly alert', error);
  }
}

/**
 * Get active alerts
 */
export async function getActiveAlerts() {
  return prisma.monitoringAlert.findMany({
    where: {
      status: 'ACTIVE',
    },
    orderBy: [
      { severity: 'desc' },
      { triggeredAt: 'desc' },
    ],
  });
}

/**
 * Get alert history
 */
export async function getAlertHistory(limit = 100) {
  return prisma.monitoringAlert.findMany({
    orderBy: { triggeredAt: 'desc' },
    take: limit,
  });
}

/**
 * Acknowledge an alert
 */
export async function acknowledgeAlert(alertId: string): Promise<void> {
  await prisma.monitoringAlert.update({
    where: { id: alertId },
    data: { status: 'ACKNOWLEDGED' },
  });
}

/**
 * Resolve an alert
 */
export async function resolveAlert(alertId: string, resolvedBy?: string): Promise<void> {
  await prisma.monitoringAlert.update({
    where: { id: alertId },
    data: {
      status: 'RESOLVED',
      resolvedAt: new Date(),
      resolvedBy,
    },
  });
}

/**
 * Auto-resolve alerts that are no longer relevant
 */
export async function autoResolveStaleAlerts(): Promise<number> {
  // Resolve alerts older than 1 hour that are still active
  const staleThreshold = new Date(Date.now() - 60 * 60 * 1000);

  const result = await prisma.monitoringAlert.updateMany({
    where: {
      status: 'ACTIVE',
      triggeredAt: { lt: staleThreshold },
    },
    data: {
      status: 'RESOLVED',
      resolvedAt: new Date(),
    },
  });

  if (result.count > 0) {
    logger.info('Auto-resolved stale alerts', { count: result.count });
  }

  return result.count;
}

/**
 * Clean up old resolved alerts (keep last 30 days)
 */
export async function cleanupOldAlerts(): Promise<number> {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const result = await prisma.monitoringAlert.deleteMany({
    where: {
      status: 'RESOLVED',
      resolvedAt: { lt: cutoff },
    },
  });

  logger.info('Cleaned up old alerts', { deleted: result.count });
  return result.count;
}

// Periodic anomaly checking
let anomalyCheckInterval: ReturnType<typeof setInterval> | null = null;

export function startAnomalyDetection(intervalMs = 60000): void {
  if (anomalyCheckInterval) {
    return;
  }

  anomalyCheckInterval = setInterval(() => {
    checkForAnomalies().catch(err => {
      logger.error('Anomaly check failed', err);
    });
    autoResolveStaleAlerts().catch(err => {
      logger.error('Auto-resolve failed', err);
    });
  }, intervalMs);

  logger.info('Anomaly detection started', { intervalMs });
}

export function stopAnomalyDetection(): void {
  if (anomalyCheckInterval) {
    clearInterval(anomalyCheckInterval);
    anomalyCheckInterval = null;
    logger.info('Anomaly detection stopped');
  }
}
