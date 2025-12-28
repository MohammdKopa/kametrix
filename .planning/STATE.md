# Project State

## Project Summary

**Building:** Self-serve platform that lets small businesses deploy AI voice agents in minutes for phone support and appointment booking.

**Current status:** v1.2 shadcn/ui & Premium Dark Theme SHIPPED.

**Core requirements (v1.0 - COMPLETE):**
- [x] End-to-end flow: signup → create agent → assign phone number → receive test call
- [x] Agent books appointments to connected Google Calendar
- [x] Agent answers questions based on configured business info
- [x] Credit purchase and deduction system
- [x] User dashboard for agent management, call history, credit balance
- [x] Admin dashboard for full control

**Constraints:**
- Tech stack: Next.js + PostgreSQL
- Hosting: Self-hosted (not Vercel)
- Payments: Stripe only
- Auth: Email/password only

## Current Position

Phase: 13 of 13 (Landing Redesign)
Plan: 2 of 2 in current phase
Status: Milestone complete
Last activity: 2025-12-28 - Completed 13-02 (Section Animations & Polish)

Progress: v1.2 ██████████ 100%

## Performance Metrics

**Velocity:**
- Total plans completed: 38
- Average duration: 15 min
- Total execution time: 9.5 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1 | 3 | 23 min | 8 min |
| 2 | 4 | 44 min | 11 min |
| 3 | 4 | 63 min | 16 min |
| 4 | 3 | 105 min | 35 min |
| 5 | 4 | 110 min | 28 min |
| 6 | 3 | 37 min | 12 min |
| 7 | 1 | 4 min | 4 min |
| 8 | 1 | 4 min | 4 min |
| 9 | 3 | 41 min | 14 min |
| 10 | 2 | 11 min | 6 min |
| 11 | 2 | 14 min | 7 min |
| 12 | 4 | 90 min | 23 min |
| 13 | 2 | 26 min | 13 min |

*Updated after each plan completion*

## Accumulated Context

### Key Decisions (v1.0)

| Phase | Decision | Rationale |
|-------|----------|-----------|
| 0 | Voice provider: Vapi | End-to-end solution with phone handling built-in |
| 0 | Billing: Credit packs | Predictable costs, simple to implement |
| 0 | Phone numbers: Kametrix provisions | Simpler UX than bring-your-own |
| 0 | Out-of-credits: Grace period | Better UX than hard cutoff |
| 1 | Tailwind CSS v4 with CSS-first config | Latest version, simpler setup |
| 1 | Prisma 7 with adapter-pg | Database adapter requirement |
| 2 | Two-level dashboard layout | Parent auth, child UI chrome |
| 3 | gpt-4o, deepgram nova-2, 11labs defaults | Best quality per research |
| 4 | AES-256-GCM for token encryption | Industry standard |
| 5 | $0.15/min with ceil rounding | Simple, user-friendly pricing |
| 5 | Low balance threshold $5 (500 cents) | ~33 min warning gives time to buy more |
| 6 | Lazy initialization for external clients | Prevents build errors |
| 11 | OKLCH colors (not HSL) | Tailwind v4 native format |
| 11 | tw-animate-css (not tailwindcss-animate) | Tailwind v4 compatible |
| 11 | defaultTheme="dark" | Prevents light flash on load |

### Deferred Issues

None.

### Blockers/Concerns Carried Forward

None.

## Project Alignment

Last checked: 2025-12-27 (v1.0 shipped)
Status: Aligned
Assessment: All v1.0 success criteria met.
Drift notes: None

### Roadmap Evolution

- v1.0 milestone completed: 6 phases (1-6), 21 plans, shipped 2025-12-27
- v1.1 milestone completed: 4 phases (7-10), 7 plans, shipped 2025-12-27
- v1.2 milestone completed: 3 phases (11-13), 8 plans, shipped 2025-12-28

## Session Continuity

Last session: 2025-12-28
Stopped at: Completed Phase 13 (Landing Redesign) - v1.2 SHIPPED
Resume file: None
Next: /gsd:complete-milestone or /gsd:new-milestone
