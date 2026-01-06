/**
 * Database Query Optimization Utilities
 *
 * Features:
 * - Query result caching
 * - Batch loading for N+1 prevention
 * - Cursor-based pagination
 * - Query timing and logging
 * - Connection pool monitoring
 */

import { prisma } from '@/lib/prisma';
import { queryCache, cacheKeys, MemoryCache } from './cache';
import { metrics, MetricNames, withTiming } from './metrics';
import type { Agent, Call, User, CreditTransaction } from '@/generated/prisma/client';

/**
 * Cursor-based pagination options
 */
interface CursorPaginationOptions {
  cursor?: string;
  limit?: number;
  direction?: 'forward' | 'backward';
}

interface CursorPaginationResult<T> {
  items: T[];
  nextCursor: string | null;
  prevCursor: string | null;
  hasMore: boolean;
}

/**
 * Cached query wrapper with automatic TTL
 */
export async function cachedQuery<T>(
  cacheKey: string,
  query: () => Promise<T>,
  ttlMs = 120000 // 2 minutes default
): Promise<T> {
  return queryCache.getOrFetch(cacheKey, async () => {
    return withTiming(MetricNames.DB_QUERY, query);
  }, ttlMs) as Promise<T>;
}

/**
 * Batch loader for preventing N+1 queries
 */
export class BatchLoader<TKey, TResult> {
  private batch: Map<string, { resolve: (r: TResult | undefined) => void; reject: (e: Error) => void }[]> = new Map();
  private timer: NodeJS.Timeout | null = null;
  private readonly batchFn: (keys: TKey[]) => Promise<Map<string, TResult>>;
  private readonly keyFn: (key: TKey) => string;
  private readonly delay: number;

  constructor(
    batchFn: (keys: TKey[]) => Promise<Map<string, TResult>>,
    options?: { keyFn?: (key: TKey) => string; delay?: number }
  ) {
    this.batchFn = batchFn;
    this.keyFn = options?.keyFn ?? String;
    this.delay = options?.delay ?? 10;
  }

  async load(key: TKey): Promise<TResult | undefined> {
    const keyStr = this.keyFn(key);

    return new Promise((resolve, reject) => {
      const existing = this.batch.get(keyStr);
      if (existing) {
        existing.push({ resolve, reject });
      } else {
        this.batch.set(keyStr, [{ resolve, reject }]);
      }

      if (!this.timer) {
        this.timer = setTimeout(() => this.execute(), this.delay);
      }
    });
  }

  private async execute(): Promise<void> {
    this.timer = null;
    const currentBatch = this.batch;
    this.batch = new Map();

    const keys = Array.from(currentBatch.keys()) as unknown as TKey[];

    try {
      const results = await this.batchFn(keys);

      for (const [key, resolvers] of currentBatch) {
        const result = results.get(key);
        for (const { resolve } of resolvers) {
          resolve(result);
        }
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      for (const resolvers of currentBatch.values()) {
        for (const { reject } of resolvers) {
          reject(err);
        }
      }
    }
  }
}

// Pre-configured batch loaders
const userLoaderCache = new Map<string, Promise<User | null>>();

/**
 * Batch load users by ID
 */
export const userLoader = new BatchLoader<string, User>(
  async (ids: string[]) => {
    const users = await prisma.user.findMany({
      where: { id: { in: ids } },
    });
    return new Map(users.map((u) => [u.id, u]));
  }
);

/**
 * Batch load agents by ID
 */
export const agentLoader = new BatchLoader<string, Agent>(
  async (ids: string[]) => {
    const agents = await prisma.agent.findMany({
      where: { id: { in: ids } },
      include: { phoneNumber: true },
    });
    return new Map(agents.map((a) => [a.id, a]));
  }
);

/**
 * Batch load agents by Vapi Assistant ID
 */
export const agentByVapiLoader = new BatchLoader<string, Agent>(
  async (vapiIds: string[]) => {
    const agents = await prisma.agent.findMany({
      where: { vapiAssistantId: { in: vapiIds } },
      include: { user: true },
    });
    return new Map(
      agents
        .filter((a) => a.vapiAssistantId)
        .map((a) => [a.vapiAssistantId!, a])
    );
  }
);

/**
 * Cursor-based pagination for calls
 */
export async function getCallsWithCursor(
  userId: string,
  options: CursorPaginationOptions & {
    status?: string;
    agentId?: string;
  } = {}
): Promise<CursorPaginationResult<Call & { agent: Agent }>> {
  const { cursor, limit = 20, direction = 'forward', status, agentId } = options;

  const where: Record<string, unknown> = { userId };
  if (status) where.status = status;
  if (agentId) where.agentId = agentId;

  const take = direction === 'forward' ? limit + 1 : -(limit + 1);

  const calls = await prisma.call.findMany({
    where,
    include: { agent: true },
    orderBy: { startedAt: 'desc' },
    take,
    ...(cursor && {
      cursor: { id: cursor },
      skip: 1, // Skip the cursor itself
    }),
  });

  const hasMore = calls.length > limit;
  const items = hasMore ? calls.slice(0, limit) : calls;

  // Reverse if going backward
  if (direction === 'backward') {
    items.reverse();
  }

  return {
    items,
    nextCursor: hasMore && items.length > 0 ? items[items.length - 1].id : null,
    prevCursor: cursor ?? null,
    hasMore,
  };
}

/**
 * Cursor-based pagination for credit transactions
 */
export async function getTransactionsWithCursor(
  userId: string,
  options: CursorPaginationOptions = {}
): Promise<CursorPaginationResult<CreditTransaction>> {
  const { cursor, limit = 20, direction = 'forward' } = options;

  const take = direction === 'forward' ? limit + 1 : -(limit + 1);

  const transactions = await prisma.creditTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take,
    ...(cursor && {
      cursor: { id: cursor },
      skip: 1,
    }),
  });

  const hasMore = transactions.length > limit;
  const items = hasMore ? transactions.slice(0, limit) : transactions;

  if (direction === 'backward') {
    items.reverse();
  }

  return {
    items,
    nextCursor: hasMore && items.length > 0 ? items[items.length - 1].id : null,
    prevCursor: cursor ?? null,
    hasMore,
  };
}

