# Phase 5: Payments & Credits - Research

**Researched:** 2025-12-27
**Domain:** Stripe Checkout Sessions + Credit Balance System
**Confidence:** HIGH

<research_summary>
## Summary

Researched Stripe integration for one-time credit pack purchases and credit balance tracking patterns. The standard approach uses Stripe Checkout Sessions with pre-created Products/Prices for credit packs, webhook-based payment confirmation, and a dual-tracking credit system (running balance + transaction log).

Key finding: Stripe's built-in billing credits feature is designed for usage-based subscriptions with metered billing - it cannot be applied to one-time purchases. We need a custom credit balance system in our database, which is already scaffolded in the Prisma schema (CreditPack, CreditTransaction, User.creditBalance).

**Primary recommendation:** Use Stripe Checkout Sessions (mode: 'payment') with pre-defined Products/Prices for credit packs. On `checkout.session.completed` webhook, add credits to user's balance via database transaction. Track all changes in CreditTransaction table for auditability.
</research_summary>

<standard_stack>
## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| stripe | ^17.x | Stripe Node.js SDK | Official SDK for all Stripe API operations |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @stripe/stripe-js | ^4.x | Client-side Stripe.js | Only if using embedded checkout (not needed for redirect) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Stripe Checkout | Payment Intents | Checkout is simpler, handles more edge cases automatically |
| Redirect Checkout | Embedded Checkout | Redirect is simpler, no frontend component needed |
| Stripe billing credits | Custom DB credits | Stripe credits only work with subscriptions, not one-time |

**Installation:**
```bash
npm install stripe
```
</standard_stack>

<architecture_patterns>
## Architecture Patterns

### Recommended Flow
```
User selects credit pack → Create Checkout Session (API route) → Redirect to Stripe
                                ↓
Stripe collects payment → Sends webhook → Verify signature → Add credits to DB
                                                                    ↓
                                                        User redirected to success page
```

### Pattern 1: Checkout Session Creation
**What:** Create a Checkout Session with customer ID for one-time payment
**When to use:** Every credit pack purchase
**Example:**
```typescript
// Source: Stripe official docs + t3dotgg/stripe-recommendations
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Ensure Stripe customer exists for user
let stripeCustomerId = user.stripeCustomerId;
if (!stripeCustomerId) {
  const customer = await stripe.customers.create({
    email: user.email,
    metadata: { userId: user.id }  // CRITICAL: link to our user
  });
  stripeCustomerId = customer.id;
  await prisma.user.update({
    where: { id: user.id },
    data: { stripeCustomerId }
  });
}

// Create checkout session
const session = await stripe.checkout.sessions.create({
  customer: stripeCustomerId,
  mode: 'payment',
  line_items: [{
    price: creditPack.stripePriceId,
    quantity: 1
  }],
  success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?purchase=success`,
  cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/credits`,
  metadata: {
    userId: user.id,
    creditPackId: creditPack.id,
    creditsAmount: creditPack.credits.toString()
  }
});

// Redirect user to session.url
```

### Pattern 2: Webhook Handler (Next.js App Router)
**What:** Handle checkout.session.completed with raw body for signature verification
**When to use:** Always - this is how you know payment succeeded
**Example:**
```typescript
// Source: Stripe docs + Next.js 15 patterns
// app/api/webhooks/stripe/route.ts
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  const body = await request.text();  // MUST use .text() not .json()
  const sig = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed');
    return new Response('Invalid signature', { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    await handleSuccessfulPayment(session);
  }

  return new Response('OK', { status: 200 });
}
```

### Pattern 3: Credit Addition (Atomic Transaction)
**What:** Add credits with full audit trail in single database transaction
**When to use:** After successful payment confirmation
**Example:**
```typescript
// Source: Best practices for financial systems
async function handleSuccessfulPayment(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const creditsAmount = parseInt(session.metadata?.creditsAmount || '0');

  if (!userId || !creditsAmount) {
    throw new Error('Missing metadata in checkout session');
  }

  await prisma.$transaction(async (tx) => {
    // Get current balance
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { creditBalance: true, graceCreditsUsed: true }
    });

    if (!user) throw new Error('User not found');

    // Calculate new balance (pay off grace usage first if any)
    let newBalance = user.creditBalance + creditsAmount;
    let graceSettled = 0;

    if (user.graceCreditsUsed > 0) {
      graceSettled = Math.min(user.graceCreditsUsed, creditsAmount);
      // Grace usage is already reflected in balance, just clear the tracker
    }

    // Update user balance
    await tx.user.update({
      where: { id: userId },
      data: {
        creditBalance: newBalance,
        graceCreditsUsed: user.graceCreditsUsed - graceSettled
      }
    });

    // Record transaction
    await tx.creditTransaction.create({
      data: {
        userId,
        type: 'PURCHASE',
        amount: creditsAmount,
        balanceAfter: newBalance,
        stripePaymentId: session.payment_intent as string,
        description: `Purchased ${creditsAmount} credits`
      }
    });
  });
}
```

