/**
 * Performance Optimization Module
 *
 * Centralized exports for all performance-related utilities.
 * Import from '@/lib/performance' for easy access.
 */

// Cache utilities
export {
  MemoryCache,
  appCache,
  sessionCache,
  queryCache,
  cacheKeys,
  withCache,
  createCachedFunction,
} from './cache';

// HTTP pooling and request management
export {
  pooledFetch,
  batchRequests,
  RequestBatcher,
  apiClients,
} from './http-pool';

// Metrics and monitoring
export {
  metrics,
  MetricNames,
  timed,
  withTiming,
  createMetricsMiddleware,
} from './metrics';

// Database query optimization
export {
  cachedQuery,
  BatchLoader,
  userLoader,
  agentLoader,
  agentByVapiLoader,
  getCallsWithCursor,
  getTransactionsWithCursor,
  getCachedUser,
  getCachedUserAgents,
  getCachedAgentByVapiId,
  getCachedCount,
  invalidateUserCache,
  invalidateAgentCache,
  parallelQueries,
  timedTransaction,
} from './query-optimizer';

// Enhanced rate limiting
export {
  EnhancedRateLimiter,
  enhancedAuthLimiter,
  enhancedRegisterLimiter,
  enhancedGenerateLimiter,
  enhancedApiLimiter,
  enhancedWebhookLimiter,
  getClientIp,
  applyEnhancedRateLimit,
  createRateLimitHeaders,
} from './rate-limiter';

// Re-export types
export type { } from './cache';
export type { } from './http-pool';
export type { } from './metrics';
