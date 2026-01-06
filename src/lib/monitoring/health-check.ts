/**
 * Health Check Service
 *
 * Provides health check functionality for all system components:
 * - Database connectivity
 * - External services (Vapi, Google, Stripe)
 * - Memory and system resources
 * - Circuit breaker states
 */

import { prisma } from '@/lib/prisma';
import { metrics } from '@/lib/performance';
import { circuitBreakers, CircuitState } from '@/lib/errors/circuit-breaker';
import { errorMonitor } from '@/lib/errors/monitoring';

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

export interface ServiceHealth {
  name: string;
  status: HealthStatus;
  responseTimeMs?: number;
  message?: string;
  lastChecked: string;
}

export interface SystemHealth {
  status: HealthStatus;
  version: string;
  uptime: number;
  timestamp: string;
  services: ServiceHealth[];
  memory: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
    usagePercent: number;
  } | null;
  metrics: {
    errorRate: number;
    activeRequests: number;
    openCircuits: string[];
  };
}

// Track app start time for uptime calculation
const APP_START_TIME = Date.now();

/**
 * Check database connectivity
 */
async function checkDatabase(): Promise<ServiceHealth> {
  const start = performance.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const responseTime = performance.now() - start;
    return {
      name: 'database',
      status: responseTime < 100 ? 'healthy' : responseTime < 500 ? 'degraded' : 'unhealthy',
      responseTimeMs: Math.round(responseTime),
      lastChecked: new Date().toISOString(),
    };
  } catch (error) {
    return {
      name: 'database',
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Database connection failed',
      responseTimeMs: Math.round(performance.now() - start),
      lastChecked: new Date().toISOString(),
    };
  }
}

/**
 * Check Vapi API connectivity
 */
async function checkVapi(): Promise<ServiceHealth> {
  const start = performance.now();
  const apiKey = process.env.VAPI_API_KEY;

  if (!apiKey) {
    return {
      name: 'vapi',
      status: 'unhealthy',
      message: 'VAPI_API_KEY not configured',
      lastChecked: new Date().toISOString(),
    };
  }

  try {
    const response = await fetch('https://api.vapi.ai/assistant', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      signal: AbortSignal.timeout(5000),
    });

    const responseTime = performance.now() - start;

    if (response.ok || response.status === 401) {
      // 401 means the API is reachable but auth might be invalid
      return {
        name: 'vapi',
        status: response.ok ? 'healthy' : 'degraded',
        responseTimeMs: Math.round(responseTime),
        message: response.ok ? undefined : 'Authentication issue',
        lastChecked: new Date().toISOString(),
      };
    }

    return {
      name: 'vapi',
      status: 'degraded',
      responseTimeMs: Math.round(responseTime),
      message: `Status: ${response.status}`,
      lastChecked: new Date().toISOString(),
    };
  } catch (error) {
    return {
      name: 'vapi',
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Connection failed',
      responseTimeMs: Math.round(performance.now() - start),
      lastChecked: new Date().toISOString(),
    };
  }
}

/**
 * Check Stripe API connectivity
 */
async function checkStripe(): Promise<ServiceHealth> {
  const start = performance.now();
  const apiKey = process.env.STRIPE_SECRET_KEY;

  if (!apiKey) {
    return {
      name: 'stripe',
      status: 'unhealthy',
      message: 'STRIPE_SECRET_KEY not configured',
      lastChecked: new Date().toISOString(),
    };
  }

  try {
    const response = await fetch('https://api.stripe.com/v1/balance', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      signal: AbortSignal.timeout(5000),
    });

    const responseTime = performance.now() - start;

    return {
      name: 'stripe',
      status: response.ok ? 'healthy' : 'degraded',
      responseTimeMs: Math.round(responseTime),
      message: response.ok ? undefined : `Status: ${response.status}`,
      lastChecked: new Date().toISOString(),
    };
  } catch (error) {
    return {
      name: 'stripe',
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Connection failed',
      responseTimeMs: Math.round(performance.now() - start),
      lastChecked: new Date().toISOString(),
    };
  }
}

/**
 * Check Google APIs connectivity
 */
async function checkGoogle(): Promise<ServiceHealth> {
  const start = performance.now();

  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/tokeninfo', {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });

    const responseTime = performance.now() - start;

    // Even a 400 means the API is reachable
    return {
      name: 'google',
      status: responseTime < 500 ? 'healthy' : 'degraded',
      responseTimeMs: Math.round(responseTime),
      lastChecked: new Date().toISOString(),
    };
  } catch (error) {
    return {
      name: 'google',
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Connection failed',
      responseTimeMs: Math.round(performance.now() - start),
      lastChecked: new Date().toISOString(),
    };
  }
}

/**
 * Get memory usage
 */
function getMemoryUsage() {
  if (typeof process === 'undefined' || !process.memoryUsage) {
    return null;
  }

  const usage = process.memoryUsage();
  return {
    heapUsed: usage.heapUsed,
    heapTotal: usage.heapTotal,
    rss: usage.rss,
    usagePercent: Math.round((usage.heapUsed / usage.heapTotal) * 100),
  };
}

/**
 * Perform comprehensive health check
 */
export async function performHealthCheck(includeExternalServices = true): Promise<SystemHealth> {
  const services: ServiceHealth[] = [];

  // Always check database
  services.push(await checkDatabase());

  // Check external services if requested
  if (includeExternalServices) {
    const [vapi, stripe, google] = await Promise.all([
      checkVapi(),
      checkStripe(),
      checkGoogle(),
    ]);
    services.push(vapi, stripe, google);
  }

  // Get error stats
  const errorStats = errorMonitor.getStats();
  const openCircuits = circuitBreakers.getOpenCircuits();

  // Determine overall status
  const unhealthyServices = services.filter(s => s.status === 'unhealthy');
  const degradedServices = services.filter(s => s.status === 'degraded');

  let status: HealthStatus = 'healthy';
  if (unhealthyServices.some(s => s.name === 'database')) {
    status = 'unhealthy';
  } else if (unhealthyServices.length > 0 || degradedServices.length > 1 || openCircuits.length > 0) {
    status = 'degraded';
  } else if (degradedServices.length === 1) {
    status = 'healthy'; // One degraded external service is acceptable
  }

  // High error rate degrades status
  if (errorStats.errorRate.perMinute > 10) {
    status = status === 'healthy' ? 'degraded' : status;
  }
  if (errorStats.errorRate.perMinute > 50) {
    status = 'unhealthy';
  }

  return {
    status,
    version: process.env.npm_package_version || '1.0.0',
    uptime: Math.floor((Date.now() - APP_START_TIME) / 1000),
    timestamp: new Date().toISOString(),
    services,
    memory: getMemoryUsage(),
    metrics: {
      errorRate: errorStats.errorRate.perMinute,
      activeRequests: metrics.getGauge('api.active_requests'),
      openCircuits,
    },
  };
}

/**
 * Quick health check (database only)
 */
export async function quickHealthCheck(): Promise<{ status: HealthStatus; timestamp: string }> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    };
  } catch {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
    };
  }
}
