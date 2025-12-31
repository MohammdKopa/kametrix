# Phase 19: Prompt Consolidation - Context

**Gathered:** 2025-12-31
**Status:** Ready for planning

<vision>
## How This Should Work

One clean `buildSystemPrompt` function that assembles everything — business info, calendar rules, FAQ, greeting — no scattered prompt pieces. The German is good but the structure needs to be optimized for voice AI.

The result should make callers say "wow, this AI is good — I want this for my business." Natural, impressive, not robotic.

Voice AI needs:
- Very clear role definition upfront
- Explicit conversation flow guidance
- Handling of edge cases (what to do when confused)
- Natural language patterns, not robotic lists

The agent personality should be:
- **Freundlich und professionell** — friendly and professional
- **Geduldig** — patient, even with difficult questions
- **Kurze, klare Sätze** — short, clear sentences optimized for phone

Call flow: Greeting → Listen → Act
- Greet warmly
- Understand what they need
- Either book appointment or answer their question
- Confirm
- End cleanly

When confused, keep it simple: "Könnten Sie das bitte nochmal sagen?" — no over-explaining.

</vision>

<essential>
## What Must Be Nailed

- **Clear conversation flow** — the agent knows exactly how to guide calls from greeting to ending
- **Edge case handling** — when confused, interrupted, or caller goes off-topic, the agent knows what to do
- **Token efficiency** — remove repetition (especially date instructions), tighten instructions, make every token count

All three are equally critical for good voice quality.

</essential>

<boundaries>
## What's Out of Scope

- Voice provider changes — ElevenLabs is Phase 20, keep Azure for now
- UI/wizard changes — purely internal prompt refactoring
- New features — restructuring what exists, not adding capabilities

</boundaries>

<specifics>
## Specific Ideas

- Single source of truth: one `buildSystemPrompt` function
- Date instructions currently repeated and verbose — consolidate to one clear section
- Natural conversational German, not bullet-point instruction style
- Short, clear sentences optimized for phone audio

</specifics>

<notes>
## Additional Context

The current prompts work but aren't structured for optimal voice AI performance. This phase is about making the same content work better by restructuring it, not changing what the agent can do.

</notes>

---

*Phase: 19-prompt-consolidation*
*Context gathered: 2025-12-31*
