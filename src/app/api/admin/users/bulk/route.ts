import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';
import type { Role, UserStatus, AdminAction } from '@/generated/prisma/client';

// Force dynamic rendering since we use cookies() for authentication
export const dynamic = 'force-dynamic';

type BulkAction = 'activate' | 'deactivate' | 'suspend' | 'change_role' | 'delete';

interface BulkOperationBody {
  userIds: string[];
  action: BulkAction;
  role?: Role;
}

/**
 * POST /api/admin/users/bulk - Perform bulk operations on users (admin only)
 *
 * Body:
 * - userIds: string[] - Array of user IDs to operate on
 * - action: 'activate' | 'deactivate' | 'suspend' | 'change_role' | 'delete'
 * - role?: Role - Required when action is 'change_role'
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);

    const headersList = await headers();
    const forwardedFor = headersList.get('x-forwarded-for');
    const realIp = headersList.get('x-real-ip');
    const ipAddress = forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';

    const body = (await request.json()) as BulkOperationBody;
    const { userIds, action, role } = body;

    // Validate input
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'No users selected' }, { status: 400 });
    }

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    // Prevent operations on self
    if (userIds.includes(admin.id)) {
      return NextResponse.json(
        { error: 'Cannot perform bulk operations on your own account' },
        { status: 400 }
      );
    }

    // Validate role for role change action
    if (action === 'change_role' && !role) {
      return NextResponse.json(
        { error: 'Role is required for role change action' },
        { status: 400 }
      );
    }

    // Get affected users for audit logging
    const affectedUsers = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true, role: true, status: true },
    });

    if (affectedUsers.length === 0) {
      return NextResponse.json({ error: 'No valid users found' }, { status: 400 });
    }

    let updatedCount = 0;
    let auditAction: AdminAction;
    let description: string;
    let statusValue: UserStatus | undefined;

    switch (action) {
      case 'activate':
        statusValue = 'ACTIVE';
        auditAction = 'BULK_STATUS_CHANGE';
        description = `Bulk activated ${affectedUsers.length} users`;
        break;

      case 'deactivate':
        statusValue = 'INACTIVE';
        auditAction = 'BULK_STATUS_CHANGE';
        description = `Bulk deactivated ${affectedUsers.length} users`;
        break;

      case 'suspend':
        statusValue = 'SUSPENDED';
        auditAction = 'BULK_STATUS_CHANGE';
        description = `Bulk suspended ${affectedUsers.length} users`;
        break;

      case 'change_role':
        auditAction = 'BULK_ROLE_CHANGE';
        description = `Bulk changed role to ${role} for ${affectedUsers.length} users`;
        break;

      case 'delete':
        auditAction = 'USER_DELETE';
        description = `Bulk deleted ${affectedUsers.length} users`;
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Perform the bulk operation
    if (action === 'delete') {
      // Delete users
      const result = await prisma.user.deleteMany({
        where: { id: { in: userIds } },
      });
      updatedCount = result.count;
    } else if (action === 'change_role') {
      // Change role
      const result = await prisma.user.updateMany({
        where: { id: { in: userIds } },
        data: { role },
      });
      updatedCount = result.count;
    } else {
      // Status change
      const updateData: Record<string, unknown> = { status: statusValue };

      if (statusValue !== 'ACTIVE') {
        updateData.deactivatedAt = new Date();
        updateData.deactivatedBy = admin.id;
      } else {
        updateData.deactivatedAt = null;
        updateData.deactivatedBy = null;
      }

      const result = await prisma.user.updateMany({
        where: { id: { in: userIds } },
        data: updateData,
      });
      updatedCount = result.count;

      // Invalidate sessions for deactivated/suspended users
      if (statusValue !== 'ACTIVE') {
        await prisma.session.deleteMany({
          where: { userId: { in: userIds } },
        });
      }
    }

    // Create audit log with all affected user details
    await prisma.adminAuditLog.create({
      data: {
        adminId: admin.id,
        targetUserId: null, // Bulk operation
        action: auditAction,
        description,
        previousValue: {
          users: affectedUsers.map((u) => ({
            id: u.id,
            email: u.email,
            role: u.role,
            status: u.status,
          })),
        },
        newValue: {
          action,
          role: role || undefined,
          status: statusValue || undefined,
          affectedCount: updatedCount,
        },
        ipAddress,
        userAgent,
        metadata: {
          userIds,
          affectedCount: updatedCount,
        },
      },
    });

    return NextResponse.json({
      success: true,
      updatedCount,
      message: `Successfully ${action === 'delete' ? 'deleted' : 'updated'} ${updatedCount} users`,
    });
  } catch (error) {
    console.error('Error performing bulk operation:', error);

    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (error.message === 'Admin access required') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: 'Failed to perform bulk operation' },
      { status: 500 }
    );
  }
}
