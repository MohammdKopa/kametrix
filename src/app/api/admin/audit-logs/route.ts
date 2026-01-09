import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';
import type { AdminAction, Prisma } from '@/generated/prisma/client';
import {
  getActionCategory,
  getActionsForCategory,
  createAuditLog,
  type ActionCategory,
} from '@/lib/audit-logger';

// Force dynamic rendering since we use cookies() for authentication
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/audit-logs - Get audit logs with advanced filtering (admin only)
 *
 * Query params:
 * - adminId: string - Filter by admin who performed action
 * - userId: string - Filter by target user
 * - action: AdminAction - Filter by specific action type
 * - category: ActionCategory - Filter by action category
 * - search: string - Search in description
 * - startDate: string - Filter logs from this date (ISO format)
 * - endDate: string - Filter logs until this date (ISO format)
 * - page: number - Page number (default 1)
 * - limit: number - Items per page (default 50, max 100)
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get('adminId');
    const userId = searchParams.get('userId');
    const actionFilter = searchParams.get('action') as AdminAction | null;
    const categoryFilter = searchParams.get('category') as ActionCategory | null;
    const search = searchParams.get('search');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '50', 10)), 100);
    const skip = (page - 1) * limit;

    // Build where clause
    const whereConditions: Prisma.AdminAuditLogWhereInput[] = [];

    // Admin filter
    if (adminId) {
      whereConditions.push({ adminId });
    }

    // Target user filter
    if (userId) {
      whereConditions.push({ targetUserId: userId });
    }

    // Specific action filter
    if (actionFilter) {
      whereConditions.push({ action: actionFilter });
    }

    // Category filter (maps to multiple actions)
    if (categoryFilter && !actionFilter) {
      const actionsForCategory = getActionsForCategory(categoryFilter);
      if (actionsForCategory.length > 0) {
        whereConditions.push({
          action: { in: actionsForCategory },
        });
      }
    }

    // Search in description
    if (search && search.trim()) {
      whereConditions.push({
        description: {
          contains: search.trim(),
          mode: 'insensitive',
        },
      });
    }

    // Date range filter
    if (startDate) {
      const start = new Date(startDate);
      if (!isNaN(start.getTime())) {
        whereConditions.push({
          createdAt: { gte: start },
        });
      }
    }

    if (endDate) {
      const end = new Date(endDate);
      if (!isNaN(end.getTime())) {
        // Set to end of day
        end.setHours(23, 59, 59, 999);
        whereConditions.push({
          createdAt: { lte: end },
        });
      }
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
          userAgent: true,
          metadata: true,
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

    // Add category to each log for frontend grouping
    const logsWithCategory = logs.map((log) => ({
      ...log,
      category: getActionCategory(log.action),
    }));

    return NextResponse.json({
      logs: logsWithCategory,
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
