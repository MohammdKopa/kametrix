/**
 * Background Job Queue Utility
 *
 * Provides fire-and-forget task execution with:
 * - Error handling and logging
 * - Optional retry logic
 * - Task monitoring and metrics
 * - Memory-safe queue management
 *
 * Used for non-critical operations that shouldn't block webhook responses:
 * - Logging to external services (Google Sheets)
 * - Sending notification emails
 * - Analytics and event logging
 */

import { metrics, MetricNames } from '@/lib/performance';

interface BackgroundTask {
  id: string;
  name: string;
  fn: () => Promise<void>;
  retries: number;
  maxRetries: number;
  createdAt: number;
  lastError?: string;
}

interface TaskOptions {
  /** Maximum retry attempts (default: 0) */
  maxRetries?: number;
  /** Task name for logging/metrics */
  name?: string;
  /** Timeout in milliseconds (default: 30000) */
  timeout?: number;
}

interface QueueStats {
  totalQueued: number;
  totalCompleted: number;
  totalFailed: number;
  currentQueueSize: number;
  averageExecutionTime: number;
}

const DEFAULT_OPTIONS: Required<TaskOptions> = {
  maxRetries: 0,
  name: 'anonymous',
  timeout: 30000,
};

/**
 * Background task queue with retry support and monitoring
 */
class BackgroundJobQueue {
  private queue: BackgroundTask[] = [];
  private processing = false;
  private stats: QueueStats = {
    totalQueued: 0,
    totalCompleted: 0,
    totalFailed: 0,
    currentQueueSize: 0,
    averageExecutionTime: 0,
  };
  private executionTimes: number[] = [];
  private readonly maxQueueSize = 1000;
  private readonly maxExecutionTimesSamples = 100;

  /**
   * Enqueue a task for background execution
   */
  enqueue(fn: () => Promise<void>, options: TaskOptions = {}): string {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const taskId = `${opts.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Prevent queue from growing unbounded
    if (this.queue.length >= this.maxQueueSize) {
      console.warn(`Background job queue full (${this.maxQueueSize}), dropping oldest task`);
      this.queue.shift();
    }

    const task: BackgroundTask = {
      id: taskId,
      name: opts.name,
      fn: this.wrapWithTimeout(fn, opts.timeout),
      retries: 0,
      maxRetries: opts.maxRetries,
      createdAt: Date.now(),
    };

    this.queue.push(task);
    this.stats.totalQueued++;
    this.stats.currentQueueSize = this.queue.length;

    // Start processing if not already running
    if (!this.processing) {
      this.processQueue();
    }

    return taskId;
  }

  /**
   * Fire-and-forget execution (convenience method)
   * Returns immediately, task runs in background
   */
  fireAndForget(fn: () => Promise<void>, options: TaskOptions = {}): void {
    this.enqueue(fn, options);
  }

  /**
   * Get queue statistics
   */
  getStats(): QueueStats {
    return { ...this.stats };
  }

  /**
   * Clear all pending tasks
   */
  clear(): void {
    const cleared = this.queue.length;
    this.queue = [];
    this.stats.currentQueueSize = 0;
    console.log(`Cleared ${cleared} background tasks`);
  }

  private wrapWithTimeout(fn: () => Promise<void>, timeout: number): () => Promise<void> {
    return () =>
      new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => {
          reject(new Error(`Background task timed out after ${timeout}ms`));
        }, timeout);

        fn()
          .then(() => {
            clearTimeout(timer);
            resolve();
          })
          .catch((err) => {
            clearTimeout(timer);
            reject(err);
          });
      });
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const task = this.queue.shift()!;
      this.stats.currentQueueSize = this.queue.length;

      const startTime = Date.now();

      try {
        await task.fn();
        this.recordExecutionTime(Date.now() - startTime);
        this.stats.totalCompleted++;

        // Log success for debugging in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`Background task completed: ${task.name} (${Date.now() - startTime}ms)`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        task.lastError = errorMessage;

        if (task.retries < task.maxRetries) {
          // Retry with exponential backoff
          task.retries++;
          const backoffMs = Math.min(1000 * Math.pow(2, task.retries), 30000);

          console.warn(
            `Background task ${task.name} failed (attempt ${task.retries}/${task.maxRetries + 1}), ` +
              `retrying in ${backoffMs}ms: ${errorMessage}`
          );

          // Re-queue for retry after backoff
          setTimeout(() => {
            this.queue.push(task);
            this.stats.currentQueueSize = this.queue.length;
            if (!this.processing) {
              this.processQueue();
            }
          }, backoffMs);
        } else {
          console.error(`Background task ${task.name} failed permanently: ${errorMessage}`);
          this.stats.totalFailed++;
          metrics.increment(MetricNames.ERROR_COUNT, { task: task.name });
        }
      }
    }

    this.processing = false;
  }

  private recordExecutionTime(ms: number): void {
    this.executionTimes.push(ms);

    // Keep only recent samples
    if (this.executionTimes.length > this.maxExecutionTimesSamples) {
      this.executionTimes.shift();
    }

    // Update average
    this.stats.averageExecutionTime =
      this.executionTimes.reduce((a, b) => a + b, 0) / this.executionTimes.length;
  }
}

// Global singleton instance
const globalForBgJobs = globalThis as unknown as {
  backgroundJobQueue?: BackgroundJobQueue;
};

export const backgroundJobQueue =
  globalForBgJobs.backgroundJobQueue ?? new BackgroundJobQueue();

if (process.env.NODE_ENV !== 'production') {
  globalForBgJobs.backgroundJobQueue = backgroundJobQueue;
}

/**
 * Convenience function to run a task in the background
 * @example
 * runInBackground(() => sendEmail(user), { name: 'send-email', maxRetries: 2 })
 */
export function runInBackground(fn: () => Promise<void>, options?: TaskOptions): void {
  backgroundJobQueue.fireAndForget(fn, options);
}

/**
 * Convenience function to run multiple tasks in background
 */
export function runAllInBackground(tasks: Array<{ fn: () => Promise<void>; options?: TaskOptions }>): void {
  for (const task of tasks) {
    backgroundJobQueue.fireAndForget(task.fn, task.options);
  }
}
