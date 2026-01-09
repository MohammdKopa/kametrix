import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';
import type { AdminAction, Prisma } from '@/generated/prisma/client';
import {
  getActionCategory,
  getActionsForCategory,
  getActionLabel,
  getCategoryLabel,
  createAuditLog,
  type ActionCategory,
} from '@/lib/audit-logger';

// Force dynamic rendering since we use cookies() for authentication
export const dynamic = 'force-dynamic';

// Maximum records for export (to prevent memory issues)
const MAX_EXPORT_RECORDS = 10000;

interface ExportableLog {
  id: string;
  timestamp: string;
  action: string;
  actionLabel: string;
  category: string;
  categoryLabel: string;
  description: string;
  adminId: string;
  adminEmail: string;
  adminName: string | null;
  targetUserId: string | null;
  targetUserEmail: string | null;
  targetUserName: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  previousValue: string;
  newValue: string;
  metadata: string;
}

/**
 * GET /api/admin/audit-logs/export - Export audit logs (admin only)
 *
 * Query params:
 * - format: 'csv' | 'json' (default: 'json')
 * - adminId: string - Filter by admin who performed action
 * - userId: string - Filter by target user
 * - action: AdminAction - Filter by specific action type
 * - category: ActionCategory - Filter by action category
 * - search: string - Search in description
 * - startDate: string - Filter logs from this date (ISO format)
 * - endDate: string - Filter logs until this date (ISO format)
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const format = (searchParams.get('format') || 'json').toLowerCase();
    const adminIdFilter = searchParams.get('adminId');
    const userId = searchParams.get('userId');
    const actionFilter = searchParams.get('action') as AdminAction | null;
    const categoryFilter = searchParams.get('category') as ActionCategory | null;
    const search = searchParams.get('search');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Validate format
    if (format !== 'csv' && format !== 'json') {
      return NextResponse.json(
        { error: 'Invalid format. Use "csv" or "json".' },
        { status: 400 }
      );
    }

    // Build where clause
    const whereConditions: Prisma.AdminAuditLogWhereInput[] = [];

    if (adminIdFilter) {
      whereConditions.push({ adminId: adminIdFilter });
    }

    if (userId) {
      whereConditions.push({ targetUserId: userId });
    }

    if (actionFilter) {
      whereConditions.push({ action: actionFilter });
    }

    if (categoryFilter && !actionFilter) {
      const actionsForCategory = getActionsForCategory(categoryFilter);
      if (actionsForCategory.length > 0) {
        whereConditions.push({
          action: { in: actionsForCategory },
        });
      }
    }

    if (search && search.trim()) {
      whereConditions.push({
        description: {
          contains: search.trim(),
          mode: 'insensitive',
        },
      });
    }

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
        end.setHours(23, 59, 59, 999);
        whereConditions.push({
          createdAt: { lte: end },
        });
      }
    }

    const where: Prisma.AdminAuditLogWhereInput =
      whereConditions.length > 0 ? { AND: whereConditions } : {};

    // Get total count first
    const totalCount = await prisma.adminAuditLog.count({ where });

    if (totalCount > MAX_EXPORT_RECORDS) {
      return NextResponse.json(
        {
          error: `Too many records (${totalCount}). Maximum export limit is ${MAX_EXPORT_RECORDS}. Please narrow your filters.`,
        },
        { status: 400 }
      );
    }

    // Fetch logs
    const logs = await prisma.adminAuditLog.findMany({
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
      take: MAX_EXPORT_RECORDS,
    });

    // Transform logs for export
    const exportableLogs: ExportableLog[] = logs.map((log) => {
      const category = getActionCategory(log.action);
      return {
        id: log.id,
        timestamp: log.createdAt.toISOString(),
        action: log.action,
        actionLabel: getActionLabel(log.action),
        category,
        categoryLabel: getCategoryLabel(category),
        description: log.description,
        adminId: log.admin.id,
        adminEmail: log.admin.email,
        adminName: log.admin.name,
        targetUserId: log.targetUser?.id || null,
        targetUserEmail: log.targetUser?.email || null,
        targetUserName: log.targetUser?.name || null,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        previousValue: log.previousValue ? JSON.stringify(log.previousValue) : '',
        newValue: log.newValue ? JSON.stringify(log.newValue) : '',
        metadata: log.metadata ? JSON.stringify(log.metadata) : '',
      };
    });

    // Log the export action
    await createAuditLog({
      adminId: admin.id,
      action: 'AUDIT_EXPORT',
      description: `Exported ${logs.length} audit log records in ${format.toUpperCase()} format`,
      metadata: {
        format,
        recordCount: logs.length,
        filters: {
          adminId: adminIdFilter,
          userId,
          action: actionFilter,
          category: categoryFilter,
          search,
          startDate,
          endDate,
        },
      },
    });

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `audit-logs-${timestamp}.${format}`;

    if (format === 'json') {
      return new NextResponse(JSON.stringify(exportableLogs, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    // Generate CSV
    const csvHeaders = [
      'ID',
      'Timestamp',
      'Action',
      'Action Label',
      'Category',
      'Category Label',
      'Description',
      'Admin ID',
      'Admin Email',
      'Admin Name',
      'Target User ID',
      'Target User Email',
      'Target User Name',
      'IP Address',
      'User Agent',
      'Previous Value',
      'New Value',
      'Metadata',
    ];

    const escapeCSV = (value: string | null | undefined): string => {
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    const csvRows = exportableLogs.map((log) =>
      [
        log.id,
        log.timestamp,
        log.action,
        log.actionLabel,
        log.category,
        log.categoryLabel,
        log.description,
        log.adminId,
        log.adminEmail,
        log.adminName || '',
        log.targetUserId || '',
        log.targetUserEmail || '',
        log.targetUserName || '',
        log.ipAddress || '',
        log.userAgent || '',
        log.previousValue,
        log.newValue,
        log.metadata,
      ]
        .map(escapeCSV)
        .join(',')
    );

    const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting audit logs:', error);

    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (error.message === 'Admin access required') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: 'Failed to export audit logs' },
      { status: 500 }
    );
  }
}
