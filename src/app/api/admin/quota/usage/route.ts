import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateSession, getSessionFromCookies } from '@/lib/auth';
import { cookies } from 'next/headers';
import { quotaManager } from '@/lib/quota';
import { QuotaType } from '@/generated/prisma/client';

/**
 * GET /api/admin/quota/usage
 *
 * Get API usage statistics and analytics
 *
 * Query params:
 * - userId?: string - Filter by user ID
 * - quotaType?: QuotaType - Filter by quota type
 * - startDate?: string - Start date (ISO format)
 * - endDate?: string - End date (ISO format)
 * - groupBy?: 'hour' | 'day' | 'endpoint' | 'user'
 * - limit?: number - Limit results (default 100)
 */
export async function GET(req: NextRequest) {
  try {
    // Verify admin
    const cookieStore = await cookies();
    const token = getSessionFromCookies(cookieStore);
    if (!token) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
    }

    const session = await validateSession(token);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const quotaType = searchParams.get('quotaType') as QuotaType | null;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const groupBy = searchParams.get('groupBy') || 'day';
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 1000);

    // Build query
    const where: any = {};
    if (userId) where.userId = userId;
    if (quotaType) where.quotaType = quotaType;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // Get raw usage logs
    const logs = await prisma.apiUsageLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit * 10, // Get more for aggregation
    });

    // Calculate statistics
    const totalRequests = logs.length;
    const successfulRequests = logs.filter(l => l.statusCode >= 200 && l.statusCode < 300).length;
    const failedRequests = logs.filter(l => l.statusCode >= 400).length;
    const rateLimitedRequests = logs.filter(l => l.statusCode === 429).length;

    const responseTimes = logs.filter(l => l.responseTimeMs != null).map(l => l.responseTimeMs!);
    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;

    // Group data based on groupBy parameter
    let groupedData: any = {};

    switch (groupBy) {
      case 'hour':
        logs.forEach(log => {
          const hour = log.createdAt.toISOString().substring(0, 13);
          if (!groupedData[hour]) {
            groupedData[hour] = { count: 0, success: 0, failed: 0, rateLimited: 0 };
          }
          groupedData[hour].count++;
          if (log.statusCode >= 200 && log.statusCode < 300) groupedData[hour].success++;
          if (log.statusCode >= 400) groupedData[hour].failed++;
          if (log.statusCode === 429) groupedData[hour].rateLimited++;
        });
        break;

      case 'day':
        logs.forEach(log => {
          const day = log.createdAt.toISOString().substring(0, 10);
          if (!groupedData[day]) {
            groupedData[day] = { count: 0, success: 0, failed: 0, rateLimited: 0 };
          }
          groupedData[day].count++;
          if (log.statusCode >= 200 && log.statusCode < 300) groupedData[day].success++;
          if (log.statusCode >= 400) groupedData[day].failed++;
          if (log.statusCode === 429) groupedData[day].rateLimited++;
        });
        break;

      case 'endpoint':
        logs.forEach(log => {
          if (!groupedData[log.endpoint]) {
            groupedData[log.endpoint] = { count: 0, success: 0, failed: 0, avgResponseTime: 0, responseTimes: [] };
          }
          groupedData[log.endpoint].count++;
          if (log.statusCode >= 200 && log.statusCode < 300) groupedData[log.endpoint].success++;
          if (log.statusCode >= 400) groupedData[log.endpoint].failed++;
          if (log.responseTimeMs) groupedData[log.endpoint].responseTimes.push(log.responseTimeMs);
        });
        // Calculate averages
        Object.keys(groupedData).forEach(key => {
          const times = groupedData[key].responseTimes;
          groupedData[key].avgResponseTime = times.length > 0
            ? times.reduce((a: number, b: number) => a + b, 0) / times.length
            : 0;
          delete groupedData[key].responseTimes;
        });
        break;

      case 'user':
        logs.forEach(log => {
          const key = log.userId || 'anonymous';
          if (!groupedData[key]) {
            groupedData[key] = { count: 0, success: 0, failed: 0, rateLimited: 0 };
          }
          groupedData[key].count++;
          if (log.statusCode >= 200 && log.statusCode < 300) groupedData[key].success++;
          if (log.statusCode >= 400) groupedData[key].failed++;
          if (log.statusCode === 429) groupedData[key].rateLimited++;
        });
        break;
    }

    // Get top endpoints
    const endpointCounts = logs.reduce((acc, log) => {
      acc[log.endpoint] = (acc[log.endpoint] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topEndpoints = Object.entries(endpointCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([endpoint, count]) => ({ endpoint, count }));

    // Get users with most requests
    const userCounts = logs.reduce((acc, log) => {
      const key = log.userId || 'anonymous';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topUsers = Object.entries(userCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    // Get user details for top users
    const userIds = topUsers.map(([id]) => id).filter(id => id !== 'anonymous');
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true, name: true },
    });
    const userMap = new Map(users.map(u => [u.id, u]));

    const topUsersWithDetails = topUsers.map(([id, count]) => ({
      userId: id,
      user: userMap.get(id) || (id === 'anonymous' ? { email: 'anonymous' } : null),
      count,
    }));

    return NextResponse.json({
      summary: {
        totalRequests,
        successfulRequests,
        failedRequests,
        rateLimitedRequests,
        avgResponseTime: Math.round(avgResponseTime * 100) / 100,
        successRate: totalRequests > 0 ? ((successfulRequests / totalRequests) * 100).toFixed(2) + '%' : '0%',
      },
      groupedData,
      topEndpoints,
      topUsers: topUsersWithDetails,
      filters: {
        userId,
        quotaType,
        startDate,
        endDate,
        groupBy,
        limit,
      },
    });
  } catch (error) {
    console.error('Error fetching usage data:', error);
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Nutzungsdaten' },
      { status: 500 }
    );
  }
}
