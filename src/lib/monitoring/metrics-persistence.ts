/**
 * Metrics Persistence Service
 *
 * Persists in-memory metrics to the database for historical analysis:
 * - Periodic metric snapshots
 * - Metric aggregation (hourly/daily rollups)
 * - Historical data queries
 */

import { prisma } from '@/lib/prisma';
import { MetricType } from '@/generated/prisma/client';
import { metrics } from '@/lib/performance';
import { logger } from '@/lib/errors/logger';

/**
 * Persist current metrics to database
 */
export async function persistMetrics(): Promise<void> {
  try {
    const report = metrics.generateReport();
    const records: Array<{
      name: string;
      type: MetricType;
      value: number;
      tags?: object;
    }> = [];

    // Persist timing metrics
    for (const metric of report.metrics) {
      records.push({
        name: metric.name,
        type: 'TIMING',
        value: metric.avgMs,
        tags: {
          count: metric.count,
          minMs: metric.minMs,
          maxMs: metric.maxMs,
          errorRate: metric.errorRate,
        },
      });
    }

    // Persist gauges
    for (const [name, value] of Object.entries(report.gauges)) {
      records.push({
        name,
        type: 'GAUGE',
        value,
      });
    }

    // Persist memory metrics
    if (report.memory) {
      records.push({
        name: 'memory.heap_used',
        type: 'GAUGE',
        value: report.memory.heapUsed,
      });
      records.push({
        name: 'memory.heap_total',
        type: 'GAUGE',
        value: report.memory.heapTotal,
      });
      records.push({
        name: 'memory.rss',
        type: 'GAUGE',
        value: report.memory.rss,
      });
      records.push({
        name: 'memory.usage_percent',
        type: 'GAUGE',
        value: report.memory.usagePercent,
      });
    }

    if (records.length > 0) {
      await prisma.systemMetric.createMany({
        data: records,
      });
      logger.debug('Metrics persisted', { count: records.length });
    }
  } catch (error) {
    logger.error('Failed to persist metrics', error);
  }
}

/**
 * Create hourly metric aggregates
 */
export async function createHourlyAggregates(): Promise<void> {
  const now = new Date();
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const hourKey = hourAgo.toISOString().slice(0, 13).replace('T', '-'); // "2024-01-15-14"

  try {
    // Get distinct metric names from the last hour
    const metricNames = await prisma.systemMetric.findMany({
      where: {
        recordedAt: {
          gte: hourAgo,
          lt: now,
        },
      },
      select: { name: true },
      distinct: ['name'],
    });

    for (const { name } of metricNames) {
      // Get all values for this metric in the hour
      const values = await prisma.systemMetric.findMany({
        where: {
          name,
          recordedAt: {
            gte: hourAgo,
            lt: now,
          },
        },
        select: { value: true },
      });

      if (values.length === 0) continue;

      const sortedValues = values.map(v => v.value).sort((a, b) => a - b);
      const sum = sortedValues.reduce((a, b) => a + b, 0);
      const count = sortedValues.length;

      const aggregate = {
        name,
        period: 'hourly',
        periodKey: hourKey,
        count,
        sum,
        min: sortedValues[0],
        max: sortedValues[count - 1],
        avg: sum / count,
        p50: sortedValues[Math.floor(count * 0.5)],
        p95: sortedValues[Math.floor(count * 0.95)],
        p99: sortedValues[Math.floor(count * 0.99)],
      };

      await prisma.metricAggregate.upsert({
        where: {
          name_period_periodKey: {
            name,
            period: 'hourly',
            periodKey: hourKey,
          },
        },
        create: aggregate,
        update: aggregate,
      });
    }

    logger.debug('Hourly aggregates created', { periodKey: hourKey, metrics: metricNames.length });
  } catch (error) {
    logger.error('Failed to create hourly aggregates', error);
  }
}

/**
 * Create daily metric aggregates
 */
