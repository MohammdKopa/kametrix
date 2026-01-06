/**
 * Performance Metrics Collection and Monitoring
 *
 * Features:
 * - Request timing and latency tracking
 * - Memory usage monitoring
 * - API call metrics
 * - Database query timing
 * - Custom metric collection
 * - Periodic reporting
 */

interface MetricEntry {
  count: number;
  totalMs: number;
  minMs: number;
  maxMs: number;
  lastMs: number;
  errors: number;
  lastUpdated: number;
}

interface TimingContext {
  name: string;
  startTime: number;
  metadata?: Record<string, unknown>;
}

interface MetricSnapshot {
  name: string;
  count: number;
  avgMs: number;
  minMs: number;
  maxMs: number;
  lastMs: number;
  errors: number;
  errorRate: number;
}

interface MemoryUsage {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  usagePercent: number;
}

/**
 * Performance metrics collector
 */
class MetricsCollector {
  private metrics: Map<string, MetricEntry> = new Map();
  private gauges: Map<string, number> = new Map();
  private histogramBuckets: Map<string, number[]> = new Map();

  /**
   * Record a timing metric
   */
  recordTiming(name: string, durationMs: number, error = false): void {
    const existing = this.metrics.get(name);

    if (existing) {
      existing.count++;
      existing.totalMs += durationMs;
      existing.minMs = Math.min(existing.minMs, durationMs);
      existing.maxMs = Math.max(existing.maxMs, durationMs);
      existing.lastMs = durationMs;
      existing.lastUpdated = Date.now();
      if (error) existing.errors++;
    } else {
      this.metrics.set(name, {
        count: 1,
        totalMs: durationMs,
        minMs: durationMs,
        maxMs: durationMs,
        lastMs: durationMs,
        errors: error ? 1 : 0,
        lastUpdated: Date.now(),
      });
    }

    // Record in histogram
    this.recordHistogram(name, durationMs);
  }

  /**
   * Start a timer for measuring duration
   */
  startTimer(name: string, metadata?: Record<string, unknown>): TimingContext {
    return {
      name,
      startTime: performance.now(),
      metadata,
    };
  }

  /**
   * End a timer and record the metric
   */
  endTimer(context: TimingContext, error = false): number {
    const duration = performance.now() - context.startTime;
    this.recordTiming(context.name, duration, error);
    return duration;
  }

  /**
   * Set a gauge value
   */
  setGauge(name: string, value: number): void {
    this.gauges.set(name, value);
  }

  /**
   * Increment a gauge
   */
  incrementGauge(name: string, by = 1): void {
    const current = this.gauges.get(name) ?? 0;
    this.gauges.set(name, current + by);
  }

  /**
   * Decrement a gauge
   */
  decrementGauge(name: string, by = 1): void {
    const current = this.gauges.get(name) ?? 0;
    this.gauges.set(name, current - by);
  }

  /**
   * Get gauge value
   */
  getGauge(name: string): number {
    return this.gauges.get(name) ?? 0;
  }

  /**
   * Record a value in a histogram
   */
  private recordHistogram(name: string, value: number): void {
    const key = `histogram:${name}`;
    const bucket = this.histogramBuckets.get(key) ?? [];

    // Keep last 1000 samples
    if (bucket.length >= 1000) {
      bucket.shift();
    }
    bucket.push(value);

    this.histogramBuckets.set(key, bucket);
  }

  /**
   * Get percentile from histogram
   */
  getPercentile(name: string, percentile: number): number | null {
    const bucket = this.histogramBuckets.get(`histogram:${name}`);
    if (!bucket || bucket.length === 0) return null;

    const sorted = [...bucket].sort((a, b) => a - b);
    const index = Math.floor((percentile / 100) * sorted.length);
    return sorted[Math.min(index, sorted.length - 1)];
  }

  /**
   * Get metric snapshot
   */
  getMetric(name: string): MetricSnapshot | null {
    const entry = this.metrics.get(name);
    if (!entry) return null;

    return {
      name,
      count: entry.count,
      avgMs: entry.count > 0 ? entry.totalMs / entry.count : 0,
      minMs: entry.minMs,
      maxMs: entry.maxMs,
      lastMs: entry.lastMs,
      errors: entry.errors,
      errorRate: entry.count > 0 ? entry.errors / entry.count : 0,
    };
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): MetricSnapshot[] {
    const snapshots: MetricSnapshot[] = [];

    for (const [name, entry] of this.metrics) {
      snapshots.push({
        name,
        count: entry.count,
        avgMs: entry.count > 0 ? entry.totalMs / entry.count : 0,
        minMs: entry.minMs,
        maxMs: entry.maxMs,
        lastMs: entry.lastMs,
        errors: entry.errors,
        errorRate: entry.count > 0 ? entry.errors / entry.count : 0,
      });
    }

    return snapshots.sort((a, b) => b.count - a.count);
  }

