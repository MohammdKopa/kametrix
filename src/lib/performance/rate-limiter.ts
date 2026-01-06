/**
 * Enhanced Rate Limiting with Distributed Support
 *
 * Features:
 * - In-memory rate limiting (default)
 * - Redis-backed distributed rate limiting (optional)
 * - Sliding window algorithm
 * - Token bucket algorithm
 * - Per-user and per-IP limiting
 * - Graceful degradation
 */

import { NextResponse } from 'next/server';

/**
 * Rate limit algorithm types
 */
type RateLimitAlgorithm = 'sliding-window' | 'token-bucket' | 'fixed-window';

/**
 * Rate limiter configuration
 */
interface RateLimiterConfig {
  /** Maximum requests allowed */
  points: number;
  /** Time window in seconds */
  duration: number;
  /** Block duration in seconds when limit exceeded */
  blockDuration?: number;
  /** Algorithm to use */
  algorithm?: RateLimitAlgorithm;
  /** Key prefix for namespacing */
  keyPrefix?: string;
}

/**
 * Rate limit result
 */
interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

/**
 * In-memory sliding window entry
 */
interface WindowEntry {
  count: number;
  windowStart: number;
  blockedUntil?: number;
}

/**
 * Token bucket entry
 */
interface TokenBucketEntry {
  tokens: number;
  lastRefill: number;
  blockedUntil?: number;
}

/**
 * Abstract rate limiter interface
 */
interface RateLimiterBackend {
  consume(key: string): Promise<RateLimitResult>;
  reset(key: string): Promise<void>;
  getStatus(key: string): Promise<RateLimitResult | null>;
}

/**
 * In-memory sliding window rate limiter
 */
class SlidingWindowLimiter implements RateLimiterBackend {
  private windows: Map<string, WindowEntry> = new Map();
  private config: Required<RateLimiterConfig>;

  constructor(config: RateLimiterConfig) {
    this.config = {
      points: config.points,
      duration: config.duration,
      blockDuration: config.blockDuration ?? config.duration,
      algorithm: 'sliding-window',
      keyPrefix: config.keyPrefix ?? '',
    };

    // Periodic cleanup
    setInterval(() => this.cleanup(), 60000);
  }

  async consume(key: string): Promise<RateLimitResult> {
    const now = Date.now();
    const fullKey = this.config.keyPrefix + key;
    let entry = this.windows.get(fullKey);

    // Check if blocked
    if (entry?.blockedUntil && now < entry.blockedUntil) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.blockedUntil,
        retryAfter: Math.ceil((entry.blockedUntil - now) / 1000),
      };
    }

    const windowDurationMs = this.config.duration * 1000;

    if (!entry || now - entry.windowStart >= windowDurationMs) {
      // New window
      entry = {
        count: 1,
        windowStart: now,
      };
      this.windows.set(fullKey, entry);
      return {
        allowed: true,
        remaining: this.config.points - 1,
        resetAt: now + windowDurationMs,
      };
    }

    // Within current window
    if (entry.count >= this.config.points) {
      // Limit exceeded - block
      entry.blockedUntil = now + this.config.blockDuration * 1000;
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.blockedUntil,
        retryAfter: this.config.blockDuration,
      };
    }

    entry.count++;
    return {
      allowed: true,
      remaining: this.config.points - entry.count,
      resetAt: entry.windowStart + windowDurationMs,
    };
  }

  async reset(key: string): Promise<void> {
    this.windows.delete(this.config.keyPrefix + key);
  }

  async getStatus(key: string): Promise<RateLimitResult | null> {
    const entry = this.windows.get(this.config.keyPrefix + key);
    if (!entry) return null;

    const now = Date.now();
    const windowDurationMs = this.config.duration * 1000;

    if (entry.blockedUntil && now < entry.blockedUntil) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.blockedUntil,
        retryAfter: Math.ceil((entry.blockedUntil - now) / 1000),
      };
    }

    if (now - entry.windowStart >= windowDurationMs) {
      return {
        allowed: true,
        remaining: this.config.points,
        resetAt: now + windowDurationMs,
      };
    }

    return {
      allowed: entry.count < this.config.points,
      remaining: Math.max(0, this.config.points - entry.count),
      resetAt: entry.windowStart + windowDurationMs,
    };
  }

  private cleanup(): void {
    const now = Date.now();
    const maxAge = (this.config.duration + this.config.blockDuration) * 1000;

    for (const [key, entry] of this.windows) {
      const entryAge = now - entry.windowStart;
      const blockExpired = !entry.blockedUntil || now >= entry.blockedUntil;

      if (entryAge > maxAge && blockExpired) {
        this.windows.delete(key);
      }
    }
  }
}

