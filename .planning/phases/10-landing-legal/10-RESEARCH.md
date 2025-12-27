# Phase 10: Landing & Legal Pages - Research

**Researched:** 2025-12-27
**Domain:** German legal compliance (Impressum, Datenschutz, AGB) + GDPR cookie consent
**Confidence:** HIGH

<research_summary>
## Summary

Researched German website legal requirements for a voice AI SaaS platform targeting the German market. The primary requirements are Impressum (legal notice), Datenschutzerklärung (privacy policy), and cookie consent - AGB (terms) are optional but recommended.

Key finding: German legal compliance is well-documented with clear mandatory fields. The primary complexity is in the Datenschutzerklärung which must disclose voice AI data processing (call recordings, transcripts, Vapi integration). For cookie consent, use vanilla-cookieconsent (orestbida) - a lightweight, GDPR-compliant library with excellent React/Next.js support.

**Primary recommendation:** Create static legal pages with all mandatory fields, use vanilla-cookieconsent v3.1.0 for cookie consent, and ensure Datenschutzerklärung specifically addresses voice AI data processing with Vapi as data processor.
</research_summary>

<standard_stack>
## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vanilla-cookieconsent | 3.1.0 | GDPR cookie consent banner | Lightweight, a11y-compliant, 2B+ monthly impressions, MIT license |
| Next.js static pages | - | Legal pages (Impressum, Datenschutz, AGB) | Already in stack, static export for performance |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| js-cookie | 3.0.5 | Cookie reading/writing | If need programmatic cookie access beyond consent |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| vanilla-cookieconsent | Osano/cookieconsent | Osano is older, less maintained; vanilla is the modernized fork |
| vanilla-cookieconsent | Klaro/Orejime | More complex, heavier; vanilla is simpler for basic needs |
| Static legal pages | CMS-managed | Overkill for rarely-changing legal content |

**Installation:**
```bash
npm install vanilla-cookieconsent@3.1.0
```
</standard_stack>

<architecture_patterns>
## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── (marketing)/           # Public marketing pages
│   │   ├── page.tsx           # Landing page
│   │   ├── impressum/
│   │   │   └── page.tsx       # Impressum (legal notice)
│   │   ├── datenschutz/
│   │   │   └── page.tsx       # Privacy policy
│   │   ├── agb/
│   │   │   └── page.tsx       # Terms and conditions
│   │   └── layout.tsx         # Marketing layout (no auth)
│   └── ...
├── components/
│   ├── cookie-consent/
│   │   ├── CookieConsent.tsx  # Cookie consent wrapper
│   │   └── config.ts          # German consent configuration
│   └── marketing/
│       ├── Hero.tsx
│       ├── Features.tsx
│       └── ...
└── lib/
    └── cookies.ts             # Cookie utility functions
```

### Pattern 1: Cookie Consent in Root Layout
**What:** Initialize cookie consent at app root level, before any tracking scripts
**When to use:** Always - consent must be obtained before setting non-essential cookies
**Example:**
```tsx
// src/components/cookie-consent/CookieConsent.tsx
"use client";

import { useEffect } from "react";
import "vanilla-cookieconsent/dist/cookieconsent.css";
import * as CookieConsent from "vanilla-cookieconsent";
import { cookieConsentConfig } from "./config";

export function CookieConsentBanner() {
  useEffect(() => {
    CookieConsent.run(cookieConsentConfig);
  }, []);

  return null; // UI is rendered by the library
}
```

### Pattern 2: German Cookie Consent Configuration
**What:** Configure consent with German text and GDPR-compliant categories
**When to use:** For German market compliance
**Example:**
```tsx
// src/components/cookie-consent/config.ts
import type { CookieConsentConfig } from "vanilla-cookieconsent";

