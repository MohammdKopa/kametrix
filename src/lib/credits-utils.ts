/**
 * Credit utility functions - safe for client-side use
 * These functions do NOT use prisma and can be imported in client components
 */

/**
 * Credit pricing constants
 * $0.15 per minute = 15 cents per minute
 */
export const CENTS_PER_MINUTE = 15;

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
 * @returns Cost in cents
 */
export function calculateCallCost(durationSeconds: number): number {
  if (durationSeconds <= 0) return 0;
  // Round up to nearest minute
  const minutes = Math.ceil(durationSeconds / 60);
  return minutes * CENTS_PER_MINUTE;
}

/**
 * Format credit balance for display
 * Shows dollars and approximate minutes
 *
 * @param cents - Balance in cents
 * @returns Formatted string like "$5.00 (~33 min)"
 */
export function formatBalance(cents: number): string {
  const dollars = (cents / 100).toFixed(2);
  const minutes = Math.floor(cents / CENTS_PER_MINUTE);
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
 * @returns Warning message string
 */
export function getLowBalanceMessage(balanceCents: number): string {
  const estimatedMinutes = Math.floor(balanceCents / CENTS_PER_MINUTE);
  return `Low balance: ${formatBalance(balanceCents)}. You have about ${estimatedMinutes} minutes of call time remaining.`;
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