/**
 * Optimized user data fetching with caching
 */
export async function getCachedUser(userId: string): Promise<User | null> {
  const cacheKey = cacheKeys.user(userId);

  return cachedQuery(cacheKey, () =>
    prisma.user.findUnique({
      where: { id: userId },
    })
  );
}

/**
 * Optimized agent list with caching
 */
export async function getCachedUserAgents(
  userId: string
): Promise<Array<Agent & { phoneNumber: { number: string } | null }>> {
  const cacheKey = cacheKeys.userAgents(userId);

  return cachedQuery(cacheKey, () =>
    prisma.agent.findMany({
      where: { userId },
      include: { phoneNumber: true },
      orderBy: { createdAt: 'desc' },
    })
  );
}

/**
 * Invalidate user-related caches
 */
export function invalidateUserCache(userId: string): void {
  queryCache.invalidatePattern(new RegExp(`^(user|calls|agent):${userId}`));
}

/**
 * Invalidate agent cache
 */
export function invalidateAgentCache(agentId: string, vapiId?: string): void {
  queryCache.delete(cacheKeys.agent(agentId));
  if (vapiId) {
    queryCache.delete(cacheKeys.agentByVapi(vapiId));
  }
}

/**
 * Optimized agent lookup by Vapi ID with caching
 */
export async function getCachedAgentByVapiId(
  vapiAssistantId: string
): Promise<(Agent & { user: User }) | null> {
  const cacheKey = cacheKeys.agentByVapi(vapiAssistantId);

  return cachedQuery(cacheKey, () =>
    prisma.agent.findFirst({
      where: { vapiAssistantId },
      include: { user: true },
    })
  );
}

/**
 * Count queries with caching
 */
export async function getCachedCount(
  model: 'call' | 'agent' | 'user' | 'creditTransaction',
  where: Record<string, unknown>,
  cacheKey: string
): Promise<number> {
  return cachedQuery(cacheKey, async () => {
    switch (model) {
      case 'call':
        return prisma.call.count({ where });
      case 'agent':
        return prisma.agent.count({ where });
      case 'user':
        return prisma.user.count({ where });
      case 'creditTransaction':
        return prisma.creditTransaction.count({ where });
    }
  }, 60000); // 1 minute cache for counts
}

/**
 * Parallel query execution helper
 */
export async function parallelQueries<T extends readonly unknown[]>(
  queries: { [K in keyof T]: () => Promise<T[K]> }
): Promise<T> {
  const timer = metrics.startTimer(MetricNames.DB_QUERY);

  try {
    const results = await Promise.all(queries.map((q) => q()));
    metrics.endTimer(timer, false);
    return results as unknown as T;
  } catch (error) {
    metrics.endTimer(timer, true);
    throw error;
  }
}

/**
 * Transaction helper with timing
 */
export async function timedTransaction<T>(
  fn: (tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => Promise<T>
): Promise<T> {
  return withTiming(MetricNames.DB_QUERY, () => prisma.$transaction(fn));
}
