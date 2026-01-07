import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateSession, getSessionFromCookies } from '@/lib/auth';
import { cookies } from 'next/headers';
import { quotaManager, googleCalendarQuotaManager } from '@/lib/quota';
import { QuotaType, QuotaPeriod } from '@/generated/prisma/client';

/**
 * GET /api/admin/quota
 *
 * Get quota information for all users or a specific user
 *
 * Query params:
 * - userId?: string - Filter by user ID
 * - quotaType?: QuotaType - Filter by quota type
 * - includeAlerts?: boolean - Include unacknowledged alerts
 * - nearLimit?: number - Only users at or above this percentage of limit
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
    const includeAlerts = searchParams.get('includeAlerts') === 'true';
    const nearLimit = searchParams.get('nearLimit') ? parseInt(searchParams.get('nearLimit')!) : null;

    // Build query
    const where: any = {};
    if (userId) where.userId = userId;
    if (quotaType) where.quotaType = quotaType;

    // Get general API quotas
    const apiQuotas = await prisma.apiQuota.findMany({
      where,
      orderBy: [{ userId: 'asc' }, { quotaType: 'asc' }, { period: 'asc' }],
    });

    // Get Google Calendar quotas
    const googleQuotaWhere: any = {};
    if (userId) googleQuotaWhere.userId = userId;

    let googleQuotas = await prisma.googleCalendarQuota.findMany({
      where: googleQuotaWhere,
      orderBy: { userId: 'asc' },
    });

    // Filter by nearLimit if specified
    if (nearLimit) {
      googleQuotas = googleQuotas.filter(q =>
        (q.userDailyUsed / q.userDailyLimit) * 100 >= nearLimit
      );
    }

    // Get alerts if requested
    let alerts: any[] = [];
    if (includeAlerts) {
      const alertWhere: any = { acknowledged: false };
      if (userId) alertWhere.userId = userId;
      if (quotaType) alertWhere.quotaType = quotaType;

      alerts = await prisma.quotaAlert.findMany({
        where: alertWhere,
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
    }

    // Get user info for the quotas
    const userIds = [...new Set([
      ...apiQuotas.map(q => q.userId),
      ...googleQuotas.map(q => q.userId),
    ])];

    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true, name: true },
    });

    const userMap = new Map(users.map(u => [u.id, u]));

    // Format response
    const formattedApiQuotas = apiQuotas.map(q => ({
      ...q,
      user: userMap.get(q.userId),
      percentUsed: (q.usedRequests / q.maxRequests) * 100,
    }));

    const formattedGoogleQuotas = googleQuotas.map(q => ({
      ...q,
      user: userMap.get(q.userId),
      dailyPercentUsed: (q.userDailyUsed / q.userDailyLimit) * 100,
    }));

    return NextResponse.json({
      apiQuotas: formattedApiQuotas,
      googleCalendarQuotas: formattedGoogleQuotas,
      alerts,
      summary: {
        totalUsers: userIds.length,
        totalApiQuotas: apiQuotas.length,
        totalGoogleQuotas: googleQuotas.length,
        unacknowledgedAlerts: alerts.length,
      },
    });
  } catch (error) {
    console.error('Error fetching quota data:', error);
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Quota-Daten' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/quota
 *
 * Update quota settings for a user
 *
 * Body:
 * - userId: string
 * - quotaType: QuotaType
 * - period?: QuotaPeriod (for API quotas)
 * - maxRequests?: number (for API quotas)
 * - userDailyLimit?: number (for Google Calendar)
 * - queriesPerMinute?: number (for Google Calendar)
 * - isBlocked?: boolean
 * - blockReason?: string
 * - blockDurationMinutes?: number
 */
export async function PUT(req: NextRequest) {
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

    const body = await req.json();
    const {
      userId,
      quotaType,
      period,
      maxRequests,
      userDailyLimit,
      queriesPerMinute,
      isBlocked,
      blockReason,
      blockDurationMinutes,
    } = body;

    if (!userId || !quotaType) {
      return NextResponse.json(
        { error: 'userId und quotaType sind erforderlich' },
        { status: 400 }
      );
    }

    // Handle Google Calendar quota updates
    if (quotaType === QuotaType.GOOGLE_CALENDAR) {
      if (isBlocked) {
        await googleCalendarQuotaManager.throttleUser(
          userId,
          blockDurationMinutes || 60,
          blockReason
        );
      } else if (isBlocked === false) {
        await googleCalendarQuotaManager.clearThrottle(userId);
      }

      if (userDailyLimit !== undefined || queriesPerMinute !== undefined) {
        await googleCalendarQuotaManager.updateUserLimits(
          userId,
          userDailyLimit,
          queriesPerMinute
        );
      }

      const updated = await prisma.googleCalendarQuota.findUnique({
        where: { userId },
      });

      return NextResponse.json({
        message: 'Google Calendar Quota aktualisiert',
        quota: updated,
      });
    }

    // Handle general API quota updates
    if (!period) {
      return NextResponse.json(
        { error: 'period ist erforderlich für API Quotas' },
        { status: 400 }
      );
    }

    if (isBlocked) {
      await quotaManager.blockUser(userId, quotaType, blockReason || 'Admin blocked', blockDurationMinutes);
    }

    if (maxRequests !== undefined) {
      await quotaManager.updateUserQuotaLimit(userId, quotaType, period, maxRequests);
    }

    const updated = await prisma.apiQuota.findUnique({
      where: {
        userId_quotaType_period: {
          userId,
          quotaType,
          period,
        },
      },
    });

    return NextResponse.json({
      message: 'API Quota aktualisiert',
      quota: updated,
    });
  } catch (error) {
    console.error('Error updating quota:', error);
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren der Quota' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/quota/acknowledge-alert
 *
 * Acknowledge a quota alert
 *
 * Body:
 * - alertId: string
 */
export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { alertId } = body;

    if (!alertId) {
      return NextResponse.json(
        { error: 'alertId ist erforderlich' },
        { status: 400 }
      );
    }

    const updated = await prisma.quotaAlert.update({
      where: { id: alertId },
      data: {
        acknowledged: true,
        acknowledgedBy: session.user.id,
        acknowledgedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: 'Alert bestätigt',
      alert: updated,
    });
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    return NextResponse.json(
      { error: 'Fehler beim Bestätigen des Alerts' },
      { status: 500 }
    );
  }
}
