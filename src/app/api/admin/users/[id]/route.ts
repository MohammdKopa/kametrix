import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering since we use cookies() for authentication
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/users/[id] - Get specific user details (admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        creditBalance: true,
        graceCreditsUsed: true,
        createdAt: true,
        updatedAt: true,
        agents: {
          include: {
            phoneNumber: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        calls: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            phoneNumber: true,
            status: true,
            startedAt: true,
            endedAt: true,
            durationSeconds: true,
            creditsUsed: true,
            summary: true,
            agent: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        creditTransactions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            type: true,
            amount: true,
            balanceAfter: true,
            description: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            agents: true,
            calls: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);

    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (error.message === 'Admin access required') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}
