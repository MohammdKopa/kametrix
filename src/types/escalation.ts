/**
 * Type definitions for call escalation and forwarding
 */

import type { EscalationReason, EscalationStatus } from '@/generated/prisma/client';

/**
 * Phrases that trigger escalation to human operator
 * Includes both German and English variations
 */
export const DEFAULT_TRIGGER_PHRASES = [
  // German phrases
  'ich moechte mit einem menschen sprechen',
  'ich will mit einem menschen reden',
  'verbinden sie mich mit einem mitarbeiter',
  'koennen sie mich weiterleiten',
  'ich brauche einen echten menschen',
  'kann ich mit jemandem sprechen',
  'ich moechte mit einer person sprechen',
  'einen mitarbeiter bitte',
  'weiterleitung bitte',
  'verbinden sie mich bitte',
  'ich brauche hilfe von einem menschen',
  'kann ich mit ihrem chef sprechen',
  'ich moechte mich beschweren',
  'das ist mir zu kompliziert',
  'sie verstehen mich nicht',
  'sie helfen mir nicht',
  // English phrases (for mixed-language support)
  'speak to a human',
  'talk to a person',
  'human agent',
  'real person',
  'representative',
  'transfer me',
  'connect me',
  'speak to someone',
] as const;

/**
 * Configuration for escalation behavior
 */
export interface EscalationConfigInput {
  enabled?: boolean;

  // Forwarding destinations
  forwardingNumber?: string;
  forwardingQueue?: string;
  forwardingDepartment?: string;
  fallbackNumber?: string;

  // Voicemail settings
  voicemailEnabled?: boolean;
  voicemailGreeting?: string;

  // Business hours
  businessHoursStart?: string;
  businessHoursEnd?: string;
  businessDays?: string[];
  afterHoursNumber?: string;
  afterHoursMessage?: string;
  timezone?: string;

  // Trigger thresholds
  maxCallDuration?: number;
  maxClarifications?: number;
  sentimentThreshold?: number;
  triggerPhrases?: string[];

  // Transfer settings
  maxTransferWaitTime?: number;
  announceTransfer?: boolean;
  transferMessage?: string;
  holdMusicUrl?: string;

  // Context sharing
  shareTranscript?: boolean;
  shareSummary?: boolean;
  shareCallerInfo?: boolean;
}

/**
 * Result of escalation trigger detection
 */
export interface EscalationTriggerResult {
  shouldEscalate: boolean;
  reason?: EscalationReason;
  confidence: number; // 0-1 confidence in the trigger detection
  triggerDetails?: {
    matchedPhrase?: string;
    sentimentScore?: number;
    clarificationCount?: number;
    callDuration?: number;
  };
}

/**
 * Context passed to human operator during transfer
 */
export interface EscalationContext {
  callId: string;
  callerPhone: string;
  agentName: string;
  businessName: string;
  escalationReason: EscalationReason;
  conversationSummary?: string;
  transcript?: string;
  lastMessages?: {
    role: 'ai' | 'user';
    content: string;
    timestamp: string;
  }[];
  callerSentiment?: string;
  sentimentScore?: number;
  callDuration: number;
  keyTopics?: string[];
  customerIntents?: string[];
}

/**
 * Result of a transfer attempt
 */
export interface TransferResult {
  success: boolean;
  status: EscalationStatus;
  transferredTo?: string;
  waitTimeSeconds?: number;
  failureReason?: string;
  fallbackUsed?: boolean;
}

/**
 * Message to announce during transfer
 */
export interface TransferAnnouncement {
  callerMessage: string; // Message to caller during transfer
  operatorContext: string; // Context provided to operator
}

/**
 * Availability check result
 */
export interface OperatorAvailability {
  available: boolean;
  isWithinBusinessHours: boolean;
  estimatedWaitTime?: number; // in seconds
  queuePosition?: number;
  nextAvailableTime?: string; // ISO timestamp
  alternativeOptions?: {
    voicemail: boolean;
    callback: boolean;
    afterHoursNumber?: string;
  };
}

/**
 * Analytics data for escalation reporting
 */
export interface EscalationAnalytics {
  totalEscalations: number;
  byReason: Record<EscalationReason, number>;
  byStatus: Record<EscalationStatus, number>;
  averageWaitTime: number;
  successRate: number;
  resolutionRate: number;
  averageCallDurationBeforeEscalation: number;
  peakEscalationHours: number[];
  commonTriggerPhrases: { phrase: string; count: number }[];
}

/**
 * Request to initiate escalation
 */
export interface InitiateEscalationRequest {
  callId: string;
  reason: EscalationReason;
  callerName?: string;
  conversationSummary?: string;
  lastUserMessage?: string;
  urgency?: 'low' | 'normal' | 'high' | 'critical';
}

/**
 * Response from escalation initiation
 */
export interface InitiateEscalationResponse {
  escalationId: string;
  status: EscalationStatus;
  transferNumber?: string;
  estimatedWaitTime?: number;
  callerMessage: string; // Message to play to caller
  operatorBriefing?: string; // Briefing for operator
}

/**
 * Callback request (alternative to immediate transfer)
 */
export interface CallbackRequest {
  callId: string;
  callerPhone: string;
  callerName?: string;
  preferredTime?: string;
  reason: string;
  priority: 'low' | 'normal' | 'high';
}

/**
 * Tool call arguments for escalate_call function
 */
export interface EscalateCallArgs {
  reason: string; // Will be mapped to EscalationReason
  summary: string; // Current conversation summary
  urgency?: 'normal' | 'high' | 'critical';
  callerName?: string;
  lastUserMessage?: string;
}

/**
 * Tool call arguments for check_operator_availability function
 */
export interface CheckOperatorAvailabilityArgs {
  department?: string;
  queue?: string;
}
