/**
 * Centralized Error Handler
 *
 * Provides unified error handling for API routes with:
 * - Automatic error classification
 * - User-friendly responses
 * - Logging and monitoring integration
 * - Request context tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { AppError, internalError } from './app-error';
import { ErrorCode, ErrorResponse, ErrorHttpStatus, ErrorCategory } from './types';
import { Logger, createRequestLogger } from './logger';
import { errorMonitor } from './monitoring';
import {
  createRequestContext,
  addRequestIdToResponse,
  RequestContext,
  getRequestDuration,
  REQUEST_ID_HEADER,
} from './request-context';
import { getUserMessage } from './messages';

/**
 * Wrap a route handler with error handling
 */
export type RouteHandler = (
  request: NextRequest,
  context?: { params?: Record<string, string> }
) => Promise<NextResponse>;

/**
 * Error handler options
 */
export interface ErrorHandlerOptions {
  includeStackTrace?: boolean;
  logAllErrors?: boolean;
  userFriendlyMessages?: boolean;
  language?: 'en' | 'de';
}

/**
 * Default error handler options
 */
const DEFAULT_OPTIONS: ErrorHandlerOptions = {
  includeStackTrace: process.env.NODE_ENV === 'development',
  logAllErrors: true,
  userFriendlyMessages: true,
  language: 'en',
};

/**
 * Convert unknown error to AppError
 */
export function normalizeError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    // Check for specific error patterns
    const message = error.message.toLowerCase();

    // Authentication errors
    if (message.includes('authentication required') || message.includes('unauthorized')) {
      return new AppError('Authentication required', ErrorCode.AUTH_REQUIRED, {
        originalError: error,
      });
    }

    // Prisma errors
    if (error.name === 'PrismaClientKnownRequestError') {
      const prismaError = error as { code?: string };
      if (prismaError.code === 'P2002') {
        return new AppError('Duplicate entry', ErrorCode.DUPLICATE_ENTRY, {
          originalError: error,
        });
      }
      if (prismaError.code === 'P2025') {
        return new AppError('Record not found', ErrorCode.RESOURCE_NOT_FOUND, {
          originalError: error,
        });
      }
      return new AppError('Database error', ErrorCode.DATABASE_ERROR, {
        originalError: error,
      });
    }

    // Network/timeout errors
    if (message.includes('timeout') || message.includes('timed out')) {
      return new AppError(error.message, ErrorCode.SERVICE_TIMEOUT, {
        originalError: error,
      });
    }

    if (message.includes('econnrefused') || message.includes('network')) {
      return new AppError(error.message, ErrorCode.NETWORK_ERROR, {
        originalError: error,
      });
    }

    // Generic error
    return internalError(error.message, error);
  }

  // Unknown error type
  return internalError(String(error));
}

/**
 * Create error response
 */
export function createErrorResponse(
  error: AppError,
  requestId?: string,
  options: ErrorHandlerOptions = DEFAULT_OPTIONS
): NextResponse<ErrorResponse> {
  const message = options.userFriendlyMessages
    ? getUserMessage(error.code, options.language)
    : error.message;

  const response: ErrorResponse = {
    success: false,
    error: {
      code: error.code,
      message,
      details: error.details,
      requestId,
      timestamp: error.timestamp.toISOString(),
    },
  };

  // Include stack trace in development
  if (options.includeStackTrace && error.stack) {
    (response.error as Record<string, unknown>).stack = error.stack;
  }

  const nextResponse = NextResponse.json(response, {
    status: error.httpStatus,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (requestId) {
    nextResponse.headers.set(REQUEST_ID_HEADER, requestId);
  }

  return nextResponse;
}

/**
 * Handle error with logging and monitoring
 */
export function handleError(
  error: unknown,
  context: RequestContext,
  options: ErrorHandlerOptions = DEFAULT_OPTIONS
): NextResponse<ErrorResponse> {
  const appError = normalizeError(error);

  // Add request context to error
  appError.metadata.requestId = context.requestId;
  appError.metadata.path = context.path;
  appError.metadata.method = context.method;
  appError.metadata.userId = context.userId;

  // Log error
  if (options.logAllErrors || appError.severity !== 'LOW') {
    const duration = getRequestDuration(context);
    context.logger.error(`Request failed: ${appError.message}`, appError, {
      duration,
      errorCode: appError.code,
      category: appError.category,
    });
  }

  // Track error in monitoring
  errorMonitor.track(appError);

  // Create response
  return createErrorResponse(appError, context.requestId, options);
}

/**
 * Create a wrapped route handler with error handling
 */
export function withErrorHandling(
  handler: RouteHandler,
  options: ErrorHandlerOptions = DEFAULT_OPTIONS
): RouteHandler {
  return async (
    request: NextRequest,
    routeContext?: { params?: Record<string, string> }
  ): Promise<NextResponse> => {
    const context = createRequestContext(request);

    try {
      const response = await handler(request, routeContext);

      // Add request ID to successful responses
      addRequestIdToResponse(response, context.requestId);

      // Log successful request
      const duration = getRequestDuration(context);
      context.logger.request(
        context.method,
        context.path,
        response.status,
        duration
      );

      return response;
    } catch (error) {
      return handleError(error, context, options);
    }
  };
}

/**
 * API route helper for consistent responses
 */
export function apiResponse<T>(
  data: T,
  status: number = 200,
  requestId?: string
): NextResponse<{ success: true; data: T }> {
  const response = NextResponse.json(
    { success: true, data },
    { status }
  );

  if (requestId) {
    response.headers.set(REQUEST_ID_HEADER, requestId);
  }

  return response;
}

/**
 * API error response helper
 */
export function apiError(
  code: ErrorCode,
  message?: string,
  details?: Record<string, unknown>,
  requestId?: string
): NextResponse<ErrorResponse> {
  const error = new AppError(
    message ?? getUserMessage(code),
    code,
    { details }
  );

  return createErrorResponse(error, requestId);
}

/**
 * Try-catch wrapper for async operations
 */
export async function tryCatch<T>(
  operation: () => Promise<T>,
  errorMessage?: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw internalError(errorMessage ?? 'Operation failed', error as Error);
  }
}

/**
 * Assert condition or throw error
 */
export function assertOrThrow(
  condition: boolean,
  error: AppError
): asserts condition {
  if (!condition) {
    throw error;
  }
}

/**
 * Assert not null or throw not found error
 */
export function assertFound<T>(
  value: T | null | undefined,
  resource: string,
  id?: string
): asserts value is T {
  if (value === null || value === undefined) {
    throw new AppError(
      id ? `${resource} not found: ${id}` : `${resource} not found`,
      ErrorCode.RESOURCE_NOT_FOUND,
      { details: { resource, id } }
    );
  }
}
