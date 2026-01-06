/**
 * HTTP Client Pooling and Connection Management
 *
 * Optimizes HTTP requests through:
 * - Connection pooling and keep-alive
 * - Request batching
 * - Automatic retries with exponential backoff
 * - Timeout management
 * - Request deduplication
 */

import { appCache, cacheKeys } from './cache';

interface RequestOptions extends RequestInit {
  /** Timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Number of retries on failure (default: 3) */
  retries?: number;
  /** Enable request deduplication (default: false) */
  deduplicate?: boolean;
  /** Cache TTL in milliseconds (default: no caching) */
  cacheTTL?: number;
}

interface PooledResponse<T = unknown> {
  data: T;
  status: number;
  headers: Headers;
  cached: boolean;
}

interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  retryableStatusCodes: number[];
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
};

// In-flight request tracking for deduplication
const inFlightRequests = new Map<string, Promise<Response>>();

/**
 * Calculate exponential backoff delay with jitter
 */
function calculateBackoff(
  attempt: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): number {
  const exponentialDelay = config.baseDelayMs * Math.pow(2, attempt);
  const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs);
  // Add jitter (±25%)
  const jitter = cappedDelay * 0.25 * (Math.random() * 2 - 1);
  return Math.floor(cappedDelay + jitter);
}

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate a cache key for HTTP requests
 */
function generateRequestKey(url: string, options?: RequestInit): string {
  const method = options?.method || 'GET';
  const body = options?.body ? JSON.stringify(options.body) : '';
  return `http:${method}:${url}:${body}`;
}

/**
 * Enhanced fetch with pooling, retries, and caching
 */
export async function pooledFetch<T = unknown>(
  url: string,
  options: RequestOptions = {}
): Promise<PooledResponse<T>> {
  const {
    timeout = 30000,
    retries = DEFAULT_RETRY_CONFIG.maxRetries,
    deduplicate = false,
    cacheTTL,
    ...fetchOptions
  } = options;

  const requestKey = generateRequestKey(url, fetchOptions);

  // Check cache first
  if (cacheTTL && fetchOptions.method === 'GET') {
    const cached = appCache.get(requestKey) as PooledResponse<T> | undefined;
    if (cached) {
      return { ...cached, cached: true };
    }
  }

  // Request deduplication for GET requests
  if (deduplicate && (!fetchOptions.method || fetchOptions.method === 'GET')) {
    const inFlight = inFlightRequests.get(requestKey);
    if (inFlight) {
      const response = await inFlight;
      const data = (await response.clone().json()) as T;
      return {
        data,
        status: response.status,
        headers: response.headers,
        cached: false,
      };
    }
  }

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  // Retry loop
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const fetchPromise = fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Connection: 'keep-alive',
          ...fetchOptions.headers,
        },
      });

      // Track in-flight request for deduplication
      if (deduplicate) {
        inFlightRequests.set(requestKey, fetchPromise);
      }

      const response = await fetchPromise;

      // Remove from in-flight tracking
      inFlightRequests.delete(requestKey);

      // Check if retry is needed
      if (
        !response.ok &&
        DEFAULT_RETRY_CONFIG.retryableStatusCodes.includes(response.status) &&
        attempt < retries
      ) {
        const delay = calculateBackoff(attempt);
        console.log(
          `[HTTP Pool] Retrying ${url} (attempt ${attempt + 1}/${retries}) after ${delay}ms`
        );
        await sleep(delay);
        continue;
      }

      const data = (await response.json()) as T;

      const result: PooledResponse<T> = {
        data,
        status: response.status,
        headers: response.headers,
        cached: false,
      };

      // Cache successful GET responses
      if (cacheTTL && response.ok && (!fetchOptions.method || fetchOptions.method === 'GET')) {
        appCache.set(requestKey, result, cacheTTL);
      }

      return result;
    } catch (error) {
      inFlightRequests.delete(requestKey);
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on abort (timeout)
      if (controller.signal.aborted) {
        throw new Error(`Request timeout after ${timeout}ms: ${url}`);
      }

      // Retry on network errors
      if (attempt < retries) {
        const delay = calculateBackoff(attempt);
        console.log(
          `[HTTP Pool] Network error, retrying ${url} (attempt ${attempt + 1}/${retries}) after ${delay}ms`
        );
        await sleep(delay);
        continue;
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw lastError || new Error(`Failed to fetch ${url} after ${retries} retries`);
}

/**
 * Batch multiple requests and execute them concurrently with a limit
 */
export async function batchRequests<T>(
  requests: Array<{ url: string; options?: RequestOptions }>,
  concurrencyLimit = 5
): Promise<Array<PooledResponse<T> | Error>> {
  const results: Array<PooledResponse<T> | Error> = [];
  const queue = [...requests];

  while (queue.length > 0) {
    const batch = queue.splice(0, concurrencyLimit);
    const batchResults = await Promise.allSettled(
      batch.map((req) => pooledFetch<T>(req.url, req.options))
    );

    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        results.push(result.reason);
      }
    }
  }

  return results;
}

