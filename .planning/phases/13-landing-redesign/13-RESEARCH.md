# Phase 13: Landing Redesign - Research

**Researched:** 2025-12-28
**Domain:** Scroll animations for React/Next.js landing page with premium dark theme
**Confidence:** HIGH

<research_summary>
## Summary

Researched scroll animation libraries and techniques for rebuilding the Kametrix landing page with scroll-triggered reveals and enhanced visual effects. The standard approach for React/Next.js applications is **Motion (formerly Framer Motion)** for declarative scroll animations using `whileInView` and `useScroll` hooks.

Key finding: The project already has radial glow patterns established in the current Hero.tsx (CSS radial gradients with blur). No animation library is currently installed. Motion is the clear choice over GSAP for this use case because:
- React-native declarative API with `whileInView` prop
- Perfect for simple reveal animations (the primary requirement)
- Smaller bundle than GSAP for equivalent features
- No cleanup/lifecycle management needed (unlike GSAP ScrollTrigger)

**Primary recommendation:** Install Motion (`motion`), use `whileInView` for section reveals with fade+slide variants, enhance existing radial glow with subtle animation. Keep it simple - avoid complex scroll-linked parallax.
</research_summary>

<standard_stack>
## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| motion | 11.x | Scroll animations, entrance effects | The React animation standard; declarative whileInView is perfect for landing pages |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-intersection-observer | 9.x | Alternative to Motion for simple inView detection | If bundle size is critical and only need visibility detection |
| tw-animate-css | 1.4.0 | Tailwind animation classes | Already installed; use for simple hover/pulse effects |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Motion | GSAP + ScrollTrigger | GSAP more powerful for complex timelines, but overkill for section reveals. Requires manual cleanup. |
| Motion | CSS scroll-driven animations | Native CSS, best performance, BUT Safari doesn't support yet (coming in Safari 26). Not production-ready for all browsers. |
| Motion | react-intersection-observer + CSS | Lighter weight but more manual animation setup |

**Installation:**
```bash
npm install motion
```

**Note:** Package is now just `motion` not `framer-motion` (rebranded in 2024).
</standard_stack>

<architecture_patterns>
## Architecture Patterns

### Recommended Project Structure
No new folders needed. Animation code goes directly in components:
```
src/
├── components/marketing/
│   ├── Hero.tsx         # Add motion + animate glow
│   ├── Features.tsx     # Add whileInView to cards
│   └── HowItWorks.tsx   # Add staggered step reveals
```

### Pattern 1: Section Reveal with whileInView
**What:** Animate sections when they enter viewport
**When to use:** Every section below the fold (Features, HowItWorks)
**Example:**
```tsx
// Source: Motion official docs
import { motion } from "motion/react";

// Wrap section content
<motion.div
  initial={{ opacity: 0, y: 30 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: "-100px" }}
  transition={{ duration: 0.6, ease: "easeOut" }}
>
  {/* Section content */}
</motion.div>
```

### Pattern 2: Staggered Card Reveals
**What:** Cards animate in sequence with delay
**When to use:** Feature grids, step lists
**Example:**
```tsx
// Source: Motion official docs - variants pattern
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 }
  },
};

<motion.div
  variants={containerVariants}
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true }}
>
  {items.map((item) => (
    <motion.div key={item.id} variants={itemVariants}>
      {/* Card content */}
    </motion.div>
  ))}
</motion.div>
```

### Pattern 3: Scroll-Linked Progress (Hero Glow)
**What:** Animate based on scroll position, not just visibility
**When to use:** Hero background effects, progress indicators
**Example:**
```tsx
// Source: Motion official docs
import { motion, useScroll, useTransform } from "motion/react";

function Hero() {
  const { scrollYProgress } = useScroll();

  // Glow shrinks/fades as user scrolls down
  const glowScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.5]);
  const glowOpacity = useTransform(scrollYProgress, [0, 0.3], [0.2, 0]);

  return (
    <motion.div
      className="absolute w-[600px] h-[400px] bg-purple-600/20 rounded-full blur-[128px]"
      style={{ scale: glowScale, opacity: glowOpacity }}
    />
  );
}
```

