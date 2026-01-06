/**
 * Request Context Management
 *
 * Provides request ID generation and context tracking for
 * request correlation across the application.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRequestLogger, Logger } from './logger';

/**
 * Generate a unique request ID
 * Format: timestamp-random (e.g., "1704067200000-a1b2c3d4")
 */
export function generateRequestId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${random}`;
}

/**
 * Request context interface
 */
export interface RequestContext {
  requestId: string;
  startTime: number;
  path: string;
  method: string;
  userId?: string;
  logger: Logger;
}

/**
 * Header name for request ID
 */
export const REQUEST_ID_HEADER = 'x-request-id';

/**
 * Extract or generate request ID from request
 */
export function getRequestId(request: Request | NextRequest): string {
  const existingId = request.headers.get(REQUEST_ID_HEADER);
  if (existingId && /^[\w-]+$/.test(existingId)) {
    return existingId;
  }
  return generateRequestId();
}

/**
 * Create request context from Next.js request
 */
export function createRequestContext(request: NextRequest): RequestContext {
  const requestId = getRequestId(request);
  const url = new URL(request.url);

  return {
    requestId,
    startTime: Date.now(),
    path: url.pathname,
    method: request.method,
    logger: createRequestLogger(requestId, {
      path: url.pathname,
      method: request.method,
    }),
  };
}

/**
 * Add request ID to response headers
 */
export function addRequestIdToResponse(
  response: NextResponse,
  requestId: string
): NextResponse {
  response.headers.set(REQUEST_ID_HEADER, requestId);
  return response;
}

/**
 * Extract request metadata for logging/error tracking
 */
export function extractRequestMetadata(request: Request | NextRequest): {
  requestId: string;
  path: string;
  method: string;
  userAgent: string;
  ipAddress: string;
  referer: string | null;
} {
  const url = new URL(request.url);

  // Extract IP address from various headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  const ipAddress = cfConnectingIp || forwardedFor?.split(',')[0].trim() || realIp || 'unknown';

  return {
    requestId: getRequestId(request),
    path: url.pathname,
    method: request.method,
    userAgent: request.headers.get('user-agent') || 'unknown',
    ipAddress,
    referer: request.headers.get('referer'),
  };
}

/**
 * Calculate request duration
 */
export function getRequestDuration(context: RequestContext): number {
  return Date.now() - context.startTime;
}

/**
 * Async local storage for request context (Node.js)
 * Note: This works in Node.js runtime but not in Edge runtime
 */
let requestContextStorage: Map<string, RequestContext> | null = null;

/**
 * Initialize request context storage
 */
export function initRequestContextStorage(): void {
  if (!requestContextStorage) {
    requestContextStorage = new Map();
  }
}

/**
 * Store request context
 */
export function setRequestContext(context: RequestContext): void {
  if (requestContextStorage) {
    requestContextStorage.set(context.requestId, context);
  }
}

/**
 * Get current request context by ID
 */
export function getRequestContext(requestId: string): RequestContext | undefined {
  return requestContextStorage?.get(requestId);
}

/**
 * Clear request context
 */
export function clearRequestContext(requestId: string): void {
  requestContextStorage?.delete(requestId);
}

// Initialize storage on module load
initRequestContextStorage();
