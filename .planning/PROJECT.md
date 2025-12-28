# Kametrix

## Current State (Updated: 2025-12-28)

**Shipped:** v1.2 shadcn/ui & Premium Dark Theme (2025-12-28)
**Status:** Production Ready
**Users:** German small business market
**Codebase:** ~28,500 lines TypeScript/TSX, Next.js 15 + PostgreSQL + Prisma 7, self-hosted deployment
**Design:** Proximab-inspired premium dark theme with glassmorphism, radial glows, and scroll animations

## v1.3 Goals

**Vision:** To be determined based on user feedback and market needs.

**Potential directions:**
- English localization for international markets
- Pricing page and billing improvements
- Analytics and reporting features
- Multi-agent support
- Outbound calling capabilities

**Scope (v1.3):**
- TBD - run /gsd:new-milestone when ready to plan

---

<details>
<summary>Original Vision (v1.0 - Archived for reference)</summary>

## Vision

Kametrix is a self-serve platform that lets small businesses deploy AI voice agents in minutes. Local shops, clinics, and service providers need phone support and appointment booking but can't afford dedicated staff or complex enterprise solutions. Kametrix bridges this gap with dead-simple setup and powerful integrations.

The core idea: a small business owner signs up, picks a template (or builds custom), connects their calendar, buys credits, and has a working AI receptionist handling calls within minutes. No technical expertise needed. No sales calls. No complex configuration.

## Problem

Small businesses are caught between two bad options:
1. **Miss calls and opportunities** — no staff to answer phones during busy times or after hours
2. **Expensive/complex solutions** — enterprise voice AI requires technical setup, long onboarding, and high costs

Current AI voice solutions target enterprises with complex integrations, sales-led processes, and high price points. Small businesses need something that "just works" — simple enough to set up without IT help, affordable with pay-as-you-go pricing, and useful for the two things they actually need: answering customer questions and booking appointments.

## Success Criteria

How we know this worked:

- [x] End-to-end flow works: signup → create agent → assign phone number → receive test call
- [x] Agent successfully books appointments to connected Google Calendar
- [x] Agent can answer questions based on configured business info
- [x] Credit purchase and deduction system works correctly
- [x] User can manage their agent, view call history, and see credit balance
- [x] Admin can manage all users, credits, phone numbers, and agents

## Scope

### Built
- AI voice agents for customer support and appointment booking
- Self-serve signup with email/password authentication
- Agent creation via templates AND custom builder
- Integration with Google Calendar for appointment booking
- Integration with Google Sheets for data logging
- Email notifications for important events (welcome, low credits)
- Credit pack system with Stripe payments
- Grace period when credits run low (allow overage before blocking)
- Phone number provisioning (Kametrix manages via Vapi)
- User dashboard (agents, calls, credits, integrations)
- Admin dashboard with full control (users, credits, agents, phone numbers)
- Health check endpoint and deployment documentation

### Not Built (v1.0)
- Custom voice cloning — use pre-made high-quality voices only
- White-label/agency features — focus on direct small business customers
- Outbound calling campaigns — inbound-focused for v1
- SMS/text support — voice only for v1
- Complex IVR menus — AI-driven conversation, not phone trees
- German localization (deferred to v1.1)
- Public landing page (deferred to v1.1)

## Constraints

- **Tech stack**: Next.js + PostgreSQL (user preference)
- **Hosting**: Self-hosted (not Vercel — need control over infrastructure)
- **Payments**: Stripe only for v1
- **Auth**: Email/password only for v1 (no social login)

## Decisions Made

Key decisions from project exploration:

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Target customer | Small businesses | Underserved market, simpler needs than enterprise |
| Voice provider | Vapi | End-to-end solution with phone handling built-in |
| Billing model | Credit packs | Predictable costs for customers, simple to implement |
| Agent creation | Templates + builder | Templates for quick start, builder for customization |
| Phone numbers | Kametrix provisions | Simpler UX than bring-your-own |
| Out-of-credits | Grace period | Better UX than hard cutoff, reduces churn |
| Customer journey | Self-serve | No sales calls, supports "dead simple" goal |
| Credit pricing | $0.15/min | Simple, user-friendly, ceil rounding |
| Low balance threshold | $5 (500 cents) | ~33 min warning gives time to buy more |
| Token encryption | AES-256-GCM | Industry standard for Google OAuth tokens |

</details>

---
*Initialized: 2025-12-24*
*v1.0 Shipped: 2025-12-27*