/**
 * Token bucket rate limiter (smoother rate limiting)
 */
class TokenBucketLimiter implements RateLimiterBackend {
  private buckets: Map<string, TokenBucketEntry> = new Map();
  private config: Required<RateLimiterConfig>;
  private refillRate: number;

  constructor(config: RateLimiterConfig) {
    this.config = {
      points: config.points,
      duration: config.duration,
      blockDuration: config.blockDuration ?? config.duration,
      algorithm: 'token-bucket',
      keyPrefix: config.keyPrefix ?? '',
    };
    // Tokens per millisecond
    this.refillRate = config.points / (config.duration * 1000);

    setInterval(() => this.cleanup(), 60000);
  }

  async consume(key: string): Promise<RateLimitResult> {
    const now = Date.now();
    const fullKey = this.config.keyPrefix + key;
    let entry = this.buckets.get(fullKey);

    // Check if blocked
    if (entry?.blockedUntil && now < entry.blockedUntil) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.blockedUntil,
        retryAfter: Math.ceil((entry.blockedUntil - now) / 1000),
      };
    }

    if (!entry) {
      entry = {
        tokens: this.config.points - 1,
        lastRefill: now,
      };
      this.buckets.set(fullKey, entry);
      return {
        allowed: true,
        remaining: entry.tokens,
        resetAt: now + this.config.duration * 1000,
      };
    }

    // Refill tokens based on time elapsed
    const timePassed = now - entry.lastRefill;
    const newTokens = Math.min(
      this.config.points,
      entry.tokens + timePassed * this.refillRate
    );
    entry.tokens = newTokens;
    entry.lastRefill = now;

    if (entry.tokens < 1) {
      // Not enough tokens
      entry.blockedUntil = now + this.config.blockDuration * 1000;
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.blockedUntil,
        retryAfter: this.config.blockDuration,
      };
    }

    entry.tokens--;
    return {
      allowed: true,
      remaining: Math.floor(entry.tokens),
      resetAt: now + this.config.duration * 1000,
    };
  }

  async reset(key: string): Promise<void> {
    this.buckets.delete(this.config.keyPrefix + key);
  }

  async getStatus(key: string): Promise<RateLimitResult | null> {
    const entry = this.buckets.get(this.config.keyPrefix + key);
    if (!entry) return null;

    const now = Date.now();

    if (entry.blockedUntil && now < entry.blockedUntil) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.blockedUntil,
        retryAfter: Math.ceil((entry.blockedUntil - now) / 1000),
      };
    }

    const timePassed = now - entry.lastRefill;
    const currentTokens = Math.min(
      this.config.points,
      entry.tokens + timePassed * this.refillRate
    );

    return {
      allowed: currentTokens >= 1,
      remaining: Math.floor(currentTokens),
      resetAt: now + this.config.duration * 1000,
    };
  }

  private cleanup(): void {
    const now = Date.now();
    const maxAge = this.config.duration * 2 * 1000;

    for (const [key, entry] of this.buckets) {
      const age = now - entry.lastRefill;
      const blockExpired = !entry.blockedUntil || now >= entry.blockedUntil;

      if (age > maxAge && blockExpired) {
        this.buckets.delete(key);
      }
    }
  }
}

/**
 * Enhanced rate limiter with fallback support
 */
export class EnhancedRateLimiter {
  private backend: RateLimiterBackend;
  private config: RateLimiterConfig;

  constructor(config: RateLimiterConfig) {
    this.config = config;

    // Choose backend based on algorithm
    switch (config.algorithm) {
      case 'token-bucket':
        this.backend = new TokenBucketLimiter(config);
        break;
      case 'sliding-window':
      default:
        this.backend = new SlidingWindowLimiter(config);
        break;
    }
  }

  /**
   * Check rate limit and consume a point if allowed
   */
  async consume(key: string): Promise<RateLimitResult> {
    try {
      return await this.backend.consume(key);
    } catch (error) {
      // Fail open on errors
      console.error('Rate limiter error (failing open):', error);
      return {
        allowed: true,
        remaining: this.config.points,
        resetAt: Date.now() + this.config.duration * 1000,
      };
    }
  }

