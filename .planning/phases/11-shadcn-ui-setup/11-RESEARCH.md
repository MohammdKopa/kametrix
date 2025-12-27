# Phase 11: shadcn/ui Setup - Research

**Researched:** 2025-12-27
**Domain:** shadcn/ui component library with Tailwind v4 and Proximab-style dark theme
**Confidence:** HIGH

<research_summary>
## Summary

Researched the complete shadcn/ui integration with Tailwind CSS v4 for building a Proximab-inspired premium dark theme. The project already runs Tailwind v4.1.18 and React 19, making it ready for the latest shadcn/ui components.

Key finding: shadcn/ui has first-class Tailwind v4 support with the `@theme inline` directive for CSS variables. The CLI can initialize directly with v4 components. The existing globals.css already has Proximab colors defined — Phase 11 extends this with shadcn/ui's full variable system and component library.

**Primary recommendation:** Run `npx shadcn@latest init` with Tailwind v4 defaults, configure Proximab colors in OKLCH format, use `tw-animate-css` for animations, and install core components (Button, Card, Dialog, Input, etc.) to establish the component foundation.

</research_summary>

<standard_stack>
## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| shadcn/ui | latest (2025) | Component library | Official Tailwind v4 support, Radix primitives, fully customizable |
| tailwindcss | 4.1.18 | CSS framework | Already installed, CSS-first config |
| next-themes | 0.4.6 | Dark mode | Already installed, works with shadcn/ui ThemeProvider |
| tw-animate-css | latest | Animations | Replaces deprecated tailwindcss-animate for v4 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @radix-ui/* | latest | Primitives | Auto-installed with shadcn/ui components |
| lucide-react | 0.562.0 | Icons | Already installed, shadcn/ui default |
| clsx | latest | Class merging | Conditional classes in components |
| tailwind-merge | latest | Tailwind class deduplication | Prevents conflicting utilities |
| class-variance-authority | latest | Component variants | Type-safe variant definitions |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| shadcn/ui | Radix Themes | Radix Themes is pre-styled, less customizable |
| tw-animate-css | framer-motion | framer-motion more powerful but heavier |
| OKLCH colors | HSL colors | OKLCH has better perceptual uniformity |

**Installation:**
```bash
# Initialize shadcn/ui (will detect Tailwind v4)
npx shadcn@latest init

# Install animation library
npm install tw-animate-css

# Install utility libraries (if not auto-installed)
npm install clsx tailwind-merge class-variance-authority
```

</standard_stack>

<architecture_patterns>
## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── globals.css          # Theme variables + @theme inline
│   └── layout.tsx           # ThemeProvider wrapper
├── components/
│   ├── ui/                   # shadcn/ui components (auto-generated)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   └── theme-provider.tsx    # next-themes wrapper
└── lib/
    └── utils.ts              # cn() helper function
```

### Pattern 1: CSS Variables with @theme inline
**What:** Define theme variables in :root/.dark, then expose via @theme inline for Tailwind utilities
**When to use:** Always — this is how shadcn/ui v4 works
**Example:**
```css
/* Source: shadcn/ui docs + Tailwind v4 docs */
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  /* ... more variables */
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  /* ... dark overrides */
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  /* ... map all variables */
}
```

### Pattern 2: ThemeProvider in Root Layout
**What:** Wrap app in next-themes provider with class-based switching
**When to use:** Required for dark mode toggle
**Example:**
```tsx
// Source: shadcn/ui docs
// components/theme-provider.tsx
"use client"
import { ThemeProvider as NextThemesProvider } from "next-themes"

export function ThemeProvider({ children, ...props }) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

// app/layout.tsx
import { ThemeProvider } from "@/components/theme-provider"

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

