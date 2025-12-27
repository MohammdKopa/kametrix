# Phase 8: German Prompts & Localization - Research

**Researched:** 2025-12-27
**Domain:** German localization for AI voice agents (prompts, date/time formatting)
**Confidence:** HIGH

<research_summary>
## Summary

Researched German business phone etiquette, spoken date/time conventions, and JavaScript Intl API for German locale. The codebase already has German TTS (Azure de-DE-KatjaNeural) and STT (Deepgram German) from Phase 7. This phase focuses on naturalizing prompts and date/time spoken output.

Key findings:
1. German business calls use "Sie" form, formal greetings ("Guten Tag"), and specific answer patterns ("[Firma], [Name] am Apparat")
2. Spoken times use 24-hour format officially ("vierzehn Uhr dreißig") but casual speech often uses 12-hour with context
3. Dates spoken as "Montag, der fünfzehnte Januar" (full form) or "am Montag, dem fünfzehnten" (casual)
4. JavaScript Intl.DateTimeFormat with 'de-DE' locale handles written formatting, but spoken output needs custom conversion

**Primary recommendation:** Create German prompt templates with native phrasing, use Intl API for locale-aware formatting, add helper to convert times to spoken German format.
</research_summary>

<standard_stack>
## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Intl.DateTimeFormat | Built-in | German date/time formatting | Native JS, no dependencies |
| Intl.NumberFormat | Built-in | German number formatting | Native JS, handles comma decimals |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | 3.x | Date manipulation | Already in use, supports de locale |
| date-fns/locale/de | 3.x | German locale data | Week names, month names |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Intl API | moment.js | Moment is deprecated, Intl is native |
| Custom spoken format | External library | No standard lib for spoken German numbers |

**Installation:**
No new dependencies required - Intl API is built into JavaScript.
</standard_stack>

<architecture_patterns>
## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   ├── localization/
│   │   ├── german-prompts.ts    # German prompt templates
│   │   ├── spoken-format.ts     # Time/date to spoken German
│   │   └── index.ts
│   └── vapi/
│       └── assistants.ts        # (existing) - update to use German
```

### Pattern 1: German Prompt Templates
**What:** Separate German prompt strings from code, use Sie-form throughout
**When to use:** All agent-facing text
**Example:**
```typescript
// german-prompts.ts
export const GERMAN_PROMPTS = {
  greeting: (businessName: string) =>
    `Guten Tag! Sie sind verbunden mit ${businessName}. Wie kann ich Ihnen behilflich sein?`,

  endCall: 'Vielen Dank für Ihren Anruf. Auf Wiederhören!',

  appointmentConfirm: (date: string, time: string, name: string) =>
    `Ich habe Ihren Termin für ${date} um ${time} eingetragen. Vielen Dank, ${name}!`,

  // Use "Sie" form consistently
  askName: 'Darf ich Ihren Namen erfahren?',
  askPhone: 'Unter welcher Telefonnummer sind Sie erreichbar?',
};
```

### Pattern 2: Spoken Time Conversion
**What:** Convert 24-hour time to spoken German format
**When to use:** When announcing times to callers
**Example:**
```typescript
// spoken-format.ts
export function timeToSpokenGerman(time: string): string {
  // Input: "14:30" or "09:00"
  const [hours, minutes] = time.split(':').map(Number);

  const hourWord = numberToGerman(hours);
  const minuteWord = minutes > 0 ? numberToGerman(minutes) : '';

  if (minutes === 0) {
    return `${hourWord} Uhr`;
  }
  return `${hourWord} Uhr ${minuteWord}`;
}

