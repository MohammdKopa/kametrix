# Codebase Concerns

**Analysis Date:** 2025-12-29

## Tech Debt

**Console logging instead of structured logging:**
- Issue: 132 console statements throughout production code
- Files: Throughout `src/`, especially `src/app/api/webhooks/vapi/route.ts` (20+ statements)
- Why: Rapid development, no logging library chosen
- Impact: Hard to filter/aggregate logs in production, no log levels
- Fix approach: Add structured logging library (pino or winston), replace console calls

**Missing request body validation:**
- Issue: `request.json()` called without try-catch at call site in 14 API routes
- Files: `src/app/api/auth/login/route.ts`, `src/app/api/auth/register/route.ts`, `src/app/api/checkout/route.ts`, and 11 more
- Why: Assumes valid JSON from trusted clients
- Impact: Unhandled JSON parse errors crash route handlers
- Fix approach: Wrap all `request.json()` calls in try-catch or use validation library

**Unsafe parseInt without radix:**
- Issue: `parseInt(value)` missing radix parameter
- Files: `src/app/api/calls/route.ts`, `src/app/api/credits/transactions/route.ts`, `src/app/api/admin/users/route.ts`
- Why: Works for decimal but violates best practices
- Impact: Potential bugs with edge case inputs
- Fix approach: Add `, 10` radix to all parseInt calls

## Known Bugs

**None currently tracked.**

## Security Considerations

**Missing environment variable validation:**
- Risk: Non-null assertions (`process.env.VAR!`) crash at runtime if var missing
- Files: `src/app/api/webhooks/stripe/route.ts:30` (`STRIPE_WEBHOOK_SECRET!`), various other files
- Current mitigation: `.env.example` documents required vars
- Recommendations: Add startup validation (check all required env vars at app start), or use zod/envalid

**Vapi webhook signature verification not implemented:**
- Risk: Anyone can POST to `/api/webhooks/vapi` and trigger credit deductions
- File: `src/app/api/webhooks/vapi/route.ts`
- Current mitigation: None
- Recommendations: Implement Vapi webhook signature verification (planned Phase 15)

**Rate limiting not implemented:**
- Risk: API endpoints vulnerable to abuse/DoS
- Files: All API routes
- Current mitigation: None
- Recommendations: Add rate limiting middleware (planned Phase 15)

**Use of `any` type:**
- Risk: Type safety bypassed in critical areas
- Files: 20+ files, including `src/lib/vapi/assistants.ts:136`, `src/app/api/webhooks/vapi/route.ts:269`
- Current mitigation: None
- Recommendations: Replace `any` with proper types, enable `noImplicitAny`

## Performance Bottlenecks

**Fire-and-forget promises:**
- Problem: Google Sheets logging failures silently swallowed
- File: `src/app/api/webhooks/vapi/route.ts:295-306`
- Measurement: Unknown failure rate
- Cause: `.catch()` only logs error, no retry mechanism
- Improvement path: Add job queue for reliable async operations

**Email sending without retry:**
- Problem: Low credit email fails once if SMTP unavailable
- File: `src/app/api/webhooks/vapi/route.ts:241-248`
- Measurement: Unknown failure rate
- Cause: No retry mechanism or queue
- Improvement path: Add email queue with retry logic

## Fragile Areas

**Vapi webhook handler:**
- File: `src/app/api/webhooks/vapi/route.ts` (605 lines)
- Why fragile: Giant file with multiple event types, complex tool-call handling
- Common failures: Must respond within 7.5 seconds (Vapi timeout), silent failures
- Safe modification: Extract handlers to separate files, add comprehensive tests
- Test coverage: 0 tests

**Tool arguments parsing:**
- File: `src/app/api/webhooks/vapi/route.ts:348-351`
- Why fragile: Vapi sends arguments as "string | object" (undocumented behavior)
- Common failures: JSON.parse on already-parsed object, or vice versa
- Safe modification: Add explicit type checking before parsing
- Test coverage: 0 tests

## Scaling Limits

**No known limits documented.**

## Dependencies at Risk

**No immediate risks identified.**
- All dependencies are recent versions
- No deprecated packages detected

## Missing Critical Features

**Webhook idempotency:**
- Problem: No check if webhook already processed (duplicate events)
- File: `src/app/api/webhooks/vapi/route.ts`, `src/app/api/webhooks/stripe/route.ts`
- Current workaround: None (relies on webhook providers not duplicating)
- Blocks: Reliable at-least-once delivery handling
- Implementation complexity: Low (check call ID before creating)

## Test Coverage Gaps

**Credit deduction logic:**
- What's not tested: `src/lib/credits.ts` - atomic credit deductions, grace period handling
- Risk: Payment/billing bugs could go unnoticed
- Priority: High
- Difficulty to test: Medium (need database mocking)

**Stripe webhook handler:**
- What's not tested: `src/app/api/webhooks/stripe/route.ts` - payment completion flow
- Risk: Users pay but don't receive credits
- Priority: High
- Difficulty to test: Medium (need Stripe test fixtures)

**Vapi webhook handler:**
- What's not tested: `src/app/api/webhooks/vapi/route.ts` - call processing, tool calls
- Risk: Call billing errors, failed bookings
- Priority: High
- Difficulty to test: High (complex event types, external dependencies)

**Authentication flow:**
- What's not tested: `src/lib/auth.ts`, `src/app/api/auth/*/route.ts`
- Risk: Auth bypass, session issues
- Priority: Medium
- Difficulty to test: Medium

**All API routes:**
- What's not tested: 28 route handlers with 0 tests
- Risk: Regressions on any change
- Priority: Medium
- Difficulty to test: Medium

---

*Concerns audit: 2025-12-29*
*Update as issues are fixed or new ones discovered*