### Pattern 3: cn() Utility for Class Merging
**What:** Combine clsx + tailwind-merge for conditional classes
**When to use:** Every component with dynamic classes
**Example:**
```typescript
// Source: shadcn/ui lib/utils.ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### Anti-Patterns to Avoid
- **Using HSL wrappers in Tailwind v4:** Don't use `hsl(var(--color))` — use `var(--color)` directly with OKLCH
- **Keeping tailwindcss-animate:** Deprecated in v4, use tw-animate-css instead
- **Manual dark mode classes:** Use CSS variables that auto-switch, not separate dark: utilities everywhere
- **Mixing old variable names:** shadcn/ui v4 uses `--color-*` prefix in @theme inline

</architecture_patterns>

<dont_hand_roll>
## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Accessible dialogs | Custom modal with z-index | shadcn/ui Dialog (Radix) | Focus trap, escape handling, ARIA |
| Dropdown menus | Custom div with onClick | shadcn/ui DropdownMenu | Keyboard nav, focus management |
| Form inputs | Styled raw inputs | shadcn/ui Input, Select | Consistent styling, accessibility |
| Toast notifications | Custom notification system | sonner (shadcn default) | Queuing, animations, accessibility |
| Class merging | String concatenation | cn() with tailwind-merge | Prevents conflicting utilities |
| Dark mode toggle | Custom localStorage logic | next-themes | SSR hydration, system detection |
| Component variants | If/else class logic | class-variance-authority | Type-safe, maintainable |

**Key insight:** shadcn/ui is built on Radix UI primitives which handle all the hard accessibility and interaction patterns. Every shadcn/ui component is unstyled by Radix, then styled via Tailwind. This means you get battle-tested interactions with full style control. Don't recreate these primitives.

</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: Using HSL Wrappers in Tailwind v4
**What goes wrong:** Colors don't resolve correctly, components have wrong colors
**Why it happens:** Tailwind v4 changed how CSS variables work — no hsl() wrapper needed with OKLCH
**How to avoid:** Use raw OKLCH values in CSS variables, reference directly with var()
**Warning signs:** `hsl(var(--background))` in your code — this is v3 syntax

### Pitfall 2: Forgetting @theme inline
**What goes wrong:** Tailwind utilities like `bg-background` don't work
**Why it happens:** Tailwind v4 needs explicit mapping from CSS variables to color utilities
**How to avoid:** Always include `@theme inline { --color-*: var(--*); }` block
**Warning signs:** Classes like `bg-primary` render but with wrong/no color

### Pitfall 3: Using Deprecated tailwindcss-animate
**What goes wrong:** Build errors, animations don't work
**Why it happens:** tailwindcss-animate not compatible with Tailwind v4
**How to avoid:** Use tw-animate-css instead, update imports
**Warning signs:** `@plugin 'tailwindcss-animate'` in CSS — remove it

### Pitfall 4: Not Setting defaultTheme="dark"
**What goes wrong:** Flash of light theme on load
**Why it happens:** System preference detected after hydration
**How to avoid:** Set `defaultTheme="dark"` in ThemeProvider, match user preference
**Warning signs:** White flash when navigating to dark-themed app

### Pitfall 5: Mixing Component Versions
**What goes wrong:** TypeScript errors, inconsistent behavior
**Why it happens:** Adding v3-style components to v4 project
**How to avoid:** Run `npx shadcn@latest add` always (not @v3 or old docs)
**Warning signs:** `forwardRef` in component code — v4 removed these

</common_pitfalls>

<code_examples>
## Code Examples

Verified patterns from official sources:

### shadcn/ui Init Output (Tailwind v4)
```css
/* Source: shadcn/ui docs - globals.css after init */
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

