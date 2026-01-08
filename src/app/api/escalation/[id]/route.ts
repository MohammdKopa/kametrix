import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';
import { updateEscalationResolution, getCallEscalationSummary } from '@/lib/escalation/escalation-logger';
import { EscalationService } from '@/lib/escalation/escalation-service';
import type { EscalationStatus } from '@/generated/prisma/client';

/**
 * GET /api/escalation/[id]
 * Get details of a specific escalation
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;

    const escalation = await prisma.escalationLog.findUnique({
      where: { id },
      include: {
        call: {
          select: {
            id: true,
            phoneNumber: true,
            status: true,
            startedAt: true,
            endedAt: true,
            durationSeconds: true,
            transcript: true,
            summary: true,
          },
        },
      },
    });

    if (!escalation) {
      return NextResponse.json(
        { error: 'Escalation not found' },
        { status: 404 }
      );
    }

    // Verify user owns this escalation
    if (escalation.userId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.json({ escalation });
  } catch (error) {
    console.error('Error getting escalation:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Failed to get escalation details' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/escalation/[id]
 * Update escalation (status, resolution, etc.)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;
    const body = await req.json();

    // Verify escalation exists and belongs to user
    const escalation = await prisma.escalationLog.findUnique({
      where: { id },
    });

    if (!escalation) {
      return NextResponse.json(
        { error: 'Escalation not found' },
        { status: 404 }
      );
    }

    if (escalation.userId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Handle status update
    if (body.status) {
      const escalationService = new EscalationService();
      await escalationService.updateEscalationStatus(id, body.status as EscalationStatus, {
        humanConnectedAt: body.humanConnectedAt ? new Date(body.humanConnectedAt) : undefined,
        humanAgentId: body.humanAgentId,
        failureReason: body.failureReason,
        waitTimeSeconds: body.waitTimeSeconds,
      });
    }

    // Handle resolution update
    if (body.wasResolved !== undefined || body.customerSatisfied !== undefined || body.resolutionNotes) {
      await updateEscalationResolution(id, {
        wasResolved: body.wasResolved,
        customerSatisfied: body.customerSatisfied,
        resolutionNotes: body.resolutionNotes,
        humanAgentId: body.humanAgentId,
      });
    }

    // Get updated record
    const updated = await prisma.escalationLog.findUnique({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      escalation: updated,
    });
  } catch (error) {
    console.error('Error updating escalation:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Failed to update escalation' },
      { status: 500 }
    );
  }
}
