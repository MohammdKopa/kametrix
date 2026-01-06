/**
 * Structured Logging System
 *
 * Provides consistent, structured logging with:
 * - Log levels (DEBUG, INFO, WARN, ERROR, FATAL)
 * - Request correlation via request IDs
 * - Automatic context enrichment
 * - JSON output for log aggregation
 * - Sensitive data redaction
 */

import { ErrorSeverity } from './types';
import { AppError } from './app-error';

/**
 * Log levels in order of severity
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

/**
 * Log level names for output
 */
const LOG_LEVEL_NAMES: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.FATAL]: 'FATAL',
};

/**
 * Log entry structure
 */
export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  requestId?: string;
  userId?: string;
  service?: string;
  path?: string;
  method?: string;
  duration?: number;
  error?: {
    code?: string;
    name: string;
    message: string;
    stack?: string;
    category?: string;
    severity?: string;
  };
  metadata?: Record<string, unknown>;
}

/**
 * Log context for request correlation
 */
export interface LogContext {
  requestId?: string;
  userId?: string;
  service?: string;
  path?: string;
  method?: string;
  [key: string]: unknown;
}

/**
 * Sensitive keys to redact from logs
 */
const SENSITIVE_KEYS = [
  'password',
  'passwordHash',
  'token',
  'accessToken',
  'refreshToken',
  'apiKey',
  'api_key',
  'secret',
  'authorization',
  'cookie',
  'sessionToken',
  'session_token',
  'credit_card',
  'creditCard',
  'cvv',
  'ssn',
  'private_key',
  'privateKey',
];

/**
 * Redact sensitive values from objects
 */
function redactSensitive(obj: unknown, depth = 0): unknown {
  if (depth > 10) return '[MAX_DEPTH]';
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    // Redact potential tokens (long alphanumeric strings)
    if (obj.length > 40 && /^[a-zA-Z0-9_-]+$/.test(obj)) {
      return `${obj.substring(0, 8)}...[REDACTED]`;
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => redactSensitive(item, depth + 1));
  }

  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_KEYS.some((sk) => lowerKey.includes(sk.toLowerCase()))) {
        result[key] = '[REDACTED]';
      } else {
        result[key] = redactSensitive(value, depth + 1);
      }
    }
    return result;
  }

  return obj;
}

/**
 * Format error for logging
 */
function formatError(error: unknown): LogEntry['error'] | undefined {
  if (!error) return undefined;

  if (error instanceof AppError) {
    return {
      code: error.code,
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      category: error.category,
      severity: error.severity,
    };
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    };
  }

  return {
    name: 'UnknownError',
    message: String(error),
  };
}

/**
 * Logger class with structured output
 */
export class Logger {
  private context: LogContext;
  private minLevel: LogLevel;
  private static globalContext: LogContext = {};

  constructor(context: LogContext = {}) {
    this.context = context;
    this.minLevel = this.parseLogLevel(process.env.LOG_LEVEL || 'INFO');
  }

  /**
   * Parse log level from string
   */
  private parseLogLevel(level: string): LogLevel {
    const upperLevel = level.toUpperCase();
    const levelValue = LogLevel[upperLevel as keyof typeof LogLevel];
    return levelValue !== undefined ? levelValue : LogLevel.INFO;
  }

  /**
   * Set global context for all loggers
   */
  static setGlobalContext(context: LogContext): void {
    Logger.globalContext = { ...Logger.globalContext, ...context };
  }

  /**
   * Create child logger with additional context
   */
  child(context: LogContext): Logger {
    const logger = new Logger({
      ...this.context,
      ...context,
    });
    return logger;
  }

  /**
   * Core log method
   */
  private log(
    level: LogLevel,
    message: string,
    metadata?: Record<string, unknown>,
    error?: unknown
  ): void {
    if (level < this.minLevel) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LOG_LEVEL_NAMES[level],
      message,
      ...Logger.globalContext,
      ...this.context,
      requestId: this.context.requestId ?? Logger.globalContext.requestId,
    };

