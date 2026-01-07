/**
 * Rate Limiting Middleware
 *
 * Middleware for applying rate limiting and quota tracking to API routes.
 * Supports both per-IP and per-user rate limiting.
 *
 * Features:
 * - Per-user quota tracking
 * - Per-IP fallback for unauthenticated requests
 * - Google Calendar API specific rate limiting
 * - Automatic usage logging
 * - Response headers with rate limit info
 */

import { NextRequest, NextResponse } from 'next/server';
import { QuotaType } from '@/generated/prisma/client';
import { quotaManager, QuotaCheckResult } from './quota-manager';
import { googleCalendarQuotaManager } from './google-calendar-quota';
import { getClientIp } from '@/lib/performance/rate-limiter';

// ============================================================================
// Types
// ============================================================================

export interface RateLimitConfig {
  quotaType: QuotaType;
  getUserId?: (req: NextRequest) => Promise<string | null>;
  skipCondition?: (req: NextRequest) => boolean;
  consumePoints?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  response?: NextResponse;
  quotaResult?: QuotaCheckResult;
  userId?: string | null;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create rate limit response headers
 */
function createRateLimitHeaders(result: QuotaCheckResult): Headers {
  const headers = new Headers();
  headers.set('X-RateLimit-Limit', String(result.limit));
  headers.set('X-RateLimit-Remaining', String(result.remaining));
  headers.set('X-RateLimit-Reset', String(Math.ceil(result.resetAt.getTime() / 1000)));
  if (result.retryAfterSeconds) {
    headers.set('Retry-After', String(result.retryAfterSeconds));
  }
  return headers;
}

/**
 * Create a 429 Too Many Requests response
 */
function createRateLimitResponse(result: QuotaCheckResult): NextResponse {
  const headers = createRateLimitHeaders(result);

  return NextResponse.json(
    {
      error: 'Rate limit exceeded',
      message: result.message || 'Too many requests. Please try again later.',
      retryAfter: result.retryAfterSeconds,
      resetAt: result.resetAt.toISOString(),
    },
    {
      status: 429,
      headers: Object.fromEntries(headers.entries()),
    }
  );
}

// ============================================================================
// Rate Limit Middleware Functions
// ============================================================================

/**
 * Apply rate limiting to a request
 *
 * @param req - The Next.js request
 * @param config - Rate limit configuration
 * @returns Rate limit result with allowed status and optional response
 */
export async function applyRateLimitMiddleware(
  req: NextRequest,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const startTime = Date.now();

  // Check skip condition
  if (config.skipCondition?.(req)) {
    return { allowed: true };
  }

  // Get user ID or fall back to IP
  let userId: string | null = null;
  if (config.getUserId) {
    userId = await config.getUserId(req);
  }
  const rateLimitKey = userId || `ip:${getClientIp(req)}`;

  // Check quota
  const quotaResult = await quotaManager.checkQuota(
    rateLimitKey,
    config.quotaType,
    config.consumePoints ?? 1
  );

  // Log usage (async, don't await)
  const endpoint = req.nextUrl.pathname;
  const method = req.method;
  const ipAddress = getClientIp(req);
  const userAgent = req.headers.get('user-agent') || undefined;

  quotaManager.logApiUsage(
    userId,
    endpoint,
    method,
    config.quotaType,
    quotaResult.allowed ? 200 : 429,
    Date.now() - startTime,
    ipAddress,
    userAgent
  ).catch(console.error);

  if (!quotaResult.allowed) {
    return {
      allowed: false,
      response: createRateLimitResponse(quotaResult),
      quotaResult,
      userId,
    };
  }

  return {
    allowed: true,
    quotaResult,
    userId,
  };
}

/**
 * Apply Google Calendar specific rate limiting
 *
 * @param req - The Next.js request
 * @param userId - The user ID making the request
 * @param agentId - Optional agent ID for logging
 * @returns Rate limit result
 */
export async function applyGoogleCalendarRateLimit(
  req: NextRequest,
  userId: string,
  agentId?: string
): Promise<RateLimitResult> {
  const startTime = Date.now();
  const quotaResult = await googleCalendarQuotaManager.checkQuota(userId);

  // Log usage
  const endpoint = req.nextUrl.pathname;
  const method = req.method;
  const ipAddress = getClientIp(req);
  const userAgent = req.headers.get('user-agent') || undefined;

  quotaManager.logApiUsage(
    userId,
    endpoint,
    method,
    QuotaType.GOOGLE_CALENDAR,
    quotaResult.allowed ? 200 : 429,
    Date.now() - startTime,
    ipAddress,
    userAgent,
    quotaResult.message,
    agentId
  ).catch(console.error);

  if (!quotaResult.allowed) {
    const headers = new Headers();
    headers.set('X-RateLimit-Limit', String(quotaResult.dailyLimit));
    headers.set('X-RateLimit-Remaining', String(quotaResult.remaining));
    headers.set('X-RateLimit-Reset', String(Math.ceil(quotaResult.resetAt.getTime() / 1000)));
    if (quotaResult.retryAfterSeconds) {
      headers.set('Retry-After', String(quotaResult.retryAfterSeconds));
    }

    const response = NextResponse.json(
      {
        error: 'Google Calendar API rate limit exceeded',
        message: quotaResult.message || 'Too many calendar requests. Please try again later.',
        retryAfter: quotaResult.retryAfterSeconds,
        resetAt: quotaResult.resetAt.toISOString(),
        quotaInfo: {
          dailyUsed: quotaResult.dailyUsed,
          dailyLimit: quotaResult.dailyLimit,
          minuteUsed: quotaResult.minuteUsed,
          minuteLimit: quotaResult.minuteLimit,
        },
      },
      {
        status: 429,
        headers: Object.fromEntries(headers.entries()),
      }
    );

    return {
      allowed: false,
      response,
      userId,
    };
  }

  return { allowed: true, userId };
}

/**
 * Record successful Google Calendar API call
 */
export async function recordGoogleCalendarSuccess(userId: string): Promise<void> {
  await googleCalendarQuotaManager.recordSuccess(userId);
}

/**
 * Record Google Calendar API error
 */
export async function recordGoogleCalendarError(
  userId: string,
  isRateLimitError: boolean = false
): Promise<void> {
  await googleCalendarQuotaManager.recordError(userId, isRateLimitError);
}

// ============================================================================
// Higher-Order Function Wrapper
// ============================================================================

/**
 * Wrap a route handler with rate limiting
 *
 * @param handler - The route handler function
 * @param config - Rate limit configuration
 * @returns Wrapped handler with rate limiting
 */
export function withRateLimit<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T,
  config: RateLimitConfig
): T {
  return (async (req: NextRequest, ...args: any[]) => {
    const result = await applyRateLimitMiddleware(req, config);

    if (!result.allowed && result.response) {
      return result.response;
    }

    const response = await handler(req, ...args);

    // Add rate limit headers to successful responses
    if (result.quotaResult) {
      const headers = createRateLimitHeaders(result.quotaResult);
      headers.forEach((value, key) => {
        response.headers.set(key, value);
      });
    }

    return response;
  }) as T;
}

