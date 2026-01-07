/**
 * Quota Management Module
 *
 * Exports all quota management functionality for API rate limiting,
 * Google Calendar quota management, and usage tracking.
 */

// Core quota manager
export {
  QuotaManager,
  quotaManager,
  DEFAULT_QUOTAS,
  type QuotaCheckResult,
  type QuotaConfig,
  type UserQuotaStatus,
} from './quota-manager';

// Google Calendar specific quota management
export {
  GoogleCalendarQuotaManager,
  googleCalendarQuotaManager,
  type GoogleCalendarQuotaResult,
  type QuotaUsageStats,
} from './google-calendar-quota';

// Rate limiting middleware
export {
  applyRateLimitMiddleware,
  applyGoogleCalendarRateLimit,
  recordGoogleCalendarSuccess,
  recordGoogleCalendarError,
  withRateLimit,
  withGoogleCalendarRateLimit,
  getUserIdFromAgentRequest,
  addRateLimitHeaders,
  type RateLimitConfig,
  type RateLimitResult,
} from './rate-limit-middleware';
