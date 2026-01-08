import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';
import { getEscalationHistory, getEscalationAnalytics } from '@/lib/escalation/escalation-logger';
import type { EscalationReason, EscalationStatus } from '@/generated/prisma/client';

/**
 * GET /api/escalation
 * Get escalation history and analytics for the current user
 *
 * Query parameters:
 * - agentId: Filter by specific agent
 * - status: Filter by escalation status
 * - reason: Filter by escalation reason
 * - startDate: Start of date range (ISO string)
 * - endDate: End of date range (ISO string)
 * - limit: Number of records to return (default 20)
 * - cursor: Pagination cursor
 * - analytics: If "true", return analytics instead of history
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const { searchParams } = new URL(req.url);

    const agentId = searchParams.get('agentId') || undefined;
    const status = searchParams.get('status') as EscalationStatus | undefined;
    const reason = searchParams.get('reason') as EscalationReason | undefined;
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const cursor = searchParams.get('cursor') || undefined;
    const isAnalytics = searchParams.get('analytics') === 'true';

    const startDate = startDateStr ? new Date(startDateStr) : undefined;
    const endDate = endDateStr ? new Date(endDateStr) : undefined;

    if (isAnalytics) {
      // Return analytics data
      if (!startDate || !endDate) {
        return NextResponse.json(
          { error: 'startDate and endDate are required for analytics' },
          { status: 400 }
        );
      }

      const analytics = await getEscalationAnalytics({
        userId: user.id,
        agentId,
        startDate,
        endDate,
      });

      return NextResponse.json({ analytics });
    }

    // Return escalation history
    const result = await getEscalationHistory({
      userId: user.id,
      agentId,
      status,
      reason,
      startDate,
      endDate,
      limit,
      cursor,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error getting escalation data:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Failed to get escalation data' },
      { status: 500 }
    );
  }
}
