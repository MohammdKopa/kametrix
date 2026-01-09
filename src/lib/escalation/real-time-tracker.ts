/**
 * Real-Time Conversation Tracker
 *
 * Tracks conversation context during live calls to enable
 * automatic escalation detection based on:
 * - Sentiment analysis (frustration detection)
 * - Clarification count
 * - Unrecognized intent count
 * - Low confidence indicators in AI responses
 * - Call duration
 */

import { EscalationDetector, type ConversationContext } from './escalation-detector';
import type { EscalationTriggerResult } from '@/types/escalation';

/**
 * Message from conversation update
 */
export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp?: string;
}

/**
 * Tracked conversation state for a call
 */
interface TrackedCallState {
  callId: string;
  agentId: string;
  startedAt: Date;
  messages: ConversationMessage[];
  clarificationCount: number;
  unrecognizedIntentCount: number;
  frustrationScore: number;
  frustrationIndicators: string[];
  lastUserMessage?: string;
  lastAiMessage?: string;
  sentimentScore?: number;
  lastEscalationCheck?: Date;
  escalationTriggered: boolean;
}

/**
 * Patterns that indicate the AI is asking for clarification
 */
const CLARIFICATION_PATTERNS = [
  // German clarification phrases
  'koennten sie das bitte wiederholen',
  'koennten sie das nochmal sagen',
  'ich habe das nicht ganz verstanden',
  'was meinen sie mit',
  'koennten sie das praezisieren',
  'ich bin mir nicht sicher was sie meinen',
  'entschuldigung ich habe nicht verstanden',
  'koennten sie genauer erklaeren',
  'wie meinen sie das',
  'was genau moechten sie',
  // English patterns
  'could you please repeat',
  'i didn\'t quite understand',
  'could you clarify',
  'what do you mean by',
  'can you explain',
];

/**
 * Patterns that indicate the AI couldn't recognize the user's intent
 */
const UNRECOGNIZED_INTENT_PATTERNS = [
  // German patterns
  'das kann ich leider nicht',
  'dazu habe ich keine informationen',
  'das uebersteigt meine moeglichkeiten',
  'ich bin nicht in der lage',
  'ich verstehe ihre anfrage nicht',
  'das ist mir leider nicht moeglich',
  'ich kann ihnen dabei nicht helfen',
  'das faellt nicht in meinen aufgabenbereich',
  // English patterns
  'i can\'t help with that',
  'i don\'t have information about',
  'that\'s beyond my capabilities',
  'i\'m not able to',
  'i don\'t understand your request',
];

/**
 * Normalize text for pattern matching
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
 * RealTimeConversationTracker
 *
 * Maintains state for active calls and provides real-time escalation detection.
 * Uses an in-memory store with automatic cleanup for completed calls.
 */
export class RealTimeConversationTracker {
  private activeCalls: Map<string, TrackedCallState> = new Map();
  private detector: EscalationDetector;
  private cleanupInterval: NodeJS.Timeout | null = null;

  // Configuration
  private readonly ESCALATION_CHECK_INTERVAL_MS = 5000; // Check every 5 seconds max
  private readonly CALL_TIMEOUT_MS = 30 * 60 * 1000; // 30 minute max call tracking

  constructor(detector?: EscalationDetector) {
    this.detector = detector || new EscalationDetector();
    // Start cleanup interval to remove stale calls
    this.startCleanupInterval();
  }

  /**
   * Start tracking a new call
   */
  startTracking(callId: string, agentId: string): void {
    if (this.activeCalls.has(callId)) {
      return; // Already tracking
    }

    this.activeCalls.set(callId, {
      callId,
      agentId,
      startedAt: new Date(),
      messages: [],
      clarificationCount: 0,
      unrecognizedIntentCount: 0,
      frustrationScore: 0,
      frustrationIndicators: [],
      escalationTriggered: false,
    });

    console.log(`RealTimeTracker: Started tracking call ${callId}`);
  }

  /**
   * Stop tracking a call (call ended)
   */
  stopTracking(callId: string): TrackedCallState | undefined {
    const state = this.activeCalls.get(callId);
    this.activeCalls.delete(callId);

    if (state) {
      console.log(`RealTimeTracker: Stopped tracking call ${callId}, messages: ${state.messages.length}`);
    }

    return state;
  }

