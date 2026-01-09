import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@/generated/prisma/client';
import {
  getActionCategory,
  getActionLabel,
  getCategoryLabel,
  createAuditLog,
  ACTION_CATEGORIES,
  type ActionCategory,
} from '@/lib/audit-logger';

// Force dynamic rendering since we use cookies() for authentication
export const dynamic = 'force-dynamic';

interface CategoryStats {
  category: ActionCategory;
  categoryLabel: string;
  count: number;
  actions: {
    action: string;
    actionLabel: string;
    count: number;
  }[];
}

interface AdminActivity {
  adminId: string;
  adminEmail: string;
  adminName: string | null;
  totalActions: number;
  actions: Record<string, number>;
}

interface ComplianceReport {
  generatedAt: string;
  reportPeriod: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalEvents: number;
    uniqueAdmins: number;
    categoryCounts: CategoryStats[];
  };
  adminActivity: AdminActivity[];
  securityHighlights: {
    accessDenied: number;
    bulkOperations: number;
    userDeletions: number;
    roleChanges: number;
    passwordResets: number;
  };
  recentCriticalActions: {
    id: string;
    timestamp: string;
    action: string;
    actionLabel: string;
    description: string;
    adminEmail: string;
    targetUserEmail: string | null;
  }[];
}

/**
 * GET /api/admin/audit-logs/compliance-report - Generate compliance report (admin only)
 *
 * Query params:
 * - startDate: string - Report start date (ISO format, default: 30 days ago)
 * - endDate: string - Report end date (ISO format, default: now)
 * - format: 'json' | 'pdf' (default: 'json')
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';

    // Calculate default date range (last 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let startDate = thirtyDaysAgo;
    let endDate = now;

    if (searchParams.get('startDate')) {
      const parsed = new Date(searchParams.get('startDate')!);
      if (!isNaN(parsed.getTime())) {
        startDate = parsed;
      }
    }

    if (searchParams.get('endDate')) {
      const parsed = new Date(searchParams.get('endDate')!);
      if (!isNaN(parsed.getTime())) {
        endDate = parsed;
        endDate.setHours(23, 59, 59, 999);
      }
    }

    // Build where clause
    const where: Prisma.AdminAuditLogWhereInput = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    // Fetch all logs for the period
    const logs = await prisma.adminAuditLog.findMany({
      where,
      select: {
        id: true,
        action: true,
        description: true,
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
    });

    // Calculate category statistics
    const categoryStats: Map<ActionCategory, CategoryStats> = new Map();
    ACTION_CATEGORIES.forEach((category) => {
      categoryStats.set(category, {
        category,
        categoryLabel: getCategoryLabel(category),
        count: 0,
        actions: [],
      });
    });

    const actionCounts: Map<string, number> = new Map();
    const adminActivityMap: Map<string, AdminActivity> = new Map();

    // Security metrics
    let accessDenied = 0;
    let bulkOperations = 0;
    let userDeletions = 0;
    let roleChanges = 0;
    let passwordResets = 0;

    // Process logs
    for (const log of logs) {
      const category = getActionCategory(log.action);

      // Update category stats
      const catStats = categoryStats.get(category)!;
      catStats.count++;

      // Update action counts
      const actionKey = `${category}:${log.action}`;
      actionCounts.set(actionKey, (actionCounts.get(actionKey) || 0) + 1);

      // Update admin activity
      if (!adminActivityMap.has(log.admin.id)) {
        adminActivityMap.set(log.admin.id, {
          adminId: log.admin.id,
          adminEmail: log.admin.email,
          adminName: log.admin.name,
          totalActions: 0,
          actions: {},
        });
      }
      const adminActivity = adminActivityMap.get(log.admin.id)!;
      adminActivity.totalActions++;
      adminActivity.actions[log.action] = (adminActivity.actions[log.action] || 0) + 1;

      // Count security-relevant actions
      switch (log.action) {
        case 'ACCESS_DENIED':
          accessDenied++;
          break;
        case 'BULK_STATUS_CHANGE':
        case 'BULK_ROLE_CHANGE':
        case 'BULK_DELETE':
          bulkOperations++;
          break;
        case 'USER_DELETE':
          userDeletions++;
          break;
        case 'USER_ROLE_CHANGE':
          roleChanges++;
          break;
        case 'USER_PASSWORD_RESET':
          passwordResets++;
          break;
      }
    }

    // Add action breakdown to categories
    for (const [key, count] of actionCounts) {
      const [categoryKey, action] = key.split(':') as [ActionCategory, string];
      const catStats = categoryStats.get(categoryKey);
      if (catStats) {
        catStats.actions.push({
          action,
          actionLabel: getActionLabel(action as any),
          count,
        });
      }
    }

    // Sort actions by count
    for (const [, catStats] of categoryStats) {
      catStats.actions.sort((a, b) => b.count - a.count);
    }

    // Get critical actions (user deletions, role changes, bulk ops)
    const criticalActions = logs
      .filter((log) =>
        [
          'USER_DELETE',
          'USER_ROLE_CHANGE',
          'BULK_STATUS_CHANGE',
          'BULK_ROLE_CHANGE',
          'BULK_DELETE',
          'ACCESS_DENIED',
          'SETTINGS_UPDATE',
        ].includes(log.action)
      )
      .slice(0, 20)
      .map((log) => ({
        id: log.id,
        timestamp: log.createdAt.toISOString(),
        action: log.action,
        actionLabel: getActionLabel(log.action),
        description: log.description,
        adminEmail: log.admin.email,
        targetUserEmail: log.targetUser?.email || null,
      }));

    // Build report
    const report: ComplianceReport = {
      generatedAt: new Date().toISOString(),
      reportPeriod: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      summary: {
        totalEvents: logs.length,
        uniqueAdmins: adminActivityMap.size,
        categoryCounts: Array.from(categoryStats.values()).sort(
          (a, b) => b.count - a.count
        ),
      },
      adminActivity: Array.from(adminActivityMap.values()).sort(
        (a, b) => b.totalActions - a.totalActions
      ),
      securityHighlights: {
        accessDenied,
        bulkOperations,
        userDeletions,
        roleChanges,
        passwordResets,
      },
      recentCriticalActions: criticalActions,
    };

    // Log compliance report generation
    await createAuditLog({
      adminId: admin.id,
      action: 'COMPLIANCE_REPORT',
      description: `Generated compliance report for period ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
      metadata: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        totalEvents: logs.length,
        format,
      },
    });

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `compliance-report-${timestamp}.json`;

    if (format === 'json') {
      return new NextResponse(JSON.stringify(report, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    // For other formats, just return JSON for now
    // PDF generation would require additional libraries
    return NextResponse.json(report);
  } catch (error) {
    console.error('Error generating compliance report:', error);

    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (error.message === 'Admin access required') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: 'Failed to generate compliance report' },
      { status: 500 }
    );
  }
}
