import { NextResponse } from 'next/server';
import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible';

/**
 * Rate limiters for protecting API endpoints from abuse
 *
 * Uses in-memory storage (appropriate for single-server deployment).
 * All limiters fail open (allow request if limiter errors) to prevent DoS.
 */

/**
 * Auth limiter: 5 requests per 15 minutes
 * Protects login endpoint from brute force attacks
 */
export const authLimiter = new RateLimiterMemory({
  keyPrefix: 'login',
  points: 5,
  duration: 15 * 60, // 15 minutes
  blockDuration: 15 * 60, // Block for 15 minutes when exceeded
});

/**
 * Register limiter: 3 requests per hour
 * Prevents spam account creation
 */
export const registerLimiter = new RateLimiterMemory({
  keyPrefix: 'register',
  points: 3,
  duration: 60 * 60, // 1 hour
  blockDuration: 60 * 60, // Block for 1 hour when exceeded
});

/**
 * Generate limiter: 10 requests per minute
 * Protects expensive AI generation endpoint
 */
export const generateLimiter = new RateLimiterMemory({
  keyPrefix: 'generate',
  points: 10,
  duration: 60, // 1 minute
  blockDuration: 60, // Block for 1 minute when exceeded
});

/**
 * Extract client IP address from request headers
 * Checks x-forwarded-for, x-real-ip, then falls back to 'unknown'
 */
export function getClientIp(request: Request): string {
  // Check x-forwarded-for (may contain multiple IPs)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Take the first IP (original client)
    const firstIp = forwardedFor.split(',')[0].trim();
    if (firstIp) return firstIp;
  }

  // Check x-real-ip
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;

  // Fallback
  return 'unknown';
}

/**
 * Apply rate limiting and return 429 response if exceeded
 * Returns null if request is allowed, NextResponse with 429 if rate limited
 *
 * Fails open on errors (allows request) to prevent rate limiter issues from causing DoS
 */
export async function applyRateLimit(
  limiter: RateLimiterMemory,
  key: string
): Promise<NextResponse | null> {
  try {
    await limiter.consume(key);
    return null; // Request allowed
  } catch (error) {
    // Rate limit exceeded
    if (error instanceof RateLimiterRes) {
      const retryAfterSeconds = Math.ceil(error.msBeforeNext / 1000);

      return NextResponse.json(
        { error: 'Zu viele Anfragen. Bitte warten Sie.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfterSeconds),
            'X-RateLimit-Limit': String(limiter.points),
            'X-RateLimit-Remaining': String(error.remainingPoints),
            'X-RateLimit-Reset': String(
              Math.ceil(Date.now() / 1000) + retryAfterSeconds
            ),
          },
        }
      );
    }

    // Unknown error - fail open (allow request)
    console.error('Rate limiter error (failing open):', error);
    return null;
  }
}
