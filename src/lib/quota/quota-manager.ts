/**
 * API Quota Manager
 *
 * Manages rate limiting and quota tracking for API calls, with special handling
 * for Google Calendar API quotas. Ensures fair resource allocation and prevents
 * quota exhaustion in production.
 *
 * Features:
 * - Per-user quota tracking
 * - Google Calendar API quota management
 * - Automatic quota reset based on time windows
 * - Alert generation when approaching limits
 * - In-memory caching with database persistence
 */

import { prisma } from '@/lib/prisma';
import { QuotaType, QuotaPeriod } from '@/generated/prisma/client';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface QuotaCheckResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: Date;
  retryAfterSeconds?: number;
  warningLevel?: 'warning' | 'critical' | 'exceeded';
  message?: string;
}

export interface QuotaConfig {
  type: QuotaType;
  period: QuotaPeriod;
  maxRequests: number;
}

export interface UserQuotaStatus {
  userId: string;
  quotaType: QuotaType;
  used: number;
  limit: number;
  remaining: number;
  percentUsed: number;
  resetAt: Date;
  isBlocked: boolean;
  blockReason?: string | null;
}

// ============================================================================
// Default Quota Configurations
// ============================================================================

export const DEFAULT_QUOTAS: Record<QuotaType, QuotaConfig[]> = {
  GOOGLE_CALENDAR: [
    { type: QuotaType.GOOGLE_CALENDAR, period: QuotaPeriod.MINUTE, maxRequests: 60 },
    { type: QuotaType.GOOGLE_CALENDAR, period: QuotaPeriod.HOUR, maxRequests: 1000 },
    { type: QuotaType.GOOGLE_CALENDAR, period: QuotaPeriod.DAY, maxRequests: 10000 },
  ],
  API_GENERAL: [
    { type: QuotaType.API_GENERAL, period: QuotaPeriod.MINUTE, maxRequests: 100 },
    { type: QuotaType.API_GENERAL, period: QuotaPeriod.HOUR, maxRequests: 2000 },
    { type: QuotaType.API_GENERAL, period: QuotaPeriod.DAY, maxRequests: 20000 },
  ],
  API_WEBHOOK: [
    { type: QuotaType.API_WEBHOOK, period: QuotaPeriod.MINUTE, maxRequests: 1000 },
    { type: QuotaType.API_WEBHOOK, period: QuotaPeriod.HOUR, maxRequests: 20000 },
  ],
};

// Alert thresholds (percentage)
const WARNING_THRESHOLD = 80;
const CRITICAL_THRESHOLD = 95;

// ============================================================================
// In-Memory Cache for Performance
// ============================================================================

interface CacheEntry {
  used: number;
  limit: number;
  periodStart: Date;
  lastUpdated: Date;
}

const quotaCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5000; // 5 seconds cache

function getCacheKey(userId: string, quotaType: QuotaType, period: QuotaPeriod): string {
  return `${userId}:${quotaType}:${period}`;
}

function isExpiredPeriod(periodStart: Date, period: QuotaPeriod): boolean {
  const now = new Date();
  const diff = now.getTime() - periodStart.getTime();

  switch (period) {
    case QuotaPeriod.MINUTE:
      return diff >= 60 * 1000;
    case QuotaPeriod.HOUR:
      return diff >= 60 * 60 * 1000;
    case QuotaPeriod.DAY:
      return diff >= 24 * 60 * 60 * 1000;
    case QuotaPeriod.MONTH:
      // Check if we're in a new month
      const periodMonth = periodStart.getMonth();
      const currentMonth = now.getMonth();
      return periodMonth !== currentMonth || periodStart.getFullYear() !== now.getFullYear();
    default:
      return true;
  }
}

function getPeriodDurationMs(period: QuotaPeriod): number {
  switch (period) {
    case QuotaPeriod.MINUTE:
      return 60 * 1000;
    case QuotaPeriod.HOUR:
      return 60 * 60 * 1000;
    case QuotaPeriod.DAY:
      return 24 * 60 * 60 * 1000;
    case QuotaPeriod.MONTH:
      return 30 * 24 * 60 * 60 * 1000; // Approximate
    default:
      return 60 * 1000;
  }
}

// ============================================================================
// Quota Manager Class
// ============================================================================