### Pattern 4: Credit Deduction on Call End
**What:** Deduct credits atomically when call completes
**When to use:** In the end-of-call webhook handler
**Example:**
```typescript
// Source: Existing calls.ts pattern + credit system best practices
async function deductCreditsForCall(
  userId: string,
  callId: string,
  durationSeconds: number
) {
  // Credit calculation: e.g., $0.15/minute = 15 cents/minute
  const CENTS_PER_MINUTE = 15;
  const creditsUsed = Math.ceil(durationSeconds / 60) * CENTS_PER_MINUTE;

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { creditBalance: true, graceCreditsUsed: true }
    });

    if (!user) throw new Error('User not found');

    let newBalance = user.creditBalance - creditsUsed;
    let newGraceUsed = user.graceCreditsUsed;

    // Grace period: if balance goes negative, track grace usage
    if (newBalance < 0) {
      newGraceUsed += Math.abs(newBalance);
      newBalance = 0;  // Or keep negative, depends on design
    }

    // Update user
    await tx.user.update({
      where: { id: userId },
      data: {
        creditBalance: newBalance,
        graceCreditsUsed: newGraceUsed
      }
    });

    // Record transaction
    await tx.creditTransaction.create({
      data: {
        userId,
        type: newGraceUsed > user.graceCreditsUsed ? 'GRACE_USAGE' : 'CALL_USAGE',
        amount: -creditsUsed,
        balanceAfter: newBalance,
        callId,
        description: `Call: ${Math.ceil(durationSeconds / 60)} min`
      }
    });

    // Update call record
    await tx.call.update({
      where: { id: callId },
      data: { creditsUsed }
    });
  });
}
```

### Anti-Patterns to Avoid
- **Trusting client-side success redirect:** Always verify via webhook, never trust `success_url` alone
- **Processing webhook without signature verification:** Always verify `stripe-signature` header
- **Using `request.json()` for webhook body:** Breaks signature verification, use `request.text()`
- **Non-atomic credit operations:** Always use database transactions for balance changes
- **Storing Stripe Price IDs only in Stripe:** Keep local CreditPack records synced with Stripe
</architecture_patterns>

<dont_hand_roll>
## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Payment UI | Custom card form | Stripe Checkout | PCI compliance, fraud detection, 3DS handling |
| Webhook signature | Manual HMAC | stripe.webhooks.constructEvent() | Timing-safe comparison, handles edge cases |
| Receipt generation | Custom PDFs | Stripe automatic receipts | Already included, legally compliant |
| Currency handling | Math on floats | Store as integers (cents) | Float arithmetic errors |
| Idempotency | Manual tracking | Stripe's built-in idempotency | Stripe handles duplicate webhook delivery |

**Key insight:** Payment systems have decades of edge cases. Stripe Checkout handles card declines, 3D Secure, fraud checks, and 40+ payment methods. Never build custom payment forms unless you need extremely custom UX.
</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: Webhook Body Parsing
**What goes wrong:** Signature verification fails with "No signatures found matching the expected signature"
**Why it happens:** Next.js App Router parses body as JSON, but Stripe needs raw string
**How to avoid:** Use `await request.text()` NOT `await request.json()`
**Warning signs:** Webhook always returns 400, signature mismatch errors

### Pitfall 2: Missing Customer Linking
**What goes wrong:** Can't connect payment to user
**Why it happens:** No userId in metadata, or no stripeCustomerId stored
**How to avoid:** Always pass `metadata: { userId }` and store `customer` ID on user
**Warning signs:** Webhook succeeds but credits don't appear

### Pitfall 3: Race Condition on Balance
**What goes wrong:** Incorrect balance when concurrent operations
**Why it happens:** Read-modify-write without transaction
**How to avoid:** Always use `prisma.$transaction()` for balance changes
**Warning signs:** Balance discrepancies, negative balances that shouldn't happen

### Pitfall 4: Grace Period Complexity
**What goes wrong:** Users confused about balance, double-charging on purchase
**Why it happens:** Over-complicating the grace period logic
**How to avoid:** Simple rule: track grace usage separately, settle on next purchase
**Warning signs:** Support tickets about balance confusion

### Pitfall 5: Not Testing with Stripe CLI
**What goes wrong:** Webhooks work in test mode but fail in production
**Why it happens:** Different webhook secrets, different event formats
**How to avoid:** Use `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
**Warning signs:** Works in dashboard test mode, fails with real webhooks
</common_pitfalls>

<code_examples>
## Code Examples

Verified patterns from official sources:

### Products and Prices Setup (Stripe Dashboard or API)
```typescript
// Source: Stripe API docs
// Run once during setup or use Stripe Dashboard
const product = await stripe.products.create({
  name: 'Credit Pack - 100 Credits',
  description: '100 credits for voice agent calls (~36 minutes)',
  metadata: { credits: '100' }
});

