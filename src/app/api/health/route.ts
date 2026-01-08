import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { metrics, appCache, queryCache } from '@/lib/performance';
import { getMonitoringHealth, circuitBreakers, errorMonitor } from '@/lib/errors';
import { performHealthCheck, quickHealthCheck } from '@/lib/monitoring';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * Build information for health checks
 * Used to verify client/server build synchronization
 */
interface BuildInfo {
  buildId: string | null;
  gitSha: string | null;
  timestamp: string | null;
  isValid: boolean;
}

/**
 * Get build information from the .next directory
 * This helps detect build mismatches that cause "Failed to find Server Action" errors
 */
function getBuildInfo(): BuildInfo {
  try {
    // Try to read BUILD_ID file
    const buildIdPath = join(process.cwd(), '.next', 'BUILD_ID');
    const buildId = existsSync(buildIdPath)
      ? readFileSync(buildIdPath, 'utf-8').trim()
      : null;

    // Try to read build metadata
    const metadataPath = join(process.cwd(), '.next', 'build-metadata.json');
    let gitSha: string | null = null;
    let timestamp: string | null = null;

    if (existsSync(metadataPath)) {
      const metadata = JSON.parse(readFileSync(metadataPath, 'utf-8'));
      gitSha = metadata.gitSha || null;
      timestamp = metadata.timestamp || null;
    }

    // Check if expected build ID matches (if set)
    const expectedBuildId = process.env.EXPECTED_BUILD_ID;
    const isValid = !expectedBuildId || expectedBuildId === buildId;

    return { buildId, gitSha, timestamp, isValid };
  } catch {
    return { buildId: null, gitSha: null, timestamp: null, isValid: false };
  }
}

/**
 * GET /api/health - Health check endpoint
 *
 * Query params:
 * - detailed=true: Include detailed service checks (requires more time)
 * - quick=true: Minimal check for load balancers
 * - build=true: Include build verification information
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const isQuick = searchParams.get('quick') === 'true';
  const isDetailed = searchParams.get('detailed') === 'true';
  const includeBuild = searchParams.get('build') === 'true';

  const timestamp = new Date().toISOString();

  try {
    // Quick check for load balancers
    if (isQuick) {
      const health = await quickHealthCheck();
      // Include basic build ID for quick checks to detect mismatches
      const buildInfo = getBuildInfo();
      return NextResponse.json(
        {
          ...health,
          buildId: buildInfo.buildId,
          buildValid: buildInfo.isValid,
        },
        {
          status: health.status === 'healthy' && buildInfo.isValid ? 200 : 503,
          headers: { 'Cache-Control': 'no-store, max-age=0' },
        }
      );
    }

    // Detailed check with external services
    if (isDetailed) {
      const health = await performHealthCheck(true);
      const buildInfo = getBuildInfo();
      return NextResponse.json(
        {
          ...health,
          build: {
            id: buildInfo.buildId,
            gitSha: buildInfo.gitSha,
            timestamp: buildInfo.timestamp,
            valid: buildInfo.isValid,
          },
        },
        {
          status: health.status === 'unhealthy' || !buildInfo.isValid ? 503 : 200,
          headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
        }
      );
    }

    // Standard check (original behavior)
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - startTime;

    // Get build information for synchronization verification
    const buildInfo = getBuildInfo();

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

    // Determine overall health status (include build validation)
    const overallStatus = monitoringHealth.status === 'unhealthy' || !buildInfo.isValid
      ? 'unhealthy'
      : monitoringHealth.status;

    return NextResponse.json(
      {
        status: overallStatus,
        database: 'connected',
        dbLatencyMs: dbLatency,
        build: includeBuild || !buildInfo.isValid
          ? {
              id: buildInfo.buildId,
              gitSha: buildInfo.gitSha,
              timestamp: buildInfo.timestamp,
              valid: buildInfo.isValid,
            }
          : { id: buildInfo.buildId, valid: buildInfo.isValid },
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
        status: overallStatus === 'unhealthy' ? 503 : 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('Health check failed:', error);

    // Include build info in error response for debugging
    const buildInfo = getBuildInfo();

    return NextResponse.json(
      {
        status: 'unhealthy',
        database: 'error',
        build: {
          id: buildInfo.buildId,
          valid: buildInfo.isValid,
        },
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp,
      },
      { status: 503 }
    );
  }
}
