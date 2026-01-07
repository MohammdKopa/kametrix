import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-guard';
import {
  metrics,
  appCache,
  queryCache,
  sessionCache,
} from '@/lib/performance';

// Force dynamic rendering since we use cookies() for authentication
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/performance - Get performance metrics (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const report = metrics.generateReport();
    const cacheStats = {
      app: appCache.getStats(),
      query: queryCache.getStats(),
      session: sessionCache.getStats(),
    };

    return NextResponse.json({
      metrics: report.metrics,
      gauges: report.gauges,
      memory: report.memory,
      percentiles: report.percentiles,
      caches: cacheStats,
      timestamp: report.timestamp,
    });
  } catch (error) {
    console.error('Error fetching performance metrics:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch performance metrics' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/performance - Clear caches or reset metrics (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'clear-app-cache':
        appCache.clear();
        return NextResponse.json({ message: 'App cache cleared' });

      case 'clear-query-cache':
        queryCache.clear();
        return NextResponse.json({ message: 'Query cache cleared' });

      case 'clear-session-cache':
        sessionCache.clear();
        return NextResponse.json({ message: 'Session cache cleared' });

      case 'clear-all-caches':
        appCache.clear();
        queryCache.clear();
        sessionCache.clear();
        return NextResponse.json({ message: 'All caches cleared' });

      case 'cleanup-expired':
        const cleanedApp = appCache.cleanup();
        const cleanedQuery = queryCache.cleanup();
        const cleanedSession = sessionCache.cleanup();
        return NextResponse.json({
          message: 'Expired entries cleaned up',
          cleaned: { app: cleanedApp, query: cleanedQuery, session: cleanedSession },
        });

      case 'reset-metrics':
        metrics.reset();
        return NextResponse.json({ message: 'Metrics reset' });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: clear-app-cache, clear-query-cache, clear-session-cache, clear-all-caches, cleanup-expired, reset-metrics' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error performing performance action:', error);

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
