/**
 * Error Monitoring and Alerting System
 *
 * Provides:
 * - Error tracking and aggregation
 * - Alert triggering for critical failures
 * - Integration hooks for external monitoring services
 * - Error rate monitoring
 */

import { AppError } from './app-error';
import { ErrorSeverity, ErrorCode, ErrorCategory } from './types';
import { logger, LogLevel } from './logger';
import { CircuitState, circuitBreakers } from './circuit-breaker';

/**
 * Alert channel types
 */
export enum AlertChannel {
  CONSOLE = 'CONSOLE',
  EMAIL = 'EMAIL',
  WEBHOOK = 'WEBHOOK',
  SLACK = 'SLACK',
}

/**
 * Alert configuration
 */
export interface AlertConfig {
  channels: AlertChannel[];
  webhookUrl?: string;
  slackWebhookUrl?: string;
  emailRecipients?: string[];
  minSeverity: ErrorSeverity;
  cooldownMs: number; // Minimum time between alerts for same error
}

/**
 * Alert payload
 */
export interface AlertPayload {
  id: string;
  timestamp: string;
  severity: ErrorSeverity;
  title: string;
  message: string;
  errorCode?: ErrorCode;
  category?: ErrorCategory;
  service?: string;
  requestId?: string;
  metadata?: Record<string, unknown>;
  stackTrace?: string;
}

/**
 * Error tracking entry
 */
interface ErrorTrackingEntry {
  code: ErrorCode;
  count: number;
  firstSeen: Date;
  lastSeen: Date;
  lastRequestId?: string;
  samples: AppError[];
}

/**
 * Default alert configuration
 */
const DEFAULT_ALERT_CONFIG: AlertConfig = {
  channels: [AlertChannel.CONSOLE],
  minSeverity: ErrorSeverity.HIGH,
  cooldownMs: 60000, // 1 minute cooldown
};

/**
 * Error Monitor class
 */
export class ErrorMonitor {
  private config: AlertConfig;
  private errorCounts: Map<string, ErrorTrackingEntry> = new Map();
  private lastAlerts: Map<string, Date> = new Map();
  private errorRate: { timestamp: number; count: number }[] = [];
  private alertHandlers: ((payload: AlertPayload) => Promise<void>)[] = [];
  private reportingHooks: ((error: AppError) => void)[] = [];

  constructor(config: Partial<AlertConfig> = {}) {
    this.config = { ...DEFAULT_ALERT_CONFIG, ...config };

    // Register circuit breaker listener
    circuitBreakers.onStateChange((state, service) => {
      if (state === CircuitState.OPEN) {
        this.triggerAlert({
          id: `circuit-open-${service}-${Date.now()}`,
          timestamp: new Date().toISOString(),
          severity: ErrorSeverity.HIGH,
          title: `Circuit Breaker Opened: ${service}`,
          message: `The circuit breaker for ${service} has opened due to consecutive failures. Service requests will be rejected until recovery.`,
          service,
          metadata: { circuitState: state },
        });
      }
    });
  }

  /**
   * Track an error
   */
  track(error: AppError): void {
    const key = error.code;
    const existing = this.errorCounts.get(key);

    if (existing) {
      existing.count++;
      existing.lastSeen = new Date();
      existing.lastRequestId = error.metadata.requestId;

      // Keep only last 5 samples
      if (existing.samples.length >= 5) {
        existing.samples.shift();
      }
      existing.samples.push(error);
    } else {
      this.errorCounts.set(key, {
        code: error.code,
        count: 1,
        firstSeen: new Date(),
        lastSeen: new Date(),
        lastRequestId: error.metadata.requestId,
        samples: [error],
      });
    }

    // Track error rate
    this.recordErrorOccurrence();

    // Notify reporting hooks
    for (const hook of this.reportingHooks) {
      try {
        hook(error);
      } catch (e) {
        logger.error('Error reporting hook failed', e);
      }
    }

    // Check if alert should be triggered
    if (this.shouldAlert(error)) {
      this.triggerAlertFromError(error);
    }
  }

  /**
   * Record error occurrence for rate tracking
   */
  private recordErrorOccurrence(): void {
    const now = Date.now();
    this.errorRate.push({ timestamp: now, count: 1 });

    // Keep only last 5 minutes
    const fiveMinutesAgo = now - 5 * 60 * 1000;
    this.errorRate = this.errorRate.filter((e) => e.timestamp > fiveMinutesAgo);
  }