  /**
   * Process a new message in the conversation
   */
  processMessage(
    callId: string,
    message: ConversationMessage
  ): { needsEscalation: boolean; result?: EscalationTriggerResult } {
    const state = this.activeCalls.get(callId);
    if (!state) {
      return { needsEscalation: false };
    }

    // Add message to history
    state.messages.push({
      ...message,
      timestamp: message.timestamp || new Date().toISOString(),
    });

    // Update based on message role
    if (message.role === 'user') {
      state.lastUserMessage = message.content;

      // Analyze user message for frustration
      const frustrationResult = this.detector.analyzeFrustration(message.content);
      if (frustrationResult.isFrustrated) {
        state.frustrationScore = Math.max(state.frustrationScore, frustrationResult.score);
        state.frustrationIndicators.push(...frustrationResult.indicators);
      }
    } else if (message.role === 'assistant') {
      state.lastAiMessage = message.content;

      // Check for clarification requests
      if (this.isClarificationRequest(message.content)) {
        state.clarificationCount++;
        console.log(`RealTimeTracker: Clarification detected for call ${callId}, count: ${state.clarificationCount}`);
      }

      // Check for unrecognized intent indicators
      if (this.isUnrecognizedIntent(message.content)) {
        state.unrecognizedIntentCount++;
        console.log(`RealTimeTracker: Unrecognized intent detected for call ${callId}, count: ${state.unrecognizedIntentCount}`);
      }

      // Check for AI confusion
      const confusionResult = this.detector.detectConfusion(message.content);
      if (confusionResult.isConfused) {
        // Boost frustration score when AI is confused
        state.frustrationScore = Math.min(1, state.frustrationScore + 0.2);
      }
    }

    // Check if we should evaluate for escalation
    return this.evaluateEscalation(state);
  }

  /**
   * Update detector configuration for a specific agent
   */
  updateDetectorConfig(config: {
    maxClarifications?: number;
    maxCallDuration?: number;
    sentimentThreshold?: number;
    triggerPhrases?: string[];
  }): void {
    this.detector.updateConfig(config);
  }

  /**
   * Get current state for a call
   */
  getCallState(callId: string): TrackedCallState | undefined {
    return this.activeCalls.get(callId);
  }

  /**
   * Build conversation context for detector
   */
  buildContext(callId: string): ConversationContext | null {
    const state = this.activeCalls.get(callId);
    if (!state) {
      return null;
    }

    const callDurationSeconds = Math.floor(
      (Date.now() - state.startedAt.getTime()) / 1000
    );

    // Build transcript from messages
    const transcript = state.messages
      .map(m => `${m.role}: ${m.content}`)
      .join('\n');

    // Calculate sentiment score based on frustration
    // Frustration score is 0-1, convert to -1 to 1 range for sentiment
    // Higher frustration = more negative sentiment
    const sentimentScore = state.frustrationScore > 0
      ? -state.frustrationScore
      : 0;

    return {
      transcript,
      lastUserMessage: state.lastUserMessage,
      clarificationCount: state.clarificationCount,
      callDurationSeconds,
      sentimentScore,
      sentiment: sentimentScore < -0.5 ? 'negative' : sentimentScore < -0.2 ? 'neutral' : 'positive',
      unrecognizedIntentCount: state.unrecognizedIntentCount,
    };
  }

  /**
   * Check if a message is a clarification request
   */
  private isClarificationRequest(text: string): boolean {
    const normalized = normalizeText(text);
    return CLARIFICATION_PATTERNS.some(pattern =>
      normalized.includes(normalizeText(pattern))
    );
  }

  /**
   * Check if a message indicates unrecognized intent
   */
  private isUnrecognizedIntent(text: string): boolean {
    const normalized = normalizeText(text);
    return UNRECOGNIZED_INTENT_PATTERNS.some(pattern =>
      normalized.includes(normalizeText(pattern))
    );
  }

  /**
   * Evaluate if escalation should be triggered
   */
  private evaluateEscalation(state: TrackedCallState): {
    needsEscalation: boolean;
    result?: EscalationTriggerResult;
  } {
    // Don't re-trigger if already triggered
    if (state.escalationTriggered) {
      return { needsEscalation: false };
    }

    // Rate limit escalation checks
    const now = new Date();
    if (
      state.lastEscalationCheck &&
      now.getTime() - state.lastEscalationCheck.getTime() < this.ESCALATION_CHECK_INTERVAL_MS
    ) {
      return { needsEscalation: false };
    }
    state.lastEscalationCheck = now;

    // Build context for detector
    const context = this.buildContext(state.callId);
    if (!context) {
      return { needsEscalation: false };
    }

    // Evaluate with detector
    const result = this.detector.evaluate(context);

    if (result.shouldEscalate) {
      state.escalationTriggered = true;
      console.log(`RealTimeTracker: Escalation triggered for call ${state.callId}`, {
        reason: result.reason,
        confidence: result.confidence,
        details: result.triggerDetails,
      });
    }

    return {
      needsEscalation: result.shouldEscalate,
      result: result.shouldEscalate ? result : undefined,
    };
  }

  /**
   * Start interval to clean up stale call tracking
   */
  private startCleanupInterval(): void {
    if (this.cleanupInterval) {
      return;
    }

    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [callId, state] of this.activeCalls.entries()) {
        if (now - state.startedAt.getTime() > this.CALL_TIMEOUT_MS) {
          console.log(`RealTimeTracker: Cleaning up stale call ${callId}`);
          this.activeCalls.delete(callId);
        }
      }
    }, 60000); // Check every minute
  }

  /**
   * Stop the cleanup interval (for testing/shutdown)
   */
  stopCleanupInterval(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Get count of active calls being tracked
   */
  getActiveCallCount(): number {
    return this.activeCalls.size;
  }
}

// Export singleton instance
export const realTimeTracker = new RealTimeConversationTracker();
