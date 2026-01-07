import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-guard';
import {
  withErrorHandling,
  apiResponse,
  createRequestContext,
  getRequestDuration,
  userNotFoundError,
} from '@/lib/errors';

// Force dynamic rendering since we use cookies() for authentication
export const dynamic = 'force-dynamic';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const context = createRequestContext(request);

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
    throw userNotFoundError(user.id);
  }

  context.logger.info('Credits fetched', {
    userId: user.id,
    balance: userWithCredits.creditBalance,
    duration: getRequestDuration(context),
  });

  return apiResponse({
    balance: userWithCredits.creditBalance,
    graceCreditsUsed: userWithCredits.graceCreditsUsed,
  }, 200, context.requestId);
});
