import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering since we use cookies() for authentication
export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/credits/adjust - Adjust user credits (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);

    const body = await request.json();
    const { userId, amount, description } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (typeof amount !== 'number' || amount === 0) {
      return NextResponse.json(
        { error: 'Amount must be a non-zero number' },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Calculate new balance
    const newBalance = user.creditBalance + amount;

    // Don't allow negative balance from adjustment
    if (newBalance < 0) {
      return NextResponse.json(
        { error: 'Adjustment would result in negative balance' },
        { status: 400 }
      );
    }

    // Update user and create transaction in a transaction
    const [updatedUser, transaction] = await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          creditBalance: newBalance,
        },
      }),
      prisma.creditTransaction.create({
        data: {
          userId,
          type: 'ADMIN_ADJUSTMENT',
          amount,
          balanceAfter: newBalance,
          description: description || `Admin adjustment: ${amount > 0 ? '+' : ''}${amount} cents`,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      newBalance: updatedUser.creditBalance,
      transaction: {
        id: transaction.id,
        type: transaction.type,
        amount: transaction.amount,
        balanceAfter: transaction.balanceAfter,
        description: transaction.description,
        createdAt: transaction.createdAt,
      },
    });
  } catch (error) {
    console.error('Error adjusting credits:', error);

    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (error.message === 'Admin access required') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: 'Failed to adjust credits' },
      { status: 500 }
    );
  }
}
