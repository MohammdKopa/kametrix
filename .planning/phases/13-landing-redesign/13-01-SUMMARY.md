# Phase 13 Plan 01: Motion Setup & Hero Enhancement Summary

**Installed motion animation library and added scroll-linked radial glow effect to Hero section.**

## Accomplishments

- Installed `motion` v12.23.26 animation library (rebranded from framer-motion)
- Enhanced Hero.tsx with scroll-linked glow that fades (0.2 to 0) and shrinks (100% to 70%) as user scrolls
- Added subtle entrance animation to hero content (fade+slide, 0.6s duration)
- Secondary glow kept static to avoid over-animation
- Build passes successfully

## Files Created/Modified

- `package.json` - Added motion dependency
- `src/components/marketing/Hero.tsx` - Added "use client" directive, motion imports, scroll-linked glow animation, and entrance animation

## Decisions Made

- Used `motion` package (not `framer-motion`) per 2024 rebrand
- Imported from `"motion/react"` (new path)
- Kept animation durations under 0.7s (0.6s for entrance)
- Used small Y offset (20px) to avoid layout shift
- Animated only the main glow and content container (not every element)

## Issues Encountered

None. Build succeeded on first attempt.

## Next Step

Ready for 13-02-PLAN.md (Section Animations & Polish)
