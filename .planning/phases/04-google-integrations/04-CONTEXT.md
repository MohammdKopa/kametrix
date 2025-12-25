# Phase 4: Google Integrations - Context

**Gathered:** 2025-12-25
**Status:** Ready for research

<vision>
## How This Should Work

When a user connects their Google account, it should feel like Calendly — a clean "Connect Google" button that handles permissions seamlessly. One click, authorize, done.

Once connected, the voice agent can:
1. **Book appointments in real-time** — During a call, the agent checks the user's Google Calendar live, finds available slots, and books directly while the caller is still on the line
2. **Log everything to Sheets** — Every call automatically logs to a Google Sheet: caller info, duration, outcome, notes, plus any structured data collected (like appointment details)

The Sheet should auto-create or auto-find — users shouldn't have to manually create or link a spreadsheet. Connect Google, and logging just works.

</vision>

<essential>
## What Must Be Nailed

- **Seamless booking flow** — Real-time availability checking during calls, natural slot offering, actual calendar events created correctly
- **Easy setup** — Users connect their Google account once and everything just works. No manual configuration of calendars or sheets.

</essential>

<boundaries>
## What's Out of Scope

- Multiple calendars per user — just one primary calendar for now
- Other Google services — only Calendar and Sheets, not Drive/Gmail/Docs/etc.
- Advanced scheduling rules — no recurring appointments, buffer times, or complex availability logic

</boundaries>

<specifics>
## Specific Ideas

- OAuth flow should feel like Calendly — clean button, smooth permission grant, immediate confirmation
- Auto-create the logging spreadsheet when Google is connected (or find existing one) — zero manual sheet setup
- Real-time calendar availability checking during live calls

</specifics>

<notes>
## Additional Context

This phase enables the core value prop: voice agents that actually DO things (book appointments, capture data) rather than just answer questions. The Google integrations are what make agents productive.

Priority is reliability over features — better to have rock-solid booking for one calendar than flaky support for multiple.

</notes>

---

*Phase: 04-google-integrations*
*Context gathered: 2025-12-25*