export const cookieConsentConfig: CookieConsentConfig = {
  guiOptions: {
    consentModal: {
      layout: "box",
      position: "bottom left",
      equalWeightButtons: true, // GDPR: Accept/Reject equally prominent
    },
  },
  categories: {
    necessary: {
      enabled: true,
      readOnly: true, // Cannot be disabled
    },
    analytics: {
      autoClear: {
        cookies: [{ name: /^_ga/ }, { name: "_gid" }],
      },
    },
  },
  language: {
    default: "de",
    translations: {
      de: {
        consentModal: {
          title: "Wir verwenden Cookies",
          description: "Wir nutzen Cookies, um Ihre Erfahrung zu verbessern und unsere Website zu analysieren. Sie können Ihre Einstellungen jederzeit ändern.",
          acceptAllBtn: "Alle akzeptieren",
          acceptNecessaryBtn: "Nur notwendige",
          showPreferencesBtn: "Einstellungen verwalten",
          footer: `
            <a href="/impressum">Impressum</a>
            <a href="/datenschutz">Datenschutz</a>
          `,
        },
        preferencesModal: {
          title: "Cookie-Einstellungen",
          acceptAllBtn: "Alle akzeptieren",
          acceptNecessaryBtn: "Nur notwendige",
          savePreferencesBtn: "Auswahl speichern",
          closeIconLabel: "Schließen",
          sections: [
            {
              title: "Ihre Privatsphäre",
              description: "Hier können Sie Ihre Cookie-Einstellungen verwalten.",
            },
            {
              title: "Notwendige Cookies",
              description: "Diese Cookies sind für die Grundfunktionen der Website erforderlich und können nicht deaktiviert werden.",
              linkedCategory: "necessary",
            },
            {
              title: "Analyse-Cookies",
              description: "Diese Cookies helfen uns zu verstehen, wie Besucher unsere Website nutzen.",
              linkedCategory: "analytics",
            },
          ],
        },
      },
    },
  },
};
```

### Pattern 3: Static Legal Page Structure
**What:** Consistent structure for legal pages with proper headings and sections
**When to use:** All legal pages
**Example:**
```tsx
// src/app/(marketing)/impressum/page.tsx
export const metadata = {
  title: "Impressum | Kametrix",
  robots: "noindex", // Hide from search engines (optional)
};

