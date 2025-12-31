# Phase 19: Prompt Consolidation - Research

**Researched:** 2025-12-31
**Domain:** Voice AI prompt engineering, system prompt architecture
**Confidence:** HIGH

<research_summary>
## Summary

Researched voice AI prompt engineering best practices for Vapi integration, focusing on system prompt structure, German language considerations, and consolidation architecture patterns.

**Current state analysis:** The codebase has THREE separate prompt building locations:
1. `src/lib/vapi/assistants.ts` - `buildSystemPrompt()` for direct Vapi assistant creation
2. `src/app/api/agents/route.ts` - `buildSystemPrompt()` for wizard-based agent creation (DUPLICATE)
3. `src/app/api/webhooks/vapi/route.ts` - Inline prompt augmentation for assistant-request webhook

This creates maintenance burden, inconsistency risk, and violates DRY principles.

**Primary recommendation:** Create a single `src/lib/prompts/system-prompt.ts` module with one `buildSystemPrompt()` function that all locations import. Use Vapi's recommended section-based structure ([Identity], [Style], [Task], etc.) and keep prompts concise for voice interactions.
</research_summary>

<standard_stack>
## Standard Stack

No external libraries needed - this is internal refactoring using existing patterns.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| N/A | - | Internal TypeScript module | Prompt building is business logic, not a library concern |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Vapi SDK | existing | Dynamic variables | Already integrated for `{{"now" \| date: ...}}` syntax |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom module | Prompt templating library (e.g., Langchain) | Overkill for this use case - simple string building suffices |
| Single function | Class-based builder | Unnecessary complexity for current requirements |

**No installation needed** - this phase uses existing codebase patterns.
</standard_stack>

<architecture_patterns>
## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   └── prompts/
│       ├── index.ts              # Re-exports
│       ├── system-prompt.ts      # Single buildSystemPrompt function
│       ├── tool-descriptions.ts  # Calendar tool descriptions (German)
│       └── types.ts              # PromptConfig interface
```

### Pattern 1: Section-Based Prompt Structure (Vapi Recommended)
**What:** Organize prompts into labeled sections for LLM parsing clarity
**When to use:** All voice AI system prompts
**Example:**
```typescript
// Source: https://docs.vapi.ai/prompting-guide
const sections = [
  '[AKTUELLES DATUM UND UHRZEIT]',
  dateInfo,
  '',
  '[Identity]',
  `Sie sind der KI-Assistent für ${config.businessName}.`,
  '',
  '[Geschäftsinformationen]',
  businessInfo,
  '',
  '[Style]',
  '- Sprechen Sie Anrufer mit "Sie" an (formell)',
  '- Seien Sie freundlich, professionell und präzise',
  '- Halten Sie Antworten kurz und natürlich für Telefongespräche',
  '',
  '[Task]',
  taskInstructions,
];
return sections.join('\n');
```

### Pattern 2: Config Object Input
**What:** Accept a typed config object, not scattered parameters
**When to use:** Any prompt builder function
**Example:**
```typescript
// Source: Codebase best practices
interface PromptConfig {
  businessName: string;
  businessDescription?: string;
  businessHours: string;
  services: string[];
  faqs: { question: string; answer: string }[];
  policies?: string;
  hasGoogleCalendar: boolean;
}

function buildSystemPrompt(config: PromptConfig): string {
  // Single source of truth for all prompt building
}
```

### Pattern 3: Conditional Sections
**What:** Only include sections that have content
**When to use:** Dynamic content like FAQs, calendar features
**Example:**
```typescript
// Source: Current codebase pattern
const sections: string[] = [];

if (config.hasGoogleCalendar) {
  sections.push(buildDateHeader());
  sections.push(buildCalendarSection());
}