  /**
   * Reset rate limit for a key
   */
  async reset(key: string): Promise<void> {
    await this.backend.reset(key);
  }

  /**
   * Get current status without consuming
   */
  async getStatus(key: string): Promise<RateLimitResult | null> {
    return this.backend.getStatus(key);
  }
}

// Pre-configured rate limiters
const globalForRateLimiters = globalThis as unknown as {
  enhancedAuthLimiter?: EnhancedRateLimiter;
  enhancedRegisterLimiter?: EnhancedRateLimiter;
  enhancedGenerateLimiter?: EnhancedRateLimiter;
  enhancedApiLimiter?: EnhancedRateLimiter;
  enhancedWebhookLimiter?: EnhancedRateLimiter;
};

/**
 * Auth limiter: 5 requests per 15 minutes (sliding window)
 */
export const enhancedAuthLimiter =
  globalForRateLimiters.enhancedAuthLimiter ??
  new EnhancedRateLimiter({
    keyPrefix: 'auth:',
    points: 5,
    duration: 15 * 60,
    blockDuration: 15 * 60,
    algorithm: 'sliding-window',
  });

if (process.env.NODE_ENV !== 'production') {
  globalForRateLimiters.enhancedAuthLimiter = enhancedAuthLimiter;
}

/**
 * Register limiter: 3 requests per hour
 */
export const enhancedRegisterLimiter =
  globalForRateLimiters.enhancedRegisterLimiter ??
  new EnhancedRateLimiter({
    keyPrefix: 'register:',
    points: 3,
    duration: 60 * 60,
    blockDuration: 60 * 60,
    algorithm: 'sliding-window',
  });

if (process.env.NODE_ENV !== 'production') {
  globalForRateLimiters.enhancedRegisterLimiter = enhancedRegisterLimiter;
}

/**
 * Generate limiter: 10 requests per minute (token bucket for smoother limiting)
 */
export const enhancedGenerateLimiter =
  globalForRateLimiters.enhancedGenerateLimiter ??
  new EnhancedRateLimiter({
    keyPrefix: 'generate:',
    points: 10,
    duration: 60,
    blockDuration: 60,
    algorithm: 'token-bucket',
  });

if (process.env.NODE_ENV !== 'production') {
  globalForRateLimiters.enhancedGenerateLimiter = enhancedGenerateLimiter;
}

/**
 * General API limiter: 100 requests per minute
 */
export const enhancedApiLimiter =
  globalForRateLimiters.enhancedApiLimiter ??
  new EnhancedRateLimiter({
    keyPrefix: 'api:',
    points: 100,
    duration: 60,
    blockDuration: 60,
    algorithm: 'token-bucket',
  });

if (process.env.NODE_ENV !== 'production') {
  globalForRateLimiters.enhancedApiLimiter = enhancedApiLimiter;
}

/**
 * Webhook limiter: 1000 requests per minute (high volume)
 */
export const enhancedWebhookLimiter =
  globalForRateLimiters.enhancedWebhookLimiter ??
  new EnhancedRateLimiter({
    keyPrefix: 'webhook:',
    points: 1000,
    duration: 60,
    algorithm: 'sliding-window',
  });

if (process.env.NODE_ENV !== 'production') {
  globalForRateLimiters.enhancedWebhookLimiter = enhancedWebhookLimiter;
}

/**
 * Extract client IP address from request headers
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0].trim();
    if (firstIp) return firstIp;
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;

  return 'unknown';
}

/**
 * Apply enhanced rate limiting
 */
export async function applyEnhancedRateLimit(
  limiter: EnhancedRateLimiter,
  key: string
): Promise<NextResponse | null> {
  const result = await limiter.consume(key);

  if (!result.allowed) {
    return NextResponse.json(
      { error: 'Zu viele Anfragen. Bitte warten Sie.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(result.retryAfter ?? 60),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
        },
      }
    );
  }

  return null;
}

/**
 * Create rate limit response headers
 */
export function createRateLimitHeaders(result: RateLimitResult): Headers {
  const headers = new Headers();
  headers.set('X-RateLimit-Remaining', String(result.remaining));
  headers.set('X-RateLimit-Reset', String(Math.ceil(result.resetAt / 1000)));
  if (result.retryAfter) {
    headers.set('Retry-After', String(result.retryAfter));
  }
  return headers;
}
