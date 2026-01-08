/**
 * Escalation Detector
 *
 * Analyzes conversation context to determine if a call should be
 * escalated to a human operator.
 */

import type { EscalationReason } from '@/generated/prisma/client';
import type { EscalationTriggerResult } from '@/types/escalation';
import { DEFAULT_TRIGGER_PHRASES } from '@/types/escalation';

/**
 * Configuration for the escalation detector
 */
export interface DetectorConfig {
  maxClarifications: number;
  maxCallDuration: number;
  sentimentThreshold: number;
  triggerPhrases: string[];
}

/**
 * Context for evaluating escalation triggers
 */
export interface ConversationContext {
  transcript?: string;
  lastUserMessage?: string;
  clarificationCount: number;
  callDurationSeconds: number;
  sentimentScore?: number;
  sentiment?: string;
  unrecognizedIntentCount?: number;
}

/**
 * Normalizes text for comparison (lowercase, remove special chars)
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[äÄ]/g, 'ae')
    .replace(/[öÖ]/g, 'oe')
    .replace(/[üÜ]/g, 'ue')
    .replace(/[ß]/g, 'ss')
    .replace(/[^\w\s]/g, '')
    .trim();
}

/**
 * EscalationDetector class
 *
 * Analyzes conversation context and determines if escalation is needed.
 */
export class EscalationDetector {
  private config: DetectorConfig;
  private triggerPhrasesNormalized: string[];

  constructor(config: Partial<DetectorConfig> = {}) {
    this.config = {
      maxClarifications: config.maxClarifications ?? 3,
      maxCallDuration: config.maxCallDuration ?? 300,
      sentimentThreshold: config.sentimentThreshold ?? -0.5,
      triggerPhrases: config.triggerPhrases ?? [...DEFAULT_TRIGGER_PHRASES],
    };

    // Pre-normalize trigger phrases for faster matching
    this.triggerPhrasesNormalized = this.config.triggerPhrases.map(normalizeText);
  }

  /**
   * Evaluate if a call should be escalated
   */
  evaluate(context: ConversationContext): EscalationTriggerResult {
    const triggers: Array<{
      reason: EscalationReason;
      confidence: number;
      details: EscalationTriggerResult['triggerDetails'];
    }> = [];

    // Check for explicit user request
    if (context.lastUserMessage) {
      const phraseMatch = this.checkTriggerPhrases(context.lastUserMessage);
      if (phraseMatch) {
        triggers.push({
          reason: 'USER_REQUEST',
          confidence: 0.95,
          details: { matchedPhrase: phraseMatch },
        });
      }
    }

    // Check sentiment
    if (context.sentimentScore !== undefined) {
      const sentimentTrigger = this.checkSentiment(context.sentimentScore);
      if (sentimentTrigger) {
        triggers.push({
          reason: 'SENTIMENT_NEGATIVE',
          confidence: Math.min(0.9, Math.abs(context.sentimentScore)),
          details: { sentimentScore: context.sentimentScore },
        });
      }
    }

    // Check clarification count
    if (context.clarificationCount >= this.config.maxClarifications) {
      triggers.push({
        reason: 'REPEATED_CLARIFICATION',
        confidence: 0.8,
        details: { clarificationCount: context.clarificationCount },
      });
    }

    // Check call duration
    if (
      this.config.maxCallDuration > 0 &&
      context.callDurationSeconds >= this.config.maxCallDuration
    ) {
      triggers.push({
        reason: 'MAX_DURATION',
        confidence: 0.7,
        details: { callDuration: context.callDurationSeconds },
      });
    }

    // Check unrecognized intents
    if (context.unrecognizedIntentCount && context.unrecognizedIntentCount >= 2) {
      triggers.push({
        reason: 'UNRECOGNIZED_INTENT',
        confidence: 0.75,
        details: {},
      });
    }

    // Return the highest confidence trigger
    if (triggers.length > 0) {
      const highestConfidence = triggers.reduce((prev, curr) =>
        curr.confidence > prev.confidence ? curr : prev
      );

      return {
        shouldEscalate: true,
        reason: highestConfidence.reason,
        confidence: highestConfidence.confidence,
        triggerDetails: highestConfidence.details,
      };
    }

    return {
      shouldEscalate: false,
      confidence: 0,
    };
  }

  /**
   * Check if user message contains trigger phrases
   */
  private checkTriggerPhrases(message: string): string | null {
    const normalizedMessage = normalizeText(message);

    for (let i = 0; i < this.triggerPhrasesNormalized.length; i++) {
      if (normalizedMessage.includes(this.triggerPhrasesNormalized[i])) {
        return this.config.triggerPhrases[i]; // Return original phrase
      }
    }

    return null;
  }