### Anti-Patterns to Avoid
- **Animating every element:** Only animate sections/cards, not every text element. Too much motion is distracting.
- **Using `once: false`:** For landing pages, use `once: true` so animations don't replay on scroll back up.
- **Large Y offsets:** Keep `y` offsets to 20-40px max. Large offsets (100px+) feel unnatural.
- **Slow durations:** Keep durations 0.4-0.7s. Anything over 1s feels sluggish on a landing page.
</architecture_patterns>

<dont_hand_roll>
## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Scroll-triggered visibility | Intersection Observer + useState + CSS | Motion `whileInView` | Motion handles timing, easing, and cleanup automatically |
| Staggered animations | Manual setTimeout/delay calculations | Motion `staggerChildren` in variants | Declarative, auto-cleanup, no timing bugs |
| Scroll progress tracking | window scroll listener + calculations | Motion `useScroll` hook | Debounced, optimized, handles resize/SSR |
| Entrance animations | CSS keyframes + conditional classes | Motion `initial` + `animate`/`whileInView` | Consistent API, easier to tweak |

**Key insight:** Motion's declarative API eliminates the entire class of bugs from manual scroll listeners, cleanup, and animation coordination. The library is ~32KB but saves significant development time and prevents performance issues from naive scroll handlers.
</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: Animation Replay on Mobile
**What goes wrong:** Animations replay when mobile browser address bar shows/hides (triggers resize)
**Why it happens:** `whileInView` re-triggers if element exits and re-enters viewport
**How to avoid:** Always use `viewport={{ once: true }}` for landing page sections
**Warning signs:** Elements flashing on mobile scroll

### Pitfall 2: Content Layout Shift
**What goes wrong:** Page jumps as elements animate in with transforms
**Why it happens:** Initial `y` offset changes element's visual position
**How to avoid:** Use `opacity` as primary reveal; keep `y` offsets small (20-40px)
**Warning signs:** Scrollbar jumping, content reflowing

### Pitfall 3: SSR Hydration Mismatch
**What goes wrong:** React hydration errors with Motion on Next.js
**Why it happens:** Server renders `initial` state, client hydrates with animation
**How to avoid:** This is handled automatically by Motion since v10. Ensure you import from `"motion/react"` not `"framer-motion"`.
**Warning signs:** Console hydration warnings

### Pitfall 4: Performance on Many Elements
**What goes wrong:** Page becomes janky with too many animated elements
**Why it happens:** Each motion element has IntersectionObserver overhead
**How to avoid:** Animate parent containers, not individual items. Use variants for children.
**Warning signs:** Low FPS on scroll, stuttering

### Pitfall 5: Forgetting prefers-reduced-motion
**What goes wrong:** Users with motion sensitivity get nauseated
**Why it happens:** Not respecting system accessibility settings
**How to avoid:** Motion respects `prefers-reduced-motion` by default since v10. Verify with test.
**Warning signs:** Accessibility audit failures
</common_pitfalls>

<code_examples>
## Code Examples

Verified patterns from official sources:

### Basic Section Reveal
```tsx
// Source: motion.dev/docs/react-scroll-animations
import { motion } from "motion/react";

export function FeaturesSection() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="py-24"
    >
      {/* Content */}
    </motion.section>
  );
}
```

### Staggered Grid Items
```tsx
// Source: motion.dev/docs/react-motion-component (variants)
import { motion } from "motion/react";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export function FeatureGrid({ features }) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
      className="grid grid-cols-3 gap-6"
    >
      {features.map((feature) => (
        <motion.div key={feature.id} variants={item} className="p-6 rounded-xl">
          {/* Card content */}
        </motion.div>
      ))}
    </motion.div>
  );
}
```

### Scroll-Linked Hero Effect
```tsx
// Source: motion.dev/docs/react-use-scroll
import { motion, useScroll, useTransform } from "motion/react";

export function HeroWithParallax() {
  const { scrollYProgress } = useScroll();

  // Glow fades and shrinks as user scrolls
  const glowOpacity = useTransform(scrollYProgress, [0, 0.2], [0.2, 0]);
  const glowScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.8]);

  return (
    <section className="relative min-h-screen">
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-purple-600/20 rounded-full blur-[128px]"
        style={{
          opacity: glowOpacity,
          scale: glowScale
        }}
      />
      {/* Hero content */}
    </section>
  );
}
```

