/**
 * User Analytics Service
 *
 * Tracks user engagement and activity for business insights:
 * - Session tracking
 * - Feature usage
 * - User journey analytics
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/errors/logger';

export type EventType =
  | 'login'
  | 'logout'
  | 'signup'
  | 'agent_created'
  | 'agent_updated'
  | 'agent_deleted'
  | 'call_initiated'
  | 'call_completed'
  | 'credits_purchased'
  | 'page_view'
  | 'feature_used';

export interface TrackEventOptions {
  userId?: string;
  eventType: EventType;
  eventData?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Track a user event
 */
export async function trackEvent(options: TrackEventOptions): Promise<void> {
  try {
    await prisma.eventLog.create({
      data: {
        userId: options.userId ?? null,
        eventType: options.eventType,
        eventData: options.eventData ? JSON.parse(JSON.stringify(options.eventData)) : undefined,
        ipAddress: options.ipAddress ?? null,
        userAgent: options.userAgent ?? null,
      },
    });

    // Update user analytics if userId is provided
    if (options.userId) {
      await updateUserAnalytics(options.userId, options.eventType, options.eventData);
    }
  } catch (error) {
    logger.error('Failed to track event', error);
  }
}

/**
 * Update user analytics based on event
 */
async function updateUserAnalytics(
  userId: string,
  eventType: EventType,
  eventData?: Record<string, unknown>
): Promise<void> {
  const updates: Record<string, unknown> = {
    lastActiveAt: new Date(),
  };

  switch (eventType) {
    case 'login':
      updates.totalSessions = { increment: 1 };
      break;
    case 'call_completed':
      updates.totalCallsPlaced = { increment: 1 };
      if (typeof eventData?.duration === 'number') {
        updates.totalCallDuration = { increment: eventData.duration };
      }
      if (typeof eventData?.creditsUsed === 'number') {
        updates.totalCreditsUsed = { increment: eventData.creditsUsed };
      }
      break;
  }

  try {
    await prisma.userAnalytics.upsert({
      where: { userId },
      create: {
        userId,
        totalSessions: eventType === 'login' ? 1 : 0,
        totalCallsPlaced: eventType === 'call_completed' ? 1 : 0,
        totalCallDuration: typeof eventData?.duration === 'number' ? eventData.duration : 0,
        totalCreditsUsed: typeof eventData?.creditsUsed === 'number' ? eventData.creditsUsed : 0,
        lastActiveAt: new Date(),
        firstSeenAt: new Date(),
      },
      update: updates,
    });
  } catch (error) {
    logger.error('Failed to update user analytics', error);
  }
}

/**
 * Get user analytics summary
 */
export async function getUserAnalytics(userId: string) {
  return prisma.userAnalytics.findUnique({
    where: { userId },
  });
}

/**
 * Get platform-wide analytics summary
 */
export async function getPlatformAnalytics(hoursBack = 24) {
  const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

  // Get event counts by type
  const eventCounts = await prisma.eventLog.groupBy({
    by: ['eventType'],
    where: {
      createdAt: { gte: since },
    },
    _count: true,
  });

  // Get active users count
  const activeUsers = await prisma.userAnalytics.count({
    where: {
      lastActiveAt: { gte: since },
    },
  });

  // Get total events
  const totalEvents = await prisma.eventLog.count({
    where: {
      createdAt: { gte: since },
    },
  });

  // Get new signups
  const newSignups = await prisma.user.count({
    where: {
      createdAt: { gte: since },
    },
  });

  // Get calls stats
  const callStats = await prisma.call.aggregate({
    where: {
      createdAt: { gte: since },
    },
    _count: true,
    _sum: {
      durationSeconds: true,
      creditsUsed: true,
    },
  });

  return {
    period: {
      start: since,
      end: new Date(),
      hoursBack,
    },
    users: {
      activeUsers,
      newSignups,
    },
    events: {
      total: totalEvents,
      byType: Object.fromEntries(
        eventCounts.map(e => [e.eventType, e._count])
      ),
    },
    calls: {
      total: callStats._count,
      totalDuration: callStats._sum.durationSeconds ?? 0,
      totalCreditsUsed: callStats._sum.creditsUsed ?? 0,
    },
  };
}

/**
 * Get event timeline for a user
 */
export async function getUserEventTimeline(
  userId: string,
  limit = 50
) {
  return prisma.eventLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      eventType: true,
      eventData: true,
      createdAt: true,
    },
  });
}

/**
 * Get recent platform events
 */
export async function getRecentEvents(limit = 100) {
  return prisma.eventLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      userId: true,
      eventType: true,
      eventData: true,
      createdAt: true,
    },
  });
}

/**
 * Get top users by activity
 */
export async function getTopUsersByActivity(limit = 10) {
  return prisma.userAnalytics.findMany({
    orderBy: [
      { totalCallsPlaced: 'desc' },
      { totalSessions: 'desc' },
    ],
    take: limit,
    select: {
      userId: true,
      totalSessions: true,
      totalCallsPlaced: true,
      totalCallDuration: true,
      totalCreditsUsed: true,
      lastActiveAt: true,
    },
  });
}

/**
 * Clean up old event logs (keep last 90 days)
 */
export async function cleanupOldEventLogs(): Promise<number> {
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const result = await prisma.eventLog.deleteMany({
    where: {
      createdAt: { lt: cutoff },
    },
  });

  logger.info('Cleaned up old event logs', { deleted: result.count });
  return result.count;
}