// "14:30" -> "vierzehn Uhr dreißig"
// "09:00" -> "neun Uhr"
```

### Pattern 3: German System Prompt Structure
**What:** Native German prompt structure for natural speech
**When to use:** Building agent system prompts
**Example:**
```typescript
const systemPrompt = `Sie sind der KI-Assistent für ${businessName}.

## Geschäftsinformationen
- Firmenname: ${businessName}
- Öffnungszeiten: ${businessHours}
- Dienstleistungen: ${services.join(', ')}

## Richtlinien
- Sprechen Sie die Anrufer mit "Sie" an
- Seien Sie freundlich, professionell und präzise
- Halten Sie Ihre Antworten kurz und natürlich für Telefongespräche
- Bei Terminbuchungen: Datum, Uhrzeit und Name erfragen, dann bestätigen`;
```

### Anti-Patterns to Avoid
- **Translating English prompts word-for-word:** Results in unnatural German ("Wie kann ich Ihnen heute helfen?" is fine, but avoid literal translations)
- **Mixing Sie and Du:** Always use formal "Sie" in business context
- **Using AM/PM:** Germans use 24-hour format, never say "vierzehn Uhr nachmittags"
- **English date format in speech:** Never "January 15th", always "fünfzehnter Januar"
</architecture_patterns>

<dont_hand_roll>
## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Date formatting | Custom string building | Intl.DateTimeFormat | Handles edge cases, localization |
| Number formatting | Manual comma/period swap | Intl.NumberFormat | 1.234,56 vs 1,234.56 handled |
| Weekday/month names | Hardcoded arrays | date-fns/locale/de | Proper capitalization, variants |

**Key insight:** The JavaScript Intl API handles German locale formatting correctly. For spoken format, a thin conversion layer is needed, but don't rebuild what Intl provides.
</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: Literal Translation of English Prompts
**What goes wrong:** Agent sounds robotic or uses non-native phrasing
**Why it happens:** Direct translation without considering German idiom
**How to avoid:** Write prompts in German from scratch, not as translations
**Warning signs:** Phrases like "Haben Sie einen schönen Tag!" (too American)

### Pitfall 2: Inconsistent Formality Level
**What goes wrong:** Mixing "Sie" and "du" or formal/informal tone
**Why it happens:** Different parts of prompts written at different times
**How to avoid:** Use Sie-form consistently, review all prompts together
**Warning signs:** "Dein Termin" mixed with "Ihr Anruf"

### Pitfall 3: Wrong Time Format for Speech
**What goes wrong:** Agent says "14:30" as text instead of "vierzehn Uhr dreißig"
**Why it happens:** Using written format directly in speech
**How to avoid:** Convert times to spoken format before including in responses
**Warning signs:** TTS reads "14:30" as "eins vier drei null"

### Pitfall 4: Hardcoded English Response Messages
**What goes wrong:** Tool responses return English messages ("I've booked your appointment...")
**Why it happens:** Webhook handler returns hardcoded English strings
**How to avoid:** Localize all tool response messages in webhook handler
**Warning signs:** Mixed German/English during calls
</common_pitfalls>

<code_examples>
## Code Examples

### German Date Formatting with Intl
```typescript
// Written format: "15. Januar 2025"
const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('de-DE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
};