export class QuotaManager {
  /**
   * Check if a request is allowed under quota limits
   */
  async checkQuota(
    userId: string,
    quotaType: QuotaType,
    consumePoints: number = 1
  ): Promise<QuotaCheckResult> {
    const configs = DEFAULT_QUOTAS[quotaType];

    // Check all period quotas for this type
    for (const config of configs) {
      const result = await this.checkSingleQuota(userId, config, consumePoints);
      if (!result.allowed) {
        return result;
      }
    }

    // If all checks passed, consume the quota
    await this.consumeQuota(userId, quotaType, consumePoints);

    // Return status from the most restrictive (shortest) period
    const shortestPeriodConfig = configs[0]; // Minute is first
    return this.getQuotaStatus(userId, shortestPeriodConfig);
  }

  /**
   * Check a single quota period
   */
  private async checkSingleQuota(
    userId: string,
    config: QuotaConfig,
    consumePoints: number
  ): Promise<QuotaCheckResult> {
    const cacheKey = getCacheKey(userId, config.type, config.period);
    const cached = quotaCache.get(cacheKey);
    const now = new Date();

    // Check cache first (within TTL and same period)
    if (cached && now.getTime() - cached.lastUpdated.getTime() < CACHE_TTL_MS) {
      if (!isExpiredPeriod(cached.periodStart, config.period)) {
        const remaining = cached.limit - cached.used;
        const percentUsed = (cached.used / cached.limit) * 100;

        if (remaining < consumePoints) {
          const resetAt = new Date(cached.periodStart.getTime() + getPeriodDurationMs(config.period));
          return {
            allowed: false,
            remaining: 0,
            limit: cached.limit,
            resetAt,
            retryAfterSeconds: Math.ceil((resetAt.getTime() - now.getTime()) / 1000),
            warningLevel: 'exceeded',
            message: `Rate limit exceeded for ${config.type}. Quota resets at ${resetAt.toISOString()}`,
          };
        }

        return {
          allowed: true,
          remaining: remaining - consumePoints,
          limit: cached.limit,
          resetAt: new Date(cached.periodStart.getTime() + getPeriodDurationMs(config.period)),
          warningLevel: percentUsed >= CRITICAL_THRESHOLD ? 'critical' :
                        percentUsed >= WARNING_THRESHOLD ? 'warning' : undefined,
        };
      }
    }

    // Fetch from database
    const quota = await this.getOrCreateQuota(userId, config);

    // Check if period has expired and reset if needed
    if (isExpiredPeriod(quota.periodStartAt, config.period)) {
      await this.resetQuota(userId, config.type, config.period);
      const resetQuota = await this.getOrCreateQuota(userId, config);
      quota.usedRequests = resetQuota.usedRequests;
      quota.periodStartAt = resetQuota.periodStartAt;
    }

    // Check if user is blocked
    if (quota.isBlocked) {
      if (quota.blockExpiresAt && quota.blockExpiresAt > now) {
        return {
          allowed: false,
          remaining: 0,
          limit: quota.maxRequests,
          resetAt: quota.blockExpiresAt,
          retryAfterSeconds: Math.ceil((quota.blockExpiresAt.getTime() - now.getTime()) / 1000),
          warningLevel: 'exceeded',
          message: quota.blockReason || 'User is temporarily blocked',
        };
      }
      // Block has expired, unblock user
      await this.unblockUser(userId, config.type, config.period);
    }

    const remaining = quota.maxRequests - quota.usedRequests;
    const percentUsed = (quota.usedRequests / quota.maxRequests) * 100;
    const resetAt = new Date(quota.periodStartAt.getTime() + getPeriodDurationMs(config.period));

    // Update cache
    quotaCache.set(cacheKey, {
      used: quota.usedRequests,
      limit: quota.maxRequests,
      periodStart: quota.periodStartAt,
      lastUpdated: now,
    });

    if (remaining < consumePoints) {
      return {
        allowed: false,
        remaining: 0,
        limit: quota.maxRequests,
        resetAt,
        retryAfterSeconds: Math.ceil((resetAt.getTime() - now.getTime()) / 1000),
        warningLevel: 'exceeded',
        message: `Rate limit exceeded for ${config.type}. Quota resets at ${resetAt.toISOString()}`,
      };
    }

    return {
      allowed: true,
      remaining: remaining - consumePoints,
      limit: quota.maxRequests,
      resetAt,
      warningLevel: percentUsed >= CRITICAL_THRESHOLD ? 'critical' :
                    percentUsed >= WARNING_THRESHOLD ? 'warning' : undefined,
    };
  }

