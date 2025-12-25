import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';
import { refreshAssistantDate } from '@/lib/vapi/assistants';

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

    // Get agent with user info
    const agent = await prisma.agent.findFirst({
      where: {
        id,
        userId: user.id,
      },
      include: {
        user: true,
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

    // Check if user has Google Calendar connected
    const hasGoogleCalendar = !!agent.user?.googleAccessToken;

    // Refresh the assistant with current date
    await refreshAssistantDate(agent.vapiAssistantId, {
      name: agent.name,
      businessName: agent.businessName,
      businessHours: agent.businessHours || '',
      services: (agent.services as string[]) || [],
      faqs: (agent.faqs as Array<{ question: string; answer: string }>) || [],
      greeting: agent.greeting || undefined,
      voiceId: agent.voiceId || undefined,
      hasGoogleCalendar,
    });

    return NextResponse.json({
      success: true,
      message: 'Agent assistant refreshed with current date',
      date: new Date().toISOString().split('T')[0],
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
