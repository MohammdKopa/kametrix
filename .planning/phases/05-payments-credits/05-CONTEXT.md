# Phase 5: Payments & Credits - Context

**Gathered:** 2025-12-27
**Status:** Ready for planning

<vision>
## How This Should Work

When users need credits, they go to a credits page and see a clean card grid with 3-4 pack options. They pick one, click buy, and Stripe Checkout handles the rest. Credits land in their account immediately. No subscriptions, no complexity — just simple one-time purchases.

Throughout the app, users see their balance displayed as both dollars and estimated minutes: "$12.50 (~45 min)". Full transparency without being overwhelming.

In call history, each call shows duration and cost together: "4 min 32 sec — $0.85". Users can always trace where their credits went.

When balance runs low (fixed threshold like $5 or 15 min), they get a warning. But calls never stop — soft warning only. If they go into overage, it gets billed on their next purchase. Trust-first approach keeps service uninterrupted.

</vision>

<essential>
## What Must Be Nailed

- **Transparent usage** — Users must always know exactly where their credits went and what's left. This is the core of trust. Balance displayed as "$X (~Y min)", call history shows "duration — cost".
- **Frictionless purchase** — Clean card grid, pick a pack, Stripe Checkout, done. Credits appear immediately.
- **No hard cutoffs** — Grace period with soft warning. Overage billed on next purchase. Never interrupt service.

</essential>

<boundaries>
## What's Out of Scope

- No subscriptions or recurring billing — one-time pack purchases only
- No promo codes or discount system — keep it simple
- No itemized cost breakdown (voice vs transcription vs model) — just total per call
- No complex invoicing — Stripe handles receipts

</boundaries>

<specifics>
## Specific Ideas

- Credit packs displayed as card grid (3-4 options)
- Balance format: "$12.50 (~45 min)" everywhere
- Call cost format: "4 min 32 sec — $0.85"
- Fixed threshold for low balance warning (e.g., $5 or 15 min)
- Overage tracked and settled on next purchase

</specifics>

<notes>
## Additional Context

This phase aligns with Kametrix's "dead simple" philosophy. The goal is a payment experience that feels lightweight — users should never feel like they're dealing with enterprise billing software.

Transparency is the priority over complexity. Better to show clear, simple numbers than detailed breakdowns that require interpretation.

</notes>

---

*Phase: 05-payments-credits*
*Context gathered: 2025-12-27*
