import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';
import { Prisma } from '@/generated/prisma/client';
import type { Role, UserStatus, AdminAction } from '@/generated/prisma/client';

// Force dynamic rendering since we use cookies() for authentication
export const dynamic = 'force-dynamic';

// Helper to get request metadata for audit logging
async function getRequestMetadata() {
  const headersList = await headers();
  const forwardedFor = headersList.get('x-forwarded-for');
  const realIp = headersList.get('x-real-ip');
  const ipAddress = forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown';
  const userAgent = headersList.get('user-agent') || 'unknown';
  return { ipAddress, userAgent };
}

// Helper to create audit log
async function createAuditLog(
  adminId: string,
  targetUserId: string | null,
  action: AdminAction,
  description: string,
  previousValue: Prisma.InputJsonValue | null,
  newValue: Prisma.InputJsonValue | null,
  ipAddress: string,
  userAgent: string,
  metadata?: Prisma.InputJsonValue
) {
  await prisma.adminAuditLog.create({
    data: {
      adminId,
      targetUserId,
      action,
      description,
      previousValue: previousValue ?? Prisma.JsonNull,
      newValue: newValue ?? Prisma.JsonNull,
      ipAddress,
      userAgent,
      metadata: metadata ?? undefined,
    },
  });
}

/**
 * GET /api/admin/users/[id] - Get specific user details (admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        role: true,
        status: true,
        creditBalance: true,
        graceCreditsUsed: true,
        createdAt: true,
        updatedAt: true,
        lastPasswordReset: true,
        deactivatedAt: true,
        deactivatedBy: true,
        agents: {
          include: {
            phoneNumber: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        calls: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            phoneNumber: true,
            status: true,
            startedAt: true,
            endedAt: true,
            durationSeconds: true,
            creditsUsed: true,
            summary: true,
            agent: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        creditTransactions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            type: true,
            amount: true,
            balanceAfter: true,
            description: true,
            createdAt: true,
          },
        },
        userAuditLogs: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true,
            action: true,
            description: true,
            previousValue: true,
            newValue: true,
            createdAt: true,
            admin: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            agents: true,
            calls: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);

    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (error.message === 'Admin access required') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/users/[id] - Update user details (admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await params;
    const { ipAddress, userAgent } = await getRequestMetadata();

    const body = await request.json();
    const { email, name, username, role, status } = body as {
      email?: string;
      name?: string;
      username?: string;
      role?: Role;
      status?: UserStatus;
    };

    // Get current user state for audit log
    const currentUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, username: true, role: true, status: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent admin from changing their own role
    if (admin.id === id && role && role !== currentUser.role) {
      return NextResponse.json({ error: 'Cannot change your own role' }, { status: 400 });
    }

    // Validate email uniqueness if being changed
    if (email && email !== currentUser.email) {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
      }
    }

    // Validate username uniqueness if being changed
    if (username && username !== currentUser.username) {
      const existingUser = await prisma.user.findUnique({ where: { username } });
      if (existingUser) {
        return NextResponse.json({ error: 'Username already in use' }, { status: 400 });
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (email !== undefined) updateData.email = email;
    if (name !== undefined) updateData.name = name;
    if (username !== undefined) updateData.username = username;
    if (role !== undefined) updateData.role = role;
    if (status !== undefined) {
      updateData.status = status;
      if (status !== 'ACTIVE') {
        updateData.deactivatedAt = new Date();
        updateData.deactivatedBy = admin.id;
      } else {
        updateData.deactivatedAt = null;
        updateData.deactivatedBy = null;
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        role: true,
        status: true,
        creditBalance: true,
        updatedAt: true,
      },
    });

    // Determine action type and create audit log
    let action: AdminAction = 'USER_UPDATE';
    let description = `Updated user ${currentUser.email}`;

    if (role && role !== currentUser.role) {
      action = 'USER_ROLE_CHANGE';
      description = `Changed role for ${currentUser.email} from ${currentUser.role} to ${role}`;
    } else if (status && status !== currentUser.status) {
      action = 'USER_STATUS_CHANGE';
      description = `Changed status for ${currentUser.email} from ${currentUser.status} to ${status}`;
    }

    await createAuditLog(
      admin.id,
      id,
      action,
      description,
      { email: currentUser.email, name: currentUser.name, username: currentUser.username, role: currentUser.role, status: currentUser.status },
      { email: updatedUser.email, name: updatedUser.name, username: updatedUser.username, role: updatedUser.role, status: updatedUser.status },
      ipAddress,
      userAgent
    );

    // If user was deactivated, invalidate their sessions
    if (status && status !== 'ACTIVE') {
      await prisma.session.deleteMany({ where: { userId: id } });
    }

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Error updating user:', error);

    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (error.message === 'Admin access required') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/[id] - Delete a user (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await params;
    const { ipAddress, userAgent } = await getRequestMetadata();

    // Get current user for audit log
    const currentUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent admin from deleting themselves
    if (admin.id === id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    // Delete user (cascades to related records)
    await prisma.user.delete({ where: { id } });

    // Create audit log (user is deleted so targetUserId is null)
    await createAuditLog(
      admin.id,
      null, // User was deleted
      'USER_DELETE',
      `Deleted user ${currentUser.email}`,
      { id: currentUser.id, email: currentUser.email, name: currentUser.name, role: currentUser.role },
      null,
      ipAddress,
      userAgent,
      { deletedUserId: id }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);

    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (error.message === 'Admin access required') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
