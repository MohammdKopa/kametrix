/**
 * Credit deduction functions - server-side only
 * Uses prisma for database operations
 *
 * For client-safe utility functions, use @/lib/credits-utils
 */

import { prisma } from '@/lib/prisma';
import { TransactionType } from '@/generated/prisma/client';
import { calculateCallCost, CENTS_PER_MINUTE } from '@/lib/credits-utils';

// Re-export utility functions for server-side convenience
export {
  CENTS_PER_MINUTE,
  LOW_BALANCE_THRESHOLD_CENTS,
  LOW_BALANCE_THRESHOLD_MINUTES,
  calculateCallCost,
  formatBalance,
  formatCallCost,
  isLowBalance,
  hasGraceUsage,
  getLowBalanceMessage,
  getGraceUsageMessage,
} from '@/lib/credits-utils';

/**
 * Deduct credits for a completed call
 * Uses atomic transaction to ensure consistency
 *
 * Grace period: if balance goes negative, track overage in graceCreditsUsed
 * instead of blocking the call
 *
 * @param userId - User ID to deduct credits from
 * @param callId - Call ID for transaction record
 * @param durationSeconds - Call duration in seconds
 */
export async function deductCreditsForCall(
  userId: string,
  callId: string,
  durationSeconds: number
): Promise<void> {
  const creditsUsed = calculateCallCost(durationSeconds);

  if (creditsUsed <= 0) return;

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { creditBalance: true, graceCreditsUsed: true },
    });

    if (!user) throw new Error('User not found');

    let newBalance = user.creditBalance - creditsUsed;
    let newGraceUsed = user.graceCreditsUsed;
    let transactionType: TransactionType = TransactionType.CALL_USAGE;

    // Grace period: if balance goes negative, track as grace usage
    if (newBalance < 0) {
      // Calculate how much went into grace
      const graceAmount = Math.abs(newBalance);
      newGraceUsed += graceAmount;
      newBalance = 0;
      transactionType = TransactionType.GRACE_USAGE;
    }

    // Update user balance
    await tx.user.update({
      where: { id: userId },
      data: {
        creditBalance: newBalance,
        graceCreditsUsed: newGraceUsed,
      },
    });

    // Record transaction
    await tx.creditTransaction.create({
      data: {
        userId,
        type: transactionType,
        amount: -creditsUsed,
        balanceAfter: newBalance,
        callId,
        description: `Call: ${Math.ceil(durationSeconds / 60)} min`,
      },
    });

    // Update call record with cost
    await tx.call.update({
      where: { id: callId },
      data: { creditsUsed },
    });
  });
}
