import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';
import { getVapiClient } from '@/lib/vapi';

// Force dynamic rendering since we use cookies() for authentication
export const dynamic = 'force-dynamic';

/**
 * POST /api/agents/[id]/refresh - Refresh agent's Vapi assistant with current date
 *
 * This updates the system prompt to include today's date, ensuring
 * correct year/month when booking appointments.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;

    // Get agent
    const agent = await prisma.agent.findFirst({
      where: {
        id,
        userId: user.id,
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
        { error: 'Agent has no Vapi assistant to refresh' },
        { status: 400 }
      );
    }

    // Build date header
    const today = new Date();
    const currentDateStr = today.toISOString().split('T')[0];
    const dateHeader = `[CURRENT DATE: ${currentDateStr}. Always use year ${today.getFullYear()} for appointments.]\n\n`;

    // Remove any existing date header from system prompt
    let systemPrompt = agent.systemPrompt;
    systemPrompt = systemPrompt.replace(/^\[CURRENT DATE:[^\]]*\]\n\n/, '');

    // Prepend new date header
    const updatedPrompt = dateHeader + systemPrompt;

    // Update Vapi assistant
    const client = getVapiClient();
    await client.assistants.update({
      id: agent.vapiAssistantId,
      model: {
        provider: 'openai',
        model: 'gpt-4o',
        messages: [{ role: 'system', content: updatedPrompt }],
      },
    });

    console.log(`Refreshed assistant ${agent.vapiAssistantId} with date ${currentDateStr}`);

    return NextResponse.json({
      success: true,
      message: 'Agent assistant refreshed with current date',
      date: currentDateStr,
    });
  } catch (error) {
    console.error('Error refreshing agent:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to refresh agent' },
      { status: 500 }
    );
  }
}