if (config.faqs.length > 0) {
  sections.push(buildFaqSection(config.faqs));
}
```

### Anti-Patterns to Avoid
- **Multiple buildSystemPrompt functions:** Creates inconsistency and maintenance burden
- **Inline prompt building in API routes:** Scatters business logic across codebase
- **Hardcoded strings everywhere:** Makes updates error-prone
- **Verbose greetings/responses:** Voice AI should be concise (< 50 words per response)
- **Markdown formatting for voice:** Don't use asterisks, bullets may be read aloud awkwardly
</architecture_patterns>

<dont_hand_roll>
## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Date/time in prompts | Manual date calculation | Vapi dynamic variables `{{"now" \| date: ...}}` | Vapi substitutes at call time, always accurate |
| German date formatting | Custom locale logic | Vapi `Europe/Berlin` timezone + `%d.%m.%Y` format | Vapi handles natively |
| Prompt templating engine | Complex template system | Simple string concatenation | Overkill for this use case |
| Tool descriptions | Copy-paste per location | Shared module export | Single source of truth |

**Key insight:** The consolidation itself IS the solution. Don't add complexity - just eliminate duplication by having one function imported everywhere.
</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: Verbose Voice Responses
**What goes wrong:** AI gives long, text-like responses inappropriate for phone
**Why it happens:** Prompts written for chat, not voice
**How to avoid:** Include explicit instruction: "Halten Sie Antworten kurz und natürlich für Telefongespräche" + "Keep responses under 50 words"
**Warning signs:** Call transcripts show multi-paragraph AI responses

### Pitfall 2: Markdown in Voice Prompts
**What goes wrong:** AI says "asterisk asterisk bold text asterisk asterisk"
**Why it happens:** Default LLM behavior includes markdown
**How to avoid:** Add to style section: "Verwende keine Markdown-Formatierung"
**Warning signs:** Weird spoken punctuation in calls

### Pitfall 3: Inconsistent Date Handling
**What goes wrong:** Different date formats in different places
**Why it happens:** Multiple prompt building locations with slight variations
**How to avoid:** Single buildSystemPrompt function, single date header format
**Warning signs:** Appointment booking uses wrong year, inconsistent date formats

### Pitfall 4: Tool Description Drift
**What goes wrong:** Tool descriptions in Vapi don't match stored prompts
**Why it happens:** Tools defined in multiple places with subtle differences
**How to avoid:** Export tool definitions from shared module
**Warning signs:** AI confused about what tools can do

### Pitfall 5: Missing Sie-Form Enforcement
**What goes wrong:** AI uses informal "du" form with German customers
**Why it happens:** Prompt doesn't emphasize formal address
**How to avoid:** Explicit instruction: "Sprechen Sie Anrufer IMMER mit 'Sie' an (formell)"
**Warning signs:** Customer complaints about informal address
</common_pitfalls>

<code_examples>
## Code Examples

Verified patterns for the consolidation:

### Single Source of Truth Module
```typescript
// src/lib/prompts/system-prompt.ts
// Source: Vapi prompting guide + current codebase patterns

export interface PromptConfig {
  businessName: string;
  businessDescription?: string;
  businessHours: string;
  services: string[];
  faqs: { question: string; answer: string }[];
  policies?: string;
  hasGoogleCalendar: boolean;
}

export function buildSystemPrompt(config: PromptConfig): string {
  const sections: string[] = [];

  // Date header (only for calendar-enabled agents)
  if (config.hasGoogleCalendar) {
    sections.push(buildDateHeader());
  }

  // Identity section
  sections.push('[Identity]');
  sections.push(`Sie sind der KI-Assistent für ${config.businessName}.`);
  if (config.businessDescription) {
    sections.push(config.businessDescription);
  }

  // Business info section
  sections.push('');
  sections.push('[Geschäftsinformationen]');
  sections.push(`- Firmenname: ${config.businessName}`);
  sections.push(`- Öffnungszeiten: ${config.businessHours}`);
  if (config.services.length > 0) {
    sections.push(`- Dienstleistungen: ${config.services.join(', ')}`);
  }

  // FAQ section (conditional)
  if (config.faqs.length > 0) {
    sections.push('');
    sections.push('[Häufige Fragen]');
    config.faqs.forEach((faq) => {
      sections.push(`F: ${faq.question}`);
      sections.push(`A: ${faq.answer}`);
    });
  }

  // Calendar section (conditional)
  if (config.hasGoogleCalendar) {
    sections.push('');
    sections.push('[Kalender-Funktionen]');
    sections.push('- Verfügbarkeit prüfen mit check_availability');
    sections.push('- Termine buchen mit book_appointment');
    sections.push('- Bei Buchungen erfragen: Datum, Uhrzeit, Name (erforderlich)');
    sections.push('- Details vor Buchung bestätigen');
  }

  // Style section
  sections.push('');
  sections.push('[Style]');
  sections.push('- Sprechen Sie Anrufer IMMER mit "Sie" an (formell)');
  sections.push('- Seien Sie freundlich, professionell und präzise');
  sections.push('- Halten Sie Antworten kurz (max 2-3 Sätze)');
  sections.push('- Natürlich für Telefongespräche sprechen');
  sections.push('- Keine Markdown-Formatierung verwenden');

  return sections.join('\n');
}

