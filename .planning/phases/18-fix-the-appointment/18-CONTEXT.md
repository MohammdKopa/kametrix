# Phase 18: Fix the Appointment - Context

**Gathered:** 2025-12-29
**Status:** Ready for planning

<vision>
## How This Should Work

When a caller books an appointment, the AI should understand dates intelligently based on the current date:

- **"Tomorrow"** → The AI knows today is December 29, 2025, so tomorrow is December 30, 2025
- **"October 6"** → The AI knows it's currently December, so October means October 2026 (next year)
- **"January 15"** → January 2026 (coming up next month)

The AI should never generate dates with wrong years (like 2023) and should understand temporal context — if a month has already passed this year, it means next year.

Currently broken: The webhook shows dates like `2023-10-06` being corrected through flawed logic that bumps to next year arbitrarily, resulting in dates like `2026-10-06` when it should be `2025-10-06` or contextually appropriate.

</vision>

<essential>
## What Must Be Nailed

- **Current date awareness** — The AI must know today's actual date when interpreting relative terms like "tomorrow", "next week", "this Friday"
- **Smart month inference** — If the caller says a month that's already passed this year, assume next year. If it's coming up, assume this year.
- **No arbitrary year assumptions** — Stop the AI from defaulting to 2023 or other incorrect years

</essential>

<boundaries>
## What's Out of Scope

- Complex scheduling rules (business hours, blocked days, recurring appointments)
- Multi-timezone support
- Rescheduling/cancellation flows
- Any calendar availability logic changes

This is purely about getting the date/time interpretation correct.

</boundaries>

<specifics>
## Specific Ideas

The fix likely involves:
1. Ensuring the AI's system prompt includes today's date
2. Fixing the date validation/correction logic in the booking function
3. Making the correction logic smarter about inferring the correct year based on month context

</specifics>

<notes>
## Additional Context

From webhook logs, the pattern is clear:
```
Executing tool: book_appointment with args: { date: '2023-10-06', time: '14:00', callerName: 'Mohamed Keba' }
Date year corrected from 2023 to 2025: 2023-10-06
Date 2023-10-06 is in the past, moved to next year: 2026-10-06
```

The AI generates 2023 dates, then the correction logic cascades through multiple fixes ending up with wrong results.

</notes>

---

*Phase: 18-fix-the-appointment*
*Context gathered: 2025-12-29*