  /**
   * Check if sentiment score indicates escalation
   */
  private checkSentiment(score: number): boolean {
    return score <= this.config.sentimentThreshold;
  }

  /**
   * Analyze text for frustration indicators
   */
  analyzeFrustration(text: string): {
    isFrustrated: boolean;
    indicators: string[];
    score: number;
  } {
    const frustrationIndicators = [
      // German frustration phrases
      'das ist laecherlich',
      'das ist unakzeptabel',
      'ich bin wuetend',
      'ich bin sauer',
      'das nervt',
      'das ist eine frechheit',
      'das geht gar nicht',
      'was soll das',
      'das kann doch nicht sein',
      'ich warte schon ewig',
      'immer das gleiche',
      'nie funktioniert',
      'unfassbar',
      'unverschaemt',
      'eine katastrophe',
      'total verrueckt',
      // English indicators
      'this is ridiculous',
      'unacceptable',
      'frustrated',
      'angry',
      'terrible service',
      'waste of time',
    ];

    const normalizedText = normalizeText(text);
    const foundIndicators: string[] = [];

    for (const indicator of frustrationIndicators) {
      if (normalizedText.includes(normalizeText(indicator))) {
        foundIndicators.push(indicator);
      }
    }

    const score = Math.min(1, foundIndicators.length * 0.3);

    return {
      isFrustrated: foundIndicators.length >= 1,
      indicators: foundIndicators,
      score,
    };
  }

  /**
   * Detect confusion in AI responses (for internal use)
   */
  detectConfusion(aiResponse: string): {
    isConfused: boolean;
    confidence: number;
    indicators: string[];
  } {
    const confusionIndicators = [
      'ich bin mir nicht sicher',
      'ich verstehe nicht ganz',
      'koennten sie das bitte wiederholen',
      'das habe ich nicht verstanden',
      'ich bin leider nicht in der lage',
      'das kann ich leider nicht',
      'dazu habe ich keine informationen',
      'das uebersteigt meine moeglichkeiten',
      'ich bin mir unsicher',
      'entschuldigung, ich habe das nicht richtig erfasst',
    ];

    const normalizedResponse = normalizeText(aiResponse);
    const foundIndicators: string[] = [];

    for (const indicator of confusionIndicators) {
      if (normalizedResponse.includes(normalizeText(indicator))) {
        foundIndicators.push(indicator);
      }
    }

    return {
      isConfused: foundIndicators.length >= 1,
      confidence: Math.min(1, foundIndicators.length * 0.4),
      indicators: foundIndicators,
    };
  }

  /**
   * Map a reason string to EscalationReason enum
   */
  static mapReasonString(reason: string): EscalationReason {
    const normalizedReason = reason.toLowerCase().trim();

    if (
      normalizedReason.includes('human') ||
      normalizedReason.includes('mensch') ||
      normalizedReason.includes('person') ||
      normalizedReason.includes('mitarbeiter') ||
      normalizedReason.includes('user request')
    ) {
      return 'USER_REQUEST';
    }

    if (
      normalizedReason.includes('confused') ||
      normalizedReason.includes('unsure') ||
      normalizedReason.includes('confidence') ||
      normalizedReason.includes('unsicher')
    ) {
      return 'LOW_CONFIDENCE';
    }

    if (
      normalizedReason.includes('repeat') ||
      normalizedReason.includes('clarif') ||
      normalizedReason.includes('wiederhol')
    ) {
      return 'REPEATED_CLARIFICATION';
    }

    if (
      normalizedReason.includes('understand') ||
      normalizedReason.includes('intent') ||
      normalizedReason.includes('versteh')
    ) {
      return 'UNRECOGNIZED_INTENT';
    }

    if (
      normalizedReason.includes('complex') ||
      normalizedReason.includes('komplex') ||
      normalizedReason.includes('complicated')
    ) {
      return 'COMPLEX_ISSUE';
    }

    if (
      normalizedReason.includes('angry') ||
      normalizedReason.includes('frustrat') ||
      normalizedReason.includes('upset') ||
      normalizedReason.includes('wuetend') ||
      normalizedReason.includes('sauer') ||
      normalizedReason.includes('sentiment')
    ) {
      return 'SENTIMENT_NEGATIVE';
    }

    if (normalizedReason.includes('duration') || normalizedReason.includes('time')) {
      return 'MAX_DURATION';
    }

    // Default to explicit trigger if no other match
    return 'EXPLICIT_TRIGGER';
  }

  /**
   * Update detector configuration
   */
  updateConfig(newConfig: Partial<DetectorConfig>): void {
    this.config = { ...this.config, ...newConfig };

    if (newConfig.triggerPhrases) {
      this.triggerPhrasesNormalized = this.config.triggerPhrases.map(normalizeText);
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): DetectorConfig {
    return { ...this.config };
  }
}