/**
 * Wrap a Google Calendar route handler with rate limiting
 *
 * @param handler - The route handler function
 * @param getUserId - Function to extract user ID from agent ID in request
 * @returns Wrapped handler with Google Calendar rate limiting
 */
export function withGoogleCalendarRateLimit<T extends (req: NextRequest) => Promise<NextResponse>>(
  handler: T,
  getUserIdFromRequest: (req: NextRequest) => Promise<{ userId: string; agentId?: string } | null>
): T {
  return (async (req: NextRequest) => {
    const userInfo = await getUserIdFromRequest(req);

    if (!userInfo) {
      return handler(req);
    }

    const result = await applyGoogleCalendarRateLimit(req, userInfo.userId, userInfo.agentId);

    if (!result.allowed && result.response) {
      return result.response;
    }

    try {
      const response = await handler(req);

      // Record success if response is OK
      if (response.status >= 200 && response.status < 300) {
        await recordGoogleCalendarSuccess(userInfo.userId);
      } else if (response.status === 429) {
        await recordGoogleCalendarError(userInfo.userId, true);
      } else if (response.status >= 400) {
        await recordGoogleCalendarError(userInfo.userId, false);
      }

      return response;
    } catch (error) {
      // Record error
      const isRateLimit = error instanceof Error &&
        (error.message.includes('rate limit') || error.message.includes('quota'));
      await recordGoogleCalendarError(userInfo.userId, isRateLimit);
      throw error;
    }
  }) as T;
}

// ============================================================================
// Utility Functions for Route Handlers
// ============================================================================

/**
 * Get user ID from agent ID in request body
 * Used for Google Calendar endpoints that receive agentId
 */
export async function getUserIdFromAgentRequest(
  req: NextRequest
): Promise<{ userId: string; agentId?: string } | null> {
  try {
    const body = await req.clone().json();
    const agentId = body.agentId;

    if (!agentId) {
      return null;
    }

    const { prisma } = await import('@/lib/prisma');
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      select: { userId: true, id: true },
    });

    if (!agent) {
      return null;
    }

    return { userId: agent.userId, agentId: agent.id };
  } catch {
    return null;
  }
}

/**
 * Add rate limit headers to a response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  remaining: number,
  limit: number,
  resetAt: Date
): void {
  response.headers.set('X-RateLimit-Limit', String(limit));
  response.headers.set('X-RateLimit-Remaining', String(remaining));
  response.headers.set('X-RateLimit-Reset', String(Math.ceil(resetAt.getTime() / 1000)));
}
