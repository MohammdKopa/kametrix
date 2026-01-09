import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';
import { getVapiClient } from '@/lib/vapi';
import { buildCalendarTools } from '@/lib/prompts';
import { buildEscalationTools } from '@/lib/escalation';

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

    // Get agent with user info to check Google Calendar status
    const agent = await prisma.agent.findFirst({
      where: {
        id,
        userId: user.id,
      },
      include: {
        user: {
          select: {
            googleRefreshToken: true,
          },
        },
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

    // Build tools - ESCALATION TOOLS FIRST for priority, then calendar tools
    const serverUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const hasCalendarTools = !!agent.user?.googleRefreshToken;

    const escalationTools = buildEscalationTools(serverUrl);
    const calendarTools = hasCalendarTools ? buildCalendarTools(serverUrl) : [];

    // Combine tools with escalation FIRST (so AI prioritizes them when user asks for human)
    const allTools = [...escalationTools, ...calendarTools];
    const tools = allTools.length > 0 ? allTools : undefined;

    // Update Vapi assistant with prompt AND tools
    const client = getVapiClient();
    await client.assistants.update({
      id: agent.vapiAssistantId,
      model: {
        provider: 'openai',
        model: 'gpt-4o',
        messages: [{ role: 'system', content: updatedPrompt }],
        ...(tools && { tools }),
      } as any, // Type assertion needed due to Vapi SDK type limitations
    });

    console.log(`Refreshed assistant ${agent.vapiAssistantId} with date ${currentDateStr} and tools: ${allTools.map(t => t.function.name).join(', ') || 'none'}`);

    return NextResponse.json({
      success: true,
      message: 'Agent assistant refreshed with current date and tools',
      date: currentDateStr,
      tools: allTools.map(t => t.function.name),
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
