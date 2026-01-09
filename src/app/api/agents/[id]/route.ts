import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';
import { unassignPhoneNumberGracefully } from '@/lib/vapi/phone-numbers';
import { deleteAssistantGracefully } from '@/lib/vapi';

// Force dynamic rendering since we use cookies() for authentication
export const dynamic = 'force-dynamic';

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
 *
 * This endpoint gracefully handles cases where external resources (Vapi assistant, phone numbers)
 * may already be deleted or don't exist. It treats "not found" errors as success cases.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;

    // Track deletion status for detailed response
    const deletionStatus = {
      agentDeleted: false,
      phoneUnassigned: false,
      phoneUnassignedAlreadyDone: false,
      vapiAssistantDeleted: false,
      vapiAssistantAlreadyDeleted: false,
      warnings: [] as string[],
    };

    // Check if agent exists and user owns it
    const existingAgent = await prisma.agent.findFirst({
      where: {
        id,
        userId: user.id,
      },
      include: {
        phoneNumber: true,
      },
    });

    if (!existingAgent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    // If agent has a phone number, unassign it from Vapi gracefully
    if (existingAgent.phoneNumber && existingAgent.phoneNumber.vapiPhoneId) {
      const phoneResult = await unassignPhoneNumberGracefully(existingAgent.phoneNumber.vapiPhoneId);

      if (phoneResult.success) {
        deletionStatus.phoneUnassigned = true;
        deletionStatus.phoneUnassignedAlreadyDone = phoneResult.notFound;

        // Update phone number in DB to make it available again
        try {
          await prisma.phoneNumber.update({
            where: { id: existingAgent.phoneNumber.id },
            data: {
              agentId: null,
              status: 'AVAILABLE',
            },
          });
        } catch (dbError) {
          console.error('Failed to update phone number in database:', dbError);
          deletionStatus.warnings.push('Phone number database update failed');
        }
      } else {
        // Non-critical error - log warning but continue
        deletionStatus.warnings.push(`Phone unassignment warning: ${phoneResult.error}`);
        console.warn('Phone unassignment had issues:', phoneResult.error);
      }
    }

    // Delete Vapi assistant if it exists, using graceful deletion
    if (existingAgent.vapiAssistantId) {
      const vapiResult = await deleteAssistantGracefully(existingAgent.vapiAssistantId);

      if (vapiResult.success) {
        deletionStatus.vapiAssistantDeleted = true;
        deletionStatus.vapiAssistantAlreadyDeleted = vapiResult.alreadyDeleted;
      } else {
        // Non-critical error - log warning but continue with database deletion
        deletionStatus.warnings.push(`Vapi assistant cleanup warning: ${vapiResult.error}`);
        console.warn('Vapi assistant deletion had issues:', vapiResult.error);
      }
    }

    // Delete agent from database (cascade will handle related records)
    await prisma.agent.delete({
      where: { id },
    });
    deletionStatus.agentDeleted = true;

    // Return success with detailed status
    return NextResponse.json({
      success: true,
      message: 'Agent deleted successfully',
      details: {
        agentId: id,
        agentName: existingAgent.name,
        phoneUnassigned: deletionStatus.phoneUnassigned,
        vapiAssistantDeleted: deletionStatus.vapiAssistantDeleted,
        // Include info about resources that were already cleaned up
        alreadyCleanedUp: {
          phoneNumber: deletionStatus.phoneUnassignedAlreadyDone,
          vapiAssistant: deletionStatus.vapiAssistantAlreadyDeleted,
        },
        warnings: deletionStatus.warnings.length > 0 ? deletionStatus.warnings : undefined,
      },
    });
  } catch (error) {
    console.error('Error deleting agent:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to delete agent', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
