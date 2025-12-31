/**
 * System prompt builder for voice AI assistants
 *
 * Single source of truth for all system prompt generation.
 * Uses Vapi dynamic variables for real-time date/time:
 * https://docs.vapi.ai/assistants/dynamic-variables#advanced-date-and-time-usage
 */

import type { PromptConfig } from './types';

/**
 * Build the date header with Vapi dynamic variables
 *
 * These variables are substituted by Vapi at call time, ensuring
 * the AI always knows the current date when booking appointments.
 */
export function buildDateHeader(): string {
  return `[AKTUELLES DATUM UND UHRZEIT]
Heute: {{"now" | date: "%d.%m.%Y", "Europe/Berlin"}} (ISO: {{"now" | date: "%Y-%m-%d", "Europe/Berlin"}})
Uhrzeit: {{"now" | date: "%H:%M", "Europe/Berlin"}} Uhr
Wochentag: {{"now" | date: "%A", "Europe/Berlin"}}
Jahr: {{"now" | date: "%Y", "Europe/Berlin"}}

WICHTIG - DATUMSREGELN:
- Das aktuelle Jahr ist {{"now" | date: "%Y", "Europe/Berlin"}} - NIEMALS 2023 oder 2024 verwenden!
- Wenn der Kunde "morgen" sagt, berechne das korrekte Datum basierend auf heute
- Wenn der Kunde "Montag" sagt, nimm den NAECHSTEN Montag (nicht vergangene)
- Uebergib Datumsangaben im Format JJJJ-MM-TT an die Tools

`;
}

/**
 * Build a complete system prompt for a voice AI assistant
 *
 * Uses section-based structure for LLM parsing clarity:
 * - [AKTUELLES DATUM...] - Date header (calendar-enabled only)
 * - [Identity] - Who the assistant is
 * - [Geschaeftsinformationen] - Business details
 * - [Haeufige Fragen] - FAQ section (if any)
 * - [Kalender-Funktionen] - Calendar tools (if enabled)
 * - [Style] - Voice-optimized response guidelines
 *
 * All content is in German Sie-form for professional business communication.
 *
 * @param config - Business configuration for the prompt
 * @returns Complete system prompt string
 */
export function buildSystemPrompt(config: PromptConfig): string {
  const sections: string[] = [];

  // Date header (only for calendar-enabled agents)
  if (config.hasGoogleCalendar) {
    sections.push(buildDateHeader());
  }

  // Identity section
  sections.push('[Identity]');
  sections.push(`Sie sind der KI-Assistent fuer ${config.businessName}.`);
  if (config.businessDescription) {
    sections.push(config.businessDescription);
  }

  // Business info section
  sections.push('');
  sections.push('[Geschaeftsinformationen]');
  sections.push(`- Firmenname: ${config.businessName}`);
  sections.push(`- Oeffnungszeiten: ${config.businessHours}`);
  if (config.services.length > 0) {
    sections.push(`- Dienstleistungen: ${config.services.join(', ')}`);
  }

  // FAQ section (conditional)
  if (config.faqs.length > 0) {
    sections.push('');
    sections.push('[Haeufige Fragen]');
    config.faqs.forEach((faq) => {
      sections.push(`F: ${faq.question}`);
      sections.push(`A: ${faq.answer}`);
    });
  }

  // Policies section (conditional)
  if (config.policies) {
    sections.push('');
    sections.push('[Richtlinien]');
    sections.push(config.policies);
  }

  // Calendar section (conditional)
  if (config.hasGoogleCalendar) {
    sections.push('');
    sections.push('[Kalender-Funktionen]');
    sections.push('- Verfuegbarkeit pruefen mit check_availability');
    sections.push('- Termine buchen mit book_appointment');
    sections.push(
      '- Bei Buchungen erfragen: Datum, Uhrzeit, Name (erforderlich), Telefon (optional), E-Mail (optional)'
    );
    sections.push('- Details vor Buchung bestaetigen');
    sections.push('- Relative Datumsangaben (morgen, naechsten Montag) anhand des aktuellen Datums berechnen');
  }

  // Style section - voice-optimized guidelines
  sections.push('');
  sections.push('[Style]');
  sections.push('- Sprechen Sie Anrufer IMMER mit "Sie" an (formell)');
  sections.push('- Seien Sie freundlich, professionell und praezise');
  sections.push('- Halten Sie Antworten kurz (max 2-3 Saetze)');
  sections.push('- Natuerlich fuer Telefongespraeche sprechen');
  sections.push('- Keine Markdown-Formatierung verwenden');
  sections.push('- Wenn Sie etwas nicht wissen, sagen Sie hoeflich, dass sich jemand melden wird');

  return sections.join('\n');
}
