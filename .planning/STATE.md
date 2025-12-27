# Project State

## Project Summary

**Building:** Self-serve platform that lets small businesses deploy AI voice agents in minutes for phone support and appointment booking.

**Core requirements:**
- End-to-end flow: signup → create agent → assign phone number → receive test call
- Agent books appointments to connected Google Calendar
- Agent answers questions based on configured business info
- Credit purchase and deduction system
- User dashboard for agent management, call history, credit balance
- Admin dashboard for full control

**Constraints:**
- Tech stack: Next.js + PostgreSQL
- Hosting: Self-hosted (not Vercel)
- Payments: Stripe only
- Auth: Email/password only

## Current Position

Phase: 5 of 6 (Payments & Credits) - IN PROGRESS
Plan: 2 of 4 in current phase
Status: Plan 05-02 complete
Last activity: 2025-12-27 - Completed 05-02-PLAN.md (Credit purchase flow)

Progress: ██████████████████░░ 88%

## Performance Metrics

**Velocity:**
- Total plans completed: 16
- Average duration: 19 min
- Total execution time: 5.0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1 | 3 | 23 min | 8 min |
| 2 | 4 | 44 min | 11 min |
| 3 | 4 | 63 min | 16 min |
| 4 | 3 | 105 min | 35 min |
| 5 | 2 | 60 min | 30 min |

**Recent Trend:**
- Last 5 plans: 8 min, 70 min, 27 min, 15 min, 45 min
- Trend: Phase 5 includes VPS testing and webhook verification

*Updated after each plan completion*

## Accumulated Context

### Decisions Made

| Phase | Decision | Rationale |
|-------|----------|-----------|
| 0 | Voice provider: Vapi | End-to-end solution with phone handling built-in |
| 0 | Billing: Credit packs | Predictable costs, simple to implement |
| 0 | Phone numbers: Kametrix provisions | Simpler UX than bring-your-own |
| 0 | Out-of-credits: Grace period | Better UX than hard cutoff |
| 1 | Tailwind CSS v4 with CSS-first config | Latest version, simpler setup |
| 1 | Prisma output to src/generated/prisma | Collocated with app code |
| 1 | Prisma 7 datasource in config.ts | Prisma 7 requirement |
| 1 | Migration via migrate diff | Database not running locally |
| 1 | Prisma 7 adapter-pg for client | Prisma 7 requires adapter |
| 1 | Middleware cookie-check only | Edge runtime limitation |
| 2 | Two-level dashboard layout | Parent auth, child UI chrome |
| 2 | Docker Compose for PostgreSQL | Local dev database setup |
| 2 | Inline toggle/modal in AgentCard | Single-use, simpler than separate components |
| 2 | Credits displayed as dollars | User clarity, stored as cents in DB |
| 2 | Server + client pagination hybrid | SEO for initial load, smooth UX for navigation |
| 3 | Same globalThis singleton as Prisma | Consistency, prevents multiple client instances |
| 3 | gpt-4o, deepgram nova-2, 11labs defaults | Best quality per research, user can customize |
| 3 | 10 min max call duration | Cost protection per research recommendations |
| 3 | OpenRouter with gpt-4o-mini for AI generation | Fast, cost-effective content generation |
| 3 | FIFO phone assignment from pool | Oldest available first, distributes usage |
| 3 | Non-blocking phone assignment | Agent creation succeeds without phones |
| 4 | AES-256-GCM for token encryption | Industry standard, includes authentication tag |
| 4 | Force consent on every OAuth | Guarantees refresh token is returned |
| 4 | Token refresh event listener | Auto-update stored tokens if Google issues new ones |
| 4 | Default timezone Europe/Berlin | User's location |
| 4 | 30-min appointment slots | Standard duration for quick appointments |
| 4 | Local datetime format (no Z) | Google Calendar interprets with timeZone param |
| 4 | Direct function calls in webhook | Avoids Docker networking issues with HTTP fetch |
| 4 | Date header prepended to systemPrompt | GPT-4o needs current date for correct year |
| 5 | Lazy Stripe client initialization | Prevents build errors when STRIPE_SECRET_KEY not set |
| 5 | Proxy pattern for stripe export | Backward compatibility with lazy initialization |
| 5 | Balance format "$X.XX (~Y min)" | User clarity with 15 cents/minute rate |
| 5 | Separate CreditsNotification component | Clean URL cleanup logic for credits page |

### Deferred Issues

None yet.

### Blockers/Concerns Carried Forward

None yet.

## Project Alignment

Last checked: Project start
Status: ✓ Aligned
Assessment: No work done yet - baseline alignment.
Drift notes: None

### Roadmap Evolution

- v1.1 milestone created: German Market & Polish, 4 phases (Phase 7-10)

## Session Continuity

Last session: 2025-12-27
Stopped at: Phase 05-02 complete
Resume file: None
Next: Execute 05-03-PLAN.md (Credit deduction on call completion)