:root {
  --radius: 0.625rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --card-foreground: oklch(0.985 0 0);
  /* ... */
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

### Glassmorphism Card Pattern (Tailwind)
```html
<!-- Source: Tailwind glassmorphism best practices -->
<div class="backdrop-blur-md bg-white/10 border border-white/20 rounded-lg shadow-xl p-6">
  <!-- Card content -->
</div>

<!-- Dark mode variant with purple tint -->
<div class="backdrop-blur-xl bg-purple-900/20 border border-purple-500/20 rounded-xl shadow-2xl p-6">
  <!-- Premium dark card -->
</div>
```

### Proximab-Style Custom Colors (OKLCH)
```css
/* Source: Proximab color extraction + OKLCH conversion */
.dark {
  /* Base background - deep dark purple-black */
  --background: oklch(0.08 0.03 285);          /* #06040d */
  --background-secondary: oklch(0.1 0.04 290); /* #0c0512 */

  /* Surfaces - subtle purple tint */
  --card: oklch(0.18 0.05 285);                /* #241c36 approx */
  --muted: oklch(0.15 0.04 285);               /* #1a1425 approx */

  /* Accents - vibrant purple/pink gradient */
  --primary: oklch(0.55 0.25 300);             /* #983ad6 */
  --accent: oklch(0.45 0.3 305);               /* #681ee0 */

  /* Highlight pink */
  --chart-1: oklch(0.8 0.2 320);               /* #e496ff */

  /* Borders - muted purple */
  --border: oklch(0.3 0.06 290);               /* #2d1f3d */
}
```

</code_examples>

<sota_updates>
## State of the Art (2024-2025)

What's changed recently:

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| tailwindcss-animate | tw-animate-css | March 2025 | Must migrate animation plugin |
| HSL color values | OKLCH color values | Jan 2025 | Better perceptual uniformity, gradient support |
| forwardRef components | data-slot + direct props | 2025 | Simpler component code, React 19 native |
| toast component | sonner | 2025 | Better toast library, more features |
| Tailwind config file | CSS-first @theme | Tailwind v4 | No tailwind.config.js needed |

**New tools/patterns to consider:**
- **OKLCH colors:** Better for gradients, more uniform color perception
- **@theme inline:** Cleaner variable mapping than v3's extend.colors
- **data-slot attributes:** Every shadcn/ui primitive now has these for styling

**Deprecated/outdated:**
- **tailwindcss-animate:** Replace with tw-animate-css
- **HSL wrappers:** No longer needed in Tailwind v4
- **forwardRef:** React 19 + shadcn/ui v4 don't need it
- **default style:** new-york is now the default shadcn/ui style

</sota_updates>

<open_questions>
## Open Questions

Things that couldn't be fully resolved:

1. **OKLCH conversion precision**
   - What we know: Proximab uses hex colors like #06040d, #983ad6
   - What's unclear: Exact OKLCH equivalents for perfect match
   - Recommendation: Use online converter, verify visually during implementation

2. **Gradient animation performance**
   - What we know: Proximab uses animated gradients and radial glows
   - What's unclear: Performance impact on lower-end devices
   - Recommendation: Use CSS animations (GPU-accelerated), test on mobile

</open_questions>

<sources>
## Sources

### Primary (HIGH confidence)
- /websites/ui_shadcn (Context7) - installation, theming, components
- /websites/tailwindcss (Context7) - dark mode, @theme inline, CSS variables
- https://ui.shadcn.com/docs/tailwind-v4 - official v4 migration guide
- https://tailwindcss.com/docs/dark-mode - dark mode configuration

### Secondary (MEDIUM confidence)
- https://proximab.framer.website/ - color palette extraction
- https://flyonui.com/blog/glassmorphism-with-tailwind-css/ - glassmorphism patterns
- https://www.shadcnblocks.com/blog/tailwind4-shadcn-themeing/ - real-world v4 migration

### Tertiary (LOW confidence - needs validation)
- OKLCH color conversions - should be verified visually during implementation

</sources>

<metadata>
## Metadata

**Research scope:**
- Core technology: shadcn/ui + Tailwind CSS v4
- Ecosystem: Radix UI, next-themes, tw-animate-css, lucide-react
- Patterns: CSS variables, @theme inline, ThemeProvider, glassmorphism
- Pitfalls: HSL wrappers, deprecated animate plugin, version mixing

**Confidence breakdown:**
- Standard stack: HIGH - verified with Context7, official docs
- Architecture: HIGH - from official shadcn/ui docs and examples
- Pitfalls: HIGH - documented in migration guides
- Code examples: HIGH - from Context7 and official sources
- Proximab colors: MEDIUM - extracted, needs visual verification

**Research date:** 2025-12-27
**Valid until:** 2026-01-27 (30 days - shadcn/ui + Tailwind stable ecosystem)

</metadata>

---

*Phase: 11-shadcn-ui-setup*
*Research completed: 2025-12-27*
*Ready for planning: yes*