export default function ImpressumPage() {
  return (
    <div className="prose prose-invert max-w-3xl mx-auto py-16 px-4">
      <h1>Impressum</h1>
      <p>Angaben gemäß § 5 DDG</p>

      <h2>Anbieter</h2>
      <p>
        [Firmenname] [Rechtsform]<br />
        [Straße Hausnummer]<br />
        [PLZ Stadt]<br />
        Deutschland
      </p>

      <h2>Kontakt</h2>
      <p>
        E-Mail: <a href="mailto:info@kametrix.de">info@kametrix.de</a><br />
        Telefon: [optional]
      </p>

      <h2>Vertretungsberechtigte</h2>
      <p>Geschäftsführer: [Name]</p>

      <h2>Registereintrag</h2>
      <p>
        Handelsregister: [Amtsgericht Stadt]<br />
        Registernummer: HRB [Nummer]
      </p>

      <h2>Umsatzsteuer-ID</h2>
      <p>
        Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG:<br />
        DE [Nummer]
      </p>

      <h2>Verantwortlich für den Inhalt</h2>
      <p>
        [Name]<br />
        [Adresse]
      </p>
    </div>
  );
}
```

### Anti-Patterns to Avoid
- **Pre-ticked consent boxes:** GDPR explicitly prohibits this
- **Cookie wall:** Blocking content until cookies accepted is not compliant
- **Hidden reject button:** Accept and Reject must be equally prominent
- **PO Box in Impressum:** Physical address is mandatory
- **Missing legal form:** Company name must include GmbH, UG, etc.
- **Generic privacy policy:** Must reflect actual data processing activities
</architecture_patterns>

<dont_hand_roll>
## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cookie consent UI | Custom modal with localStorage | vanilla-cookieconsent | Handles consent state, script blocking, GDPR requirements |
| Consent persistence | Manual cookie management | vanilla-cookieconsent | Automatic cookie handling with proper expiry |
| Script blocking | Conditional rendering | vanilla-cookieconsent autoClear | Library handles blocking/unblocking automatically |
| Legal text structure | Custom markdown | Prose/Typography CSS | Consistent, accessible formatting |
| Cookie banner styling | CSS from scratch | vanilla-cookieconsent themes | Pre-built, accessible, customizable |

**Key insight:** Cookie consent has strict legal requirements (equal button prominence, prior consent, easy withdrawal). vanilla-cookieconsent handles these edge cases correctly - custom implementations frequently miss requirements that lead to GDPR violations.
</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: Incomplete Impressum
**What goes wrong:** Missing mandatory fields leads to Abmahnung (cease and desist)
**Why it happens:** Assuming contact page is sufficient, not knowing all requirements
**How to avoid:** Use complete checklist: Name, legal form, full address (no PO box), email, VAT-ID/W-IdNr, registry number, managing directors
**Warning signs:** Using "Contact Us" instead of "Impressum", PO box in address

### Pitfall 2: Generic Privacy Policy
**What goes wrong:** Policy doesn't reflect actual data processing, violates DSGVO Art. 13
**Why it happens:** Using templates without customization for voice AI specifics
**How to avoid:** Document actual data flows: Vapi call recordings, transcripts, Google Calendar integration, Stripe payments
**Warning signs:** No mention of voice data, call recordings, or AI processing

### Pitfall 3: Cookie Consent Dark Patterns
**What goes wrong:** German courts have specifically ruled against manipulative consent designs
**Why it happens:** Making "Accept" more prominent or hiding "Reject" option
**How to avoid:** Use equalWeightButtons: true, same visual prominence for accept/reject
**Warning signs:** Colored Accept button with gray Reject, Reject requires extra clicks

### Pitfall 4: Wrong Legal References
**What goes wrong:** Citing TMG/TTDSG instead of DDG/TDDDG (changed May 2024)
**Why it happens:** Using outdated templates or not updating after law change
**How to avoid:** Reference "§ 5 DDG" for Impressum, "TDDDG" for cookies (not TMG/TTDSG)
**Warning signs:** "gemäß § 5 TMG" in Impressum text

### Pitfall 5: Missing Voice AI Data Disclosure
**What goes wrong:** Not disclosing that call recordings and voice data are processed
**Why it happens:** Voice AI data processing is unique, templates don't cover it
**How to avoid:** Add specific section: "Sprachdatenverarbeitung" covering Vapi as processor, recording storage, transcript handling
**Warning signs:** Privacy policy reads like standard SaaS with no voice/AI mentions
</common_pitfalls>

<code_examples>
## Code Examples

### Impressum Mandatory Fields (Complete)
```tsx
// Source: § 5 DDG, verified with AllAboutBerlin.com
// All fields below are MANDATORY for commercial websites

<h1>Impressum</h1>
<p>Angaben gemäß § 5 DDG</p>

{/* 1. Provider name with legal form */}
<h2>Anbieter</h2>
<p>
  Kametrix GmbH {/* or UG (haftungsbeschränkt), etc. */}
  Musterstraße 123
  12345 Berlin
  Deutschland
</p>

{/* 2. Contact - Email mandatory, phone optional */}
<h2>Kontakt</h2>
<p>
  E-Mail: info@kametrix.de
  {/* Phone optional if rapid electronic contact exists */}
</p>

{/* 3. Legal representatives */}
<h2>Vertreten durch</h2>
<p>Geschäftsführer: Max Mustermann</p>

{/* 4. Registry entry (if registered) */}
<h2>Registereintrag</h2>
<p>
  Eingetragen im Handelsregister.
  Registergericht: Amtsgericht Berlin-Charlottenburg
  Registernummer: HRB 123456
</p>

{/* 5. VAT ID */}
<h2>Umsatzsteuer-ID</h2>
<p>
  Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG:
  DE123456789
</p>

{/* 6. Content responsibility (same as provider for small companies) */}
<h2>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
<p>
  Max Mustermann
  Musterstraße 123
  12345 Berlin