function buildDateHeader(): string {
  return `[AKTUELLES DATUM UND UHRZEIT]
Heute: {{"now" | date: "%d.%m.%Y", "Europe/Berlin"}} (ISO: {{"now" | date: "%Y-%m-%d", "Europe/Berlin"}})
Uhrzeit: {{"now" | date: "%H:%M", "Europe/Berlin"}} Uhr
Wochentag: {{"now" | date: "%A", "Europe/Berlin"}}

DATUMSREGELN:
- Aktuelles Jahr: {{"now" | date: "%Y", "Europe/Berlin"}}
- "morgen" = nächster Tag nach heute
- "Montag" = NÄCHSTER Montag
- Format für Tools: JJJJ-MM-TT
`;
}
```

### Usage in API Routes
```typescript
// src/app/api/agents/route.ts
import { buildSystemPrompt } from '@/lib/prompts';

// ... in POST handler:
const systemPrompt = buildSystemPrompt({
  businessName: wizardData.businessInfo.businessName,
  businessDescription: wizardData.businessInfo.businessDescription,
  businessHours: wizardData.businessInfo.businessHours,
  services: validServices,
  faqs: validFaqs,
  policies: wizardData.knowledge.policies,
  hasGoogleCalendar,
});
```

### Tool Descriptions Export
```typescript
// src/lib/prompts/tool-descriptions.ts
export const CALENDAR_TOOLS = {
  check_availability: {
    name: 'check_availability',
    description: 'Prüft die Kalenderverfügbarkeit für ein Datum.',
    // ... parameters
  },
  book_appointment: {
    name: 'book_appointment',
    description: 'Bucht einen Termin im Kalender.',
    // ... parameters
  },
};
```
</code_examples>

<sota_updates>
## State of the Art (2024-2025)

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Static date in prompt | Vapi dynamic variables | 2024 | Real-time date substitution at call time |
| Chat-style prompts | Voice-optimized prompts | 2024 | Shorter, more natural responses |
| English prompts | German Sie-form | Already implemented | Professional German business communication |

**New tools/patterns to consider:**
- **Vapi dynamic variables:** Use `{{"now" | date: ...}}` for real-time date/time - eliminates stale date bugs
- **Section-based prompts:** `[Identity]`, `[Style]`, `[Task]` format improves LLM parsing
- **Voice-first conciseness:** Target < 50 words per AI response for natural phone conversations

**Deprecated/outdated:**
- **Pre-computed dates in prompts:** Vapi dynamic variables are superior
- **Verbose system prompts:** Voice AI needs brevity
</sota_updates>

<open_questions>
## Open Questions

1. **Prompt versioning**
   - What we know: Prompts will evolve over time
   - What's unclear: Whether to version prompts or just update in place
   - Recommendation: Start simple (update in place), add versioning later if needed

2. **Existing agents migration**
   - What we know: Database has `systemPrompt` field with old format
   - What's unclear: Whether to migrate existing prompts or grandfather them
   - Recommendation: New agents use consolidated format; existing agents work via webhook augmentation
</open_questions>

<sources>
## Sources

### Primary (HIGH confidence)
- [Vapi Prompting Guide](https://docs.vapi.ai/prompting-guide) - Section structure, best practices
- [Vapi Dynamic Variables](https://docs.vapi.ai/assistants/dynamic-variables) - Date/time substitution
- Context7 /llmstxt/vapi_ai-llms.txt - Multilingual prompts, assistant structure

### Secondary (MEDIUM confidence)
- [Voice AI Prompt Engineering Guide](https://voiceinfra.ai/blog/prompt-engineering-ai-agent-complete-guide) - General voice AI patterns
- [Agenta Prompt Management](https://agenta.ai/blog/the-definitive-guide-to-prompt-management-systems) - Single source of truth patterns

### Tertiary (LOW confidence - needs validation)
- None - all findings verified against Vapi documentation
</sources>

<metadata>
## Metadata

**Research scope:**
- Core technology: Vapi voice AI, system prompt engineering
- Ecosystem: TypeScript modules, Next.js API routes
- Patterns: Section-based prompts, single source of truth, voice-optimized content
- Pitfalls: Verbosity, markdown in voice, date inconsistency, Sie-form enforcement

**Confidence breakdown:**
- Standard stack: HIGH - no external libraries needed
- Architecture: HIGH - clear consolidation path from codebase analysis
- Pitfalls: HIGH - derived from current codebase issues + Vapi docs
- Code examples: HIGH - based on current working patterns

**Research date:** 2025-12-31
**Valid until:** 2026-01-31 (30 days - stable internal refactoring)
</metadata>

---

*Phase: 19-prompt-consolidation*
*Research completed: 2025-12-31*
*Ready for planning: yes*
