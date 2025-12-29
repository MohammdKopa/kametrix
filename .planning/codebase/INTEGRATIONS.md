# External Integrations

**Analysis Date:** 2025-12-29

## APIs & External Services

**Voice AI (Vapi):**
- Service: Vapi AI - Voice assistant creation, phone number provisioning, call handling
  - SDK/Client: `@vapi-ai/server-sdk` 0.11.0
  - Auth: API key in `VAPI_API_KEY` env var
  - Client location: `src/lib/vapi/client.ts` (lazy singleton)
  - Features used: Assistant CRUD, phone number management, call webhooks

**Payment Processing (Stripe):**
- Service: Stripe - Credit pack purchases, checkout sessions
  - SDK/Client: `stripe` 20.1.0
  - Auth: API key in `STRIPE_SECRET_KEY` env var
  - Webhook secret: `STRIPE_WEBHOOK_SECRET` env var
  - Client location: `src/lib/stripe.ts` (lazy singleton)
  - Events: `checkout.session.completed`

**AI Text Generation (OpenRouter):**
- Service: OpenRouter - Agent FAQ, greeting, policy generation
  - Integration: REST API via fetch
  - Auth: Bearer token in `OPENROUTER_API_KEY` env var
  - Model: `openai/gpt-4o-mini`
  - Client location: `src/lib/openrouter.ts`
  - Route: `src/app/api/generate/route.ts`

**Email (SMTP):**
- Service: SMTP server - Transactional emails (low credit warnings)
  - SDK/Client: `nodemailer` 7.0.12
  - Auth: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
  - Client location: `src/lib/email.ts`

## Data Storage

**Database:**
- PostgreSQL - Primary data store
  - Connection: `DATABASE_URL` env var
  - Client: Prisma ORM 7.2.0 with `@prisma/adapter-pg`
  - Client location: `src/lib/prisma.ts`
  - Schema: `prisma/schema.prisma`
  - Migrations: `prisma/migrations/`

**Models:**
- User (with Stripe customer ID, Google tokens, credit system)
- Agent (Vapi assistants with voice configuration)
- Call (call records with Vapi integration)
- PhoneNumber (Vapi phone number assignments)
- Session (user sessions)
- CreditTransaction (credit ledger)

## Authentication & Identity

**Auth Provider:**
- Custom session-based authentication
  - Implementation: `src/lib/auth.ts`
  - Token storage: HTTP-only cookie (`session` cookie)
  - Session management: 7-day expiration, stored in database
  - Password hashing: bcryptjs

**OAuth Integrations:**
- Google OAuth - Calendar and Sheets access
  - SDK: `google-auth-library` 10.5.0, `googleapis` 169.0.0
  - Credentials: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
  - Token encryption: AES-256-GCM with `GOOGLE_ENCRYPTION_KEY`
  - Scopes: Google Calendar (read/write), Google Sheets (read/write)
  - Routes:
    - `src/app/api/auth/google/route.ts` - OAuth initiation
    - `src/app/api/auth/google/callback/route.ts` - OAuth callback
    - `src/app/api/auth/google/disconnect/route.ts` - Disconnect

## Google Services

**Google Calendar:**
- Purpose: Appointment booking for voice agents
- Client: `src/lib/google/calendar.ts`
- Routes:
  - `src/app/api/google/calendar/availability/route.ts`
  - `src/app/api/google/calendar/book/route.ts`
- Functions: `getAvailableSlots()`, `bookAppointment()`, `validateAndCorrectDate()`

**Google Sheets:**
- Purpose: Call logging
- Client: `src/lib/google/sheets.ts`
- Function: `logCallToSheets()` - Appends call data to user's spreadsheet

## Monitoring & Observability

**Error Tracking:**
- None (console.error only)

**Analytics:**
- None

**Logs:**
- Console.log/warn/error to stdout
- No structured logging

## CI/CD & Deployment

**Hosting:**
- Self-hosted (not Vercel)
- Standalone Next.js build (`output: 'standalone'` in next.config.ts)

**CI Pipeline:**
- None configured

## Environment Configuration

**Development:**
- Required env vars: See `.env.example`
- Secrets location: `.env` file (gitignored)
- Services: Stripe test mode, local/dev PostgreSQL

**Production:**
- Required env vars: See `.env.production.example`
- Secrets location: Environment variables on host
- Services: Stripe live mode, production PostgreSQL

**Critical Environment Variables:**
```
DATABASE_URL              # PostgreSQL connection string
VAPI_API_KEY             # Vapi API key
GOOGLE_CLIENT_ID         # Google OAuth client ID
GOOGLE_CLIENT_SECRET     # Google OAuth secret
GOOGLE_ENCRYPTION_KEY    # 32-byte hex key for token encryption
STRIPE_SECRET_KEY        # Stripe API key
STRIPE_WEBHOOK_SECRET    # Stripe webhook signing secret
SMTP_HOST                # Email server host
SMTP_PORT                # Email server port
SMTP_USER                # Email username
SMTP_PASS                # Email password
SMTP_FROM                # Email from address
OPENROUTER_API_KEY       # OpenRouter API key
NEXT_PUBLIC_APP_URL      # Application public URL
```

## Webhooks & Callbacks

**Incoming:**
- Vapi - `/api/webhooks/vapi`
  - File: `src/app/api/webhooks/vapi/route.ts` (605 lines)
  - Verification: None (planned in Phase 15)
  - Events: `status-update`, `end-of-call-report`, `transcript`, `tool-calls`, `assistant-request`
  - Timeout: Must respond within 7.5 seconds

- Stripe - `/api/webhooks/stripe`
  - File: `src/app/api/webhooks/stripe/route.ts` (132 lines)
  - Verification: Signature validation via `stripe.webhooks.constructEvent`
  - Events: `checkout.session.completed`

**Outgoing:**
- None

---

*Integration audit: 2025-12-29*
*Update when adding/removing external services*
