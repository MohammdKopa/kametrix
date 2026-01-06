/**
 * Application Error Class
 *
 * Custom error class with rich metadata for comprehensive error handling
 */

import {
  ErrorCode,
  ErrorCategory,
  ErrorSeverity,
  ErrorMetadata,
  getErrorCategory,
  getDefaultSeverity,
  ErrorHttpStatus,
} from './types';

/**
 * Application Error - custom error class with enhanced capabilities
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly category: ErrorCategory;
  public readonly severity: ErrorSeverity;
  public readonly httpStatus: number;
  public readonly isOperational: boolean;
  public readonly timestamp: Date;
  public readonly details?: Record<string, unknown>;
  public readonly metadata: ErrorMetadata;
  public readonly originalError?: Error;

  constructor(
    message: string,
    code: ErrorCode,
    options: {
      details?: Record<string, unknown>;
      metadata?: ErrorMetadata;
      originalError?: Error;
      severity?: ErrorSeverity;
      isOperational?: boolean;
      httpStatus?: number;
    } = {}
  ) {
    super(message);

    this.name = 'AppError';
    this.code = code;
    this.category = getErrorCategory(code);
    this.severity = options.severity ?? getDefaultSeverity(this.category);
    this.httpStatus = options.httpStatus ?? ErrorHttpStatus[this.category];
    this.isOperational = options.isOperational ?? true;
    this.timestamp = new Date();
    this.details = options.details;
    this.metadata = options.metadata ?? {};
    this.originalError = options.originalError;

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);

    // Preserve original error stack
    if (options.originalError?.stack) {
      this.stack = `${this.stack}\nCaused by: ${options.originalError.stack}`;
    }
  }

  /**
   * Check if error is retryable
   */
  get isRetryable(): boolean {
    return [
      ErrorCode.RATE_LIMIT_EXCEEDED,
      ErrorCode.SERVICE_TIMEOUT,
      ErrorCode.NETWORK_ERROR,
      ErrorCode.CONNECTION_TIMEOUT,
      ErrorCode.SERVICE_UNAVAILABLE,
    ].includes(this.code);
  }

  /**
   * Check if error requires user action
   */
  get requiresUserAction(): boolean {
    return [
      ErrorCode.AUTH_REQUIRED,
      ErrorCode.SESSION_EXPIRED,
      ErrorCode.INVALID_CREDENTIALS,
      ErrorCode.INSUFFICIENT_PERMISSIONS,
    ].includes(this.code);
  }

  /**
   * Convert to plain object for serialization
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      category: this.category,
      severity: this.severity,
      message: this.message,
      httpStatus: this.httpStatus,
      isOperational: this.isOperational,
      isRetryable: this.isRetryable,
      timestamp: this.timestamp.toISOString(),
      details: this.details,
      metadata: this.metadata,
      stack: process.env.NODE_ENV === 'development' ? this.stack : undefined,
    };
  }

  /**
   * Create error response for API
   */
  toResponse(requestId?: string): {
    success: false;
    error: {
      code: ErrorCode;
      message: string;
      details?: Record<string, unknown>;
      requestId?: string;
      timestamp: string;
    };
  } {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
        requestId: requestId ?? this.metadata.requestId,
        timestamp: this.timestamp.toISOString(),
      },
    };
  }
}

// ============================================================================
// FACTORY FUNCTIONS FOR COMMON ERRORS
// ============================================================================

/**
 * Create validation error
 */
export function validationError(
  message: string,
  details?: Record<string, unknown>
): AppError {
  return new AppError(message, ErrorCode.VALIDATION_FAILED, { details });
}

/**
 * Create missing field error
 */
export function missingFieldError(field: string): AppError {
  return new AppError(
    `Missing required field: ${field}`,
    ErrorCode.MISSING_REQUIRED_FIELD,
    { details: { field } }
  );
}

/**
 * Create authentication required error
 */
export function authRequiredError(): AppError {
  return new AppError('Authentication required', ErrorCode.AUTH_REQUIRED);
}

/**
 * Create invalid credentials error
 */
export function invalidCredentialsError(): AppError {
  return new AppError('Invalid credentials', ErrorCode.INVALID_CREDENTIALS);
}

/**
 * Create session expired error
 */
export function sessionExpiredError(): AppError {
  return new AppError('Session has expired', ErrorCode.SESSION_EXPIRED);
}

/**
 * Create forbidden error
 */
