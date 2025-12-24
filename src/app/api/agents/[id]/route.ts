import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/agents/[id] - Get a single agent
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;

    const agent = await prisma.agent.findFirst({
      where: {
        id,
        userId: user.id,
      },
      include: {
        phoneNumber: true,
      },
    });

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ agent });
  } catch (error) {
    console.error('Error fetching agent:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch agent' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/agents/[id] - Update an agent
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    const body = await request.json();

    // Check if agent exists and user owns it
    const existingAgent = await prisma.agent.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existingAgent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Build update data object with only provided fields
    const updateData: any = {};

    if (body.name !== undefined) {
      if (body.name.length > 100) {
        return NextResponse.json(
          { error: 'Name must be 100 characters or less' },
          { status: 400 }
        );
      }
      updateData.name = body.name;
    }

    if (body.greeting !== undefined) {
      if (body.greeting.length > 500) {
        return NextResponse.json(
          { error: 'Greeting must be 500 characters or less' },
          { status: 400 }
        );
      }
      updateData.greeting = body.greeting;
    }

    if (body.systemPrompt !== undefined) {
      updateData.systemPrompt = body.systemPrompt;
    }

    if (body.voiceId !== undefined) {
      updateData.voiceId = body.voiceId;
    }

    if (body.businessName !== undefined) {
      updateData.businessName = body.businessName;
    }

    if (body.businessDescription !== undefined) {
      updateData.businessDescription = body.businessDescription;
    }

    if (body.isActive !== undefined) {
      updateData.isActive = body.isActive;
    }

    // Update agent
    const agent = await prisma.agent.update({
      where: { id },
      data: updateData,
      include: {
        phoneNumber: true,
      },
    });

    return NextResponse.json({ agent });
  } catch (error) {
    console.error('Error updating agent:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to update agent' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/agents/[id] - Delete an agent
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;

    // Check if agent exists and user owns it
    const existingAgent = await prisma.agent.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existingAgent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Delete agent (cascade will handle related records)
    await prisma.agent.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting agent:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to delete agent' },
      { status: 500 }
    );
  }
}
