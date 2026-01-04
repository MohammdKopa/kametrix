/**
 * System prompt builder for voice AI assistants
 *
 * Single source of truth for all system prompt generation.
 * Uses Vapi dynamic variables for real-time date/time:
 * https://docs.vapi.ai/assistants/dynamic-variables#advanced-date-and-time-usage
 *
 * Enhanced with:
 * - Context-aware business type detection
 * - Dynamic variable substitution
 * - Modular section-based templates
 * - Improved clarity and specificity
 */

import type { PromptConfig, GeneratedPrompt, BusinessType } from './types';
import { buildEnhancedPrompt } from './template-builder';
import { detectBusinessType } from './business-type-detector';

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
 * Build a complete system prompt for a voice AI assistant (Legacy API)
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
  // Use the enhanced prompt builder for improved context awareness
  const result = buildEnhancedPrompt(config);
  return result.prompt;
}

/**
 * Build a complete system prompt with full metadata (Enhanced API)
 *
 * Returns the prompt along with section details, variables used,
 * and generation metadata for debugging and analytics.
 *
 * @param config - Business configuration for the prompt
 * @returns Generated prompt with full metadata
 */
export function buildSystemPromptWithMetadata(config: PromptConfig): GeneratedPrompt {
  return buildEnhancedPrompt(config);
}

/**
 * Detect business type from configuration
 *
 * Utility function to detect the business type without building the full prompt.
 * Useful for UI display and conditional logic.
 *
 * @param config - Business configuration
 * @returns Detected business type
 */
export function getBusinessType(config: PromptConfig): BusinessType {
  return config.businessType || detectBusinessType(
    config.businessName,
    config.businessDescription,
    config.services
  );
}

/**
 * Validate prompt configuration
 *
 * Checks for common issues in the configuration that could
 * result in a suboptimal prompt.
 *
 * @param config - Business configuration to validate
 * @returns Array of warning messages (empty if valid)
 */
export function validatePromptConfig(config: PromptConfig): string[] {
  const warnings: string[] = [];

  if (!config.businessName.trim()) {
    warnings.push('Firmenname ist erforderlich');
  }

  if (!config.businessHours.trim()) {
    warnings.push('Oeffnungszeiten sollten angegeben werden');
  }

  if (config.services.length === 0) {
    warnings.push('Mindestens eine Dienstleistung sollte angegeben werden');
  }

  if (config.faqs.length === 0) {
    warnings.push('FAQs verbessern die Qualitaet der Antworten erheblich');
  }

  if (config.faqs.length > 0) {
    const emptyFaqs = config.faqs.filter(
      (faq) => !faq.question.trim() || !faq.answer.trim()
    );
    if (emptyFaqs.length > 0) {
      warnings.push(`${emptyFaqs.length} FAQ(s) haben leere Fragen oder Antworten`);
    }
  }

  if (config.hasGoogleCalendar && !config.businessHours.trim()) {
    warnings.push('Bei aktiviertem Kalender sind Oeffnungszeiten besonders wichtig');
  }

  return warnings;
}
