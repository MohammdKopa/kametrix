/**
 * Enhanced template builder for modular prompt construction
 *
 * Provides a flexible, section-based approach to building prompts
 * with dynamic content injection and context awareness.
 */

import type {
  PromptConfig,
  PromptSection,
  BusinessType,
  DynamicVariable,
} from './types';
import { detectBusinessType, getBusinessTypeContext, getBusinessTypeDisplayName } from './business-type-detector';
import { createVariableContext, interpolateVariables } from './variable-handler';

/**
 * Template section IDs for consistent referencing
 */
export const SECTION_IDS = {
  DATE_HEADER: 'date-header',
  IDENTITY: 'identity',
  CONTEXT: 'context',
  BUSINESS_INFO: 'business-info',
  CONTACT: 'contact',
  FAQ: 'faq',
  POLICIES: 'policies',
  CALENDAR: 'calendar',
  ESCALATION: 'escalation',
  RESPONSIBILITIES: 'responsibilities',
  BOUNDARIES: 'boundaries',
  STYLE: 'style',
  SPECIAL_INSTRUCTIONS: 'special-instructions',
} as const;

/**
 * Build the date header section with Vapi dynamic variables
 */
function buildDateHeaderSection(): PromptSection {
  return {
    id: SECTION_IDS.DATE_HEADER,
    title: 'AKTUELLES DATUM UND UHRZEIT',
    content: `Heute: {{"now" | date: "%d.%m.%Y", "Europe/Berlin"}} (ISO: {{"now" | date: "%Y-%m-%d", "Europe/Berlin"}})
Uhrzeit: {{"now" | date: "%H:%M", "Europe/Berlin"}} Uhr
Wochentag: {{"now" | date: "%A", "Europe/Berlin"}}
Jahr: {{"now" | date: "%Y", "Europe/Berlin"}}

WICHTIG - DATUMSREGELN:
- Das aktuelle Jahr ist {{"now" | date: "%Y", "Europe/Berlin"}} - NIEMALS 2023 oder 2024 verwenden!
- Wenn der Kunde "morgen" sagt, berechne das korrekte Datum basierend auf heute
- Wenn der Kunde "Montag" sagt, nimm den NAECHSTEN Montag (nicht vergangene)
- Uebergib Datumsangaben im Format JJJJ-MM-TT an die Tools`,
    priority: 100,
    enabled: true,
  };
}

/**
 * Build the identity section with enhanced context
 */
function buildIdentitySection(config: PromptConfig, businessType: BusinessType): PromptSection {
  const typeDisplayName = getBusinessTypeDisplayName(businessType);

  let content = `Sie sind der freundliche KI-Telefonassistent fuer {{businessName}}.`;

  if (config.businessDescription) {
    content += `\n\nUeber das Unternehmen:\n{{businessDescription}}`;
  }

  content += `\n\nBranche: ${typeDisplayName}`;

  return {
    id: SECTION_IDS.IDENTITY,
    title: 'Identity',
    content,
    priority: 90,
    enabled: true,
  };
}

/**
 * Build context awareness section based on business type
 */
function buildContextSection(businessType: BusinessType): PromptSection {
  const context = getBusinessTypeContext(businessType);

  let content = `Als KI-Assistent in dieser Branche bearbeiten Sie typischerweise Anfragen zu:\n`;
  content += context.typicalQueries.map((q) => `- ${q}`).join('\n');

  return {
    id: SECTION_IDS.CONTEXT,
    title: 'Kontext und Aufgaben',
    content,
    priority: 85,
    enabled: true,
  };
}

/**
 * Build business information section
 */
function buildBusinessInfoSection(config: PromptConfig): PromptSection {
  let content = `- Firmenname: {{businessName}}`;
  content += `\n- Oeffnungszeiten: {{businessHours}}`;

  if (config.services.length > 0) {
    content += `\n- Dienstleistungen:\n`;
    content += config.services.map((s) => `  * ${s}`).join('\n');
  }

  return {
    id: SECTION_IDS.BUSINESS_INFO,
    title: 'Geschaeftsinformationen',
    content,
    priority: 80,
    enabled: true,
  };
}

/**
 * Build contact information section
 */
function buildContactSection(config: PromptConfig): PromptSection {
  const lines: string[] = [];

  if (config.contactInfo?.phone) {
    lines.push(`- Telefon: {{phone}}`);
  }
  if (config.contactInfo?.email) {
    lines.push(`- E-Mail: {{email}}`);
  }
  if (config.contactInfo?.address) {
    lines.push(`- Adresse: {{address}}`);
  }
  if (config.contactInfo?.website) {
    lines.push(`- Website: {{website}}`);
  }

  return {
    id: SECTION_IDS.CONTACT,
    title: 'Kontaktinformationen',
    content: lines.length > 0 ? lines.join('\n') : 'Keine Kontaktdaten hinterlegt.',
    priority: 75,
    enabled: lines.length > 0,
  };
}

