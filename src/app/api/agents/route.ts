import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/agents - List all agents for authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const agents = await prisma.agent.findMany({
      where: {
        userId: user.id,
      },
      include: {
        phoneNumber: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ agents });
  } catch (error) {
    console.error('Error fetching agents:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch agents' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/agents - Create a new agent
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();

    // Validate required fields
    const { name, greeting, systemPrompt, voiceId, businessName, businessDescription } = body;

    if (!name || !greeting || !systemPrompt || !voiceId || !businessName) {
      return NextResponse.json(
        { error: 'Missing required fields: name, greeting, systemPrompt, voiceId, businessName' },
        { status: 400 }
      );
    }

    // Validate field lengths
    if (name.length > 100) {
      return NextResponse.json(
        { error: 'Name must be 100 characters or less' },
        { status: 400 }
      );
    }

    if (greeting.length > 500) {
      return NextResponse.json(
        { error: 'Greeting must be 500 characters or less' },
        { status: 400 }
      );
    }

    // Create agent
    const agent = await prisma.agent.create({
      data: {
        userId: user.id,
        name,
        greeting,
        systemPrompt,
        voiceId,
        businessName,
        businessDescription: businessDescription || null,
        isActive: true,
      },
    });

    return NextResponse.json({ agent }, { status: 201 });
  } catch (error) {
    console.error('Error creating agent:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to create agent' },
      { status: 500 }
    );
  }
}
