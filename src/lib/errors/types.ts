/**
 * Error Types and Codes
 *
 * Comprehensive error classification system for consistent error handling
 * across the application.
 */

/**
 * Error categories for high-level classification
 */
export enum ErrorCategory {
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  RATE_LIMIT = 'RATE_LIMIT',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',
  DATABASE = 'DATABASE',
  INTERNAL = 'INTERNAL',
  NETWORK = 'NETWORK',
}

/**
 * Specific error codes for detailed error handling
 */
export enum ErrorCode {
  // Validation errors (1xxx)
  VALIDATION_FAILED = 'E1001',
  INVALID_INPUT = 'E1002',
  MISSING_REQUIRED_FIELD = 'E1003',
  INVALID_FORMAT = 'E1004',
  VALUE_OUT_OF_RANGE = 'E1005',

  // Authentication errors (2xxx)
  AUTH_REQUIRED = 'E2001',
  INVALID_CREDENTIALS = 'E2002',
  SESSION_EXPIRED = 'E2003',
  INVALID_TOKEN = 'E2004',
  ACCOUNT_LOCKED = 'E2005',
  INVALID_SESSION = 'E2006',

  // Authorization errors (3xxx)
  FORBIDDEN = 'E3001',
  INSUFFICIENT_PERMISSIONS = 'E3002',
  ADMIN_REQUIRED = 'E3003',
  RESOURCE_ACCESS_DENIED = 'E3004',

  // Not found errors (4xxx)
  RESOURCE_NOT_FOUND = 'E4001',
  USER_NOT_FOUND = 'E4002',
  AGENT_NOT_FOUND = 'E4003',
  CALL_NOT_FOUND = 'E4004',
  ENDPOINT_NOT_FOUND = 'E4005',

  // Conflict errors (5xxx)
  RESOURCE_CONFLICT = 'E5001',
  DUPLICATE_ENTRY = 'E5002',
  CONCURRENT_MODIFICATION = 'E5003',
  CALENDAR_CONFLICT = 'E5004',

  // Rate limit errors (6xxx)
  RATE_LIMIT_EXCEEDED = 'E6001',
  QUOTA_EXCEEDED = 'E6002',
  TOO_MANY_REQUESTS = 'E6003',

  // External service errors (7xxx)
  EXTERNAL_SERVICE_ERROR = 'E7001',
  VAPI_ERROR = 'E7002',
  GOOGLE_API_ERROR = 'E7003',
  STRIPE_ERROR = 'E7004',
  EMAIL_SERVICE_ERROR = 'E7005',
  SERVICE_UNAVAILABLE = 'E7006',
  SERVICE_TIMEOUT = 'E7007',
  OPENROUTER_ERROR = 'E7008',

  // Database errors (8xxx)
  DATABASE_ERROR = 'E8001',
  CONNECTION_FAILED = 'E8002',
  QUERY_FAILED = 'E8003',
  TRANSACTION_FAILED = 'E8004',
  CONSTRAINT_VIOLATION = 'E8005',

  // Internal errors (9xxx)
  INTERNAL_ERROR = 'E9001',
  CONFIGURATION_ERROR = 'E9002',
  UNEXPECTED_ERROR = 'E9003',
  INITIALIZATION_FAILED = 'E9004',

  // Network errors (10xx)
  NETWORK_ERROR = 'E10001',
  CONNECTION_TIMEOUT = 'E10002',
  DNS_RESOLUTION_FAILED = 'E10003',
}

/**
 * Error severity levels for logging and alerting
 */
export enum ErrorSeverity {
  LOW = 'LOW',         // Informational, user errors
  MEDIUM = 'MEDIUM',   // Operational issues, recoverable
  HIGH = 'HIGH',       // Service degradation, needs attention
  CRITICAL = 'CRITICAL', // System failure, immediate action required
}

/**
 * HTTP status code mapping for errors
 */
export const ErrorHttpStatus: Record<ErrorCategory, number> = {
  [ErrorCategory.VALIDATION]: 400,
  [ErrorCategory.AUTHENTICATION]: 401,
  [ErrorCategory.AUTHORIZATION]: 403,
  [ErrorCategory.NOT_FOUND]: 404,
  [ErrorCategory.CONFLICT]: 409,
  [ErrorCategory.RATE_LIMIT]: 429,
  [ErrorCategory.EXTERNAL_SERVICE]: 502,
  [ErrorCategory.DATABASE]: 503,
  [ErrorCategory.INTERNAL]: 500,
  [ErrorCategory.NETWORK]: 502,
};

/**
 * Map error codes to categories
 */
export function getErrorCategory(code: ErrorCode): ErrorCategory {
  const codeNum = parseInt(code.substring(1));

  if (codeNum >= 1000 && codeNum < 2000) return ErrorCategory.VALIDATION;
  if (codeNum >= 2000 && codeNum < 3000) return ErrorCategory.AUTHENTICATION;
  if (codeNum >= 3000 && codeNum < 4000) return ErrorCategory.AUTHORIZATION;
  if (codeNum >= 4000 && codeNum < 5000) return ErrorCategory.NOT_FOUND;
  if (codeNum >= 5000 && codeNum < 6000) return ErrorCategory.CONFLICT;
  if (codeNum >= 6000 && codeNum < 7000) return ErrorCategory.RATE_LIMIT;
  if (codeNum >= 7000 && codeNum < 8000) return ErrorCategory.EXTERNAL_SERVICE;
  if (codeNum >= 8000 && codeNum < 9000) return ErrorCategory.DATABASE;
  if (codeNum >= 10000 && codeNum < 11000) return ErrorCategory.NETWORK;

  return ErrorCategory.INTERNAL;
}

/**
 * Get default severity for error category
 */
export function getDefaultSeverity(category: ErrorCategory): ErrorSeverity {
  switch (category) {
    case ErrorCategory.VALIDATION:
    case ErrorCategory.NOT_FOUND:
    case ErrorCategory.RATE_LIMIT:
      return ErrorSeverity.LOW;

    case ErrorCategory.AUTHENTICATION:
    case ErrorCategory.AUTHORIZATION:
    case ErrorCategory.CONFLICT:
      return ErrorSeverity.MEDIUM;

    case ErrorCategory.EXTERNAL_SERVICE:
    case ErrorCategory.NETWORK:
      return ErrorSeverity.HIGH;

    case ErrorCategory.DATABASE:
    case ErrorCategory.INTERNAL:
      return ErrorSeverity.CRITICAL;

    default:
      return ErrorSeverity.MEDIUM;
  }
}

/**
 * Error metadata interface
 */
export interface ErrorMetadata {
  requestId?: string;
  userId?: string;
  path?: string;
  method?: string;
  timestamp?: string;
  duration?: number;
  service?: string;
  [key: string]: unknown;
}

/**
 * Serialized error response format
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: Record<string, unknown>;
    requestId?: string;
    timestamp: string;
  };
}
