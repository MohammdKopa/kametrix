/**
 * Security Audit Logging
 *
 * Tracks security-relevant events for monitoring and compliance
 * Can be extended to write to external logging services
 */

import { prisma } from '@/lib/prisma';

export type AuditEventType =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILURE'
  | 'LOGOUT'
  | 'REGISTER'
  | 'PASSWORD_CHANGE'
  | 'PASSWORD_RESET_REQUEST'
  | 'PASSWORD_RESET_COMPLETE'
  | 'SESSION_EXPIRED'
  | 'SESSION_INVALIDATED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'UNAUTHORIZED_ACCESS'
  | 'ADMIN_ACTION'
  | 'GOOGLE_CONNECT'
  | 'GOOGLE_DISCONNECT'
  | 'GOOGLE_TOKEN_REFRESH'
  | 'GOOGLE_TOKEN_REVOKED'
  | 'WEBHOOK_SIGNATURE_INVALID'
  | 'API_KEY_USAGE'
  | 'SUSPICIOUS_ACTIVITY'
  | 'CREDIT_PURCHASE'
  | 'CREDIT_DEDUCTION';

export type AuditSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

export interface AuditLogEntry {
  /** Type of security event */
  eventType: AuditEventType;
  /** Severity level */
  severity: AuditSeverity;
  /** User ID if applicable */
  userId?: string;
  /** Client IP address */
  ipAddress?: string;
  /** User agent string */
  userAgent?: string;
  /** Resource being accessed */
  resource?: string;
  /** HTTP method */
  method?: string;
  /** Additional event details */
  details?: Record<string, unknown>;
  /** Timestamp (auto-generated if not provided) */
  timestamp?: Date;
}

// In-memory buffer for batch writes (configurable)
const LOG_BUFFER: AuditLogEntry[] = [];
const BUFFER_SIZE = 100;
const FLUSH_INTERVAL_MS = 30000; // 30 seconds

let flushInterval: NodeJS.Timeout | null = null;

/**
 * Map event types to default severity
 */
const EVENT_SEVERITY_MAP: Record<AuditEventType, AuditSeverity> = {
  LOGIN_SUCCESS: 'INFO',
  LOGIN_FAILURE: 'WARNING',
  LOGOUT: 'INFO',
  REGISTER: 'INFO',
  PASSWORD_CHANGE: 'INFO',
  PASSWORD_RESET_REQUEST: 'INFO',
  PASSWORD_RESET_COMPLETE: 'INFO',
  SESSION_EXPIRED: 'INFO',
  SESSION_INVALIDATED: 'INFO',
  RATE_LIMIT_EXCEEDED: 'WARNING',
  UNAUTHORIZED_ACCESS: 'ERROR',
  ADMIN_ACTION: 'INFO',
  GOOGLE_CONNECT: 'INFO',
  GOOGLE_DISCONNECT: 'INFO',
  GOOGLE_TOKEN_REFRESH: 'INFO',
  GOOGLE_TOKEN_REVOKED: 'WARNING',
  WEBHOOK_SIGNATURE_INVALID: 'ERROR',
  API_KEY_USAGE: 'INFO',
  SUSPICIOUS_ACTIVITY: 'CRITICAL',
  CREDIT_PURCHASE: 'INFO',
  CREDIT_DEDUCTION: 'INFO',
};

/**
 * Format log entry for console output
 */
function formatLogEntry(entry: AuditLogEntry): string {
  const timestamp = (entry.timestamp || new Date()).toISOString();
  const userId = entry.userId || 'anonymous';
  const ip = entry.ipAddress || 'unknown';

  let message = `[AUDIT] ${timestamp} [${entry.severity}] ${entry.eventType} - User: ${userId}, IP: ${ip}`;

  if (entry.resource) {
    message += `, Resource: ${entry.resource}`;
  }

  if (entry.method) {
    message += `, Method: ${entry.method}`;
  }

  if (entry.details && Object.keys(entry.details).length > 0) {
    // Sanitize details to avoid logging sensitive data
    const safeDetails = sanitizeLogDetails(entry.details);
    message += `, Details: ${JSON.stringify(safeDetails)}`;
  }

  return message;
}

