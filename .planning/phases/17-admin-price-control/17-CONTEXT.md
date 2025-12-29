# Phase 17: Admin Price Control - Context

**Gathered:** 2025-12-29
**Status:** Ready for planning

<vision>
## How This Should Work

A simple rate editor in the admin settings page. The admin opens settings, sees a "Pricing" section, and can update the per-minute rate with a single input field. Save it, and it takes effect immediately for all future calls. No confirmations, no previews — just a quick, direct change.

This is about giving admins operational control without touching code. When costs change or business needs shift, they can adjust pricing in seconds.

</vision>

<essential>
## What Must Be Nailed

- **Quick rate changes** - Admin can update the per-minute rate in seconds without any code deployment
- **Immediate effect** - New rate applies to all calls from the moment it's saved
- **Simple UI** - Single input field in admin settings, nothing complicated

</essential>

<boundaries>
## What's Out of Scope

- Promotional pricing (discount codes, time-limited offers) - not for this phase
- User-specific rates - everyone pays the same global rate
- Rate history/audit log - just the current rate, no historical tracking
- Tiered pricing based on subscription levels
- Per-agent pricing configurations

</boundaries>

<specifics>
## Specific Ideas

- Lives in the admin Settings page as a "Pricing" section
- Currently hardcoded at $0.15/min — this moves that to a database-backed setting
- Single number input with currency formatting

</specifics>

<notes>
## Additional Context

This is the final phase of v2.0. Keep it simple — the goal is operational flexibility, not a full pricing engine.

</notes>

---

*Phase: 17-admin-price-control*
*Context gathered: 2025-12-29*
