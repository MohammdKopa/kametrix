/**
 * Credit utility functions - safe for client-side use
 * These functions do NOT use prisma and can be imported in client components
 */

/**
 * Default credit pricing constant (fallback for client-side)
 * $0.15 per minute = 15 cents per minute
 * Server-side code should use getCentsPerMinute() from @/lib/settings instead
 */
export const DEFAULT_CENTS_PER_MINUTE = 15;

/**
 * @deprecated Use DEFAULT_CENTS_PER_MINUTE instead
 */
export const CENTS_PER_MINUTE = DEFAULT_CENTS_PER_MINUTE;

/**
 * Low balance threshold constants
 * $5.00 = 500 cents = ~33 minutes of call time
 */
export const LOW_BALANCE_THRESHOLD_CENTS = 500; // $5.00
export const LOW_BALANCE_THRESHOLD_MINUTES = 33; // ~$5 at $0.15/min

/**
 * Calculate call cost in cents based on duration
 * Rounds up to nearest minute (e.g., 4:32 = 5 minutes = 75 cents)
 *
 * @param durationSeconds - Call duration in seconds
 * @param centsPerMinute - Rate per minute (defaults to DEFAULT_CENTS_PER_MINUTE)
 * @returns Cost in cents
 */
export function calculateCallCost(
  durationSeconds: number,
  centsPerMinute: number = DEFAULT_CENTS_PER_MINUTE
): number {
  if (durationSeconds <= 0) return 0;
  // Round up to nearest minute
  const minutes = Math.ceil(durationSeconds / 60);
  return minutes * centsPerMinute;
}

/**
 * Format credit balance for display
 * Shows dollars and approximate minutes
 *
 * @param cents - Balance in cents
 * @param centsPerMinute - Rate per minute (defaults to DEFAULT_CENTS_PER_MINUTE)
 * @returns Formatted string like "$5.00 (~33 min)"
 */
export function formatBalance(
  cents: number,
  centsPerMinute: number = DEFAULT_CENTS_PER_MINUTE
): string {
  const dollars = (cents / 100).toFixed(2);
  const minutes = Math.floor(cents / centsPerMinute);
  return `$${dollars} (~${minutes} min)`;
}

/**
 * Format call cost for display in call history
 * Shows duration and cost: "4 min 32 sec - $0.75"
 *
 * @param durationSeconds - Call duration in seconds
 * @param creditsCents - Cost in cents
 * @returns Formatted string like "4 min 32 sec - $0.75"
 */
export function formatCallCost(durationSeconds: number, creditsCents: number): string {
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;
  const cost = (creditsCents / 100).toFixed(2);
  return `${minutes} min ${seconds} sec - $${cost}`;
}

/**
 * Check if a credit balance is considered low
 * Low balance is defined as <= $5.00 (500 cents)
 *
 * @param creditBalanceCents - Balance in cents
 * @returns true if balance is low
 */
export function isLowBalance(creditBalanceCents: number): boolean {
  return creditBalanceCents <= LOW_BALANCE_THRESHOLD_CENTS;
}

/**
 * Check if user has any grace credits used
 *
 * @param graceCreditsUsed - Grace credits used in cents
 * @returns true if grace credits are being used
 */
export function hasGraceUsage(graceCreditsUsed: number): boolean {
  return graceCreditsUsed > 0;
}

/**
 * Generate low balance warning message
 *
 * @param balanceCents - Current balance in cents
 * @param centsPerMinute - Rate per minute (defaults to DEFAULT_CENTS_PER_MINUTE)
 * @returns Warning message string
 */
export function getLowBalanceMessage(
  balanceCents: number,
  centsPerMinute: number = DEFAULT_CENTS_PER_MINUTE
): string {
  const estimatedMinutes = Math.floor(balanceCents / centsPerMinute);
  return `Low balance: ${formatBalance(balanceCents, centsPerMinute)}. You have about ${estimatedMinutes} minutes of call time remaining.`;
}

/**
 * Generate grace usage warning message
 *
 * @param graceUsedCents - Grace credits used in cents
 * @returns Warning message string
 */
export function getGraceUsageMessage(graceUsedCents: number): string {
  const dollars = (graceUsedCents / 100).toFixed(2);
  return `You have $${dollars} in grace credits that will be settled on your next purchase.`;
}
