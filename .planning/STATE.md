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

Phase: 1 of 6 (Foundation)
Plan: 3 of 3 in current phase
Status: Phase complete
Last activity: 2025-12-24 - Completed 01-03-PLAN.md

Progress: ███░░░░░░░ 14%

## Performance Metrics

**Velocity:**
- Total plans completed: 3
- Average duration: 8 min
- Total execution time: 0.4 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1 | 3 | 23 min | 8 min |

**Recent Trend:**
- Last 5 plans: 13 min, 5 min, 5 min
- Trend: Improving

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

### Deferred Issues

None yet.

### Blockers/Concerns Carried Forward

None yet.

## Project Alignment

Last checked: Project start
Status: ✓ Aligned
Assessment: No work done yet - baseline alignment.
Drift notes: None

## Session Continuity

Last session: 2025-12-24
Stopped at: Completed 01-03-PLAN.md (Phase 1 complete)
Resume file: None
