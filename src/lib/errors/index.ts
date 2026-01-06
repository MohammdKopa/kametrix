/**
 * Error Handling Module
 *
 * Comprehensive error handling with graceful degradation,
 * user-friendly error messages, and detailed logging.
 *
 * Features:
 * - Centralized error types and codes
 * - Custom AppError class with rich metadata
 * - User-friendly multi-language error messages
 * - Structured logging with request correlation
 * - Circuit breaker pattern for external services
 * - Error monitoring and alerting
 * - Request context tracking
 */

// Types and enums
export {
  ErrorCode,
  ErrorCategory,
  ErrorSeverity,
  ErrorHttpStatus,
  getErrorCategory,
  getDefaultSeverity,
  type ErrorMetadata,
  type ErrorResponse,
} from './types';

// AppError class and factory functions
export {
  AppError,
  validationError,
  missingFieldError,
  authRequiredError,
  invalidCredentialsError,
  sessionExpiredError,
  forbiddenError,
  adminRequiredError,
  notFoundError,
  userNotFoundError,
  agentNotFoundError,
  rateLimitError,
  externalServiceError,
  vapiError,
  googleApiError,
  stripeError,
  databaseError,
  internalError,
  timeoutError,
  conflictError,
  duplicateError,
} from './app-error';

// User-friendly messages
export {
  getUserMessage,
  getUserMessageWithParams,
  getVoiceMessage,
} from './messages';

// Logging
export {
  Logger,
  LogLevel,
  logger,
  createRequestLogger,
  severityToLogLevel,
  type LogEntry,
  type LogContext,
} from './logger';

// Request context
export {
  generateRequestId,
  getRequestId,
  createRequestContext,
  addRequestIdToResponse,
  extractRequestMetadata,
  getRequestDuration,
  REQUEST_ID_HEADER,
  type RequestContext,
} from './request-context';

// Circuit breaker
export {
  CircuitBreaker,
  CircuitState,
  circuitBreakers,
  ServiceCircuitBreakers,
  withCircuitBreaker,
  withCircuitBreakerWrapper,
  type CircuitBreakerConfig,
  type CircuitStats,
} from './circuit-breaker';

// Monitoring and alerting
export {
  ErrorMonitor,
  AlertChannel,
  errorMonitor,
  configureMonitoring,
  registerSentryIntegration,
  getMonitoringHealth,
  type AlertConfig,
  type AlertPayload,
} from './monitoring';

// Error handler
export {
  normalizeError,
  createErrorResponse,
  handleError,
  withErrorHandling,
  apiResponse,
  apiError,
  tryCatch,
  assertOrThrow,
  assertFound,
  type RouteHandler,
  type SimpleRouteHandler,
  type RouteContext,
  type ErrorHandlerOptions,
} from './handler';