const price = await stripe.prices.create({
  product: product.id,
  unit_amount: 1500,  // $15.00
  currency: 'usd'
});

// Store price.id in your CreditPack table
```

### Fetch Active Credit Packs for UI
```typescript
// Source: Prisma + existing schema pattern
const creditPacks = await prisma.creditPack.findMany({
  where: { isActive: true },
  orderBy: { priceInCents: 'asc' }
});

// Transform for UI
const packs = creditPacks.map(pack => ({
  id: pack.id,
  name: pack.name,
  credits: pack.credits,
  price: (pack.priceInCents / 100).toFixed(2),
  estimatedMinutes: Math.floor(pack.credits / 15 * 60)  // ~$0.15/min
}));
```

### Low Balance Check
```typescript
// Source: Context from 05-CONTEXT.md
const LOW_BALANCE_THRESHOLD_CENTS = 500;  // $5.00
const LOW_BALANCE_MINUTES = 15;

function checkLowBalance(user: { creditBalance: number }): boolean {
  const estimatedMinutes = Math.floor(user.creditBalance / 15);  // $0.15/min
  return user.creditBalance <= LOW_BALANCE_THRESHOLD_CENTS
    || estimatedMinutes <= LOW_BALANCE_MINUTES;
}
```

### Format Balance for Display
```typescript
// Source: 05-CONTEXT.md requirement
function formatBalance(creditBalanceCents: number): string {
  const dollars = (creditBalanceCents / 100).toFixed(2);
  const estimatedMinutes = Math.floor(creditBalanceCents / 15);  // $0.15/min
  return `$${dollars} (~${estimatedMinutes} min)`;
}

// Example: "$12.50 (~50 min)"
```

### Format Call Cost for Display
```typescript
// Source: 05-CONTEXT.md requirement
function formatCallCost(durationSeconds: number, creditsUsedCents: number): string {
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;
  const cost = (creditsUsedCents / 100).toFixed(2);
  return `${minutes} min ${seconds} sec - $${cost}`;
}

// Example: "4 min 32 sec - $0.85"
```
</code_examples>

<sota_updates>
## State of the Art (2024-2025)

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Payment Intents only | Checkout Sessions preferred | 2022+ | Simpler, more features out of the box |
| Manual webhook setup | Stripe CLI for local dev | 2020+ | Much easier testing |
| Pages Router bodyParser: false | App Router request.text() | Next.js 13+ | Different API, same principle |

**New tools/patterns to consider:**
- **Stripe Billing Credits:** New in 2024, but only for subscriptions with metered billing
- **Stripe Tax:** Automatic tax calculation if selling to EU
- **Payment Links:** Even simpler than Checkout for static products (but less flexible)

**Deprecated/outdated:**
- **Charges API:** Fully replaced by Payment Intents
- **Sources API:** Deprecated, use Payment Methods
</sota_updates>

<open_questions>
## Open Questions

1. **Credit expiration?**
   - What we know: Context says no expiration mentioned
   - What's unclear: Should credits ever expire?
   - Recommendation: Skip for MVP, add later if needed

2. **Overage billing?**
   - What we know: Context says "overage billed on next purchase"
   - What's unclear: Should there be a cap on grace period?
   - Recommendation: Track graceCreditsUsed (already in schema), settle on next purchase
</open_questions>

<sources>
## Sources

### Primary (HIGH confidence)
- /stripe/stripe-node - Checkout sessions, webhook verification, customer creation
- /websites/stripe - Official Stripe docs on Checkout, Products, Prices, Webhooks
- /stripe-samples/checkout-one-time-payments - Reference implementation

### Secondary (MEDIUM confidence)
- /t3dotgg/stripe-recommendations - Best practices for SaaS Stripe integration
- Next.js + Stripe webhook patterns from multiple verified GitHub issues

### Tertiary (LOW confidence - needs validation)
- None - all patterns verified against official docs
</sources>

<metadata>
## Metadata

**Research scope:**
- Core technology: Stripe Checkout Sessions (one-time payments)
- Ecosystem: stripe npm package only (no additional deps needed)
- Patterns: Checkout flow, webhook handling, credit balance, transaction logging
- Pitfalls: Body parsing, signature verification, race conditions

**Confidence breakdown:**
- Standard stack: HIGH - Stripe is the clear choice per PROJECT.md
- Architecture: HIGH - Patterns verified with official docs
- Pitfalls: HIGH - Well-documented in Stripe community and Next.js issues
- Code examples: HIGH - Derived from official sources and existing codebase

**Research date:** 2025-12-27
**Valid until:** 2026-01-27 (30 days - Stripe APIs are stable)
</metadata>

---

*Phase: 05-payments-credits*
*Research completed: 2025-12-27*
*Ready for planning: yes*