</p>
```

### Datenschutzerklärung Voice AI Section
```tsx
// Source: GDPR Art. 13/14, Voice AI compliance research
// MUST include for voice AI platforms

<h2>Verarbeitung von Sprachdaten</h2>

<h3>Telefonate und Sprachaufzeichnungen</h3>
<p>
  Wenn Sie mit unserem KI-Telefonassistenten sprechen, werden
  Ihre Gespräche aufgezeichnet und verarbeitet. Dies umfasst:
</p>
<ul>
  <li>Sprachaufnahmen der Telefonate</li>
  <li>Transkriptionen (Text-Umwandlung) der Gespräche</li>
  <li>Telefonnummer des Anrufers</li>
  <li>Datum, Uhrzeit und Dauer des Anrufs</li>
</ul>

<h3>Zweck der Verarbeitung</h3>
<p>
  Die Datenverarbeitung erfolgt zur Erbringung unseres
  Dienstleistung (Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO)
  sowie zur Qualitätssicherung und Verbesserung unserer KI-Systeme
  (berechtigtes Interesse, Art. 6 Abs. 1 lit. f DSGVO).
</p>

<h3>Auftragsverarbeiter</h3>
<p>
  Wir setzen folgende Dienstleister als Auftragsverarbeiter ein:
</p>
<ul>
  <li>
    <strong>Vapi Inc.</strong> (USA) - Betrieb der KI-Telefonassistenten
    <br />
    Datenschutzinformationen: https://vapi.ai/privacy
  </li>
  <li>
    <strong>Google LLC</strong> (USA) - Kalenderintegration
    <br />
    Datenschutzinformationen: https://policies.google.com/privacy
  </li>
</ul>

<h3>Datenübermittlung in Drittländer</h3>
<p>
  Die oben genannten Dienstleister haben ihren Sitz in den USA.
  Die Übermittlung erfolgt auf Grundlage von
  Standardvertragsklauseln (Art. 46 Abs. 2 lit. c DSGVO).
</p>

<h3>Speicherdauer</h3>
<p>
  Sprachaufnahmen und Transkripte werden für [X] Tage gespeichert,
  sofern keine längere Aufbewahrung gesetzlich erforderlich ist
  oder Sie einer längeren Speicherung zugestimmt haben.
</p>
```

### Cookie Consent Integration in Layout
```tsx
// Source: vanilla-cookieconsent docs
// Place in root layout to ensure consent before any tracking

// src/app/layout.tsx
import { CookieConsentBanner } from "@/components/cookie-consent/CookieConsent";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body>
        {children}
        <CookieConsentBanner />
      </body>
    </html>
  );
}
```

### Conditional Analytics Loading
```tsx
// Source: vanilla-cookieconsent + Next.js patterns
// Only load Google Analytics after consent

// src/components/Analytics.tsx
"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import * as CookieConsent from "vanilla-cookieconsent";

