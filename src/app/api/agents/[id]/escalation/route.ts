import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';
import {
  getEscalationConfig,
  createEscalationConfig,
  updateEscalationConfig,
  getDefaultEscalationConfig,
} from '@/lib/escalation/config-manager';
import type { EscalationConfigInput } from '@/types/escalation';

/**
 * GET /api/agents/[id]/escalation
 * Get escalation configuration for an agent
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { id: agentId } = await params;

    // Verify agent belongs to user
    const agent = await prisma.agent.findFirst({
      where: {
        id: agentId,
        userId: user.id,
      },
    });

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    const config = await getEscalationConfig(agentId);

    if (!config) {
      // Return default config if none exists
      return NextResponse.json({
        configured: false,
        defaults: getDefaultEscalationConfig(),
      });
    }

    return NextResponse.json({
      configured: true,
      config,
    });
  } catch (error) {
    console.error('Error getting escalation config:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Failed to get escalation configuration' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/agents/[id]/escalation
 * Create or update escalation configuration for an agent
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { id: agentId } = await params;
    const body = await req.json();

    // Verify agent belongs to user
    const agent = await prisma.agent.findFirst({
      where: {
        id: agentId,
        userId: user.id,
      },
    });

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Validate input
    const input: EscalationConfigInput = {
      enabled: body.enabled,
      forwardingNumber: body.forwardingNumber,
      forwardingQueue: body.forwardingQueue,
      forwardingDepartment: body.forwardingDepartment,
      fallbackNumber: body.fallbackNumber,
      voicemailEnabled: body.voicemailEnabled,
      voicemailGreeting: body.voicemailGreeting,
      businessHoursStart: body.businessHoursStart,
      businessHoursEnd: body.businessHoursEnd,
      businessDays: body.businessDays,
      afterHoursNumber: body.afterHoursNumber,
      afterHoursMessage: body.afterHoursMessage,
      timezone: body.timezone,
      maxCallDuration: body.maxCallDuration,
      maxClarifications: body.maxClarifications,
      sentimentThreshold: body.sentimentThreshold,
      triggerPhrases: body.triggerPhrases,
      maxTransferWaitTime: body.maxTransferWaitTime,
      announceTransfer: body.announceTransfer,
      transferMessage: body.transferMessage,
      holdMusicUrl: body.holdMusicUrl,
      shareTranscript: body.shareTranscript,
      shareSummary: body.shareSummary,
      shareCallerInfo: body.shareCallerInfo,
    };

    // Check if config exists
    const existing = await getEscalationConfig(agentId);

    let config;
    if (existing) {
      config = await updateEscalationConfig(agentId, input);
    } else {
      config = await createEscalationConfig(agentId, input);
    }

    return NextResponse.json({
      success: true,
      config,
    });
  } catch (error) {
    console.error('Error saving escalation config:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Failed to save escalation configuration' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/agents/[id]/escalation
 * Partially update escalation configuration
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { id: agentId } = await params;
    const body = await req.json();

    // Verify agent belongs to user
    const agent = await prisma.agent.findFirst({
      where: {
        id: agentId,
        userId: user.id,
      },
    });

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    const config = await updateEscalationConfig(agentId, body);

    return NextResponse.json({
      success: true,
      config,
    });
  } catch (error) {
    console.error('Error updating escalation config:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Failed to update escalation configuration' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/agents/[id]/escalation
 * Disable/delete escalation configuration
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { id: agentId } = await params;

    // Verify agent belongs to user
    const agent = await prisma.agent.findFirst({
      where: {
        id: agentId,
        userId: user.id,
      },
    });

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Disable rather than delete to preserve history
    await updateEscalationConfig(agentId, { enabled: false });

    return NextResponse.json({
      success: true,
      message: 'Escalation configuration disabled',
    });
  } catch (error) {
    console.error('Error disabling escalation config:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Failed to disable escalation configuration' },
      { status: 500 }
    );
  }
}
