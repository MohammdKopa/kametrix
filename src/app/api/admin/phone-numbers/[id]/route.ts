import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';

/**
 * PATCH /api/admin/phone-numbers/[id] - Update phone number (admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);

    const { id } = await params;
    const body = await request.json();
    const { agentId, status } = body;

    const phoneNumber = await prisma.phoneNumber.findUnique({
      where: { id },
    });

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number not found' },
        { status: 404 }
      );
    }

    const updateData: {
      agentId?: string | null;
      status?: 'AVAILABLE' | 'ASSIGNED' | 'RELEASED';
    } = {};

    // Handle agent assignment
    if (agentId !== undefined) {
      if (agentId === null) {
        // Release phone number from agent
        updateData.agentId = null;
        updateData.status = 'AVAILABLE';
      } else {
        // Assign to agent - verify agent exists and doesn't have a phone
        const agent = await prisma.agent.findUnique({
          where: { id: agentId },
          include: { phoneNumber: true },
        });

        if (!agent) {
          return NextResponse.json(
            { error: 'Agent not found' },
            { status: 404 }
          );
        }

        if (agent.phoneNumber && agent.phoneNumber.id !== id) {
          return NextResponse.json(
            { error: 'Agent already has a phone number assigned' },
            { status: 409 }
          );
        }

        updateData.agentId = agentId;
        updateData.status = 'ASSIGNED';
      }
    }

    // Handle status update (if not already set by agent assignment)
    if (status && !updateData.status) {
      if (!['AVAILABLE', 'ASSIGNED', 'RELEASED'].includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status' },
          { status: 400 }
        );
      }
      updateData.status = status;
    }

    const updated = await prisma.phoneNumber.update({
      where: { id },
      data: updateData,
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ phoneNumber: updated });
  } catch (error) {
    console.error('Error updating phone number:', error);

    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (error.message === 'Admin access required') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: 'Failed to update phone number' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/phone-numbers/[id] - Delete phone number (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);

    const { id } = await params;

    const phoneNumber = await prisma.phoneNumber.findUnique({
      where: { id },
    });

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number not found' },
        { status: 404 }
      );
    }

    // Only allow deleting if not assigned
    if (phoneNumber.status === 'ASSIGNED') {
      return NextResponse.json(
        { error: 'Cannot delete assigned phone number. Release it first.' },
        { status: 409 }
      );
    }

    await prisma.phoneNumber.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting phone number:', error);

    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (error.message === 'Admin access required') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: 'Failed to delete phone number' },
      { status: 500 }
    );
  }
}