export function Analytics() {
  const [hasConsent, setHasConsent] = useState(false);

  useEffect(() => {
    // Check if analytics category is accepted
    setHasConsent(CookieConsent.acceptedCategory("analytics"));

    // Listen for consent changes
    const handleConsentChange = () => {
      setHasConsent(CookieConsent.acceptedCategory("analytics"));
    };

    window.addEventListener("cc:onConsent", handleConsentChange);
    window.addEventListener("cc:onChange", handleConsentChange);

    return () => {
      window.removeEventListener("cc:onConsent", handleConsentChange);
      window.removeEventListener("cc:onChange", handleConsentChange);
    };
  }, []);

  if (!hasConsent) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
        strategy="lazyOnload"
      />
      <Script id="google-analytics" strategy="lazyOnload">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
        `}
      </Script>
    </>
  );
}
```
</code_examples>

<sota_updates>
## State of the Art (2024-2025)

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| TMG § 5 for Impressum | DDG § 5 for Impressum | May 2024 | Must update legal references |
| TTDSG for cookies | TDDDG for cookies | May 2024 | Must update legal references |
| VAT ID only | VAT ID or W-IdNr | Nov 2024 | New Business ID being rolled out |
| osano/cookieconsent | vanilla-cookieconsent | 2023+ | vanilla is the modernized fork |

**New tools/patterns to consider:**
- **vanilla-cookieconsent v3.x:** Major rewrite with better TypeScript support, React integration
- **Next.js App Router:** Use client components for cookie consent, avoid hydration issues
- **W-IdNr (Wirtschafts-Identifikationsnummer):** New German business ID, will eventually replace VAT ID requirement

**Deprecated/outdated:**
- **TMG (Telemediengesetz):** Replaced by DDG as of May 2024
- **TTDSG:** Renamed to TDDDG (Telekommunikation-Digitale-Dienste-Datenschutz-Gesetz)
- **osano/cookieconsent original:** Use orestbida/vanilla-cookieconsent instead
</sota_updates>

<open_questions>
## Open Questions

1. **Exact company details for Impressum**
   - What we know: Structure and required fields are documented
   - What's unclear: Actual company name, address, registry number, VAT ID
   - Recommendation: User must provide actual company details during implementation

2. **Data retention periods**
   - What we know: Must specify in Datenschutzerklärung
   - What's unclear: How long Vapi retains call recordings, Kametrix's policy
   - Recommendation: Check Vapi's data retention, define Kametrix retention policy

3. **AGB necessity**
   - What we know: AGB are not legally mandatory
   - What's unclear: Whether specific voice AI terms are needed
   - Recommendation: Start without AGB, add if legal counsel advises
</open_questions>

<sources>
## Sources

### Primary (HIGH confidence)
- [/orestbida/cookieconsent](https://github.com/orestbida/cookieconsent) - React integration, configuration reference
- [All About Berlin - Website Compliance](https://allaboutberlin.com/guides/website-compliance-germany) - Comprehensive German requirements
- [IONOS - Impressum Requirements](https://www.ionos.com/digitalguide/websites/digital-law/a-case-for-thinking-global-germanys-impressum-laws/) - 2025 mandatory fields

### Secondary (MEDIUM confidence)
- [e-recht24 - Datenschutzerklärung](https://www.e-recht24.de/muster-datenschutzerklaerung.html) - Privacy policy generator reference
- [MTH Partner - DDG Impressum](https://www.mth-partner.de/en/internet-law-imprint-obligation-according-to-the-german-gdpr-create-a-legally-compliant-imprint/) - DDG § 5 requirements
- [VoiceAIWrapper GDPR](https://voiceaiwrapper.com/legal/gdpr) - Voice AI GDPR patterns
- [Fluents.ai Compliance](https://www.fluents.ai/article/regulatory-compliance-for-voice-ai-navigating-tcpa-gdpr-and-hipaa) - Voice AI regulatory overview

### Tertiary (LOW confidence - needs validation)
- Cookie consent equal button prominence rulings - German court decisions referenced but specific cases not verified
</sources>

<metadata>
## Metadata

**Research scope:**
- Core technology: German legal compliance (Impressum, Datenschutz, AGB, Cookie Consent)
- Ecosystem: vanilla-cookieconsent, DSGVO/GDPR, DDG/TDDDG
- Patterns: Static legal pages, cookie consent integration, voice AI privacy disclosure
- Pitfalls: Incomplete Impressum, generic privacy policy, dark patterns, wrong legal references

**Confidence breakdown:**
- Standard stack: HIGH - vanilla-cookieconsent is well-documented, widely used
- Architecture: HIGH - Static pages with consent banner is standard pattern
- Pitfalls: HIGH - German legal requirements are well-documented
- Code examples: HIGH - From official Context7 docs and verified sources

**Research date:** 2025-12-27
**Valid until:** 2026-01-27 (30 days - legal requirements stable but check for court rulings)
</metadata>

---

*Phase: 10-landing-legal*
*Research completed: 2025-12-27*
*Ready for planning: yes*
