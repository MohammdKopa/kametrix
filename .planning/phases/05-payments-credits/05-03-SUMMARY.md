# Phase 5 Plan 03: Credit Deduction on Call Completion Summary

**Credit deduction logic in Vapi webhook, call records show creditsUsed, transaction logging**

## Performance

- **Duration:** 15 min
- **Started:** 2025-12-27T14:00:00Z
- **Completed:** 2025-12-27T14:15:00Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Credit deduction utility with atomic transactions and grace period support
- Vapi webhook deducts credits on COMPLETED calls with duration > 0
- Call records updated with creditsUsed field
- CreditTransaction created for each call deduction
- Call history displays "X min Y sec - $Z.ZZ" format when credits charged

## Files Created/Modified

- `src/lib/credits-utils.ts` - Pure utility functions (client-safe, no prisma)
- `src/lib/credits.ts` - Server-side deduction function with prisma
- `src/app/api/webhooks/vapi/route.ts` - Added credit deduction to handleEndOfCallReport
- `src/lib/calls.ts` - Updated comment for creditsUsed field
- `src/components/dashboard/call-row.tsx` - Added formatCallCost display for duration

## Decisions Made

- Split credits module into credits-utils.ts (client-safe) and credits.ts (server-only)
- Re-export utility functions from credits.ts for server convenience
- Grace period: balance goes to 0, overage tracked in graceCreditsUsed
- Transaction type: CALL_USAGE for normal, GRACE_USAGE when balance insufficient
- Credit deduction wrapped in try-catch to not break webhook on failure

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Split credits module for client/server separation**
- **Found during:** npm run build
- **Issue:** Importing from credits.ts in call-row.tsx pulled in prisma, causing build failure (pg module not found in browser context)
- **Fix:** Created credits-utils.ts with pure functions, updated call-row.tsx to import from credits-utils
- **Files modified:** src/lib/credits-utils.ts (created), src/lib/credits.ts (refactored), src/components/dashboard/call-row.tsx

---

**Total deviations:** 1 auto-fixed (blocking build issue)
**Impact on plan:** None. Module split is cleaner architecture anyway.

## Pricing Model Implemented

- $0.15 per minute = 15 cents per minute
- Round up to nearest minute (Math.ceil)
- Example: 4 min 32 sec = 5 minutes = 75 cents ($0.75)

## Grace Period Logic

- When deduction would cause negative balance:
  1. Calculate overage amount (how far below 0)
  2. Add overage to graceCreditsUsed
  3. Set balance to 0
  4. Mark transaction as GRACE_USAGE
- Grace credits are settled on next purchase (handled in 05-01 webhook)

## Next Phase Readiness

- Credit deduction working for completed calls
- Ready for 05-04: Grace period logic and low balance notifications

---
*Phase: 05-payments-credits*
*Completed: 2025-12-27*