/**
 * Build FAQ section with improved formatting
 */
function buildFAQSection(config: PromptConfig): PromptSection {
  if (config.faqs.length === 0) {
    return {
      id: SECTION_IDS.FAQ,
      title: 'Haeufige Fragen',
      content: '',
      priority: 70,
      enabled: false,
    };
  }

  // Group FAQs by category if categories are present
  const categorizedFAQs = new Map<string, typeof config.faqs>();

  for (const faq of config.faqs) {
    const category = faq.category || 'Allgemein';
    if (!categorizedFAQs.has(category)) {
      categorizedFAQs.set(category, []);
    }
    categorizedFAQs.get(category)!.push(faq);
  }

  let content = '';

  if (categorizedFAQs.size === 1 && categorizedFAQs.has('Allgemein')) {
    // No categories, simple list
    content = config.faqs
      .map((faq) => `FRAGE: ${faq.question}\nANTWORT: ${faq.answer}`)
      .join('\n\n');
  } else {
    // With categories
    const categories = Array.from(categorizedFAQs.keys());
    for (const category of categories) {
      const faqs = categorizedFAQs.get(category)!;
      content += `\n--- ${category} ---\n`;
      content += faqs
        .map((faq) => `FRAGE: ${faq.question}\nANTWORT: ${faq.answer}`)
        .join('\n\n');
      content += '\n';
    }
  }

  return {
    id: SECTION_IDS.FAQ,
    title: 'Haeufige Fragen',
    content: content.trim(),
    priority: 70,
    enabled: true,
  };
}

/**
 * Build policies section
 */
function buildPoliciesSection(config: PromptConfig): PromptSection {
  return {
    id: SECTION_IDS.POLICIES,
    title: 'Richtlinien',
    content: config.policies || '',
    priority: 65,
    enabled: !!config.policies,
  };
}

/**
 * Build escalation section with transfer instructions
 */
function buildEscalationSection(): PromptSection {
  return {
    id: SECTION_IDS.ESCALATION,
    title: 'Weiterleitung an Mitarbeiter',
    content: `WICHTIGSTE REGEL - MENSCHLICHE MITARBEITER:
Wenn ein Anrufer nach einem MENSCHEN, MITARBEITER, PERSON oder echten AGENT fragt:
-> Rufe SOFORT das Tool "escalate_to_human" auf
-> NICHT "check_availability" - das ist nur fuer Kalendertermine!
-> KEINE Rueckfragen, KEINE Verzoegerung - SOFORT weiterleiten!

BEISPIEL-ANFRAGEN DIE SOFORTIGE WEITERLEITUNG ERFORDERN:
- "Kann ich mit einem Menschen sprechen" -> escalate_to_human aufrufen
- "Ich moechte mit einem Mitarbeiter reden" -> escalate_to_human aufrufen
- "Verbinden Sie mich bitte" -> escalate_to_human aufrufen
- "Einen echten Menschen bitte" -> escalate_to_human aufrufen
- "Human agent" / "Real person" -> escalate_to_human aufrufen

VERFUEGBARE TOOLS FUER WEITERLEITUNG:
1. escalate_to_human - NUTZE DIESES TOOL wenn jemand mit einem Menschen sprechen will
   Parameter: reason (Grund), summary (Zusammenfassung)
2. check_operator_availability - Prueft Mitarbeiter-Verfuegbarkeit (optional vor Weiterleitung)

TOOL-UNTERSCHEIDUNG:
- "Mensch", "Mitarbeiter", "Person", "verbinden" -> escalate_to_human
- "Termin", "buchen", "Kalender", "wann haben Sie Zeit" -> check_availability (Kalender-Tool)

ZUSAETZLICHE ESKALATIONS-GRUENDE:
- Du verstehst das Anliegen nicht (nach 2 Versuchen)
- Der Anrufer klingt frustriert oder veraergert
- Das Problem ist zu komplex fuer KI
- Der Anrufer beschwert sich wiederholt

WICHTIG:
- Frage NIEMALS zurueck wenn jemand einen Menschen verlangt
- Sage kurz "Einen Moment, ich verbinde Sie" und rufe DANN escalate_to_human auf
- Fasse im summary-Parameter das bisherige Gespraech zusammen`,
    priority: 95, // Higher priority so it appears earlier in the prompt
    enabled: true,
  };
}

/**
 * Build calendar functions section with enhanced instructions
 */