### Simple Fade-In with ViewOptions
```tsx
// Source: motion.dev/docs/react-scroll-animations
import { motion } from "motion/react";

// Trigger when 20% of element is visible, 100px before viewport edge
<motion.div
  initial={{ opacity: 0 }}
  whileInView={{ opacity: 1 }}
  viewport={{
    once: true,
    amount: 0.2,
    margin: "-100px 0px"
  }}
  transition={{ duration: 0.5 }}
>
  Content
</motion.div>
```
</code_examples>

<sota_updates>
## State of the Art (2024-2025)

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `framer-motion` package | `motion` package | 2024 | Same library, rebranded. Import from `"motion/react"` |
| Manual IntersectionObserver | Motion `whileInView` | 2022+ | Built-in, handles edge cases automatically |
| GSAP for everything | Motion for React, GSAP for complex timelines | 2024 | Motion handles 90% of React animation needs with simpler API |
| JS scroll listeners | CSS scroll-driven animations | 2024+ | Native CSS is coming but Safari support lacking (v26+) |

**New tools/patterns to consider:**
- **CSS scroll-driven animations:** Native browser feature with scroll() and view() functions. Chrome/Edge support it, Safari 26 will. Use as progressive enhancement in future, not primary approach yet.
- **motion-primitives:** Pre-built animated React components (InView, TextEffect). Could use for specific effects, but adds another dependency.

**Deprecated/outdated:**
- **framer-motion import path:** Use `"motion/react"` not `"framer-motion"`
- **Manual scroll listeners:** Use `useScroll` hook instead
- **AOS (Animate on Scroll):** Old library, use Motion instead
- **ScrollReveal.js:** Outdated, use Motion
</sota_updates>

<open_questions>
## Open Questions

Things that couldn't be fully resolved:

1. **Hero glow animation specifics**
   - What we know: Can animate glow with scroll-linked transforms (scale, opacity)
   - What's unclear: Whether to add subtle idle animation (pulse) or keep static
   - Recommendation: Start with scroll-linked only, add pulse if hero feels too static

2. **Mobile performance threshold**
   - What we know: Motion is performant for typical use cases
   - What's unclear: Exact number of animated elements before mobile struggles
   - Recommendation: Test on mid-range Android device. Aim for max 10-15 simultaneous observers.
</open_questions>

<sources>
## Sources

### Primary (HIGH confidence)
- /websites/motion-dev-docs - whileInView, useScroll, viewport options, variants
- Motion official docs (motion.dev) - All code patterns
- Context7 /thebuilder/react-intersection-observer - Alternative approach reference

### Secondary (MEDIUM confidence)
- [MDN CSS scroll-driven animations](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll-driven_animations) - Browser support status
- [Smashing Magazine introduction to CSS scroll-driven animations](https://www.smashingmagazine.com/2024/12/introduction-css-scroll-driven-animations/) - 2024 landscape
- [Motion vs GSAP comparison](https://motion.dev/docs/gsap-vs-motion) - Library choice rationale
- [Pentaclay: Framer vs GSAP](https://pentaclay.com/blog/framer-vs-gsap-which-animation-library-should-you-choose) - Use case guidance

### Tertiary (LOW confidence - needs validation)
- None - all findings verified against official docs
</sources>

<metadata>
## Metadata

**Research scope:**
- Core technology: Motion (Framer Motion successor) for React
- Ecosystem: react-intersection-observer as lightweight alternative
- Patterns: whileInView reveals, staggered children, scroll-linked transforms
- Pitfalls: Mobile replay, layout shift, SSR, performance

**Confidence breakdown:**
- Standard stack: HIGH - Motion is the clear React standard, verified with official docs
- Architecture: HIGH - Patterns directly from Motion documentation
- Pitfalls: HIGH - Common issues documented in forums and official guides
- Code examples: HIGH - All from Context7/official Motion docs

**Research date:** 2025-12-28
**Valid until:** 2026-02-28 (60 days - Motion API stable, minor version bumps only)
</metadata>

---

*Phase: 13-landing-redesign*
*Research completed: 2025-12-28*
*Ready for planning: yes*
