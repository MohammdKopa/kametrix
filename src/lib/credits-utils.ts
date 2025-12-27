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
