# Phase 15: Security Hardening - Context

**Gathered:** 2025-12-29
**Status:** Ready for research

<vision>
## How This Should Work

Security hardening focused on protecting public API routes from abuse. Rate limiting should be simple and reliable — actually prevent attacks without over-engineering. Webhook endpoints (Vapi, Stripe) need signature verification to ensure only legitimate calls get processed.

The goal is application-level protection that works out of the box, not infrastructure complexity.

</vision>

<essential>
## What Must Be Nailed

- **Rate limiting that works** - Simple, reliable limits on public endpoints that actually prevent abuse
- **Webhook verification** - Ensure Vapi and Stripe webhooks are legitimate before processing

</essential>

<boundaries>
## What's Out of Scope

- WAF/CDN security (Cloudflare, etc.) - infrastructure-level protection is separate
- IP blocking/banning - no manual ban lists or IP management
- Auth system changes - keep current auth, just add rate limits around it

</boundaries>

<specifics>
## Specific Ideas

No specific requirements - open to standard approaches for Next.js rate limiting and webhook verification.

</specifics>

<notes>
## Additional Context

Focus is on public API routes as the primary attack surface. Auth endpoints are secondary concern for this phase. The priority is getting rate limiting that actually works rather than comprehensive security theater.

</notes>

---

*Phase: 15-security-hardening*
*Context gathered: 2025-12-29*
