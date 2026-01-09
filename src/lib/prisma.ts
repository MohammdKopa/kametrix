import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: pg.Pool | undefined;
};

/**
 * Database Connection Pool Configuration
 *
 * Optimized settings for high-throughput webhook processing:
 * - max: Maximum connections in the pool (default 10 for serverless)
 * - min: Minimum connections to maintain (2 for quick startup)
 * - idleTimeoutMillis: Close idle connections after 30 seconds
 * - connectionTimeoutMillis: Timeout for acquiring connection (5 seconds)
 * - statement_timeout: Kill long-running queries (10 seconds)
 */
const poolConfig: pg.PoolConfig = {
  connectionString: process.env.DATABASE_URL,
  // Connection pool size
  max: parseInt(process.env.DATABASE_POOL_MAX || '10', 10),
  min: parseInt(process.env.DATABASE_POOL_MIN || '2', 10),
  // Timeouts
  idleTimeoutMillis: 30000, // 30 seconds idle timeout
  connectionTimeoutMillis: 5000, // 5 seconds to acquire connection
  // Query timeout to prevent long-running queries blocking connections
  statement_timeout: 10000, // 10 seconds max query time
  // Application name for monitoring
  application_name: 'kametrix-webhook',
};

// Reuse pool across hot reloads in development
const pool = globalForPrisma.pool ?? new pg.Pool(poolConfig);

// Pool event handlers for monitoring
pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});

pool.on('connect', () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Database pool: new connection established');
  }
});

pool.on('remove', () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Database pool: connection removed');
  }
});

const adapter = new PrismaPg(pool);

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

// Persist in development to prevent reconnections on hot reload
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
  globalForPrisma.pool = pool;
}

/**
 * Get pool statistics for monitoring
 */
export function getPoolStats() {
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
  };
}

/**
 * Graceful shutdown helper
 */
export async function closePool() {
  await pool.end();
}
