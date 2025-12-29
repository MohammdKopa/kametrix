# Roadmap: Kametrix

## Overview

Kametrix evolves from an empty Next.js project to a complete self-serve voice AI platform. We start with foundational infrastructure and authentication, build out user-facing dashboards, integrate Vapi for voice agents, connect Google services for calendar and logging, add Stripe payments with credit tracking, and finish with polish and deployment configuration. Post-MVP, we localize for the German market and polish the UI.

## Milestones

- [v1.0 MVP](milestones/v1.0-ROADMAP.md) - Phases 1-6 (SHIPPED 2025-12-27)
- [v1.1 German Market & Polish](milestones/v1.1-ROADMAP.md) - Phases 7-10 (SHIPPED 2025-12-27)
- [v1.2 shadcn/ui & Premium Dark Theme](milestones/v1.2-ROADMAP.md) - Phases 11-13 (SHIPPED 2025-12-28)
- 🚧 **v2.0 Security & Admin Controls** - Phases 14-17 (in progress)

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

<details>
<summary>v1.2 shadcn/ui & Premium Dark Theme (Phases 11-13) - SHIPPED 2025-12-28</summary>

- [x] **Phase 11: shadcn/ui Setup** - Install shadcn/ui, configure Proximab OKLCH dark theme, Poppins/Inter typography (2/2 plans)
- [x] **Phase 12: Dashboard Redesign** - Glassmorphic cards, gradient accents, premium hover effects (4/4 plans)
- [x] **Phase 13: Landing Redesign** - Motion library, atmospheric glows, floating orbs, scroll animations (2/2 plans)

</details>

### 🚧 v2.0 Security & Admin Controls (In Progress)

**Milestone Goal:** Harden security with rate limiting and authentication, fix critical bugs, update auth UI, and add admin price controls.

#### Phase 14: Critical Bug Fixes ✓
**Goal**: Fix appointment year bug and other critical business logic issues
**Depends on**: Phase 13
**Research**: Unlikely (internal patterns)
**Plans**: 1

Plans:
- [x] 14-01: Fix appointment year bug with date validation

#### Phase 15: Security Hardening ✓
**Goal**: Add rate limiting and authentication to protect APIs
**Depends on**: Phase 14
**Research**: Likely (rate limiting library patterns)
**Research topics**: Rate limiting libraries for Next.js, Vapi webhook signature verification
**Plans**: 1

Plans:
- [x] 15-01: Rate limiting and Vapi webhook signature verification

#### Phase 16: Auth UI Polish ✓
**Goal**: Update login/signup pages to match website theme
**Depends on**: Phase 15
**Research**: Unlikely (existing patterns)
**Plans**: 1

Plans:
- [x] 16-01: Glassmorphic dark theme for login/signup pages

#### Phase 17: Admin Price Control
**Goal**: Admin dashboard for per-minute rate management
**Depends on**: Phase 16
**Research**: Unlikely (internal patterns)
**Plans**: 2

Plans:
- [x] 17-01: Database & API (SiteSetting model, admin settings endpoint)
- [x] 17-02: UI & Integration (Settings page, dynamic rate in credit functions)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12 → 13 → 14 → 15 → 16 → 17

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
| 13. Landing Redesign | v1.2 | 2/2 | Complete | 2025-12-28 |
| 14. Critical Bug Fixes | v2.0 | 1/1 | Complete | 2025-12-29 |
| 15. Security Hardening | v2.0 | 1/1 | Complete | 2025-12-29 |
| 16. Auth UI Polish | v2.0 | 1/1 | Complete | 2025-12-29 |
| 17. Admin Price Control | v2.0 | 2/2 | Complete | 2025-12-29 |
