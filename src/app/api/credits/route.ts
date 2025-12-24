import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-guard';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await requireAuth(request);

    // Fetch user's credit info
    const userWithCredits = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        creditBalance: true,
        graceCreditsUsed: true,
      },
    });

    if (!userWithCredits) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      balance: userWithCredits.creditBalance,
      graceCreditsUsed: userWithCredits.graceCreditsUsed,
    });
  } catch (error) {
    console.error('Error fetching credits:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch credits' },
      { status: 500 }
    );
  }
}
