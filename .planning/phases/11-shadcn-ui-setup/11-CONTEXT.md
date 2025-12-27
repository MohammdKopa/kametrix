# Phase 11: shadcn/ui Setup - Context

**Gathered:** 2025-12-27
**Status:** Ready for research

<vision>
## How This Should Work

Full replacement approach — rip out the existing Tailwind components and rebuild everything with shadcn/ui. No gradual migration or hybrid period. Commit fully to the new component system.

This phase is purely infrastructure setup. Install shadcn/ui, configure the Proximab-inspired theme, and get the component foundation ready. When this phase is done, I should have all the tools I need to start rebuilding the actual UI in Phase 12.

The end result should feel premium and expensive — deep blacks, glowing purple/pink accents, glassmorphic surfaces with blur effects. Think Proximab's visual identity transplanted onto Kametrix.

</vision>

<essential>
## What Must Be Nailed

- **Theme foundation** — Color system, CSS variables, and dark mode base must be rock solid. Everything downstream depends on this.
- **Component library** — shadcn/ui installed with core components ready to use. Can't rebuild UI without the building blocks.

Both are equally critical. Can't move forward to Phase 12 without both the theme AND the components ready.

</essential>

<boundaries>
## What's Out of Scope

- No UI rebuilding — Don't touch the dashboard or landing pages yet. That's Phase 12 and 13.
- This is purely setup and configuration work.
- Animations and scroll effects can wait for the pages that use them.

</boundaries>

<specifics>
## Specific Ideas

- Match Proximab as closely as possible:
  - Base color: #06040d (deep dark)
  - Purple/pink accent gradients
  - Glassmorphic cards with blur effects and subtle borders
  - Radial glow effects for atmosphere
  - Typography: Poppins + Inter
- Reference: https://proximab.framer.website/

This isn't "inspired by" — it's "match their visual identity." Make Kametrix look like it belongs in the same premium tier.

</specifics>

<notes>
## Additional Context

The current dashboard already has a dark theme from Phase 9, but this is a complete redesign. The new theme should replace it entirely, not build on top of it.

shadcn/ui brings a different component architecture — this is a commitment to their patterns and approach.

</notes>

---

*Phase: 11-shadcn-ui-setup*
*Context gathered: 2025-12-27*