function buildCalendarSection(): PromptSection {
  return {
    id: SECTION_IDS.CALENDAR,
    title: 'Kalender-Funktionen',
    content: `VERFUEGBARE TOOLS:
- check_availability: Pruefen Sie die Kalenderverfuegbarkeit (unterstuetzt Tageszeit-Filter wie "morgens", "nachmittags")
- check_conflicts: Pruefen Sie ob ein gewuenschter Zeitpunkt frei ist (vor dem Buchen verwenden)
- book_appointment: Buchen Sie einen Termin (unterstuetzt mehrere Teilnehmer, wiederkehrende Termine)
- reschedule_appointment: Verschieben Sie einen bestehenden Termin
- cancel_appointment: Stornieren Sie einen Termin
- list_appointments: Zeigen Sie Termine in einem Zeitraum an
- search_appointments: Suchen Sie nach spezifischen Terminen
- find_next_available: Finden Sie den naechsten freien Termin

BUCHUNGSPROZESS:
1. Bei Terminwunsch: Zuerst Verfuegbarkeit pruefen (check_availability)
2. Freie Zeiten dem Anrufer nennen und Praeferenz erfragen
3. Folgende Daten sammeln:
   - Datum und Uhrzeit (ERFORDERLICH)
   - Vollstaendiger Name (ERFORDERLICH)
   - Telefonnummer (empfohlen fuer Rueckruf)
   - E-Mail-Adresse (fuer Kalendereinladung)
   - Termingrund/Betreff (optional)
4. Details zusammenfassen: "Sie moechten also am [Datum] um [Uhrzeit] einen Termin? Ist das korrekt?"
5. Nach Bestaetigung: Termin buchen (book_appointment)
6. Buchungsbestaetigung mit allen Details geben

DATUMSVERARBEITUNG:
- Relative Begriffe IMMER verwenden: "morgen", "uebermorgen", "naechsten Montag", "Freitag"
- Bei Woechentagen: Den NAECHSTEN kommenden Tag nehmen
- "Diese Woche" = ab heute, "Naechste Woche" = ab Montag
- NIE alte Jahre wie 2023 oder 2024 verwenden - aktuelles Jahr beachten!

ZEITVERARBEITUNG (Deutsche Ausdruecke):
- "halb drei" = 14:30 Uhr (NICHT 14:00!)
- "viertel nach zehn" = 10:15 Uhr
- "viertel vor elf" = 10:45 Uhr
- "3 Uhr nachmittags" = 15:00 Uhr
- Bei unklaren Zeiten: "Meinen Sie vormittags oder nachmittags?"

KONFLIKTBEHANDLUNG:
- Wenn gewuenschte Zeit belegt: Alternative Zeiten anbieten
- check_conflicts gibt automatisch Alternativen zurueck
- Nicht aufgeben - immer Alternativen vorschlagen

WICHTIGE REGELN:
- NIEMALS ohne explizite Bestaetigung des Anrufers buchen
- Bei Aenderungen/Stornierungen: Nach dem Namen fragen um Termin zu finden
- Bei mehreren Terminen: Datum zur Identifikation nutzen
- Freundlich bleiben auch bei Fehlern - Loesungen anbieten`,
    priority: 60,
    enabled: true,
  };
}

/**
 * Build responsibilities section based on business type
 */
function buildResponsibilitiesSection(businessType: BusinessType): PromptSection {
  const context = getBusinessTypeContext(businessType);

  let content = 'Ihre Hauptaufgaben:\n';
  content += context.keyResponsibilities.map((r) => `- ${r}`).join('\n');

  return {
    id: SECTION_IDS.RESPONSIBILITIES,
    title: 'Aufgabenbereich',
    content,
    priority: 55,
    enabled: true,
  };
}

/**
 * Build boundaries section for topics to avoid
 */
function buildBoundariesSection(businessType: BusinessType): PromptSection {
  const context = getBusinessTypeContext(businessType);

  if (context.avoidTopics.length === 0) {
    return {
      id: SECTION_IDS.BOUNDARIES,
      title: 'Grenzen',
      content: '',
      priority: 50,
      enabled: false,
    };
  }

  let content = 'Folgende Themen sollten Sie NICHT behandeln:\n';
  content += context.avoidTopics.map((t) => `- ${t}`).join('\n');
  content += '\n\nBei solchen Anfragen: Hoeflich erklaeren, dass Sie dafuer nicht zustaendig sind und anbieten, einen Rueckruf zu organisieren.';

  return {
    id: SECTION_IDS.BOUNDARIES,
    title: 'Grenzen',
    content,
    priority: 50,
    enabled: true,
  };
}

/**
 * Build style section with configurable tone
 */
