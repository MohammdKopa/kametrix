import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-guard';
import {
  getCallsWithCursor,
  cachedQuery,
  cacheKeys,
  metrics,
  MetricNames,
} from '@/lib/performance';

export async function GET(request: NextRequest) {
  const timer = metrics.startTimer(MetricNames.API_CALLS);

  try {
    // Authenticate user
    const user = await requireAuth(request);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const agentId = searchParams.get('agentId');
    const cursor = searchParams.get('cursor');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    // Use cursor-based pagination if cursor is provided
    if (cursor) {
      const result = await getCallsWithCursor(user.id, {
        cursor,
        limit,
        status: status || undefined,
        agentId: agentId || undefined,
      });

      metrics.endTimer(timer);
      return NextResponse.json({
        calls: result.items,
        nextCursor: result.nextCursor,
        prevCursor: result.prevCursor,
        hasMore: result.hasMore,
      });
    }

    // Build where clause for offset pagination (legacy support)
    const where: Record<string, unknown> = {
      userId: user.id,
    };

    if (status) {
      where.status = status;
    }

    if (agentId) {
      where.agentId = agentId;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Generate cache key for this query
    const queryParams = `${status || ''}-${agentId || ''}-${page}-${limit}`;
    const cacheKey = cacheKeys.calls(user.id, queryParams);

    // Use cached query with 30 second TTL
    const result = await cachedQuery(
      cacheKey,
      async () => {
        const [calls, total] = await Promise.all([
          prisma.call.findMany({
            where,
            include: {
              agent: true,
            },
            orderBy: {
              startedAt: 'desc',
            },
            skip,
            take: limit,
          }),
          prisma.call.count({ where }),
        ]);
        return { calls, total };
      },
      30000 // 30 second cache
    );

    // Calculate hasMore
    const hasMore = skip + result.calls.length < result.total;

    metrics.endTimer(timer);
    return NextResponse.json({
      calls: result.calls,
      total: result.total,
      hasMore,
      page,
      limit,
    });
  } catch (error) {
    metrics.endTimer(timer, true);
    console.error('Error fetching calls:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch calls' },
      { status: 500 }
    );
  }
}
