/**
 * Circuit Breaker Pattern Implementation
 *
 * Provides graceful degradation for external services by:
 * - Tracking failure rates
 * - Opening circuit after threshold failures
 * - Allowing periodic probes to check recovery
 * - Supporting fallback functions
 */

import { logger } from './logger';
import { externalServiceError, timeoutError } from './app-error';
import { ErrorCode } from './types';

/**
 * Circuit breaker states
 */
export enum CircuitState {
  CLOSED = 'CLOSED',   // Normal operation
  OPEN = 'OPEN',       // Failing, rejecting requests
  HALF_OPEN = 'HALF_OPEN', // Testing recovery
}

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  name: string;
  failureThreshold: number;      // Number of failures before opening
  successThreshold: number;      // Successes in half-open to close
  timeout: number;               // Time in ms before trying half-open
  resetTimeout: number;          // Time in ms to reset failure count
  monitorInterval: number;       // Interval to check state changes
}

/**
 * Circuit breaker statistics
 */
export interface CircuitStats {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailure: Date | null;
  lastSuccess: Date | null;
  lastStateChange: Date;
  totalRequests: number;
  failedRequests: number;
  successfulRequests: number;
}

/**
 * Default circuit breaker configuration
 */
const DEFAULT_CONFIG: Omit<CircuitBreakerConfig, 'name'> = {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 30000, // 30 seconds
  resetTimeout: 60000, // 1 minute
  monitorInterval: 10000, // 10 seconds
};

/**
 * Circuit Breaker class
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: number = 0;
  private successes: number = 0;
  private lastFailure: Date | null = null;
  private lastSuccess: Date | null = null;
  private lastStateChange: Date = new Date();
  private totalRequests: number = 0;
  private failedRequests: number = 0;
  private successfulRequests: number = 0;
  private config: CircuitBreakerConfig;
  private stateChangeListeners: ((state: CircuitState, service: string) => void)[] = [];

  constructor(config: Partial<CircuitBreakerConfig> & { name: string }) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Get current circuit state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get circuit statistics
   */
  getStats(): CircuitStats {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailure: this.lastFailure,
      lastSuccess: this.lastSuccess,
      lastStateChange: this.lastStateChange,
      totalRequests: this.totalRequests,
      failedRequests: this.failedRequests,
      successfulRequests: this.successfulRequests,
    };
  }

  /**
   * Register state change listener
   */
  onStateChange(listener: (state: CircuitState, service: string) => void): void {
    this.stateChangeListeners.push(listener);
  }

  /**
   * Execute function with circuit breaker protection
   */
  async execute<T>(
    fn: () => Promise<T>,
    fallback?: () => T | Promise<T>
  ): Promise<T> {
    this.totalRequests++;

    // Check if circuit should transition from OPEN to HALF_OPEN
    if (this.state === CircuitState.OPEN) {
      const timeSinceOpen = Date.now() - this.lastStateChange.getTime();
      if (timeSinceOpen >= this.config.timeout) {
        this.transitionTo(CircuitState.HALF_OPEN);
      }
    }

    // If circuit is open, use fallback or throw
    if (this.state === CircuitState.OPEN) {
      this.failedRequests++;
      logger.warn(`Circuit breaker OPEN for ${this.config.name}, rejecting request`, {
        service: this.config.name,
        state: this.state,
      });

      if (fallback) {
        return fallback();
      }
      throw externalServiceError(
        this.config.name,
        `Service ${this.config.name} is currently unavailable`
      );
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);

      if (fallback) {
        logger.info(`Using fallback for ${this.config.name}`, {
          service: this.config.name,
        });
        return fallback();
      }
      throw error;
    }
  }

  /**
   * Record successful operation
   */
  private onSuccess(): void {
    this.successes++;
    this.successfulRequests++;
    this.lastSuccess = new Date();

    if (this.state === CircuitState.HALF_OPEN) {
      if (this.successes >= this.config.successThreshold) {
        this.transitionTo(CircuitState.CLOSED);
      }
    } else if (this.state === CircuitState.CLOSED) {
      // Reset failure count on success
      this.failures = 0;
    }
  }

  /**
   * Record failed operation
   */
  private onFailure(error: unknown): void {
    this.failures++;
    this.failedRequests++;
    this.lastFailure = new Date();
    this.successes = 0;

    logger.error(`Circuit breaker failure for ${this.config.name}`, error, {
      service: this.config.name,
      failures: this.failures,
      threshold: this.config.failureThreshold,
    });

    if (this.state === CircuitState.HALF_OPEN) {
      // Any failure in half-open returns to open
      this.transitionTo(CircuitState.OPEN);
    } else if (this.state === CircuitState.CLOSED) {
      if (this.failures >= this.config.failureThreshold) {
        this.transitionTo(CircuitState.OPEN);
      }
    }
  }

  /**
   * Transition to new state
   */
  private transitionTo(newState: CircuitState): void {
    const previousState = this.state;
    this.state = newState;
    this.lastStateChange = new Date();

    if (newState === CircuitState.CLOSED) {
      this.failures = 0;
      this.successes = 0;
    }

    logger.warn(`Circuit breaker state change: ${this.config.name}`, {
      service: this.config.name,
      previousState,
      newState,
    });

    // Notify listeners
    for (const listener of this.stateChangeListeners) {
      try {
        listener(newState, this.config.name);
      } catch (e) {
        // Don't let listener errors break the circuit
        logger.error('Circuit breaker listener error', e);
      }
    }
  }

  /**
   * Force circuit to open state (for testing or manual intervention)
   */
  forceOpen(): void {
    this.transitionTo(CircuitState.OPEN);
  }

  /**
   * Force circuit to closed state (for testing or manual intervention)
   */
  forceClosed(): void {
    this.transitionTo(CircuitState.CLOSED);
  }

  /**
   * Reset circuit breaker to initial state
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.lastFailure = null;
    this.lastSuccess = null;
    this.lastStateChange = new Date();
    this.totalRequests = 0;
    this.failedRequests = 0;
    this.successfulRequests = 0;
  }
}

/**
 * Registry of circuit breakers for different services
 */