/**
 * Sanitize log details to remove sensitive information
 */
function sanitizeLogDetails(details: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = [
    'password',
    'passwordHash',
    'token',
    'accessToken',
    'refreshToken',
    'apiKey',
    'secret',
    'authorization',
    'cookie',
    'sessionToken',
  ];

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(details)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some((k) => lowerKey.includes(k))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeLogDetails(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Write log entry to console (and optionally database)
 */
async function writeLog(entry: AuditLogEntry): Promise<void> {
  // Always log to console
  const severity = entry.severity || EVENT_SEVERITY_MAP[entry.eventType];

  switch (severity) {
    case 'CRITICAL':
    case 'ERROR':
      console.error(formatLogEntry(entry));
      break;
    case 'WARNING':
      console.warn(formatLogEntry(entry));
      break;
    default:
      console.log(formatLogEntry(entry));
  }

  // Add to buffer for batch database writes
  LOG_BUFFER.push({
    ...entry,
    severity,
    timestamp: entry.timestamp || new Date(),
  });

  // Flush if buffer is full
  if (LOG_BUFFER.length >= BUFFER_SIZE) {
    await flushLogBuffer();
  }
}

/**
 * Flush log buffer to database
 */
async function flushLogBuffer(): Promise<void> {
  if (LOG_BUFFER.length === 0) return;

  const entriesToWrite = [...LOG_BUFFER];
  LOG_BUFFER.length = 0;

  try {
    // Write to database using Prisma
    // Note: This requires an AuditLog model in the schema
    // For now, we'll skip database writes if the model doesn't exist
    await prisma.$executeRaw`
      INSERT INTO "AuditLog" ("eventType", "severity", "userId", "ipAddress", "userAgent", "resource", "method", "details", "timestamp")
      SELECT
        unnest(${entriesToWrite.map((e) => e.eventType)}::text[]),
        unnest(${entriesToWrite.map((e) => e.severity)}::text[]),
        unnest(${entriesToWrite.map((e) => e.userId || null)}::text[]),
        unnest(${entriesToWrite.map((e) => e.ipAddress || null)}::text[]),
        unnest(${entriesToWrite.map((e) => e.userAgent || null)}::text[]),
        unnest(${entriesToWrite.map((e) => e.resource || null)}::text[]),
        unnest(${entriesToWrite.map((e) => e.method || null)}::text[]),
        unnest(${entriesToWrite.map((e) => JSON.stringify(e.details || {}))}::jsonb[]),
        unnest(${entriesToWrite.map((e) => e.timestamp?.toISOString() || new Date().toISOString())}::timestamp[])
    `.catch(() => {
      // AuditLog table may not exist yet, which is fine
      // Logs are still written to console
    });
  } catch (error) {
    // Don't fail the application if logging fails
    console.error('[AUDIT] Failed to flush log buffer:', error);
    // Re-add entries to buffer for retry (with limit to prevent memory issues)
    if (LOG_BUFFER.length < BUFFER_SIZE * 2) {
      LOG_BUFFER.push(...entriesToWrite);
    }
  }
}

/**
 * Start periodic log flushing
 */
export function startAuditLogFlusher(): void {
  if (flushInterval) return;

  flushInterval = setInterval(() => {
    flushLogBuffer().catch(console.error);
  }, FLUSH_INTERVAL_MS);

  // Ensure buffer is flushed on process exit
  process.on('beforeExit', () => {
    flushLogBuffer().catch(console.error);
  });
}

/**
 * Stop periodic log flushing
 */
export function stopAuditLogFlusher(): void {
  if (flushInterval) {
    clearInterval(flushInterval);
    flushInterval = null;
  }
}

/**
 * Log a security event
 */
export async function auditLog(entry: AuditLogEntry): Promise<void> {
  await writeLog(entry);
}

/**
 * Log authentication success
 */
export async function logLoginSuccess(
  userId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await auditLog({
    eventType: 'LOGIN_SUCCESS',
    severity: 'INFO',
    userId,
    ipAddress,
    userAgent,
  });
}

/**
 * Log authentication failure
 */
export async function logLoginFailure(
  email: string,
  reason: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await auditLog({
    eventType: 'LOGIN_FAILURE',
    severity: 'WARNING',
    ipAddress,
    userAgent,
    details: { email: email.substring(0, 3) + '***', reason },
  });
}

/**
 * Log user registration
 */
export async function logRegistration(
  userId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await auditLog({
    eventType: 'REGISTER',
    severity: 'INFO',
    userId,
    ipAddress,
    userAgent,
  });
}

/**
 * Log rate limit exceeded
 */
export async function logRateLimitExceeded(
  endpoint: string,
  ipAddress?: string,
  userId?: string
): Promise<void> {
  await auditLog({
    eventType: 'RATE_LIMIT_EXCEEDED',
    severity: 'WARNING',
    userId,
    ipAddress,
    resource: endpoint,
    details: { endpoint },
  });
}

/**
 * Log unauthorized access attempt
 */
export async function logUnauthorizedAccess(
  resource: string,
  method: string,
  ipAddress?: string,
  userId?: string,
  reason?: string
): Promise<void> {
  await auditLog({
    eventType: 'UNAUTHORIZED_ACCESS',
    severity: 'ERROR',
    userId,
    ipAddress,
    resource,
    method,
    details: { reason },
  });
}

/**
 * Log admin action
 */
export async function logAdminAction(
  adminUserId: string,
  action: string,
  targetUserId?: string,
  details?: Record<string, unknown>,
  ipAddress?: string
): Promise<void> {
  await auditLog({
    eventType: 'ADMIN_ACTION',
    severity: 'INFO',
    userId: adminUserId,
    ipAddress,
    details: { action, targetUserId, ...details },
  });
}

/**
 * Log Google OAuth connection
 */
export async function logGoogleConnect(
  userId: string,
  ipAddress?: string
): Promise<void> {
  await auditLog({
    eventType: 'GOOGLE_CONNECT',
    severity: 'INFO',
    userId,
    ipAddress,
  });
}

/**
 * Log Google OAuth disconnection
 */
export async function logGoogleDisconnect(
  userId: string,
  ipAddress?: string
): Promise<void> {
  await auditLog({
    eventType: 'GOOGLE_DISCONNECT',
    severity: 'INFO',
    userId,
    ipAddress,
  });
}

/**
 * Log invalid webhook signature
 */
export async function logInvalidWebhookSignature(
  source: string,
  ipAddress?: string
): Promise<void> {
  await auditLog({
    eventType: 'WEBHOOK_SIGNATURE_INVALID',
    severity: 'ERROR',
    ipAddress,
    details: { source },
  });
}

/**
 * Log suspicious activity
 */
export async function logSuspiciousActivity(
  description: string,
  ipAddress?: string,
  userId?: string,
  details?: Record<string, unknown>
): Promise<void> {
  await auditLog({
    eventType: 'SUSPICIOUS_ACTIVITY',
    severity: 'CRITICAL',
    userId,
    ipAddress,
    details: { description, ...details },
  });
}

/**
 * Extract request metadata for logging
 */
export function extractRequestMetadata(request: Request): {
  ipAddress: string;
  userAgent: string;
  resource: string;
  method: string;
} {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ipAddress = forwardedFor?.split(',')[0].trim() || realIp || 'unknown';

  return {
    ipAddress,
    userAgent: request.headers.get('user-agent') || 'unknown',
    resource: new URL(request.url).pathname,
    method: request.method,
  };
}
