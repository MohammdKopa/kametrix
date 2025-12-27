# Roadmap: Kametrix

## Overview

Kametrix evolves from an empty Next.js project to a complete self-serve voice AI platform. We start with foundational infrastructure and authentication, build out user-facing dashboards, integrate Vapi for voice agents, connect Google services for calendar and logging, add Stripe payments with credit tracking, and finish with polish and deployment configuration. Post-MVP, we localize for the German market and polish the UI.

## Milestones

- [v1.0 MVP](milestones/v1.0-ROADMAP.md) - Phases 1-6 (SHIPPED 2025-12-27)
- [v1.1 German Market & Polish](milestones/v1.1-ROADMAP.md) - Phases 7-10 (SHIPPED 2025-12-27)
- v1.2 React Conversion & Landing Complete - Phases 11-13 (in progress)

## Domain Expertise

None

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

<details>
<summary>v1.0 MVP (Phases 1-6) - SHIPPED 2025-12-27</summary>

- [x] **Phase 1: Foundation** - Project setup, database schema, authentication system (3/3 plans)
- [x] **Phase 2: Core Dashboard** - User and admin dashboards, basic UI structure (4/4 plans)
- [x] **Phase 3: Vapi Integration** - Voice agent creation, phone number provisioning, call handling (4/4 plans)
- [x] **Phase 4: Google Integrations** - Calendar booking, Sheets logging, OAuth flow (3/3 plans)
- [x] **Phase 5: Payments & Credits** - Stripe integration, credit packs, usage tracking, grace period (4/4 plans)
- [x] **Phase 6: Polish & Launch** - Email notifications, webhooks, final testing, deployment config (3/3 plans)

</details>

<details>
<summary>v1.1 German Market & Polish (Phases 7-10) - SHIPPED 2025-12-27</summary>

- [x] **Phase 7: German Voice Setup** - Azure de-DE-KatjaNeural TTS, Deepgram German STT (1/1 plans)
- [x] **Phase 8: German Prompts & Localization** - Sie-form prompts, localization helpers (1/1 plans)
- [x] **Phase 9: Dashboard UI Polish** - Glassmorphism dark mode, theme toggle (3/3 plans)
- [x] **Phase 10: Landing & Legal Pages** - Hero, Features, How It Works, legal pages (2/2 plans)

</details>

### v1.2 React Conversion & Landing Complete (In Progress)

**Milestone Goal:** Convert frontend from TypeScript (.tsx) to plain React (.jsx), complete the landing page with Pricing, CTA, and Footer sections using frontend-design skill for premium visuals.

#### Phase 11: Dashboard JSX Conversion
**Goal**: Convert all dashboard components from .tsx to .jsx (remove TypeScript, keep functionality)
**Depends on**: Phase 10 (v1.1 complete)
**Research**: Unlikely (internal refactoring)
**Plans**: TBD

Plans:
- [ ] 11-01: TBD (run /gsd:plan-phase 11 to break down)

#### Phase 12: Landing JSX Conversion
**Goal**: Convert marketing/landing page components from .tsx to .jsx
**Depends on**: Phase 11
**Research**: Unlikely (internal refactoring)
**Plans**: TBD

Plans:
- [ ] 12-01: TBD (run /gsd:plan-phase 12 to break down)

#### Phase 13: Landing Completion
**Goal**: Add Pricing, CTA, Footer sections to landing page with frontend-design skill for premium visuals
**Depends on**: Phase 12
**Research**: Unlikely (established patterns + frontend-design skill)
**Plans**: TBD

Plans:
- [ ] 13-01: TBD (run /gsd:plan-phase 13 to break down)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12 → 13

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation | v1.0 | 3/3 | Complete | 2025-12-24 |
| 2. Core Dashboard | v1.0 | 4/4 | Complete | 2025-12-24 |
| 3. Vapi Integration | v1.0 | 4/4 | Complete | 2025-12-24 |
| 4. Google Integrations | v1.0 | 3/3 | Complete | 2025-12-25 |
| 5. Payments & Credits | v1.0 | 4/4 | Complete | 2025-12-27 |
| 6. Polish & Launch | v1.0 | 3/3 | Complete | 2025-12-27 |
| 7. German Voice Setup | v1.1 | 1/1 | Complete | 2025-12-27 |
| 8. German Prompts & Localization | v1.1 | 1/1 | Complete | 2025-12-27 |
| 9. Dashboard UI Polish | v1.1 | 3/3 | Complete | 2025-12-27 |
| 10. Landing & Legal Pages | v1.1 | 2/2 | Complete | 2025-12-27 |
| 11. Dashboard JSX Conversion | v1.2 | 0/? | Not started | - |
| 12. Landing JSX Conversion | v1.2 | 0/? | Not started | - |
| 13. Landing Completion | v1.2 | 0/? | Not started | - |
