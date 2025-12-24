import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-guard';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await requireAuth(request);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const agentId = searchParams.get('agentId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build where clause
    const where: any = {
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

    // Fetch calls with agent relation
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

    // Calculate hasMore
    const hasMore = skip + calls.length < total;

    return NextResponse.json({
      calls,
      total,
      hasMore,
      page,
      limit,
    });
  } catch (error) {
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
