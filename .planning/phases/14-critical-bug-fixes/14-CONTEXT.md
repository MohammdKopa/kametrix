# Phase 14: Critical Bug Fixes - Context

**Gathered:** 2025-12-29
**Status:** Ready for planning

<vision>
## How This Should Work

A focused audit of the booking/appointment flow to find and fix critical business logic bugs. The main issue: appointments are being booked in 2023 instead of the correct year. This phase is about getting confidence that the core booking flow is bulletproof before going live.

Not adding anything new — just making sure what exists works correctly.

</vision>

<essential>
## What Must Be Nailed

- **Appointments book to the correct year** — The 2023 bug must be fixed. Dates should always be constructed correctly.
- **Confidence to ship** — After this phase, the booking flow should be trustworthy. No surprises when users start booking real appointments.

</essential>

<boundaries>
## What's Out of Scope

- New features — bug fixes only, no adding functionality
- UI changes — no visual changes, just logic fixes
- Performance optimization — not optimizing, just fixing correctness
- Other areas (credits, voice agent) — focus is on booking/appointments

</boundaries>

<specifics>
## Specific Ideas

- The year bug: appointments booking to 2023 instead of the current/future year
- Audit date construction and parsing in the booking flow
- Check anywhere dates are built from components (year, month, day)

</specifics>

<notes>
## Additional Context

This is a pre-launch confidence phase. The user wants to know the booking system is solid before real users start making appointments. Focus is narrow: find the year bug, fix it, and verify the fix.

</notes>

---

*Phase: 14-critical-bug-fixes*
*Context gathered: 2025-12-29*
