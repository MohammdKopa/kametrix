import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';
import { createAuditLog, getRequestMetadata } from '@/lib/audit-logger';
import { unassignPhoneNumberGracefully } from '@/lib/vapi/phone-numbers';
import { deleteAssistantGracefully } from '@/lib/vapi';

// Force dynamic rendering since we use cookies() for authentication
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/agents/[id] - Get agent details (admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    const { id } = await params;

    const agent = await prisma.agent.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        phoneNumber: {
          select: {
            id: true,
            number: true,
            status: true,
          },
        },
        escalationConfig: true,
        _count: {
          select: {
            calls: true,
          },
        },
      },
    });

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    return NextResponse.json({ agent });
  } catch (error) {
    console.error('Error fetching agent:', error);

    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (error.message === 'Admin access required') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch agent' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/agents/[id] - Update agent (admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await params;
    const body = await request.json();

    // Get current agent state
    const currentAgent = await prisma.agent.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        isActive: true,
        businessName: true,
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!currentAgent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.businessName !== undefined) updateData.businessName = body.businessName;
    if (body.greeting !== undefined) updateData.greeting = body.greeting;
    if (body.systemPrompt !== undefined) updateData.systemPrompt = body.systemPrompt;
    if (body.voiceId !== undefined) updateData.voiceId = body.voiceId;

    // Update agent
    const updatedAgent = await prisma.agent.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        phoneNumber: {
          select: {
            id: true,
            number: true,
            status: true,
          },
        },
      },
    });

    // Determine action type
    const isStatusToggle = body.isActive !== undefined && body.isActive !== currentAgent.isActive;

    // Create audit log
    await createAuditLog({
      adminId: admin.id,
      targetUserId: currentAgent.user.id,
      action: isStatusToggle ? 'AGENT_TOGGLE_STATUS' : 'AGENT_UPDATE',
      description: isStatusToggle
        ? `${body.isActive ? 'Enabled' : 'Disabled'} agent "${currentAgent.name}" (owned by ${currentAgent.user.email})`
        : `Updated agent "${currentAgent.name}" (owned by ${currentAgent.user.email})`,
      previousValue: {
        name: currentAgent.name,
        isActive: currentAgent.isActive,
        businessName: currentAgent.businessName,
      },
      newValue: {
        name: updatedAgent.name,
        isActive: updatedAgent.isActive,
        businessName: updatedAgent.businessName,
      },
      metadata: { agentId: id },
    });

    return NextResponse.json({ agent: updatedAgent });
  } catch (error) {
    console.error('Error updating agent:', error);

    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (error.message === 'Admin access required') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: 'Failed to update agent' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/agents/[id] - Delete agent (admin only)
 *
 * This endpoint gracefully handles cases where external resources (Vapi assistant, phone numbers)
 * may already be deleted or don't exist. It treats "not found" errors as success cases.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request);
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

    // Get current agent state
    const currentAgent = await prisma.agent.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        phoneNumber: true,
      },
    });

    if (!currentAgent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // If agent has a phone number, unassign it from Vapi gracefully
    if (currentAgent.phoneNumber && currentAgent.phoneNumber.vapiPhoneId) {
      const phoneResult = await unassignPhoneNumberGracefully(currentAgent.phoneNumber.vapiPhoneId);

      if (phoneResult.success) {
        deletionStatus.phoneUnassigned = true;
        deletionStatus.phoneUnassignedAlreadyDone = phoneResult.notFound;

        // Update phone number in DB to make it available again
        try {
          await prisma.phoneNumber.update({
            where: { id: currentAgent.phoneNumber.id },
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
    if (currentAgent.vapiAssistantId) {
      const vapiResult = await deleteAssistantGracefully(currentAgent.vapiAssistantId);

      if (vapiResult.success) {
        deletionStatus.vapiAssistantDeleted = true;
        deletionStatus.vapiAssistantAlreadyDeleted = vapiResult.alreadyDeleted;
      } else {
        // Non-critical error - log warning but continue with database deletion
        deletionStatus.warnings.push(`Vapi assistant cleanup warning: ${vapiResult.error}`);
        console.warn('Vapi assistant deletion had issues:', vapiResult.error);
      }
    }

    // Delete agent from database
    await prisma.agent.delete({
      where: { id },
    });
    deletionStatus.agentDeleted = true;

    // Create audit log
    await createAuditLog({
      adminId: admin.id,
      targetUserId: currentAgent.user.id,
      action: 'AGENT_DELETE',
      description: `Deleted agent "${currentAgent.name}" (owned by ${currentAgent.user.email})`,
      previousValue: {
        id: currentAgent.id,
        name: currentAgent.name,
        businessName: currentAgent.businessName,
        isActive: currentAgent.isActive,
      },
      newValue: null,
      metadata: {
        deletedAgentId: id,
        ownerEmail: currentAgent.user.email,
        deletionDetails: {
          phoneUnassigned: deletionStatus.phoneUnassigned,
          vapiAssistantDeleted: deletionStatus.vapiAssistantDeleted,
          alreadyCleanedUp: {
            phoneNumber: deletionStatus.phoneUnassignedAlreadyDone,
            vapiAssistant: deletionStatus.vapiAssistantAlreadyDeleted,
          },
          warnings: deletionStatus.warnings.length > 0 ? deletionStatus.warnings : undefined,
        },
      },
    });

    // Return success with detailed status
    return NextResponse.json({
      success: true,
      message: 'Agent deleted successfully',
      details: {
        agentId: id,
        agentName: currentAgent.name,
        phoneUnassigned: deletionStatus.phoneUnassigned,
        vapiAssistantDeleted: deletionStatus.vapiAssistantDeleted,
        alreadyCleanedUp: {
          phoneNumber: deletionStatus.phoneUnassignedAlreadyDone,
          vapiAssistant: deletionStatus.vapiAssistantAlreadyDeleted,
        },
        warnings: deletionStatus.warnings.length > 0 ? deletionStatus.warnings : undefined,
      },
    });
  } catch (error) {
    console.error('Error deleting agent:', error);

    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (error.message === 'Admin access required') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: 'Failed to delete agent', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
