/**
 * Google Calendar API Quota Manager
 *
 * Manages quota tracking specifically for Google Calendar API calls.
 * Implements Google's quota model:
 * - 1,000,000 queries per day (project-wide)
 * - Per-user rate limiting for fair resource allocation
 * - Exponential backoff for rate limit errors
 *
 * References:
 * - https://developers.google.com/calendar/api/guides/quota
 */

import { prisma } from '@/lib/prisma';

// ============================================================================
// Types
// ============================================================================

export interface GoogleCalendarQuotaResult {
  allowed: boolean;
  remaining: number;
  dailyUsed: number;
  dailyLimit: number;
  minuteUsed: number;
  minuteLimit: number;
  resetAt: Date;
  retryAfterSeconds?: number;
  isThrottled: boolean;
  message?: string;
}

export interface QuotaUsageStats {
  userId: string;
  dailyUsed: number;
  dailyLimit: number;
  dailyRemaining: number;
  dailyPercentUsed: number;
  minuteUsed: number;
  minuteLimit: number;
  consecutiveErrors: number;
  isThrottled: boolean;
  lastRequestAt: Date | null;
}

// ============================================================================
// Constants
// ============================================================================

// Google's default quotas
const DEFAULT_DAILY_LIMIT = 10000; // Per-user daily limit for fair allocation
const DEFAULT_MINUTE_LIMIT = 60; // Queries per minute per user

// Throttle durations based on consecutive errors
const THROTTLE_DURATIONS_MS: Record<number, number> = {
  1: 1000,       // 1 second
  2: 5000,       // 5 seconds
  3: 30000,      // 30 seconds
  4: 60000,      // 1 minute
  5: 300000,     // 5 minutes
};

const MAX_THROTTLE_DURATION_MS = 600000; // 10 minutes max

// ============================================================================
// In-Memory Rate Limiting
// ============================================================================

interface MinuteWindow {
  count: number;
  windowStart: Date;
}

const minuteWindows = new Map<string, MinuteWindow>();

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, window] of minuteWindows) {
    if (now - window.windowStart.getTime() > 120000) { // 2 minutes old
      minuteWindows.delete(key);
    }
  }
}, 60000);

// ============================================================================
// Google Calendar Quota Manager
// ============================================================================

export class GoogleCalendarQuotaManager {
  /**
   * Check if a Google Calendar API request is allowed
   */
  async checkQuota(userId: string, estimatedCost: number = 1): Promise<GoogleCalendarQuotaResult> {
    const now = new Date();

    // Get or create quota record
    let quota = await this.getOrCreateQuota(userId);

    // Reset daily quota if needed
    if (this.isDailyResetNeeded(quota.dailyResetAt)) {
      quota = await this.resetDailyQuota(userId);
    }

    // Reset minute window if needed
    if (this.isMinuteResetNeeded(quota.minuteWindowStart)) {
      quota = await this.resetMinuteWindow(userId);
    }

    // Check if user is throttled
    if (quota.isThrottled && quota.throttleExpiresAt && quota.throttleExpiresAt > now) {
      const retryAfterSeconds = Math.ceil((quota.throttleExpiresAt.getTime() - now.getTime()) / 1000);
      return {
        allowed: false,
        remaining: 0,
        dailyUsed: quota.userDailyUsed,
        dailyLimit: quota.userDailyLimit,
        minuteUsed: quota.minuteWindowUsed,
        minuteLimit: quota.queriesPerMinute,
        resetAt: quota.throttleExpiresAt,
        retryAfterSeconds,
        isThrottled: true,
        message: `User is rate limited due to API errors. Retry after ${retryAfterSeconds} seconds.`,
      };
    }

    // Clear throttle if expired
    if (quota.isThrottled && (!quota.throttleExpiresAt || quota.throttleExpiresAt <= now)) {
      await this.clearThrottle(userId);
      quota.isThrottled = false;
    }

    // Check daily limit
    if (quota.userDailyUsed + estimatedCost > quota.userDailyLimit) {
      const nextReset = this.getNextDailyReset();
      return {
        allowed: false,
        remaining: 0,
        dailyUsed: quota.userDailyUsed,
        dailyLimit: quota.userDailyLimit,
        minuteUsed: quota.minuteWindowUsed,
        minuteLimit: quota.queriesPerMinute,
        resetAt: nextReset,
        retryAfterSeconds: Math.ceil((nextReset.getTime() - now.getTime()) / 1000),
        isThrottled: false,
        message: 'Daily Google Calendar API quota exceeded. Quota resets at midnight.',
      };
    }

    // Check minute limit (use in-memory for speed)
    const minuteWindow = this.getMinuteWindow(userId);
    if (minuteWindow.count + estimatedCost > quota.queriesPerMinute) {
      const resetAt = new Date(minuteWindow.windowStart.getTime() + 60000);
      return {
        allowed: false,
        remaining: 0,
        dailyUsed: quota.userDailyUsed,
        dailyLimit: quota.userDailyLimit,
        minuteUsed: minuteWindow.count,
        minuteLimit: quota.queriesPerMinute,
        resetAt,
        retryAfterSeconds: Math.ceil((resetAt.getTime() - now.getTime()) / 1000),
        isThrottled: false,
        message: 'Per-minute rate limit reached. Please wait briefly and try again.',
      };
    }

    // All checks passed
    const remaining = Math.min(
      quota.userDailyLimit - quota.userDailyUsed - estimatedCost,
      quota.queriesPerMinute - minuteWindow.count - estimatedCost
    );

    return {
      allowed: true,
      remaining,
      dailyUsed: quota.userDailyUsed,
      dailyLimit: quota.userDailyLimit,
      minuteUsed: minuteWindow.count,
      minuteLimit: quota.queriesPerMinute,
      resetAt: new Date(minuteWindow.windowStart.getTime() + 60000),
      isThrottled: false,
    };
  }