// Full spoken format: "Mittwoch, der 15. Januar 2025"
const formatDateFull = (date: Date): string => {
  return new Intl.DateTimeFormat('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
};
```

### Spoken German Numbers (0-59 for time)
```typescript
const GERMAN_NUMBERS: Record<number, string> = {
  0: 'null', 1: 'eins', 2: 'zwei', 3: 'drei', 4: 'vier',
  5: 'fünf', 6: 'sechs', 7: 'sieben', 8: 'acht', 9: 'neun',
  10: 'zehn', 11: 'elf', 12: 'zwölf', 13: 'dreizehn', 14: 'vierzehn',
  15: 'fünfzehn', 16: 'sechzehn', 17: 'siebzehn', 18: 'achtzehn',
  19: 'neunzehn', 20: 'zwanzig', 21: 'einundzwanzig', 22: 'zweiundzwanzig',
  23: 'dreiundzwanzig', 24: 'vierundzwanzig', // ... continue to 59
  30: 'dreißig', 40: 'vierzig', 45: 'fünfundvierzig', 50: 'fünfzig',
};

// For compound numbers: 21-29, 31-39, etc.
function numberToGerman(n: number): string {
  if (GERMAN_NUMBERS[n]) return GERMAN_NUMBERS[n];
  const ones = n % 10;
  const tens = Math.floor(n / 10) * 10;
  // German order: "einundzwanzig" (one-and-twenty)
  return `${GERMAN_NUMBERS[ones]}und${GERMAN_NUMBERS[tens]}`;
}
```

### German Business Greeting Pattern
```typescript
// Source: German business phone etiquette research
const buildGermanGreeting = (businessName: string) => {
  // Pattern: "[Business], [greeting]. [offer]"
  return `${businessName}, guten Tag! Wie kann ich Ihnen behilflich sein?`;

  // Alternative more formal: "[Firma] [Name], Sie sprechen mit [AI-Name]."
  // For receptionist-style: "Firma [Name], guten Tag!"
};
```

### German Tool Response Messages
```typescript
// Localized responses for calendar tools
const GERMAN_TOOL_RESPONSES = {
  availableSlots: (date: string, slots: string[]) =>
    `Am ${date} habe ich folgende Zeiten verfügbar: ${slots.join(', ')}. Welche Zeit passt Ihnen am besten?`,

  noSlotsAvailable: (date: string) =>
    `Am ${date} sind leider keine Termine mehr frei. Möchten Sie einen anderen Tag versuchen?`,

  appointmentBooked: (date: string, time: string, name: string) =>
    `Ihr Termin am ${date} um ${time} ist eingetragen. Vielen Dank, ${name}!`,

  bookingError:
    'Den Termin konnte ich leider nicht eintragen. Dieser Zeitpunkt ist möglicherweise bereits belegt. Möchten Sie eine andere Zeit versuchen?',

  technicalError:
    'Es tut mir leid, ich habe momentan technische Schwierigkeiten.',
};
```
</code_examples>

<sota_updates>
## State of the Art (2024-2025)

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| moment.js + locales | Intl API + date-fns | 2020+ | Native browser support, smaller bundles |
| Hardcoded locale strings | Intl formatters | Ongoing | Better accuracy, automatic updates |

**New tools/patterns to consider:**
- **Intl.RelativeTimeFormat:** For "in 2 Tagen" / "vor 3 Stunden" style relative times
- **Intl.ListFormat:** For natural list formatting ("Montag, Dienstag und Mittwoch")

**Deprecated/outdated:**
- **moment.js:** Use date-fns or native Intl API
- **Manual locale handling:** Intl API handles regional variations automatically
</sota_updates>

<open_questions>
## Open Questions

1. **Regional German variations**
   - What we know: German spoken in Austria and Switzerland has slight variations
   - What's unclear: Does this matter for business calls?
   - Recommendation: Use standard German (de-DE). Regional variations (de-AT, de-CH) could be future enhancement

2. **Handling caller names in German context**
   - What we know: German uses "Herr/Frau" before surnames
   - What's unclear: Should agent use "Herr Schmidt" or just "Herr" or first name?
   - Recommendation: Use first name after caller provides it (more personal, less formal)
</open_questions>

<sources>
## Sources

### Primary (HIGH confidence)
- MDN Web Docs - Intl.DateTimeFormat documentation
- [German business phone etiquette guide](https://deinbusinessgerman.com/en/business-phone-call-in-german/)
- [Telling time in German - Berlitz](https://www.berlitz.com/blog/how-to-tell-time-german)

### Secondary (MEDIUM confidence)
- Wikipedia - Date and time notation in Europe (verified format patterns)
- [German business phrases - Leemeta](https://www.leemeta-translations.co.uk/blog/companies/business-german-phrases-you-actually-need)
- [Formal greetings in German](https://en.life-in-germany.de/guide-to-formal-greetings-in-german-business-etiquette/)

### Tertiary (LOW confidence - needs validation)
- None - all findings verified against authoritative sources
</sources>

<metadata>
## Metadata

**Research scope:**
- Core technology: German localization, Intl API
- Ecosystem: date-fns locale support
- Patterns: Prompt templates, spoken format conversion
- Pitfalls: Translation errors, formality inconsistency

**Confidence breakdown:**
- Standard stack: HIGH - native JS APIs, well-documented
- Architecture: HIGH - follows existing codebase patterns
- Pitfalls: HIGH - common localization mistakes documented
- Code examples: HIGH - verified against Intl API documentation

**Research date:** 2025-12-27
**Valid until:** 2026-01-27 (30 days - stable domain, no active changes)
</metadata>

---

*Phase: 08-german-prompts-localization*
*Research completed: 2025-12-27*
*Ready for planning: yes*
