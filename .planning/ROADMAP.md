# Roadmap: Kametrix

## Overview

Kametrix evolves from an empty Next.js project to a complete self-serve voice AI platform. We start with foundational infrastructure and authentication, build out user-facing dashboards, integrate Vapi for voice agents, connect Google services for calendar and logging, add Stripe payments with credit tracking, and finish with polish and deployment configuration. Post-MVP, we localize for the German market and polish the UI.

## Milestones

- [v1.0 MVP](milestones/v1.0-ROADMAP.md) - Phases 1-6 (SHIPPED 2025-12-27)
- v1.1 German Market & Polish - Phases 7-10 (planned)

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

### v1.1 German Market & Polish (Planned)

**Milestone Goal:** Localize the platform for the German market with German voice agents and prompts, polish the dashboard UI, and add public-facing pages including landing page and legal compliance.

#### Phase 7: German Voice Setup
**Goal**: Configure German voice selection in Vapi, German TTS/STT providers, locale-aware agent configuration
**Depends on**: Phase 6 (v1.0 complete)
**Research**: Complete
**Plans**: 1/1

Plans:
- [x] 07-01: German voice configuration (Azure de-DE-KatjaNeural TTS, Deepgram German STT)

#### Phase 8: German Prompts & Localization
**Goal**: German system prompts for agents, localized UI strings, German date/time/number formatting
**Depends on**: Phase 7
**Research**: Unlikely (internal patterns, i18n setup)
**Plans**: 1/1

Plans:
- [x] 08-01: Native German localization helpers, system prompts with Sie-form, webhook responses

#### Phase 9: Dashboard UI Polish
**Goal**: Redesign dashboard UI based on provided v0 designs, improve overall UX
**Depends on**: Phase 8
**Research**: Unlikely (design implementation)
**Plans**: 1/3

Plans:
- [x] 09-01: Layout & Navigation Polish (header, nav-tabs, user-menu)
- [ ] 09-02: Core Dashboard Pages (main dashboard, credits, settings)
- [ ] 09-03: Agent & Call Pages (agents list/wizard, calls list/detail)

#### Phase 10: Landing & Legal Pages
**Goal**: Public landing page (v0 design), Impressum, Datenschutz (privacy policy), AGB (terms), cookie consent banner
**Depends on**: Phase 9
**Research**: Likely (German legal requirements, GDPR compliance)
**Research topics**: German Impressum requirements, Datenschutzerklarung template, AGB requirements, cookie consent GDPR patterns
**Plans**: TBD

Plans:
- [ ] 10-01: TBD (run /gsd:plan-phase 10 to break down)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10

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
| 9. Dashboard UI Polish | v1.1 | 1/3 | In progress | - |
| 10. Landing & Legal Pages | v1.1 | 0/? | Not started | - |