  /**
   * Record a successful API call
   */
  async recordSuccess(userId: string, cost: number = 1): Promise<void> {
    const now = new Date();

    // Update database
    await prisma.googleCalendarQuota.upsert({
      where: { userId },
      update: {
        userDailyUsed: { increment: cost },
        dailyRequestsUsed: { increment: cost },
        minuteWindowUsed: { increment: cost },
        lastRequestAt: now,
        consecutiveErrors: 0, // Reset on success
      },
      create: {
        userId,
        userDailyUsed: cost,
        dailyRequestsUsed: cost,
        minuteWindowUsed: cost,
        lastRequestAt: now,
        userDailyLimit: DEFAULT_DAILY_LIMIT,
        queriesPerMinute: DEFAULT_MINUTE_LIMIT,
      },
    });

    // Update in-memory minute window
    this.incrementMinuteWindow(userId, cost);
  }

  /**
   * Record an API error (triggers throttling after consecutive errors)
   */
  async recordError(userId: string, isRateLimitError: boolean = false): Promise<void> {
    const now = new Date();

    const quota = await this.getOrCreateQuota(userId);
    const newErrorCount = quota.consecutiveErrors + 1;

    // Calculate throttle duration based on consecutive errors
    let throttleDurationMs = THROTTLE_DURATIONS_MS[newErrorCount] || MAX_THROTTLE_DURATION_MS;
    if (isRateLimitError) {
      // More aggressive throttling for rate limit errors
      throttleDurationMs = Math.min(throttleDurationMs * 2, MAX_THROTTLE_DURATION_MS);
    }

    const throttleExpiresAt = new Date(now.getTime() + throttleDurationMs);

    await prisma.googleCalendarQuota.update({
      where: { userId },
      data: {
        consecutiveErrors: newErrorCount,
        lastErrorAt: now,
        isThrottled: newErrorCount >= 2, // Start throttling after 2 consecutive errors
        throttleExpiresAt: newErrorCount >= 2 ? throttleExpiresAt : null,
      },
    });
  }

  /**
   * Get quota usage statistics for a user
   */
  async getUsageStats(userId: string): Promise<QuotaUsageStats> {
    const quota = await this.getOrCreateQuota(userId);
    const minuteWindow = this.getMinuteWindow(userId);

    return {
      userId,
      dailyUsed: quota.userDailyUsed,
      dailyLimit: quota.userDailyLimit,
      dailyRemaining: Math.max(0, quota.userDailyLimit - quota.userDailyUsed),
      dailyPercentUsed: (quota.userDailyUsed / quota.userDailyLimit) * 100,
      minuteUsed: minuteWindow.count,
      minuteLimit: quota.queriesPerMinute,
      consecutiveErrors: quota.consecutiveErrors,
      isThrottled: quota.isThrottled,
      lastRequestAt: quota.lastRequestAt,
    };
  }

