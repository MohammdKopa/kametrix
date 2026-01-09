import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';
import type { AdminAction, Prisma } from '@/generated/prisma/client';

// Force dynamic rendering since we use cookies() for authentication
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/audit-logs - Get audit logs (admin only)
 *
 * Query params:
 * - adminId: string - Filter by admin who performed action
 * - userId: string - Filter by target user
 * - action: AdminAction - Filter by action type
 * - page: number - Page number (default 1)
 * - limit: number - Items per page (default 50)
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get('adminId');
    const userId = searchParams.get('userId');
    const actionFilter = searchParams.get('action') as AdminAction | null;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const skip = (page - 1) * limit;

    // Build where clause
    const whereConditions: Prisma.AdminAuditLogWhereInput[] = [];

    if (adminId) {
      whereConditions.push({ adminId });
    }

    if (userId) {
      whereConditions.push({ targetUserId: userId });
    }

    if (actionFilter) {
      whereConditions.push({ action: actionFilter });
    }

    const where: Prisma.AdminAuditLogWhereInput =
      whereConditions.length > 0 ? { AND: whereConditions } : {};

    const [logs, total] = await Promise.all([
      prisma.adminAuditLog.findMany({
        where,
        select: {
          id: true,
          action: true,
          description: true,
          previousValue: true,
          newValue: true,
          ipAddress: true,
          createdAt: true,
          admin: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          targetUser: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.adminAuditLog.count({ where }),
    ]);

    return NextResponse.json({
      logs,
      total,
      page,
      limit,
      hasMore: skip + logs.length < total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);

    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (error.message === 'Admin access required') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}