  /**
   * Get all gauges
   */
  getAllGauges(): Record<string, number> {
    return Object.fromEntries(this.gauges);
  }

  /**
   * Get memory usage
   */
  getMemoryUsage(): MemoryUsage | null {
    if (typeof process === 'undefined' || !process.memoryUsage) {
      return null;
    }

    const usage = process.memoryUsage();
    return {
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      external: usage.external,
      rss: usage.rss,
      usagePercent: (usage.heapUsed / usage.heapTotal) * 100,
    };
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics.clear();
    this.gauges.clear();
    this.histogramBuckets.clear();
  }

  /**
   * Generate a full report
   */
  generateReport(): {
    metrics: MetricSnapshot[];
    gauges: Record<string, number>;
    memory: MemoryUsage | null;
    percentiles: Record<string, { p50: number | null; p95: number | null; p99: number | null }>;
    timestamp: number;
  } {
    const metrics = this.getAllMetrics();
    const percentiles: Record<string, { p50: number | null; p95: number | null; p99: number | null }> = {};

    for (const metric of metrics) {
      percentiles[metric.name] = {
        p50: this.getPercentile(metric.name, 50),
        p95: this.getPercentile(metric.name, 95),
        p99: this.getPercentile(metric.name, 99),
      };
    }

    return {
      metrics,
      gauges: this.getAllGauges(),
      memory: this.getMemoryUsage(),
      percentiles,
      timestamp: Date.now(),
    };
  }
}

// Global metrics instance
const globalForMetrics = globalThis as unknown as {
  metricsCollector?: MetricsCollector;
};

export const metrics =
  globalForMetrics.metricsCollector ?? new MetricsCollector();

if (process.env.NODE_ENV !== 'production') {
  globalForMetrics.metricsCollector = metrics;
}

/**
 * Metric names constants
 */
export const MetricNames = {
  // API Routes
  API_REQUEST: 'api.request',
  API_AUTH: 'api.auth',
  API_CALLS: 'api.calls',
  API_AGENTS: 'api.agents',
  API_CREDITS: 'api.credits',

  // Database
  DB_QUERY: 'db.query',
  DB_CONNECTION: 'db.connection',

  // External Services
  VAPI_REQUEST: 'external.vapi',
  GOOGLE_AUTH: 'external.google.auth',
  GOOGLE_CALENDAR: 'external.google.calendar',
  GOOGLE_SHEETS: 'external.google.sheets',
  STRIPE_REQUEST: 'external.stripe',

  // Webhooks
  WEBHOOK_VAPI: 'webhook.vapi',
  WEBHOOK_STRIPE: 'webhook.stripe',

  // Cache
  CACHE_HIT: 'cache.hit',
  CACHE_MISS: 'cache.miss',

  // Voice Agent
  VOICE_TOOL_CALL: 'voice.tool_call',
  VOICE_LATENCY: 'voice.latency',
} as const;

/**
 * Decorator for timing async functions
 */
export function timed(metricName: string) {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const timer = metrics.startTimer(metricName);
      try {
        const result = await originalMethod.apply(this, args);
        metrics.endTimer(timer, false);
        return result;
      } catch (error) {
        metrics.endTimer(timer, true);
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Higher-order function for timing async operations
 */
export async function withTiming<T>(
  metricName: string,
  operation: () => Promise<T>
): Promise<T> {
  const timer = metrics.startTimer(metricName);
  try {
    const result = await operation();
    metrics.endTimer(timer, false);
    return result;
  } catch (error) {
    metrics.endTimer(timer, true);
    throw error;
  }
}

/**
 * Middleware for tracking API request metrics
 */
export function createMetricsMiddleware() {
  return async function metricsMiddleware(
    request: Request,
    handler: () => Promise<Response>
  ): Promise<Response> {
    const url = new URL(request.url);
    const metricName = `${MetricNames.API_REQUEST}.${url.pathname.replace(/\//g, '.')}`;

    const timer = metrics.startTimer(metricName, {
      method: request.method,
      path: url.pathname,
    });

    metrics.incrementGauge('api.active_requests');

    try {
      const response = await handler();
      const isError = response.status >= 400;
      metrics.endTimer(timer, isError);
      return response;
    } catch (error) {
      metrics.endTimer(timer, true);
      throw error;
    } finally {
      metrics.decrementGauge('api.active_requests');
    }
  };
}

// Schedule periodic memory usage tracking
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const memory = metrics.getMemoryUsage();
    if (memory) {
      metrics.setGauge('memory.heap_used', memory.heapUsed);
      metrics.setGauge('memory.heap_total', memory.heapTotal);
      metrics.setGauge('memory.rss', memory.rss);
      metrics.setGauge('memory.usage_percent', memory.usagePercent);
    }
  }, 30000); // Every 30 seconds
}