  /**
   * Update user's quota limits (admin function)
   */
  async updateUserLimits(
    userId: string,
    dailyLimit?: number,
    minuteLimit?: number
  ): Promise<void> {
    const data: any = {};
    if (dailyLimit !== undefined) data.userDailyLimit = dailyLimit;
    if (minuteLimit !== undefined) data.queriesPerMinute = minuteLimit;

    await prisma.googleCalendarQuota.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        userDailyLimit: dailyLimit ?? DEFAULT_DAILY_LIMIT,
        queriesPerMinute: minuteLimit ?? DEFAULT_MINUTE_LIMIT,
      },
    });
  }

  /**
   * Manually throttle a user
   */
  async throttleUser(userId: string, durationMinutes: number, reason?: string): Promise<void> {
    const throttleExpiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);

    await prisma.googleCalendarQuota.upsert({
      where: { userId },
      update: {
        isThrottled: true,
        throttleExpiresAt,
      },
      create: {
        userId,
        isThrottled: true,
        throttleExpiresAt,
        userDailyLimit: DEFAULT_DAILY_LIMIT,
        queriesPerMinute: DEFAULT_MINUTE_LIMIT,
      },
    });

    console.log(`User ${userId} throttled for ${durationMinutes} minutes. Reason: ${reason || 'Manual throttle'}`);
  }

  /**
   * Clear throttle for a user
   */
  async clearThrottle(userId: string): Promise<void> {
    await prisma.googleCalendarQuota.update({
      where: { userId },
      data: {
        isThrottled: false,
        throttleExpiresAt: null,
        consecutiveErrors: 0,
      },
    });
  }

  /**
   * Get all users approaching quota limits
   */
  async getUsersNearQuotaLimit(thresholdPercent: number = 80): Promise<QuotaUsageStats[]> {
    const quotas = await prisma.googleCalendarQuota.findMany({
      where: {
        userDailyUsed: {
          gt: 0,
        },
      },
    });

    return quotas
      .filter(q => (q.userDailyUsed / q.userDailyLimit) * 100 >= thresholdPercent)
      .map(q => ({
        userId: q.userId,
        dailyUsed: q.userDailyUsed,
        dailyLimit: q.userDailyLimit,
        dailyRemaining: Math.max(0, q.userDailyLimit - q.userDailyUsed),
        dailyPercentUsed: (q.userDailyUsed / q.userDailyLimit) * 100,
        minuteUsed: q.minuteWindowUsed,
        minuteLimit: q.queriesPerMinute,
        consecutiveErrors: q.consecutiveErrors,
        isThrottled: q.isThrottled,
        lastRequestAt: q.lastRequestAt,
      }));
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private async getOrCreateQuota(userId: string) {
    let quota = await prisma.googleCalendarQuota.findUnique({
      where: { userId },
    });

    if (!quota) {
      quota = await prisma.googleCalendarQuota.create({
        data: {
          userId,
          userDailyLimit: DEFAULT_DAILY_LIMIT,
          queriesPerMinute: DEFAULT_MINUTE_LIMIT,
        },
      });
    }

    return quota;
  }

  private isDailyResetNeeded(dailyResetAt: Date): boolean {
    const now = new Date();
    // Reset at midnight UTC
    return now.getUTCDate() !== dailyResetAt.getUTCDate() ||
           now.getUTCMonth() !== dailyResetAt.getUTCMonth() ||
           now.getUTCFullYear() !== dailyResetAt.getUTCFullYear();
  }

  private isMinuteResetNeeded(minuteWindowStart: Date): boolean {
    return Date.now() - minuteWindowStart.getTime() >= 60000;
  }

  private async resetDailyQuota(userId: string) {
    return prisma.googleCalendarQuota.update({
      where: { userId },
      data: {
        userDailyUsed: 0,
        dailyRequestsUsed: 0,
        dailyResetAt: new Date(),
      },
    });
  }

  private async resetMinuteWindow(userId: string) {
    minuteWindows.delete(userId);
    return prisma.googleCalendarQuota.update({
      where: { userId },
      data: {
        minuteWindowUsed: 0,
        minuteWindowStart: new Date(),
      },
    });
  }

  private getMinuteWindow(userId: string): MinuteWindow {
    let window = minuteWindows.get(userId);
    const now = new Date();

    if (!window || now.getTime() - window.windowStart.getTime() >= 60000) {
      window = { count: 0, windowStart: now };
      minuteWindows.set(userId, window);
    }

    return window;
  }

  private incrementMinuteWindow(userId: string, amount: number): void {
    const window = this.getMinuteWindow(userId);
    window.count += amount;
  }

  private getNextDailyReset(): Date {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);
    return tomorrow;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

const globalForGoogleCalendarQuota = globalThis as unknown as {
  googleCalendarQuotaManager?: GoogleCalendarQuotaManager;
};

export const googleCalendarQuotaManager =
  globalForGoogleCalendarQuota.googleCalendarQuotaManager ?? new GoogleCalendarQuotaManager();

if (process.env.NODE_ENV !== 'production') {
  globalForGoogleCalendarQuota.googleCalendarQuotaManager = googleCalendarQuotaManager;
}
