/**
 * Security Module Index
 *
 * Centralized exports for all security utilities
 */

// Security Headers
export {
  getSecurityHeaders,
  applySecurityHeaders,
  createSecureResponse,
  secureJsonResponse,
  type SecurityHeadersConfig,
} from './headers';

// Input Validation
export {
  validateEmail,
  validatePassword,
  sanitizeString,
  validateUrl,
  validateNumber,
  validateUUID,
  validateRequestBodySize,
  validateArray,
  validatePhoneNumber,
  escapeHtml,
  type ValidationResult,
  type PasswordValidationResult,
  type PasswordRequirements,
} from './validation';

// Audit Logging
export {
  auditLog,
  logLoginSuccess,
  logLoginFailure,
  logRegistration,
  logRateLimitExceeded,
  logUnauthorizedAccess,
  logAdminAction,
  logGoogleConnect,
  logGoogleDisconnect,
  logInvalidWebhookSignature,
  logSuspiciousActivity,
  extractRequestMetadata,
  startAuditLogFlusher,
  stopAuditLogFlusher,
  type AuditEventType,
  type AuditSeverity,
  type AuditLogEntry,
} from './audit-log';

// Rate Limiting (re-export from existing module)
export {
  authLimiter,
  registerLimiter,
  generateLimiter,
  getClientIp,
  applyRateLimit,
} from '../rate-limit';
