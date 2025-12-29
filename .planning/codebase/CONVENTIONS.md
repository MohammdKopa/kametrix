# Coding Conventions

**Analysis Date:** 2025-12-29

## Naming Patterns

**Files:**
- kebab-case for most files: `agent-card.tsx`, `credits-utils.ts`, `spoken-format.ts`
- PascalCase exceptions for marketing components: `Hero.tsx`, `Features.tsx`
- `route.ts` for API handlers, `page.tsx` for pages, `layout.tsx` for layouts
- `*.test.ts` for test files in `__tests__/` directories
- `index.ts` for barrel exports

**Functions:**
- camelCase for all functions: `generateSessionToken()`, `calculateCallCost()`, `formatBalance()`
- No special prefix for async functions
- Handler pattern: `handleEventName` for event handlers

**Variables:**
- camelCase for variables: `assistantId`, `phoneNumber`, `creditBalance`
- UPPER_SNAKE_CASE for constants: `CENTS_PER_MINUTE`, `SESSION_DURATION_DAYS`, `COOKIE_NAME`

**Types:**
- PascalCase for interfaces: `TimeSlot`, `BookingParams`, `AuthUser`, `WizardState`
- No I prefix (use `User`, not `IUser`)
- Props suffix for component props: `AgentCardProps`, `AgentFormProps`

## Code Style

**Formatting:**
- 2-space indentation
- Semicolons required
- Single quotes for strings: `'use client'`
- No explicit Prettier config (uses Next.js defaults)

**Linting:**
- ESLint 9.39.2 with eslint-config-next
- Run: `npm run lint`
- No custom `.eslintrc` file (uses Next.js defaults)

## Import Organization

**Order:**
1. External packages (react, next, stripe, etc.)
2. Internal modules (@/lib, @/components)
3. Relative imports (., ..)
4. Type imports (import type {})

**Path Aliases:**
- `@/*` maps to `src/*`

**Example:**
```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { Agent } from '@/generated/prisma/client';
```

## Error Handling

**Patterns:**
- Try/catch at route handler level
- Throw descriptive Error with message
- Return NextResponse with appropriate status codes

**Example:**
```typescript
try {
  const result = await operation();
  return NextResponse.json(result);
} catch (error) {
  console.error('Operation failed:', error);
  return NextResponse.json({ error: 'Failed' }, { status: 500 });
}
```

**Error Types:**
- Throw on invalid input, missing dependencies
- Return 400 for bad requests, 401 for auth errors, 404 for not found, 500 for server errors

## Logging

**Framework:**
- Console.log/warn/error (no structured logging library)

**Patterns:**
- Log errors before throwing: `console.error('Context:', error)`
- Log warnings for auto-corrections: `console.warn('Date corrected...')`
- Debug logs in development (consider removing for production)

## Comments

**When to Comment:**
- Explain why, not what
- Document business logic and edge cases
- JSDoc for public API functions

**JSDoc/TSDoc:**
```typescript
/**
 * Calculate call cost in cents based on duration
 * Rounds up to nearest minute
 *
 * @param durationSeconds - Call duration in seconds
 * @returns Cost in cents
 */
export function calculateCallCost(durationSeconds: number): number
```

**Module-level Documentation:**
```typescript
/**
 * Credit deduction functions - server-side only
 * Uses prisma for database operations
 *
 * For client-safe utility functions, use @/lib/credits-utils
 */
```

## Function Design

**Size:**
- Keep under 50 lines where practical
- Extract helpers for complex logic

**Parameters:**
- Max 3 parameters preferred
- Use options object for more: `function create(options: CreateOptions)`

**Return Values:**
- Explicit returns
- Return early for guard clauses
- Async functions return promises

## Module Design

**Exports:**
- Named exports preferred: `export function`, `export const`
- Default exports for React components in some cases
- Barrel files (`index.ts`) for module public API

**Server vs Client:**
- `'use client'` directive at top of client components
- Clear separation: `credits.ts` (server-only) vs `credits-utils.ts` (client-safe)
- JSDoc comments note safety: `// Credit utility functions - safe for client-side use`

**Lazy Initialization:**
```typescript
const globalForStripe = globalThis as unknown as { stripe: Stripe | undefined };
export const getStripe = (): Stripe => {
  if (!globalForStripe.stripe) {
    globalForStripe.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }
  return globalForStripe.stripe;
};
```

---

*Convention analysis: 2025-12-29*
*Update when patterns change*
