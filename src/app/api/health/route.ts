import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { metrics, appCache, queryCache } from '@/lib/performance';

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

    return NextResponse.json(
      {
        status: 'ok',
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
        timestamp,
      },
      {
        status: 200,
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