  /**
   * Check if alert should be triggered
   */
  private shouldAlert(error: AppError): boolean {
    // Check severity threshold
    const severityOrder = [
      ErrorSeverity.LOW,
      ErrorSeverity.MEDIUM,
      ErrorSeverity.HIGH,
      ErrorSeverity.CRITICAL,
    ];
    const errorSeverityIndex = severityOrder.indexOf(error.severity);
    const minSeverityIndex = severityOrder.indexOf(this.config.minSeverity);

    if (errorSeverityIndex < minSeverityIndex) {
      return false;
    }

    // Check cooldown
    const alertKey = `${error.code}-${error.category}`;
    const lastAlert = this.lastAlerts.get(alertKey);

    if (lastAlert) {
      const timeSinceLastAlert = Date.now() - lastAlert.getTime();
      if (timeSinceLastAlert < this.config.cooldownMs) {
        return false;
      }
    }

    return true;
  }

  /**
   * Trigger alert from error
   */
  private triggerAlertFromError(error: AppError): void {
    const alertKey = `${error.code}-${error.category}`;
    this.lastAlerts.set(alertKey, new Date());

    const entry = this.errorCounts.get(error.code);

    this.triggerAlert({
      id: `error-${error.code}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      severity: error.severity,
      title: `Error Alert: ${error.code}`,
      message: error.message,
      errorCode: error.code,
      category: error.category,
      service: error.metadata.service as string | undefined,
      requestId: error.metadata.requestId,
      metadata: {
        totalOccurrences: entry?.count ?? 1,
        details: error.details,
      },
      stackTrace:
        process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }

  /**
   * Trigger alert
   */
  async triggerAlert(payload: AlertPayload): Promise<void> {
    logger.warn(`Alert triggered: ${payload.title}`, {
      alertId: payload.id,
      severity: payload.severity,
      errorCode: payload.errorCode,
    });

    // Execute built-in channel handlers
    for (const channel of this.config.channels) {
      try {
        await this.sendToChannel(channel, payload);
      } catch (error) {
        logger.error(`Failed to send alert to ${channel}`, error);
      }
    }

    // Execute custom handlers
    for (const handler of this.alertHandlers) {
      try {
        await handler(payload);
      } catch (error) {
        logger.error('Custom alert handler failed', error);
      }
    }
  }

  /**
   * Send alert to channel
   */
  private async sendToChannel(
    channel: AlertChannel,
    payload: AlertPayload
  ): Promise<void> {
    switch (channel) {
      case AlertChannel.CONSOLE:
        this.sendToConsole(payload);
        break;

      case AlertChannel.WEBHOOK:
        await this.sendToWebhook(payload);
        break;

      case AlertChannel.SLACK:
        await this.sendToSlack(payload);
        break;

      case AlertChannel.EMAIL:
        // Email sending would be implemented here
        logger.info('Email alert would be sent', { alertId: payload.id });
        break;
    }
  }

  /**
   * Send to console
   */
  private sendToConsole(payload: AlertPayload): void {
    const severityColors: Record<ErrorSeverity, string> = {
      [ErrorSeverity.LOW]: '\x1b[34m',      // Blue
      [ErrorSeverity.MEDIUM]: '\x1b[33m',   // Yellow
      [ErrorSeverity.HIGH]: '\x1b[31m',     // Red
      [ErrorSeverity.CRITICAL]: '\x1b[35m', // Magenta
    };

    const color = severityColors[payload.severity] || '\x1b[0m';
    const reset = '\x1b[0m';

    console.error(`
${color}╔════════════════════════════════════════════════════════════════╗
║ ALERT: ${payload.title.padEnd(56)} ║
╠════════════════════════════════════════════════════════════════╣
║ Severity: ${payload.severity.padEnd(54)} ║
║ Time: ${payload.timestamp.padEnd(58)} ║
║ Message: ${payload.message.substring(0, 54).padEnd(54)} ║
${payload.errorCode ? `║ Error Code: ${payload.errorCode.padEnd(51)} ║` : ''}
${payload.requestId ? `║ Request ID: ${payload.requestId.substring(0, 51).padEnd(51)} ║` : ''}
╚════════════════════════════════════════════════════════════════╝${reset}
`);
  }

  /**
   * Send to webhook
   */
  private async sendToWebhook(payload: AlertPayload): Promise<void> {
    if (!this.config.webhookUrl) return;

    try {
      await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      logger.error('Webhook alert failed', error);
    }
  }

  /**
   * Send to Slack
   */
  private async sendToSlack(payload: AlertPayload): Promise<void> {
    if (!this.config.slackWebhookUrl) return;

    const severityEmoji: Record<ErrorSeverity, string> = {
      [ErrorSeverity.LOW]: ':information_source:',
      [ErrorSeverity.MEDIUM]: ':warning:',
      [ErrorSeverity.HIGH]: ':rotating_light:',
      [ErrorSeverity.CRITICAL]: ':fire:',
    };

    const slackPayload = {
      text: `${severityEmoji[payload.severity]} *${payload.title}*`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `${severityEmoji[payload.severity]} *${payload.title}*\n${payload.message}`,
          },
        },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*Severity:*\n${payload.severity}` },
            { type: 'mrkdwn', text: `*Time:*\n${payload.timestamp}` },
            ...(payload.errorCode
              ? [{ type: 'mrkdwn', text: `*Error Code:*\n${payload.errorCode}` }]
              : []),
            ...(payload.requestId
              ? [{ type: 'mrkdwn', text: `*Request ID:*\n${payload.requestId}` }]
              : []),
          ],
        },
      ],
    };

    try {
      await fetch(this.config.slackWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slackPayload),
      });
    } catch (error) {
      logger.error('Slack alert failed', error);
    }
  }

  /**
   * Register custom alert handler
   */
  onAlert(handler: (payload: AlertPayload) => Promise<void>): void {
    this.alertHandlers.push(handler);
  }

  /**
   * Register error reporting hook (for external services like Sentry)
   */
  onError(hook: (error: AppError) => void): void {
    this.reportingHooks.push(hook);
  }

  /**
   * Get error statistics
   */
  getStats(): {
    errorCounts: Record<string, { count: number; lastSeen: string }>;
    errorRate: { perMinute: number; perFiveMinutes: number };
    topErrors: Array<{ code: ErrorCode; count: number }>;
  } {
    const counts: Record<string, { count: number; lastSeen: string }> = {};
    for (const [code, entry] of this.errorCounts) {
      counts[code] = {
        count: entry.count,
        lastSeen: entry.lastSeen.toISOString(),
      };
    }

    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;
    const fiveMinutesAgo = now - 5 * 60 * 1000;

    const errorsLastMinute = this.errorRate.filter(
      (e) => e.timestamp > oneMinuteAgo
    ).length;
    const errorsLastFiveMinutes = this.errorRate.length;

    const topErrors = Array.from(this.errorCounts.entries())
      .map(([code, entry]) => ({ code: code as ErrorCode, count: entry.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      errorCounts: counts,
      errorRate: {
        perMinute: errorsLastMinute,
        perFiveMinutes: errorsLastFiveMinutes,
      },
      topErrors,
    };
  }

  /**
   * Clear error tracking data
   */
  clear(): void {
    this.errorCounts.clear();
    this.lastAlerts.clear();
    this.errorRate = [];
  }
}

/**
 * Global error monitor instance
 */
export const errorMonitor = new ErrorMonitor();

/**
 * Configure error monitoring
 */
export function configureMonitoring(config: Partial<AlertConfig>): void {
  Object.assign(errorMonitor, new ErrorMonitor(config));
}

/**
 * Integration hook for Sentry
 * Call this during app initialization with your Sentry instance
 */
export function registerSentryIntegration(
  captureException: (error: Error) => void
): void {
  errorMonitor.onError((error) => {
    // Only report non-operational errors or high severity
    if (!error.isOperational || error.severity === ErrorSeverity.CRITICAL) {
      captureException(error);
    }
  });
}

/**
 * Health check function for monitoring endpoints
 */
export function getMonitoringHealth(): {
  status: 'healthy' | 'degraded' | 'unhealthy';
  errorRate: number;
  openCircuits: string[];
  recentErrors: number;
} {
  const stats = errorMonitor.getStats();
  const openCircuits = circuitBreakers.getOpenCircuits();

  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

  if (openCircuits.length > 0 || stats.errorRate.perMinute > 10) {
    status = 'degraded';
  }

  if (openCircuits.length > 2 || stats.errorRate.perMinute > 50) {
    status = 'unhealthy';
  }

  return {
    status,
    errorRate: stats.errorRate.perMinute,
    openCircuits,
    recentErrors: stats.errorRate.perFiveMinutes,
  };
}
