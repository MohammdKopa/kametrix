import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-guard';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await requireAuth(request);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch transactions
    const [transactions, total] = await Promise.all([
      prisma.creditTransaction.findMany({
        where: {
          userId: user.id,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.creditTransaction.count({
        where: { userId: user.id },
      }),
    ]);

    // Calculate hasMore
    const hasMore = skip + transactions.length < total;

    return NextResponse.json({
      transactions,
      total,
      hasMore,
      page,
      limit,
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}