/**
 * Request batching queue for aggregating multiple requests
 */
interface BatchedRequest<T> {
  key: string;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
}

export class RequestBatcher<TKey, TResult> {
  private queue: Map<string, BatchedRequest<TResult>> = new Map();
  private timer: NodeJS.Timeout | null = null;
  private readonly batchDelay: number;
  private readonly maxBatchSize: number;
  private readonly batchFetcher: (keys: TKey[]) => Promise<Map<string, TResult>>;
  private readonly keySerializer: (key: TKey) => string;

  constructor(options: {
    batchDelay?: number;
    maxBatchSize?: number;
    batchFetcher: (keys: TKey[]) => Promise<Map<string, TResult>>;
    keySerializer?: (key: TKey) => string;
  }) {
    this.batchDelay = options.batchDelay ?? 10;
    this.maxBatchSize = options.maxBatchSize ?? 100;
    this.batchFetcher = options.batchFetcher;
    this.keySerializer = options.keySerializer ?? ((k) => String(k));
  }

  async load(key: TKey): Promise<TResult> {
    const serializedKey = this.keySerializer(key);

    // Check if already in queue
    const existing = this.queue.get(serializedKey);
    if (existing) {
      return new Promise<TResult>((resolve, reject) => {
        // Chain onto existing promise
        const originalResolve = existing.resolve;
        const originalReject = existing.reject;
        existing.resolve = (value: TResult) => {
          originalResolve(value);
          resolve(value);
        };
        existing.reject = (error: Error) => {
          originalReject(error);
          reject(error);
        };
      });
    }

    return new Promise<TResult>((resolve, reject) => {
      this.queue.set(serializedKey, { key: serializedKey, resolve, reject });

      // Trigger batch if max size reached
      if (this.queue.size >= this.maxBatchSize) {
        this.executeBatch();
      } else if (!this.timer) {
        // Schedule batch execution
        this.timer = setTimeout(() => this.executeBatch(), this.batchDelay);
      }
    });
  }

  private async executeBatch(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    const batch = new Map(this.queue);
    this.queue.clear();

    if (batch.size === 0) return;

    try {
      const keys = Array.from(batch.keys()) as unknown as TKey[];
      const results = await this.batchFetcher(keys);

      for (const [key, request] of batch) {
        const result = results.get(key);
        if (result !== undefined) {
          request.resolve(result);
        } else {
          request.reject(new Error(`No result for key: ${key}`));
        }
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      for (const request of batch.values()) {
        request.reject(err);
      }
    }
  }

  clear(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.queue.clear();
  }
}

/**
 * Pre-configured API clients for common external services
 */
export const apiClients = {
  /**
   * Fetch with Vapi-specific configuration
   */
  vapi: <T>(endpoint: string, options?: RequestOptions) =>
    pooledFetch<T>(`https://api.vapi.ai${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${process.env.VAPI_API_KEY}`,
        ...options?.headers,
      },
      timeout: 15000,
      retries: 2,
    }),

  /**
   * Fetch with Stripe-specific configuration
   */
  stripe: <T>(endpoint: string, options?: RequestOptions) =>
    pooledFetch<T>(`https://api.stripe.com/v1${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        ...options?.headers,
      },
      timeout: 30000,
      retries: 3,
    }),

  /**
   * Generic external API fetch
   */
  external: <T>(url: string, options?: RequestOptions) =>
    pooledFetch<T>(url, {
      ...options,
      timeout: options?.timeout ?? 30000,
      retries: options?.retries ?? 2,
    }),
};