  /**
   * Get or create a quota record for a user
   */
  private async getOrCreateQuota(userId: string, config: QuotaConfig) {
    let quota = await prisma.apiQuota.findUnique({
      where: {
        userId_quotaType_period: {
          userId,
          quotaType: config.type,
          period: config.period,
        },
      },
    });

    if (!quota) {
      quota = await prisma.apiQuota.create({
        data: {
          userId,
          quotaType: config.type,
          period: config.period,
          maxRequests: config.maxRequests,
          usedRequests: 0,
          periodStartAt: new Date(),
        },
      });
    }

    return quota;
  }

  /**
   * Consume quota points
   */
  private async consumeQuota(
    userId: string,
    quotaType: QuotaType,
    points: number = 1
  ): Promise<void> {
    const configs = DEFAULT_QUOTAS[quotaType];
    const now = new Date();

    for (const config of configs) {
      const cacheKey = getCacheKey(userId, config.type, config.period);

      // Update database
      await prisma.apiQuota.upsert({
        where: {
          userId_quotaType_period: {
            userId,
            quotaType: config.type,
            period: config.period,
          },
        },
        update: {
          usedRequests: { increment: points },
          lastRequestAt: now,
        },
        create: {
          userId,
          quotaType: config.type,
          period: config.period,
          maxRequests: config.maxRequests,
          usedRequests: points,
          periodStartAt: now,
          lastRequestAt: now,
        },
      });

      // Update cache
      const cached = quotaCache.get(cacheKey);
      if (cached) {
        cached.used += points;
        cached.lastUpdated = now;
      }

      // Check for alert generation
      const quota = await this.getOrCreateQuota(userId, config);
      const percentUsed = (quota.usedRequests / quota.maxRequests) * 100;

      if (percentUsed >= CRITICAL_THRESHOLD) {
        await this.createAlertIfNeeded(userId, quotaType, 'critical_95', percentUsed, quota.usedRequests, quota.maxRequests);
      } else if (percentUsed >= WARNING_THRESHOLD) {
        await this.createAlertIfNeeded(userId, quotaType, 'warning_80', percentUsed, quota.usedRequests, quota.maxRequests);
      }
    }
  }

  /**
   * Reset quota for a specific period
   */
  private async resetQuota(
    userId: string,
    quotaType: QuotaType,
    period: QuotaPeriod
  ): Promise<void> {
    await prisma.apiQuota.update({
      where: {
        userId_quotaType_period: {
          userId,
          quotaType,
          period,
        },
      },
      data: {
        usedRequests: 0,
        periodStartAt: new Date(),
      },
    });

    const cacheKey = getCacheKey(userId, quotaType, period);
    quotaCache.delete(cacheKey);
  }

  /**
   * Get current quota status
   */
  private async getQuotaStatus(
    userId: string,
    config: QuotaConfig
  ): Promise<QuotaCheckResult> {
    const quota = await this.getOrCreateQuota(userId, config);
    const remaining = quota.maxRequests - quota.usedRequests;
    const percentUsed = (quota.usedRequests / quota.maxRequests) * 100;
    const resetAt = new Date(quota.periodStartAt.getTime() + getPeriodDurationMs(config.period));

    return {
      allowed: remaining > 0,
      remaining: Math.max(0, remaining),
      limit: quota.maxRequests,
      resetAt,
      warningLevel: percentUsed >= CRITICAL_THRESHOLD ? 'critical' :
                    percentUsed >= WARNING_THRESHOLD ? 'warning' : undefined,
    };
  }

  /**
   * Get all quota statuses for a user
   */
  async getUserQuotaStatuses(userId: string): Promise<UserQuotaStatus[]> {
    const quotas = await prisma.apiQuota.findMany({
      where: { userId },
    });

    return quotas.map(quota => ({
      userId: quota.userId,
      quotaType: quota.quotaType,
      used: quota.usedRequests,
      limit: quota.maxRequests,
      remaining: Math.max(0, quota.maxRequests - quota.usedRequests),
      percentUsed: (quota.usedRequests / quota.maxRequests) * 100,
      resetAt: new Date(quota.periodStartAt.getTime() + getPeriodDurationMs(quota.period)),
      isBlocked: quota.isBlocked,
      blockReason: quota.blockReason,
    }));
  }

