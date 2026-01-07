import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering since we use cookies() for authentication
export const dynamic = 'force-dynamic';

/**
 * GET /api/agents/[id]/test-token - Get Vapi public key and agent details for testing
 *
 * This endpoint returns the public key and assistant ID needed to start
 * a test call with the Vapi Web SDK.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;

    // Check if agent exists and user owns it
    const agent = await prisma.agent.findFirst({
      where: {
        id,
        userId: user.id,
      },
      select: {
        id: true,
        name: true,
        vapiAssistantId: true,
        isActive: true,
      },
    });

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    if (!agent.vapiAssistantId) {
      return NextResponse.json(
        { error: 'Agent has no Vapi assistant configured' },
        { status: 400 }
      );
    }

    // Get Vapi public key from environment
    const publicKey = process.env.VAPI_PUBLIC_KEY;

    if (!publicKey) {
      console.error('VAPI_PUBLIC_KEY not configured');
      return NextResponse.json(
        { error: 'Voice testing is not configured. Please contact support.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      publicKey,
      assistantId: agent.vapiAssistantId,
      agentName: agent.name,
      isActive: agent.isActive,
    });
  } catch (error) {
    console.error('Error getting test token:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to get test token' },
      { status: 500 }
    );
  }
}
