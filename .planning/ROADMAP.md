# Roadmap: Kametrix

## Overview

Kametrix evolves from an empty Next.js project to a complete self-serve voice AI platform. We start with foundational infrastructure and authentication, build out user-facing dashboards, integrate Vapi for voice agents, connect Google services for calendar and logging, add Stripe payments with credit tracking, and finish with polish and deployment configuration. Post-MVP, we localize for the German market and polish the UI.

## Milestones

- 🚧 **v1.0 MVP** - Phases 1-6 (in progress)
- 📋 **v1.1 German Market & Polish** - Phases 7-10 (planned)

## Domain Expertise

None

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Project setup, database schema, authentication system
- [x] **Phase 2: Core Dashboard** - User and admin dashboards, basic UI structure
- [x] **Phase 3: Vapi Integration** - Voice agent creation, phone number provisioning, call handling
- [x] **Phase 4: Google Integrations** - Calendar booking, Sheets logging, OAuth flow
- [ ] **Phase 5: Payments & Credits** - Stripe integration, credit packs, usage tracking, grace period
- [ ] **Phase 6: Polish & Launch** - Email notifications, webhooks, final testing, deployment config

## Phase Details

### Phase 1: Foundation
**Goal**: Working Next.js project with PostgreSQL database, schema for all entities, and email/password authentication
**Depends on**: Nothing (first phase)
**Research**: Unlikely (established patterns)
**Plans**: TBD

Plans:
- [x] 01-01: Next.js project setup with TypeScript, Tailwind, PostgreSQL connection
- [x] 01-02: Database schema (users, agents, calls, credits, phone numbers)
- [x] 01-03: Email/password authentication with session management

### Phase 2: Core Dashboard
**Goal**: User dashboard to manage agents and view calls, admin dashboard with full control
**Depends on**: Phase 1
**Research**: Unlikely (internal UI patterns)
**Plans**: TBD

Plans:
- [x] 02-01: User dashboard layout and navigation
- [x] 02-02: Agent management UI (list, create stub, edit, delete)
- [x] 02-03: Call history and credit balance views
- [x] 02-04: Admin dashboard with user, agent, and phone number management

### Phase 3: Vapi Integration
**Goal**: Create and configure voice agents via Vapi, provision phone numbers, handle incoming calls
**Depends on**: Phase 2
**Research**: Likely (external API integration)
**Research topics**: Vapi API documentation, voice agent configuration options, phone number provisioning via Vapi/Twilio, call webhook handling, assistant templates
**Plans**: TBD

Plans:
- [x] 03-01: Vapi SDK integration and API setup
- [x] 03-02: Agent creation flow (templates + custom builder)
- [x] 03-03: Phone number provisioning and assignment
- [x] 03-04: Call webhook handling and call logging

### Phase 4: Google Integrations
**Goal**: OAuth flow for Google, Calendar integration for booking, Sheets integration for logging
**Depends on**: Phase 3
**Research**: Likely (OAuth, external APIs)
**Research topics**: Google OAuth2 flow, Calendar API for availability and booking, Sheets API for data logging, token refresh and storage patterns
**Plans**: TBD

Plans:
- [x] 04-01: Google OAuth flow and token management
- [x] 04-02: Google Calendar integration (availability check, appointment booking)
- [x] 04-03: Google Sheets integration (call logging, data export)

### Phase 5: Payments & Credits
**Goal**: Stripe checkout for credit packs, credit usage tracking, grace period for low balance
**Depends on**: Phase 3 (needs call data for credit deduction)
**Research**: Likely (external API)
**Research topics**: Stripe Checkout Sessions, webhook handling for payment events, credit pack products setup, usage-based billing patterns
**Plans**: TBD

Plans:
- [x] 05-01: Stripe integration and credit pack products
- [ ] 05-02: Credit purchase flow with Checkout
- [ ] 05-03: Credit deduction on call completion
- [ ] 05-04: Grace period logic and low balance notifications

### Phase 6: Polish & Launch
**Goal**: Email notifications, webhook support for custom integrations, deployment configuration
**Depends on**: Phase 5
**Research**: Unlikely (internal patterns, deployment config)
**Plans**: TBD

Plans:
- [ ] 06-01: Email notifications (signup, low credits, call summaries)
- [ ] 06-02: Webhook support for custom integrations
- [ ] 06-03: Deployment configuration and environment setup
- [ ] 06-04: End-to-end testing and final polish

---

### 📋 v1.1 German Market & Polish (Planned)

**Milestone Goal:** Localize the platform for the German market with German voice agents and prompts, polish the dashboard UI, and add public-facing pages including landing page and legal compliance.

#### Phase 7: German Voice Setup
**Goal**: Configure German voice selection in Vapi, German TTS/STT providers, locale-aware agent configuration
**Depends on**: Phase 6 (v1.0 complete)
**Research**: Likely (Vapi German voice options, provider availability)
**Research topics**: Vapi German voice providers, German TTS quality comparison, STT accuracy for German, locale configuration patterns
**Plans**: TBD

Plans:
- [ ] 07-01: TBD (run /gsd:plan-phase 7 to break down)

#### Phase 8: German Prompts & Localization
**Goal**: German system prompts for agents, localized UI strings, German date/time/number formatting
**Depends on**: Phase 7
**Research**: Unlikely (internal patterns, i18n setup)
**Plans**: TBD

Plans:
- [ ] 08-01: TBD (run /gsd:plan-phase 8 to break down)

#### Phase 9: Dashboard UI Polish
**Goal**: Redesign dashboard UI based on provided v0 designs, improve overall UX
**Depends on**: Phase 8
**Research**: Unlikely (design implementation)
**Plans**: TBD

Plans:
- [ ] 09-01: TBD (run /gsd:plan-phase 9 to break down)

#### Phase 10: Landing & Legal Pages
**Goal**: Public landing page (v0 design), Impressum, Datenschutz (privacy policy), AGB (terms), cookie consent banner
**Depends on**: Phase 9
**Research**: Likely (German legal requirements, GDPR compliance)
**Research topics**: German Impressum requirements, Datenschutzerklärung template, AGB requirements, cookie consent GDPR patterns
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
| 5. Payments & Credits | v1.0 | 1/4 | In progress | - |
| 6. Polish & Launch | v1.0 | 0/4 | Not started | - |
| 7. German Voice Setup | v1.1 | 0/? | Not started | - |
| 8. German Prompts & Localization | v1.1 | 0/? | Not started | - |
| 9. Dashboard UI Polish | v1.1 | 0/? | Not started | - |
| 10. Landing & Legal Pages | v1.1 | 0/? | Not started | - |
