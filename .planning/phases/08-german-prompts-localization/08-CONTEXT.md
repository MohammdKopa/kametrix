# Phase 8: German Prompts & Localization - Context

**Gathered:** 2025-12-27
**Status:** Ready for planning

<vision>
## How This Should Work

When someone calls a Kametrix agent, they hear a professional German voice that sounds like a competent business receptionist. The agent speaks formal German (Sie-form) and handles appointments naturally in German context — 24-hour time format, sensible German date phrasing.

The dashboard stays in English. This isn't a multi-language platform — it's a German-market platform where the voice experience is fully localized but the admin interface remains English. All agents are German by default.

The agent should sound native, not like translated English. When booking appointments, times are spoken in 24-hour format ("vierzehn Uhr dreißig") and dates sound natural to a German speaker.

</vision>

<essential>
## What Must Be Nailed

- **Natural German speech** — The agent sounds native, uses proper German phrasing and idioms, not translated English
- **Correct time handling** — 24-hour format spoken naturally ("vierzehn Uhr dreißig")
- **Smooth booking flow** — The appointment scheduling conversation works seamlessly in German context

</essential>

<boundaries>
## What's Out of Scope

- Multi-language support — No language switcher, no other languages beyond German
- German dashboard UI — Admin interface stays in English, no translated UI strings
- German email templates — System emails stay in English for now
- Configurable formality — All agents use formal Sie-form, no Du option

</boundaries>

<specifics>
## Specific Ideas

- Professional/formal tone (Sie-form) for all agent interactions
- Standard business German — like a competent receptionist would speak
- All new agents default to German — this is a German-market platform
- Times spoken in 24-hour format
- Dates spoken naturally (whatever sounds right to a native speaker)

</specifics>

<notes>
## Additional Context

Phase 7 already configured Azure de-DE-KatjaNeural for TTS and Deepgram German for STT. This phase focuses on the prompts, phrasing, and making the agent sound truly native.

No concerns about calendar week conventions (Monday vs Sunday start) — just use sensible German defaults.

</notes>

---

*Phase: 08-german-prompts-localization*
*Context gathered: 2025-12-27*