    if (metadata) {
      entry.metadata = redactSensitive(metadata) as Record<string, unknown>;
    }

    if (error) {
      entry.error = formatError(error);
    }

    // Output as JSON in production, pretty print in development
    const output =
      process.env.NODE_ENV === 'production'
        ? JSON.stringify(entry)
        : this.prettyFormat(entry);

    // Route to appropriate console method
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(output);
        break;
      case LogLevel.INFO:
        console.info(output);
        break;
      case LogLevel.WARN:
        console.warn(output);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(output);
        break;
    }
  }

  /**
   * Pretty format for development
   */
  private prettyFormat(entry: LogEntry): string {
    const parts: string[] = [
      `[${entry.timestamp}]`,
      `[${entry.level}]`,
    ];

    if (entry.requestId) {
      parts.push(`[${entry.requestId.substring(0, 8)}]`);
    }

    if (entry.service) {
      parts.push(`[${entry.service}]`);
    }

    parts.push(entry.message);

    if (entry.path) {
      parts.push(`(${entry.method || 'GET'} ${entry.path})`);
    }

    if (entry.duration !== undefined) {
      parts.push(`${entry.duration}ms`);
    }

    let output = parts.join(' ');

    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      output += `\n  Metadata: ${JSON.stringify(entry.metadata, null, 2)}`;
    }

    if (entry.error) {
      output += `\n  Error: ${entry.error.name}: ${entry.error.message}`;
      if (entry.error.code) {
        output += ` [${entry.error.code}]`;
      }
      if (entry.error.stack) {
        output += `\n  Stack: ${entry.error.stack}`;
      }
    }

    return output;
  }

  /**
   * Debug level log
   */
  debug(message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, metadata);
  }

  /**
   * Info level log
   */
  info(message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, metadata);
  }

  /**
   * Warning level log
   */
  warn(message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, metadata);
  }

  /**
   * Error level log
   */
  error(
    message: string,
    error?: unknown,
    metadata?: Record<string, unknown>
  ): void {
    this.log(LogLevel.ERROR, message, metadata, error);
  }

  /**
   * Fatal level log
   */
  fatal(
    message: string,
    error?: unknown,
    metadata?: Record<string, unknown>
  ): void {
    this.log(LogLevel.FATAL, message, metadata, error);
  }

  /**
   * Log API request
   */
  request(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    metadata?: Record<string, unknown>
  ): void {
    const level = statusCode >= 500 ? LogLevel.ERROR :
                  statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;

    this.log(level, `${method} ${path} ${statusCode}`, {
      statusCode,
      duration,
      ...metadata,
    });
  }

  /**
   * Log external service call
   */
  external(
    service: string,
    operation: string,
    success: boolean,
    duration: number,
    metadata?: Record<string, unknown>
  ): void {
    const level = success ? LogLevel.INFO : LogLevel.ERROR;
    this.log(level, `External: ${service}.${operation} ${success ? 'succeeded' : 'failed'}`, {
      service,
      operation,
      success,
      duration,
      ...metadata,
    });
  }
}

/**
 * Default logger instance
 */
export const logger = new Logger({ service: 'kametrix' });

/**
 * Create a request-scoped logger
 */
export function createRequestLogger(
  requestId: string,
  additionalContext?: LogContext
): Logger {
  return new Logger({
    service: 'kametrix',
    requestId,
    ...additionalContext,
  });
}

/**
 * Map error severity to log level
 */
export function severityToLogLevel(severity: ErrorSeverity): LogLevel {
  switch (severity) {
    case ErrorSeverity.LOW:
      return LogLevel.INFO;
    case ErrorSeverity.MEDIUM:
      return LogLevel.WARN;
    case ErrorSeverity.HIGH:
      return LogLevel.ERROR;
    case ErrorSeverity.CRITICAL:
      return LogLevel.FATAL;
    default:
      return LogLevel.ERROR;
  }
}