class CircuitBreakerRegistry {
  private breakers: Map<string, CircuitBreaker> = new Map();
  private globalListeners: ((state: CircuitState, service: string) => void)[] = [];

  /**
   * Get or create circuit breaker for service
   */
  get(name: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    let breaker = this.breakers.get(name);

    if (!breaker) {
      breaker = new CircuitBreaker({ name, ...config });

      // Register global listeners
      for (const listener of this.globalListeners) {
        breaker.onStateChange(listener);
      }

      this.breakers.set(name, breaker);
    }

    return breaker;
  }

  /**
   * Register global state change listener
   */
  onStateChange(listener: (state: CircuitState, service: string) => void): void {
    this.globalListeners.push(listener);

    // Register with existing breakers
    for (const breaker of this.breakers.values()) {
      breaker.onStateChange(listener);
    }
  }

  /**
   * Get all circuit breaker stats
   */
  getAllStats(): Record<string, CircuitStats> {
    const stats: Record<string, CircuitStats> = {};
    for (const [name, breaker] of this.breakers) {
      stats[name] = breaker.getStats();
    }
    return stats;
  }

  /**
   * Get names of open circuits
   */
  getOpenCircuits(): string[] {
    const open: string[] = [];
    for (const [name, breaker] of this.breakers) {
      if (breaker.getState() === CircuitState.OPEN) {
        open.push(name);
      }
    }
    return open;
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
  }
}

/**
 * Global circuit breaker registry
 */
export const circuitBreakers = new CircuitBreakerRegistry();

/**
 * Pre-configured circuit breakers for external services
 */
export const ServiceCircuitBreakers = {
  VAPI: 'vapi',
  GOOGLE_CALENDAR: 'google_calendar',
  GOOGLE_SHEETS: 'google_sheets',
  STRIPE: 'stripe',
  EMAIL: 'email',
  OPENROUTER: 'openrouter',
} as const;

/**
 * Execute with circuit breaker for a named service
 */
export async function withCircuitBreaker<T>(
  service: string,
  fn: () => Promise<T>,
  fallback?: () => T | Promise<T>,
  config?: Partial<CircuitBreakerConfig>
): Promise<T> {
  const breaker = circuitBreakers.get(service, config);
  return breaker.execute(fn, fallback);
}

/**
 * Wrap an async function with circuit breaker
 */
export function withCircuitBreakerWrapper<TArgs extends unknown[], TResult>(
  service: string,
  fn: (...args: TArgs) => Promise<TResult>,
  fallback?: (...args: TArgs) => TResult | Promise<TResult>,
  config?: Partial<CircuitBreakerConfig>
): (...args: TArgs) => Promise<TResult> {
  const breaker = circuitBreakers.get(service, config);

  return async (...args: TArgs): Promise<TResult> => {
    return breaker.execute(
      () => fn(...args),
      fallback ? () => fallback(...args) : undefined
    );
  };
}
