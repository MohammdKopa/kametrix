import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { metrics, appCache, queryCache } from '@/lib/performance';
import { getMonitoringHealth, circuitBreakers, errorMonitor } from '@/lib/errors';

export async function GET() {
  const timestamp = new Date().toISOString();
  const startTime = Date.now();

  try {
    // Simple database connectivity check
    await prisma.$queryRaw`SELECT 1`;

    const dbLatency = Date.now() - startTime;

    // Get basic cache stats
    const cacheStats = {
      app: appCache.getStats().hitRate,
      query: queryCache.getStats().hitRate,
    };

    // Get memory usage if available
    const memory = metrics.getMemoryUsage();

    // Get error monitoring health
    const monitoringHealth = getMonitoringHealth();

    // Get circuit breaker stats
    const circuitStats = circuitBreakers.getAllStats();

    // Get error statistics
    const errorStats = errorMonitor.getStats();

    return NextResponse.json(
      {
        status: monitoringHealth.status,
        database: 'connected',
        dbLatencyMs: dbLatency,
        cacheHitRates: cacheStats,
        memory: memory
          ? {
              heapUsedMB: Math.round(memory.heapUsed / 1024 / 1024),
              heapTotalMB: Math.round(memory.heapTotal / 1024 / 1024),
              usagePercent: Math.round(memory.usagePercent),
            }
          : null,
        monitoring: {
          errorRate: monitoringHealth.errorRate,
          recentErrors: monitoringHealth.recentErrors,
          openCircuits: monitoringHealth.openCircuits,
        },
        circuits: Object.fromEntries(
          Object.entries(circuitStats).map(([name, stats]) => [
            name,
            {
              state: stats.state,
              failures: stats.failures,
              successRate: stats.totalRequests > 0
                ? ((stats.successfulRequests / stats.totalRequests) * 100).toFixed(1) + '%'
                : 'N/A',
            },
          ])
        ),
        errors: {
          topErrors: errorStats.topErrors.slice(0, 5),
          ratePerMinute: errorStats.errorRate.perMinute,
        },
        timestamp,
      },
      {
        status: monitoringHealth.status === 'unhealthy' ? 503 : 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('Health check failed:', error);

    return NextResponse.json(
      {
        status: 'error',
        database: 'error',
        timestamp,
      },
      { status: 503 }
    );
  }
}
