import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering since we use cookies() for authentication
export const dynamic = 'force-dynamic';

interface DashboardStats {
  users: {
    total: number;
    active: number;
    inactive: number;
    suspended: number;
    admins: number;
    newToday: number;
    newThisWeek: number;
    newThisMonth: number;
  };
  agents: {
    total: number;
    active: number;
    inactive: number;
    withPhoneNumbers: number;
  };
  calls: {
    total: number;
    completed: number;
    failed: number;
    escalated: number;
    inProgress: number;
    todayTotal: number;
    todayCompleted: number;
    thisWeekTotal: number;
    averageDuration: number;
  };
  credits: {
    totalBalance: number;
    totalPurchased: number;
    totalUsed: number;
    transactionsToday: number;
  };
  phoneNumbers: {
    total: number;
    assigned: number;
    available: number;
  };
  recentActivity: Array<{
    id: string;
    type: 'user_signup' | 'call_completed' | 'agent_created' | 'credit_purchase';
    description: string;
    timestamp: Date;
    metadata?: Record<string, unknown>;
  }>;
  quickActions: {
    pendingUsers: number;
    activeAlerts: number;
    failedCalls24h: number;
    lowCreditUsers: number;
  };
}

/**
 * GET /api/admin/dashboard - Get comprehensive dashboard statistics (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);

    const monthStart = new Date(now);
    monthStart.setMonth(monthStart.getMonth() - 1);

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    // Run all queries in parallel for performance
    const [
      // User stats
      totalUsers,
      activeUsers,
      inactiveUsers,
      suspendedUsers,
      adminUsers,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
      // Agent stats
      totalAgents,
      activeAgents,
      agentsWithPhones,
      // Call stats
      totalCalls,
      completedCalls,
      failedCalls,
      escalatedCalls,
      inProgressCalls,
      todayCalls,
      todayCompletedCalls,
      thisWeekCalls,
      avgDuration,
      // Credit stats
      totalCreditBalance,
      creditPurchases,
      creditUsage,
      transactionsToday,
      // Phone number stats
      totalPhoneNumbers,
      assignedPhoneNumbers,
      // Quick actions
      lowCreditUsers,
      failedCalls24h,
      activeAlerts,
      // Recent activity
      recentUsers,
      recentCalls,
      recentAgents,
      recentTransactions,
    ] = await Promise.all([
      // User counts
      prisma.user.count(),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count({ where: { status: 'INACTIVE' } }),
      prisma.user.count({ where: { status: 'SUSPENDED' } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.user.count({ where: { createdAt: { gte: weekStart } } }),
      prisma.user.count({ where: { createdAt: { gte: monthStart } } }),
      // Agent counts
      prisma.agent.count(),
      prisma.agent.count({ where: { isActive: true } }),
      prisma.agent.count({ where: { phoneNumber: { isNot: null } } }),
      // Call counts
      prisma.call.count(),
      prisma.call.count({ where: { status: 'COMPLETED' } }),
      prisma.call.count({ where: { status: 'FAILED' } }),
      prisma.call.count({ where: { status: 'ESCALATED' } }),
      prisma.call.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.call.count({ where: { startedAt: { gte: todayStart } } }),
      prisma.call.count({ where: { startedAt: { gte: todayStart }, status: 'COMPLETED' } }),
      prisma.call.count({ where: { startedAt: { gte: weekStart } } }),
      prisma.call.aggregate({
        _avg: { durationSeconds: true },
        where: { status: 'COMPLETED', durationSeconds: { not: null } },
      }),
      // Credit stats
      prisma.user.aggregate({ _sum: { creditBalance: true } }),
      prisma.creditTransaction.aggregate({
        _sum: { amount: true },
        where: { type: 'PURCHASE' },
      }),
      prisma.creditTransaction.aggregate({
        _sum: { amount: true },
        where: { type: 'CALL_USAGE' },
      }),
      prisma.creditTransaction.count({ where: { createdAt: { gte: todayStart } } }),
      // Phone number stats
      prisma.phoneNumber.count(),
      prisma.phoneNumber.count({ where: { status: 'ASSIGNED' } }),
      // Quick actions
      prisma.user.count({ where: { creditBalance: { lt: 100 }, status: 'ACTIVE' } }),
      prisma.call.count({ where: { status: 'FAILED', startedAt: { gte: yesterday } } }),
      prisma.monitoringAlert.count({ where: { status: 'ACTIVE' } }),
      // Recent activity queries
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, email: true, name: true, createdAt: true },
      }),
      prisma.call.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        where: { status: 'COMPLETED' },
        select: { id: true, phoneNumber: true, durationSeconds: true, createdAt: true },
      }),
      prisma.agent.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, createdAt: true, user: { select: { email: true } } },
      }),
      prisma.creditTransaction.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        where: { type: 'PURCHASE' },
        select: { id: true, amount: true, createdAt: true, user: { select: { email: true } } },
      }),
    ]);

    // Build recent activity feed
    const recentActivity: DashboardStats['recentActivity'] = [
      ...recentUsers.map((u) => ({
        id: u.id,
        type: 'user_signup' as const,
        description: `New user registered: ${u.email}`,
        timestamp: u.createdAt,
        metadata: { userId: u.id, email: u.email, name: u.name },
      })),
      ...recentCalls.map((c) => ({
        id: c.id,
        type: 'call_completed' as const,
        description: `Call completed to ${c.phoneNumber} (${c.durationSeconds || 0}s)`,
        timestamp: c.createdAt,
        metadata: { callId: c.id, phoneNumber: c.phoneNumber, duration: c.durationSeconds },
      })),
      ...recentAgents.map((a) => ({
        id: a.id,
        type: 'agent_created' as const,
        description: `New agent "${a.name}" created by ${a.user.email}`,
        timestamp: a.createdAt,
        metadata: { agentId: a.id, name: a.name },
      })),
      ...recentTransactions.map((t) => ({
        id: t.id,
        type: 'credit_purchase' as const,
        description: `${t.user.email} purchased ${t.amount} credits`,
        timestamp: t.createdAt,
        metadata: { transactionId: t.id, amount: t.amount },
      })),
    ]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);

    const stats: DashboardStats = {
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers,
        suspended: suspendedUsers,
        admins: adminUsers,
        newToday: newUsersToday,
        newThisWeek: newUsersThisWeek,
        newThisMonth: newUsersThisMonth,
      },
      agents: {
        total: totalAgents,
        active: activeAgents,
        inactive: totalAgents - activeAgents,
        withPhoneNumbers: agentsWithPhones,
      },
      calls: {
        total: totalCalls,
        completed: completedCalls,
        failed: failedCalls,
        escalated: escalatedCalls,
        inProgress: inProgressCalls,
        todayTotal: todayCalls,
        todayCompleted: todayCompletedCalls,
        thisWeekTotal: thisWeekCalls,
        averageDuration: Math.round(avgDuration._avg.durationSeconds || 0),
      },
      credits: {
        totalBalance: totalCreditBalance._sum.creditBalance || 0,
        totalPurchased: creditPurchases._sum.amount || 0,
        totalUsed: Math.abs(creditUsage._sum.amount || 0),
        transactionsToday: transactionsToday,
      },
      phoneNumbers: {
        total: totalPhoneNumbers,
        assigned: assignedPhoneNumbers,
        available: totalPhoneNumbers - assignedPhoneNumbers,
      },
      recentActivity,
      quickActions: {
        pendingUsers: inactiveUsers,
        activeAlerts: activeAlerts,
        failedCalls24h: failedCalls24h,
        lowCreditUsers: lowCreditUsers,
      },
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}
