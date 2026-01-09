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
 * Build the date header section with Vapi dynamic variables (optimized)
 */
function buildDateHeaderSection(): PromptSection {
  return {
    id: SECTION_IDS.DATE_HEADER,
    title: 'AKTUELLES DATUM',
    content: `Heute: {{"now" | date: "%d.%m.%Y", "Europe/Berlin"}} ({{"now" | date: "%A", "Europe/Berlin"}}) {{"now" | date: "%H:%M", "Europe/Berlin"}} Uhr
Jahr: {{"now" | date: "%Y", "Europe/Berlin"}} - dieses Jahr fuer alle Termine verwenden!

WICHTIG - TOOL-DATUMSFORMAT:
IMMER im Format JJJJ-MM-TT (z.B. 2026-01-10) an Tools uebergeben!
NIEMALS DD-MM-YYYY verwenden - Tools akzeptieren nur YYYY-MM-DD!`,
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
 * Build escalation section with transfer instructions (optimized for token efficiency)
 */
function buildEscalationSection(): PromptSection {
  return {
    id: SECTION_IDS.ESCALATION,
    title: 'Weiterleitung an Mitarbeiter',
    content: `KERNREGEL: Bei Anfragen nach Mensch/Mitarbeiter/Person -> SOFORT escalate_to_human aufrufen (nicht check_availability!)

TOOLS:
- escalate_to_human(reason, summary): Weiterleitung an Menschen
- check_operator_availability: Mitarbeiter-Status pruefen

WANN WEITERLEITEN:
- Anfrage nach menschlichem Kontakt (z.B. "Mit Mitarbeiter sprechen", "Verbinden Sie mich")
- Nach 2 erfolglosen Klaerungsversuchen
- Bei Frustration/Beschwerden
- Bei komplexen Problemen

ABLAUF: "Einen Moment, ich verbinde Sie" -> escalate_to_human aufrufen mit Gespraechszusammenfassung`,
    priority: 95,
    enabled: true,
  };
}

/**
 * Build calendar functions section (optimized for token efficiency)
 */
function buildCalendarSection(): PromptSection {
  return {
    id: SECTION_IDS.CALENDAR,
    title: 'Kalender-Funktionen',
    content: `TOOLS: check_availability, check_conflicts, book_appointment, reschedule_appointment, cancel_appointment, list_appointments, search_appointments, find_next_available

BUCHUNGSABLAUF:
1. check_availability -> freie Zeiten nennen
2. Daten sammeln: Datum/Uhrzeit + Name (Pflicht), Tel/E-Mail (empfohlen)
3. Bestaetigung einholen -> book_appointment

DATUMSFORMAT FUER TOOLS:
IMMER YYYY-MM-DD (z.B. 2026-01-10) verwenden - NIEMALS DD-MM-YYYY!

ZEIT-REGELN:
- Aktuelles Jahr: {{"now" | date: "%Y", "Europe/Berlin"}} - niemals alte Jahre!
- Woechentage = naechster kommender Tag
- Deutsche Zeit: halb drei=14:30, viertel nach zehn=10:15, viertel vor elf=10:45

BEI KONFLIKTEN: Alternativen anbieten (check_conflicts liefert diese automatisch)

WICHTIG: Nur nach Bestaetigung buchen. Bei Aenderungen nach Name fragen.`,
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

  let content = 'NICHT behandeln: ' + context.avoidTopics.join(', ');
  content += '\nBei solchen Anfragen: Ablehnen und Rueckruf anbieten.';

  return {
    id: SECTION_IDS.BOUNDARIES,
    title: 'Grenzen',
    content,
    priority: 50,
    enabled: true,
  };
}

/**
 * Build style section with configurable tone (optimized for token efficiency)
 */
function buildStyleSection(config: PromptConfig, businessType: BusinessType): PromptSection {
  const context = getBusinessTypeContext(businessType);

  // Compact length guidance
  const lengthMap: Record<string, string> = {
    brief: '1-2 Saetze',
    detailed: '3-4 Saetze',
    default: '2-3 Saetze'
  };
  const lengthGuidance = lengthMap[config.responseLength || 'default'] || lengthMap.default;

  // Compact tone guidance
  const toneMap: Record<string, string> = {
    formal: 'sehr formell',
    friendly: 'herzlich-warmherzig'
  };
  const toneGuidance = toneMap[config.tone || ''] || context.suggestedTone;

  const content = `STIL: ${toneGuidance}, ${lengthGuidance}, Sie-Form, kein Markdown
BEI UNBEKANNTEM: Hoeflich ablehnen, Rueckruf anbieten (Name + Telefon erfragen)
SPRACHE: Korrekt, klar, ohne Fuellwoerter`;

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
