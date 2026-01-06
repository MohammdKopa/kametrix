/**
 * Advanced Caching System with TTL, Memory Management, and Request Deduplication
 *
 * Features:
 * - TTL-based cache expiration
 * - Memory limit management with LRU eviction
 * - Request deduplication (coalescing)
 * - Cache statistics for monitoring
 * - Type-safe cache operations
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  size: number;
  accessCount: number;
  lastAccessed: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  totalEntries: number;
  memoryUsage: number;
}

interface CacheOptions {
  /** Maximum number of entries (default: 1000) */
  maxEntries?: number;
  /** Maximum memory in bytes (default: 50MB) */
  maxMemoryBytes?: number;
  /** Default TTL in milliseconds (default: 5 minutes) */
  defaultTTL?: number;
  /** Enable request deduplication (default: true) */
  deduplication?: boolean;
}

const DEFAULT_OPTIONS: Required<CacheOptions> = {
  maxEntries: 1000,
  maxMemoryBytes: 50 * 1024 * 1024, // 50MB
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  deduplication: true,
};

/**
 * High-performance in-memory cache with TTL and memory management
 */
export class MemoryCache<T = unknown> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private pendingRequests: Map<string, Promise<T>> = new Map();
  private options: Required<CacheOptions>;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalEntries: 0,
    memoryUsage: 0,
  };

  constructor(options: CacheOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Get a value from cache
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return undefined;
    }

    // Check expiration
    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      this.stats.misses++;
      return undefined;
    }

    // Update access stats
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.stats.hits++;

    return entry.value;
  }

  /**
   * Set a value in cache with optional TTL
   */
  set(key: string, value: T, ttl?: number): void {
    const actualTTL = ttl ?? this.options.defaultTTL;
    const size = this.estimateSize(value);

    // Evict if necessary before adding
    this.evictIfNeeded(size);

    const entry: CacheEntry<T> = {
      value,
      expiresAt: Date.now() + actualTTL,
      size,
      accessCount: 1,
      lastAccessed: Date.now(),
    };

    const existingEntry = this.cache.get(key);
    if (existingEntry) {
      this.stats.memoryUsage -= existingEntry.size;
    }

    this.cache.set(key, entry);
    this.stats.memoryUsage += size;
    this.stats.totalEntries = this.cache.size;
  }

  /**
   * Get or fetch with automatic caching and request deduplication
   */
  async getOrFetch(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Check cache first
    const cached = this.get(key);
    if (cached !== undefined) {
      return cached;
    }

    // Request deduplication - if a request is already in flight, wait for it
    if (this.options.deduplication && this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!;
    }

    // Execute fetcher and cache result
    const fetchPromise = (async () => {
      try {
        const result = await fetcher();
        this.set(key, result, ttl);
        return result;
      } finally {
        this.pendingRequests.delete(key);
      }
    })();

    if (this.options.deduplication) {
      this.pendingRequests.set(key, fetchPromise);
    }

    return fetchPromise;
  }

  /**
   * Delete a key from cache
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (entry) {
      this.stats.memoryUsage -= entry.size;
      this.stats.totalEntries--;
    }
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.pendingRequests.clear();
    this.stats.memoryUsage = 0;
    this.stats.totalEntries = 0;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      return false;
    }
    return true;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats & { hitRate: number } {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      hitRate: total > 0 ? this.stats.hits / total : 0,
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): number {
    let cleaned = 0;
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Invalidate cache entries matching a pattern
   */
  invalidatePattern(pattern: string | RegExp): number {
    let invalidated = 0;
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.delete(key);
        invalidated++;
      }
    }

    return invalidated;
  }

  private evictIfNeeded(newSize: number): void {
    // Check entry count limit
    while (this.cache.size >= this.options.maxEntries) {
      this.evictLRU();
    }

    // Check memory limit
    while (
      this.stats.memoryUsage + newSize > this.options.maxMemoryBytes &&
      this.cache.size > 0
    ) {
      this.evictLRU();
    }
  }

  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.delete(oldestKey);
      this.stats.evictions++;
    }
  }

  private estimateSize(value: unknown): number {
    if (value === null || value === undefined) return 8;
    if (typeof value === 'string') return value.length * 2;
    if (typeof value === 'number') return 8;
    if (typeof value === 'boolean') return 4;
    if (Array.isArray(value)) {
      return value.reduce((acc, item) => acc + this.estimateSize(item), 24);
    }
    if (typeof value === 'object') {
      return JSON.stringify(value).length * 2;
    }
    return 16;
  }
}

// Global cache instances for different purposes
const globalForCache = globalThis as unknown as {
  appCache?: MemoryCache;
  sessionCache?: MemoryCache;
  queryCache?: MemoryCache;
};

/**
 * General application cache (5 min TTL, 50MB limit)
 */
export const appCache =
  globalForCache.appCache ??
  new MemoryCache({
    maxEntries: 1000,
    maxMemoryBytes: 50 * 1024 * 1024,
    defaultTTL: 5 * 60 * 1000,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForCache.appCache = appCache;
}

/**
 * Session cache (30 min TTL, 20MB limit)
 */
export const sessionCache =
  globalForCache.sessionCache ??
  new MemoryCache({
    maxEntries: 500,
    maxMemoryBytes: 20 * 1024 * 1024,
    defaultTTL: 30 * 60 * 1000,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForCache.sessionCache = sessionCache;
}

/**
 * Query result cache (2 min TTL, 30MB limit)
 */
export const queryCache =
  globalForCache.queryCache ??
  new MemoryCache({
    maxEntries: 500,
    maxMemoryBytes: 30 * 1024 * 1024,
    defaultTTL: 2 * 60 * 1000,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForCache.queryCache = queryCache;
}

// Schedule periodic cleanup
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    appCache.cleanup();
    sessionCache.cleanup();
    queryCache.cleanup();
  }, 60 * 1000); // Every minute
}

/**
 * Cache key generators for consistent naming
 */
export const cacheKeys = {
  user: (userId: string) => `user:${userId}`,
  userAgents: (userId: string) => `user:${userId}:agents`,
  agent: (agentId: string) => `agent:${agentId}`,
  agentByVapi: (vapiId: string) => `agent:vapi:${vapiId}`,
  calls: (userId: string, params: string) => `calls:${userId}:${params}`,
  settings: (key: string) => `settings:${key}`,
  session: (token: string) => `session:${token}`,
  googleAuth: (userId: string) => `google:auth:${userId}`,
  calendarSlots: (userId: string, date: string) => `calendar:${userId}:${date}`,
};

/**
 * Decorator for caching async function results
 */
export function withCache<T>(
  cache: MemoryCache<T>,
  keyGenerator: (...args: unknown[]) => string,
  ttl?: number
) {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const key = keyGenerator(...args);
      return cache.getOrFetch(key, () => originalMethod.apply(this, args), ttl);
    };

    return descriptor;
  };
}

/**
 * Helper to create a cached version of any async function
 */
export function createCachedFunction<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  cache: MemoryCache<TResult>,
  keyGenerator: (...args: TArgs) => string,
  ttl?: number
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs): Promise<TResult> => {
    const key = keyGenerator(...args);
    return cache.getOrFetch(key, () => fn(...args), ttl);
  };
}
