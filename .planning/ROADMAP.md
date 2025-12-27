# Roadmap: Kametrix

## Overview

Kametrix evolves from an empty Next.js project to a complete self-serve voice AI platform. We start with foundational infrastructure and authentication, build out user-facing dashboards, integrate Vapi for voice agents, connect Google services for calendar and logging, add Stripe payments with credit tracking, and finish with polish and deployment configuration. Post-MVP, we localize for the German market and polish the UI.

## Milestones

- [v1.0 MVP](milestones/v1.0-ROADMAP.md) - Phases 1-6 (SHIPPED 2025-12-27)
- [v1.1 German Market & Polish](milestones/v1.1-ROADMAP.md) - Phases 7-10 (SHIPPED 2025-12-27)
- v1.2 shadcn/ui & Premium Dark Theme - Phases 11-13 (in progress)

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

### v1.2 shadcn/ui & Premium Dark Theme (In Progress)

**Milestone Goal:** Redesign the entire app with shadcn/ui components and a Proximab-inspired premium dark theme featuring purple/pink gradients, radial glows, glassmorphism, and scroll effects. Visual polish only — no new features.

**Reference:** https://proximab.framer.website/
- Purple/pink accent gradients on dark backgrounds (#06040d base)
- Glassmorphic cards with blur effects and subtle borders
- Radial glow effects for atmosphere
- Smooth scroll animations and sticky elements
- Typography: Poppins + Inter

#### Phase 11: shadcn/ui Setup
**Goal**: Install shadcn/ui, configure Proximab-inspired theme (purple/pink gradients, dark mode), set up component foundation
**Depends on**: Phase 10 (v1.1 complete)
**Research**: Likely (new library integration)
**Research topics**: shadcn/ui installation with Next.js, theme customization, CSS variables for dark mode
**Plans**: TBD

Plans:
- [x] 11-01: shadcn/ui Installation & Theme Foundation
- [x] 11-02: Core Components & Typography

#### Phase 12: Dashboard Redesign
**Goal**: Rebuild dashboard components with shadcn/ui, apply Proximab dark theme with glassmorphism and gradient accents
**Depends on**: Phase 11
**Research**: Unlikely (internal patterns + shadcn docs from Phase 11)
**Plans**: 4

Plans:
- [x] 12-01: Layout Shell & Navigation
- [x] 12-02: Stats & Cards
- [x] 12-03: Forms & Inputs
- [x] 12-04: Tables & Final Polish

#### Phase 13: Landing Redesign
**Goal**: Rebuild landing page with shadcn/ui, add scroll effects, radial glows, and premium dark theme styling
**Depends on**: Phase 12
**Research**: Unlikely (established patterns from Phase 12)
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
| 11. shadcn/ui Setup | v1.2 | 2/2 | Complete | 2025-12-27 |
| 12. Dashboard Redesign | v1.2 | 4/4 | Complete | 2025-12-27 |
| 13. Landing Redesign | v1.2 | 0/? | Not started | - |