export function forbiddenError(resource?: string): AppError {
  return new AppError(
    resource ? `Access denied to ${resource}` : 'Access denied',
    ErrorCode.FORBIDDEN,
    { details: resource ? { resource } : undefined }
  );
}

/**
 * Create admin required error
 */
export function adminRequiredError(): AppError {
  return new AppError(
    'Administrator privileges required',
    ErrorCode.ADMIN_REQUIRED
  );
}

/**
 * Create not found error
 */
export function notFoundError(resource: string, id?: string): AppError {
  return new AppError(
    id ? `${resource} not found: ${id}` : `${resource} not found`,
    ErrorCode.RESOURCE_NOT_FOUND,
    { details: { resource, id } }
  );
}

/**
 * Create user not found error
 */
export function userNotFoundError(identifier?: string): AppError {
  return new AppError(
    identifier ? `User not found: ${identifier}` : 'User not found',
    ErrorCode.USER_NOT_FOUND,
    { details: identifier ? { identifier } : undefined }
  );
}

/**
 * Create agent not found error
 */
export function agentNotFoundError(id?: string): AppError {
  return new AppError(
    id ? `Agent not found: ${id}` : 'Agent not found',
    ErrorCode.AGENT_NOT_FOUND,
    { details: id ? { agentId: id } : undefined }
  );
}

/**
 * Create rate limit error
 */
export function rateLimitError(
  retryAfter?: number,
  limit?: number
): AppError {
  return new AppError(
    'Rate limit exceeded. Please try again later.',
    ErrorCode.RATE_LIMIT_EXCEEDED,
    {
      details: { retryAfter, limit },
      httpStatus: 429,
    }
  );
}

/**
 * Create external service error
 */
export function externalServiceError(
  service: string,
  message?: string,
  originalError?: Error
): AppError {
  return new AppError(
    message ?? `External service error: ${service}`,
    ErrorCode.EXTERNAL_SERVICE_ERROR,
    {
      details: { service },
      originalError,
      metadata: { service },
    }
  );
}

/**
 * Create Vapi error
 */
export function vapiError(message?: string, originalError?: Error): AppError {
  return new AppError(
    message ?? 'Vapi service error',
    ErrorCode.VAPI_ERROR,
    {
      details: { service: 'vapi' },
      originalError,
      metadata: { service: 'vapi' },
    }
  );
}

/**
 * Create Google API error
 */
export function googleApiError(
  message?: string,
  originalError?: Error
): AppError {
  return new AppError(
    message ?? 'Google API error',
    ErrorCode.GOOGLE_API_ERROR,
    {
      details: { service: 'google' },
      originalError,
      metadata: { service: 'google' },
    }
  );
}

/**
 * Create Stripe error
 */
export function stripeError(message?: string, originalError?: Error): AppError {
  return new AppError(
    message ?? 'Payment service error',
    ErrorCode.STRIPE_ERROR,
    {
      details: { service: 'stripe' },
      originalError,
      metadata: { service: 'stripe' },
    }
  );
}

/**
 * Create database error
 */
export function databaseError(
  message?: string,
  originalError?: Error
): AppError {
  return new AppError(
    message ?? 'Database operation failed',
    ErrorCode.DATABASE_ERROR,
    {
      originalError,
      severity: ErrorSeverity.CRITICAL,
    }
  );
}

/**
 * Create internal error
 */
export function internalError(
  message?: string,
  originalError?: Error
): AppError {
  return new AppError(
    message ?? 'An unexpected error occurred',
    ErrorCode.INTERNAL_ERROR,
    {
      originalError,
      severity: ErrorSeverity.CRITICAL,
      isOperational: false,
    }
  );
}

/**
 * Create service timeout error
 */
export function timeoutError(service?: string): AppError {
  return new AppError(
    service ? `${service} request timed out` : 'Request timed out',
    ErrorCode.SERVICE_TIMEOUT,
    { details: service ? { service } : undefined }
  );
}

/**
 * Create conflict error
 */
export function conflictError(
  message: string,
  details?: Record<string, unknown>
): AppError {
  return new AppError(message, ErrorCode.RESOURCE_CONFLICT, { details });
}

/**
 * Create duplicate entry error
 */
export function duplicateError(field: string, value?: string): AppError {
  return new AppError(
    `Duplicate ${field}${value ? `: ${value}` : ''}`,
    ErrorCode.DUPLICATE_ENTRY,
    { details: { field, value } }
  );
}
