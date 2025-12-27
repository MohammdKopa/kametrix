# Phase 3: Vapi Integration - Context

**Gathered:** 2025-12-24
**Status:** Ready for research

<vision>
## How This Should Work

Users go through a wizard-style flow to create their AI voice agent. It's comprehensive (5-7 steps) so the agent is fully configured from the start — no half-baked setup requiring immediate tweaking.

The wizard guides them through: business info → voice selection → behaviors → phone number assignment. At the end, they have a working agent on a real phone number ready to receive calls.

The agent creation experience should feel like building something powerful but accessible — structured enough to be clear, comprehensive enough to be complete.

</vision>

<essential>
## What Must Be Nailed

- **Business knowledge configuration** — The agent must know the business well. Users input structured fields: business name, hours, services offered, FAQs, policies. This is the core of what makes the agent useful.
- **Complete wizard flow** — Every step guides them to a fully-configured agent, not a skeleton they need to flesh out later.
- **Working calls at the end** — When the wizard completes, the phone number works. They can call it and talk to their agent.

</essential>

<boundaries>
## What's Out of Scope

- Calendar booking logic — Agent answers calls but appointment booking is Phase 4
- Credit/payment tracking — Calls work, but credit deduction happens in Phase 5
- Google integrations — All Google OAuth and Calendar/Sheets work is Phase 4

</boundaries>

<specifics>
## Specific Ideas

- Phone numbers auto-assigned from pool — we pick a number for them from available inventory
- Structured fields for business knowledge (not free-form) — business name, hours, services, FAQs, policies
- Wizard steps cover everything upfront so agents are fully configured from day one

</specifics>

<notes>
## Additional Context

This is the heart of Kametrix — where the product becomes real. Users create their agent, get a phone number, and can actually call it. Everything before this was infrastructure; this is where value is delivered.

The focus is on the agent being genuinely useful from the start because it knows the business well through structured knowledge input.

</notes>

---

*Phase: 03-vapi-integration*
*Context gathered: 2025-12-24*
