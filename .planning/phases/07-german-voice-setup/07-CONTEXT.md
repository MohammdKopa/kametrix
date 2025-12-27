# Phase 7: German Voice Setup - Context

**Gathered:** 2025-12-27
**Status:** Ready for research

<vision>
## How This Should Work

Kametrix is a German-market-only product. When users create an agent, it's automatically a German agent — no language selection needed. The voice agent speaks, understands, and responds entirely in German with a natural, human-like voice. It should sound like a real German receptionist, not a robotic AI.

The experience is native German from start to finish. Callers hear professional, natural German speech. The agent understands German speakers reliably, regardless of speaking speed or minor accent variations.

</vision>

<essential>
## What Must Be Nailed

- **Natural voice quality** - Agent sounds like a real German person, not synthetic or robotic
- **Reliable comprehension** - Agent understands German speakers accurately (various speeds, natural speech patterns)
- **Seamless by default** - German is the only option, so no extra configuration needed from users

</essential>

<boundaries>
## What's Out of Scope

- UI translations (dashboard stays English) — that's Phase 8
- Multiple German dialects/variants (Swiss German, Austrian German) — just standard Hochdeutsch
- Language selection UI — German is the only language, no need for selection
- English agent support — not needed for German market focus

</boundaries>

<specifics>
## Specific Ideas

- All agents default to German automatically
- Focus on standard Hochdeutsch accent for the voice
- Need to research which Vapi TTS/STT providers have the best German quality

</specifics>

<notes>
## Additional Context

This is a fundamental shift: Kametrix is German-market focused, not multi-language. This simplifies the implementation significantly — rather than adding language selection, we're configuring the entire system for German by default.

The current v1.0 implementation likely uses English voices/providers. This phase reconfigures the Vapi integration to use German TTS (text-to-speech) and STT (speech-to-text) providers.

</notes>

---

*Phase: 07-german-voice-setup*
*Context gathered: 2025-12-27*