export async function createDailyAggregates(): Promise<void> {
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const dayKey = dayAgo.toISOString().slice(0, 10); // "2024-01-15"

  try {
    // Aggregate from hourly data
    const hourlyAggregates = await prisma.metricAggregate.findMany({
      where: {
        period: 'hourly',
        periodKey: { startsWith: dayKey },
      },
    });

    // Group by metric name
    const metricGroups = new Map<string, typeof hourlyAggregates>();
    for (const agg of hourlyAggregates) {
      const existing = metricGroups.get(agg.name) ?? [];
      existing.push(agg);
      metricGroups.set(agg.name, existing);
    }

    for (const [name, aggregates] of metricGroups) {
      const totalCount = aggregates.reduce((sum, a) => sum + a.count, 0);
      const totalSum = aggregates.reduce((sum, a) => sum + a.sum, 0);
      const allMins = aggregates.map(a => a.min).filter((v): v is number => v !== null);
      const allMaxs = aggregates.map(a => a.max).filter((v): v is number => v !== null);

      const dailyAggregate = {
        name,
        period: 'daily',
        periodKey: dayKey,
        count: totalCount,
        sum: totalSum,
        min: allMins.length > 0 ? Math.min(...allMins) : null,
        max: allMaxs.length > 0 ? Math.max(...allMaxs) : null,
        avg: totalCount > 0 ? totalSum / totalCount : null,
        // Approximate percentiles from hourly data
        p50: aggregates.length > 0 ? aggregates.reduce((sum, a) => sum + (a.p50 ?? 0), 0) / aggregates.length : null,
        p95: aggregates.length > 0 ? aggregates.reduce((sum, a) => sum + (a.p95 ?? 0), 0) / aggregates.length : null,
        p99: aggregates.length > 0 ? aggregates.reduce((sum, a) => sum + (a.p99 ?? 0), 0) / aggregates.length : null,
      };

      await prisma.metricAggregate.upsert({
        where: {
          name_period_periodKey: {
            name,
            period: 'daily',
            periodKey: dayKey,
          },
        },
        create: dailyAggregate,
        update: dailyAggregate,
      });
    }

    logger.debug('Daily aggregates created', { periodKey: dayKey, metrics: metricGroups.size });
  } catch (error) {
    logger.error('Failed to create daily aggregates', error);
  }
}

/**
 * Get metric history for charting
 */
export async function getMetricHistory(
  metricName: string,
  hoursBack = 24
): Promise<Array<{ timestamp: Date; value: number }>> {
  const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

  const records = await prisma.systemMetric.findMany({
    where: {
      name: metricName,
      recordedAt: { gte: since },
    },
    orderBy: { recordedAt: 'asc' },
    select: {
      recordedAt: true,
      value: true,
    },
  });

  return records.map(r => ({
    timestamp: r.recordedAt,
    value: r.value,
  }));
}

/**
 * Get aggregated metrics for dashboard
 */
export async function getAggregatedMetrics(
  period: 'hourly' | 'daily',
  daysBack = 7
) {
  const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
  const sinceKey = since.toISOString().slice(0, period === 'hourly' ? 13 : 10).replace('T', '-');

  return prisma.metricAggregate.findMany({
    where: {
      period,
      periodKey: { gte: sinceKey },
    },
    orderBy: { periodKey: 'asc' },
  });
}

/**
 * Clean up old metrics (keep raw metrics for 7 days, aggregates for 90 days)
 */
export async function cleanupOldMetrics(): Promise<{ raw: number; aggregates: number }> {
  const rawCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const aggCutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const aggCutoffKey = aggCutoff.toISOString().slice(0, 10);

  const rawResult = await prisma.systemMetric.deleteMany({
    where: {
      recordedAt: { lt: rawCutoff },
    },
  });

  const aggResult = await prisma.metricAggregate.deleteMany({
    where: {
      periodKey: { lt: aggCutoffKey },
    },
  });

  logger.info('Cleaned up old metrics', {
    rawDeleted: rawResult.count,
    aggregatesDeleted: aggResult.count,
  });

  return {
    raw: rawResult.count,
    aggregates: aggResult.count,
  };
}

// Periodic persistence
let persistInterval: ReturnType<typeof setInterval> | null = null;
let aggregateInterval: ReturnType<typeof setInterval> | null = null;

export function startMetricsPersistence(
  persistIntervalMs = 5 * 60 * 1000, // Every 5 minutes
  aggregateIntervalMs = 60 * 60 * 1000 // Every hour
): void {
  if (persistInterval) {
    return;
  }

  persistInterval = setInterval(() => {
    persistMetrics().catch(err => {
      logger.error('Metric persistence failed', err);
    });
  }, persistIntervalMs);

  aggregateInterval = setInterval(() => {
    createHourlyAggregates().catch(err => {
      logger.error('Hourly aggregation failed', err);
    });
  }, aggregateIntervalMs);

  logger.info('Metrics persistence started', { persistIntervalMs, aggregateIntervalMs });
}

export function stopMetricsPersistence(): void {
  if (persistInterval) {
    clearInterval(persistInterval);
    persistInterval = null;
  }
  if (aggregateInterval) {
    clearInterval(aggregateInterval);
    aggregateInterval = null;
  }
  logger.info('Metrics persistence stopped');
}