function buildStyleSection(config: PromptConfig, businessType: BusinessType): PromptSection {
  const context = getBusinessTypeContext(businessType);

  // Determine response length guidance
  let lengthGuidance = 'Halten Sie Antworten kurz (max 2-3 Saetze)';
  if (config.responseLength === 'brief') {
    lengthGuidance = 'Halten Sie Antworten sehr kurz (max 1-2 Saetze)';
  } else if (config.responseLength === 'detailed') {
    lengthGuidance = 'Geben Sie ausfuehrliche Antworten wenn noetig (3-4 Saetze)';
  }

  // Determine tone guidance
  let toneGuidance = context.suggestedTone;
  if (config.tone === 'formal') {
    toneGuidance = 'Sehr formell und geschaeftsmaessig';
  } else if (config.tone === 'friendly') {
    toneGuidance = 'Besonders herzlich und warmherzig';
  }

  const content = `KOMMUNIKATIONSSTIL:
- Tonfall: ${toneGuidance}
- Sprechen Sie Anrufer IMMER mit "Sie" an (formell)
- Seien Sie freundlich, professionell und praezise
- ${lengthGuidance}
- Natuerlich fuer Telefongespraeche sprechen
- Keine Markdown-Formatierung verwenden

REAKTION AUF UNBEKANNTES:
- Bei Fragen, die Sie nicht beantworten koennen, sagen Sie hoeflich, dass Sie die Information nicht haben
- Bieten Sie an, einen Rueckruf durch einen Mitarbeiter zu organisieren
- Erfragen Sie dafuer Name und Rueckrufnummer

SPRACHLICHE QUALITAET:
- Verwenden Sie korrekte deutsche Grammatik
- Vermeiden Sie Fuellwoerter und Wiederholungen
- Sprechen Sie klar und deutlich`;

  return {
    id: SECTION_IDS.STYLE,
    title: 'Kommunikationsstil',
    content,
    priority: 40,
    enabled: true,
  };
}

/**
 * Build special instructions section
 */
function buildSpecialInstructionsSection(config: PromptConfig): PromptSection {
  return {
    id: SECTION_IDS.SPECIAL_INSTRUCTIONS,
    title: 'Besondere Anweisungen',
    content: config.specialInstructions || '',
    priority: 30,
    enabled: !!config.specialInstructions,
  };
}

/**
 * Build all prompt sections based on configuration
 */
export function buildPromptSections(config: PromptConfig): PromptSection[] {
  // Detect business type if not provided
  const businessType =
    config.businessType ||
    detectBusinessType(config.businessName, config.businessDescription, config.services);

  const sections: PromptSection[] = [];

  // Add date header for calendar-enabled agents
  if (config.hasGoogleCalendar) {
    sections.push(buildDateHeaderSection());
  }

  // Core sections
  sections.push(buildIdentitySection(config, businessType));
  sections.push(buildContextSection(businessType));
  sections.push(buildBusinessInfoSection(config));
  sections.push(buildContactSection(config));
  sections.push(buildFAQSection(config));
  sections.push(buildPoliciesSection(config));

  // Calendar section
  if (config.hasGoogleCalendar) {
    sections.push(buildCalendarSection());
  }

  // Escalation section (always included for call forwarding capability)
  if (config.hasEscalation !== false) {
    sections.push(buildEscalationSection());
  }

  // Behavioral sections
  sections.push(buildResponsibilitiesSection(businessType));
  sections.push(buildBoundariesSection(businessType));
  sections.push(buildStyleSection(config, businessType));

  // Special instructions
  if (config.specialInstructions) {
    sections.push(buildSpecialInstructionsSection(config));
  }

  // Sort by priority (highest first) and filter enabled sections
  return sections
    .filter((section) => section.enabled)
    .sort((a, b) => b.priority - a.priority);
}

/**
 * Render all sections into a complete prompt string
 */
export function renderSections(
  sections: PromptSection[],
  variables: Map<string, DynamicVariable>
): string {
  const renderedParts: string[] = [];

  for (const section of sections) {
    const interpolatedContent = interpolateVariables(section.content, variables);

    if (interpolatedContent.trim()) {
      renderedParts.push(`[${section.title}]`);
      renderedParts.push(interpolatedContent);
      renderedParts.push('');
    }
  }

  return renderedParts.join('\n').trim();
}

/**
 * Build a complete prompt from configuration
 *
 * This is the main entry point for enhanced prompt generation.
 */
export function buildEnhancedPrompt(config: PromptConfig): {
  prompt: string;
  sections: PromptSection[];
  variables: DynamicVariable[];
  metadata: {
    businessType: BusinessType;
    totalLength: number;
    sectionCount: number;
    generatedAt: string;
  };
} {
  // Detect business type
  const businessType =
    config.businessType ||
    detectBusinessType(config.businessName, config.businessDescription, config.services);

  // Build sections
  const sections = buildPromptSections(config);

  // Create variable context
  const variableContext = createVariableContext(config);
  const variables = Array.from(variableContext.values());

  // Render the prompt
  const prompt = renderSections(sections, variableContext);

  return {
    prompt,
    sections,
    variables,
    metadata: {
      businessType,
      totalLength: prompt.length,
      sectionCount: sections.length,
      generatedAt: new Date().toISOString(),
    },
  };
}
