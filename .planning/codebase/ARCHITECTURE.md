# Architecture

**Analysis Date:** 2025-12-29

## Pattern Overview

**Overall:** Monolith with Service Layer Architecture

**Key Characteristics:**
- Full-stack Next.js application with clear layer separation
- REST API via Next.js route handlers
- Session-based authentication (custom implementation)
- Credit-based billing system with grace period
- Webhook-driven external service integration

## Layers

**Presentation Layer:**
- Purpose: User interface and page rendering
- Contains: React components, page templates, layouts
- Location: `src/app/`, `src/components/`
- Depends on: API routes for data
- Used by: End users via browser

**API/Route Handler Layer:**
- Purpose: HTTP endpoints and request processing
- Contains: REST API routes, webhook handlers
- Location: `src/app/api/`
- Depends on: Service layer for business logic
- Used by: Presentation layer, external services (Vapi, Stripe)

**Service/Business Logic Layer:**
- Purpose: Core business logic and domain operations
- Contains: Auth, credits, calls, integrations
- Location: `src/lib/`
- Depends on: Data access layer, external APIs
- Used by: API routes

**Data Access Layer:**
- Purpose: Database operations
- Contains: Prisma client, database queries
- Location: `src/lib/prisma.ts`, `prisma/schema.prisma`
- Depends on: PostgreSQL database
- Used by: Service layer

**Middleware Layer:**
- Purpose: Request interception and validation
- Contains: Session validation, route protection
- Location: `src/middleware.ts`
- Depends on: Auth service
- Used by: All protected routes

## Data Flow

**Authenticated Request Flow:**

1. Client sends HTTP request
2. Middleware validates session cookie (`src/middleware.ts`)
3. Route handler invoked (`src/app/api/**/route.ts`)
4. `requireAuth()` retrieves session + user data (`src/lib/auth-guard.ts`)
5. Business logic executes (Prisma queries, API calls)
6. Response returned with data or error

**Vapi Webhook Flow:**

1. Vapi sends webhook POST to `/api/webhooks/vapi`
2. Handler processes event type (status-update, end-of-call, tool-calls)
3. Call data stored in database via Prisma
4. Credits deducted from user balance (grace period handling)
5. Google Sheets logging triggered if connected
6. Response must complete within 7.5 seconds

**Credit Purchase Flow:**

1. User initiates checkout from dashboard
2. `/api/checkout` creates Stripe Checkout Session
3. User completes payment on Stripe
4. Stripe webhook posts to `/api/webhooks/stripe`
5. Credits added via transaction record
6. User notified via email

**State Management:**
- Session-based: 7-day expiration stored in database
- File-based: No persistent in-memory state
- Database: All application state in PostgreSQL

## Key Abstractions

**Authentication:**
- Purpose: Session management and access control
- Location: `src/lib/auth.ts`, `src/lib/auth-guard.ts`
- Functions: `getAuthUser()`, `requireAuth()`, `requireAdmin()`
- Pattern: Session token in HTTP-only cookie, validated against DB

**Credit System:**
- Purpose: Call billing and balance management
- Location: `src/lib/credits.ts`, `src/lib/credits-utils.ts`
- Pattern: Atomic transactions, grace period for negative balance
- Cost: $0.15/minute (150 cents/minute), ceil rounding

**Integration Clients:**
- Purpose: External service communication
- Location: `src/lib/vapi/`, `src/lib/google/`, `src/lib/stripe.ts`
- Pattern: Lazy-initialized singletons

## Entry Points

**Web Server:**
- Location: `src/app/layout.tsx`
- Triggers: HTTP request
- Responsibilities: Root layout, theme provider, global styles

**Middleware:**
- Location: `src/middleware.ts`
- Triggers: Every request to protected routes
- Responsibilities: Session validation, redirects

**API Routes:**
- Location: `src/app/api/**/route.ts` (28 route handlers)
- Triggers: HTTP requests
- Responsibilities: Request handling, business logic orchestration

**Webhooks:**
- Location: `src/app/api/webhooks/vapi/route.ts`, `src/app/api/webhooks/stripe/route.ts`
- Triggers: External service callbacks
- Responsibilities: Event processing, state updates

## Error Handling

**Strategy:** Try/catch at route handler level with NextResponse errors

**Patterns:**
- Route handlers wrap logic in try/catch
- Business logic throws descriptive errors
- Errors logged with context before response
- HTTP status codes for different error types (400, 401, 403, 404, 500)

## Cross-Cutting Concerns

**Logging:**
- Console.log/warn/error throughout (132 statements)
- No structured logging library (tech debt)

**Validation:**
- FormData validation in route handlers
- Type coercion from request body
- No schema validation library (e.g., Zod)

**Authentication:**
- Session cookie checked in middleware
- Auth guards in route handlers
- Role-based access (USER vs ADMIN)

**Encryption:**
- AES-256-GCM for Google refresh tokens (`src/lib/google/auth.ts`)
- bcryptjs for password hashing (`src/lib/password.ts`)

---

*Architecture analysis: 2025-12-29*
*Update when major patterns change*