  /**
   * Block a user from making requests
   */
  async blockUser(
    userId: string,
    quotaType: QuotaType,
    reason: string,
    durationMinutes?: number
  ): Promise<void> {
    const blockExpiresAt = durationMinutes
      ? new Date(Date.now() + durationMinutes * 60 * 1000)
      : undefined;

    const configs = DEFAULT_QUOTAS[quotaType];
    for (const config of configs) {
      await prisma.apiQuota.upsert({
        where: {
          userId_quotaType_period: {
            userId,
            quotaType: config.type,
            period: config.period,
          },
        },
        update: {
          isBlocked: true,
          blockReason: reason,
          blockExpiresAt,
        },
        create: {
          userId,
          quotaType: config.type,
          period: config.period,
          maxRequests: config.maxRequests,
          isBlocked: true,
          blockReason: reason,
          blockExpiresAt,
        },
      });
    }

    // Create alert
    await this.createAlertIfNeeded(userId, quotaType, 'blocked', 100, 0, 0);
  }

  /**
   * Unblock a user
   */
  private async unblockUser(
    userId: string,
    quotaType: QuotaType,
    period: QuotaPeriod
  ): Promise<void> {
    await prisma.apiQuota.update({
      where: {
        userId_quotaType_period: {
          userId,
          quotaType,
          period,
        },
      },
      data: {
        isBlocked: false,
        blockReason: null,
        blockExpiresAt: null,
      },
    });
  }

  /**
   * Update user's quota limit
   */
  async updateUserQuotaLimit(
    userId: string,
    quotaType: QuotaType,
    period: QuotaPeriod,
    newLimit: number
  ): Promise<void> {
    await prisma.apiQuota.upsert({
      where: {
        userId_quotaType_period: {
          userId,
          quotaType,
          period,
        },
      },
      update: {
        maxRequests: newLimit,
      },
      create: {
        userId,
        quotaType,
        period,
        maxRequests: newLimit,
      },
    });

    const cacheKey = getCacheKey(userId, quotaType, period);
    quotaCache.delete(cacheKey);
  }

  /**
   * Create alert if not already created recently
   */
  private async createAlertIfNeeded(
    userId: string,
    quotaType: QuotaType,
    alertType: string,
    threshold: number,
    currentUsage: number,
    maxAllowed: number
  ): Promise<void> {
    // Check if we already have a recent unacknowledged alert
    const recentAlert = await prisma.quotaAlert.findFirst({
      where: {
        userId,
        quotaType,
        alertType,
        acknowledged: false,
        createdAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
        },
      },
    });

    if (recentAlert) return;

    await prisma.quotaAlert.create({
      data: {
        userId,
        quotaType,
        alertType,
        message: `User ${userId} has reached ${Math.round(threshold)}% of ${quotaType} quota`,
        threshold: Math.round(threshold),
        currentUsage,
        maxAllowed,
      },
    });
  }

  /**
   * Log API usage
   */
  async logApiUsage(
    userId: string | null,
    endpoint: string,
    method: string,
    quotaType: QuotaType,
    statusCode: number,
    responseTimeMs?: number,
    ipAddress?: string,
    userAgent?: string,
    errorMessage?: string,
    agentId?: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await prisma.apiUsageLog.create({
      data: {
        userId,
        agentId,
        endpoint,
        method,
        quotaType,
        statusCode,
        responseTimeMs,
        ipAddress,
        userAgent,
        errorMessage,
        metadata: metadata as any,
      },
    });
  }

  /**
   * Get usage statistics for a user
   */
  async getUsageStats(
    userId: string,
    quotaType?: QuotaType,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    avgResponseTime: number;
    requestsByEndpoint: Record<string, number>;
  }> {
    const where: any = {
      userId,
    };

    if (quotaType) {
      where.quotaType = quotaType;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const logs = await prisma.apiUsageLog.findMany({
      where,
      select: {
        endpoint: true,
        statusCode: true,
        responseTimeMs: true,
      },
    });

    const totalRequests = logs.length;
    const successfulRequests = logs.filter(l => l.statusCode >= 200 && l.statusCode < 300).length;
    const failedRequests = logs.filter(l => l.statusCode >= 400).length;

    const responseTimes = logs.filter(l => l.responseTimeMs != null).map(l => l.responseTimeMs!);
    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;

    const requestsByEndpoint = logs.reduce((acc, log) => {
      acc[log.endpoint] = (acc[log.endpoint] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      avgResponseTime,
      requestsByEndpoint,
    };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

const globalForQuotaManager = globalThis as unknown as {
  quotaManager?: QuotaManager;
};

export const quotaManager = globalForQuotaManager.quotaManager ?? new QuotaManager();

if (process.env.NODE_ENV !== 'production') {
  globalForQuotaManager.quotaManager = quotaManager;
}
