# Kametrix

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

- [ ] End-to-end flow works: signup → create agent → assign phone number → receive test call
- [ ] Agent successfully books appointments to connected Google Calendar
- [ ] Agent can answer questions based on configured business info
- [ ] Credit purchase and deduction system works correctly
- [ ] User can manage their agent, view call history, and see credit balance
- [ ] Admin can manage all users, credits, phone numbers, and agents

## Scope

### Building
- AI voice agents for customer support and appointment booking
- Self-serve signup with email/password authentication
- Agent creation via templates AND custom builder
- Integration with Google Calendar for appointment booking
- Integration with Google Sheets for data logging
- Email notifications for important events
- Webhook support for custom integrations
- Credit pack system with Stripe payments
- Grace period when credits run low (allow overage before blocking)
- Phone number provisioning (Kametrix manages via Twilio)
- User dashboard (agents, calls, credits, integrations)
- Admin dashboard with full control (users, credits, agents, phone numbers)

### Not Building
- Custom voice cloning — use pre-made high-quality voices only
- White-label/agency features — focus on direct small business customers
- Outbound calling campaigns — inbound-focused for v1
- SMS/text support — voice only for v1
- Complex IVR menus — AI-driven conversation, not phone trees

## Context

**Greenfield project.** Starting fresh, no existing codebase.

**Market opportunity:** Small businesses need this but current solutions are either too complex (enterprise voice AI) or too limited (basic IVRs). The gap is a self-serve platform that combines simplicity with genuinely useful AI capabilities.

**Voice provider decision:** Between Vapi and ElevenLabs. Recommendation: **Vapi** — it's an end-to-end voice agent platform with built-in phone handling, while ElevenLabs is primarily voice synthesis requiring more integration work. Vapi handles the telephony, speech recognition, and response generation in one package.

**Phone number strategy:** Kametrix provisions and manages phone numbers via Twilio (or Vapi's built-in phone handling). Customers don't need to bring their own numbers — they get assigned one from Kametrix's pool.

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
| Voice provider | Vapi (recommended) | End-to-end solution with phone handling built-in |
| Billing model | Credit packs | Predictable costs for customers, simple to implement |
| Agent creation | Templates + builder | Templates for quick start, builder for customization |
| Phone numbers | Kametrix provisions | Simpler UX than bring-your-own |
| Out-of-credits | Grace period | Better UX than hard cutoff, reduces churn |
| Customer journey | Self-serve | No sales calls, supports "dead simple" goal |

## Open Questions

Things to figure out during execution:

- [ ] Vapi vs ElevenLabs — confirm Vapi is the right choice after deeper research
- [ ] Credit pricing — how much per minute? What pack sizes?
- [ ] Phone number costs — pass through or absorb into credit pricing?
- [ ] Grace period specifics — how much overage allowed? How long?
- [ ] Template library — what specific templates for v1? (general support, appointment booking, FAQ bot?)

---
*Initialized: 2025-12-24*
