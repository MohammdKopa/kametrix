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

/**
 * Vapi Transfer Plan configuration for call transfers
 * @see https://docs.vapi.ai/call-forwarding
 */
export interface VapiTransferPlan {
  /**
   * Transfer mode:
   * - 'blind-transfer': Direct transfer without context
   * - 'warm-transfer-with-message': Transfer with custom message to operator
   * - 'warm-transfer-with-summary': Transfer with AI-generated summary
   * - 'warm-transfer-experimental': Experimental mode with hold music and voicemail detection
   */
  mode: 'blind-transfer' | 'warm-transfer-with-message' | 'warm-transfer-with-summary' | 'warm-transfer-experimental';
  /** Custom message to play to the operator (for warm-transfer-with-message) */
  message?: string;
  /** Summary plan configuration (for warm-transfer-with-summary) */
  summaryPlan?: {
    enabled: boolean;
    messages: Array<{
      role: 'system' | 'user';
      content: string;
    }>;
  };
  /** Hold audio URL for experimental mode */
  holdAudioUrl?: string;
  /** Timeout in seconds for transfer completion */
  timeout?: number;
}

/**
 * Vapi Transfer Destination object
 * Returned from escalation to trigger actual call transfer
 * @see https://docs.vapi.ai/call-forwarding
 */
export interface VapiTransferDestination {
  /** Destination type */
  type: 'number' | 'sip' | 'assistant';
  /** Phone number in E.164 format (for type: 'number') */
  number?: string;
  /** SIP URI (for type: 'sip') */
  sipUri?: string;
  /** Assistant name (for type: 'assistant') */
  assistantName?: string;
  /** Message played to caller during transfer initiation */
  message?: string;
  /** Phone extension (optional) */
  extension?: string;
  /** Transfer plan configuration */
  transferPlan?: VapiTransferPlan;
}

/**
 * Vapi Transfer Action response object
 * Returned from tool call to instruct Vapi to transfer the call
 */
export interface VapiTransferAction {
  /** Action type - must be 'transferCall' */
  action: 'transferCall';
  /** Transfer destination configuration */
  destination: VapiTransferDestination;
}

// ============================================================================
// Transfer Error Handling Types
// ============================================================================

/**
 * Types of transfer failures that can occur
 */
export enum TransferFailureType {
  /** Line is busy - recipient is on another call */
  BUSY = 'BUSY',
  /** No answer within timeout period */
  NO_ANSWER = 'NO_ANSWER',
  /** Invalid or disconnected number */
  INVALID_NUMBER = 'INVALID_NUMBER',
  /** Network or connectivity issues */
  NETWORK_ERROR = 'NETWORK_ERROR',
  /** Recipient rejected the call */
  REJECTED = 'REJECTED',
  /** Transfer timed out */
  TIMEOUT = 'TIMEOUT',
  /** Voicemail detected instead of live answer */
  VOICEMAIL_DETECTED = 'VOICEMAIL_DETECTED',
  /** Unknown or unspecified error */
  UNKNOWN = 'UNKNOWN',
}

/**
 * Configuration for retry behavior
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxAttempts: number;
  /** Delay between retries in milliseconds */
  retryDelayMs: number;
  /** Whether to try fallback numbers */
  useFallbackNumbers: boolean;
  /** Ordered list of fallback numbers to try */
  fallbackNumbers: string[];
}

/**
 * Result of a single transfer attempt
 */
export interface TransferAttemptResult {
  /** Whether the attempt was successful */
  success: boolean;
  /** The number that was attempted */
  attemptedNumber: string;
  /** Type of failure if not successful */
  failureType?: TransferFailureType;
  /** Additional error message */
  errorMessage?: string;
  /** Duration of the attempt in milliseconds */
  attemptDurationMs?: number;
  /** Timestamp of the attempt */
  timestamp: Date;
}

/**
 * Complete result of transfer with retry logic
 */
export interface TransferWithRetryResult {
  /** Overall success status */
  success: boolean;
  /** Final status of the escalation */
  status: EscalationStatus;
  /** Number successfully transferred to (if any) */
  transferredTo?: string;
  /** All attempts made */
  attempts: TransferAttemptResult[];
  /** Total number of attempts */
  totalAttempts: number;
  /** Whether a fallback number was used */
  fallbackUsed: boolean;
  /** Final failure reason if all attempts failed */
  finalFailureReason?: string;
  /** Final failure type if all attempts failed */
  finalFailureType?: TransferFailureType;
  /** Available fallback options after failure */
  fallbackOptions?: TransferFallbackOptions;
  /** Message to communicate to caller */
  callerMessage: string;
}

/**
 * Available fallback options when transfer fails
 */
export interface TransferFallbackOptions {
  /** Voicemail is available */
  voicemailAvailable: boolean;
  /** Callback can be requested */
  callbackAvailable: boolean;
  /** Alternative number available */
  alternativeNumberAvailable: boolean;
  /** The alternative number if available */
  alternativeNumber?: string;
  /** Message to send to voicemail if leaving one */
  voicemailGreeting?: string;
}

/**
 * Callback request created when transfer fails
 */
export interface CallbackRequestRecord {
  /** Unique ID for this callback request */
  id: string;
  /** ID of the associated call */
  callId: string;
  /** ID of the escalation that triggered this */
  escalationId: string;
  /** Phone number to call back */
  callerPhone: string;
  /** Caller's name if provided */
  callerName?: string;
  /** Preferred callback time if specified */
  preferredTime?: string;
  /** Reason for the callback */
  reason: string;
  /** Priority level */
  priority: 'low' | 'normal' | 'high' | 'urgent';
  /** Current status */
  status: 'PENDING' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  /** When the request was created */
  createdAt: Date;
  /** When the callback should be made by */
  dueBy?: Date;
  /** Notes about the callback */
  notes?: string;
}

/**
 * Status update event for transfer progress
 */
export interface TransferStatusUpdate {
  /** ID of the escalation */
  escalationId: string;
  /** ID of the call */
  callId: string;
  /** Current status */
  status: EscalationStatus;
  /** Previous status */
  previousStatus?: EscalationStatus;
  /** Type of update */
  updateType: 'ATTEMPT_STARTED' | 'ATTEMPT_FAILED' | 'ATTEMPT_SUCCEEDED' | 'FALLBACK_STARTED' | 'VOICEMAIL_FALLBACK' | 'CALLBACK_OFFERED' | 'TRANSFER_COMPLETE' | 'TRANSFER_FAILED';
  /** Details about the update */
  details?: {
    attemptNumber?: number;
    targetNumber?: string;
    failureType?: TransferFailureType;
    errorMessage?: string;
    nextAction?: string;
  };
  /** Timestamp of the update */
  timestamp: Date;
}

/**
 * User-facing messages for different transfer failure scenarios
 */
export interface TransferFailureMessages {
  /** Messages for different failure types */
  [TransferFailureType.BUSY]: string;
  [TransferFailureType.NO_ANSWER]: string;
  [TransferFailureType.INVALID_NUMBER]: string;
  [TransferFailureType.NETWORK_ERROR]: string;
  [TransferFailureType.REJECTED]: string;
  [TransferFailureType.TIMEOUT]: string;
  [TransferFailureType.VOICEMAIL_DETECTED]: string;
  [TransferFailureType.UNKNOWN]: string;
}

/**
 * Default German messages for transfer failures
 */
export const DEFAULT_TRANSFER_FAILURE_MESSAGES: TransferFailureMessages = {
  [TransferFailureType.BUSY]: 'Die Leitung ist momentan besetzt. Ich versuche es erneut oder kann Ihnen alternativ einen Rückruf anbieten.',
  [TransferFailureType.NO_ANSWER]: 'Leider nimmt gerade niemand ab. Möchten Sie auf der Leitung bleiben, oder soll ich einen Rückruf vereinbaren?',
  [TransferFailureType.INVALID_NUMBER]: 'Es tut mir leid, es gibt ein Problem mit der Weiterleitung. Kann ich Ihre Kontaktdaten aufnehmen für einen Rückruf?',
  [TransferFailureType.NETWORK_ERROR]: 'Es gibt momentan technische Schwierigkeiten mit der Verbindung. Ich versuche es noch einmal.',
  [TransferFailureType.REJECTED]: 'Der Mitarbeiter ist gerade nicht verfügbar. Soll ich Sie mit einem anderen Mitarbeiter verbinden oder einen Rückruf vereinbaren?',
  [TransferFailureType.TIMEOUT]: 'Die Weiterleitung hat zu lange gedauert. Möchten Sie es noch einmal versuchen oder lieber einen Rückruf erhalten?',
  [TransferFailureType.VOICEMAIL_DETECTED]: 'Ich habe die Mailbox erreicht. Möchten Sie eine Nachricht hinterlassen oder lieber einen Rückruf erhalten?',
  [TransferFailureType.UNKNOWN]: 'Es tut mir leid, die Weiterleitung ist momentan nicht möglich. Ich kann Ihnen aber einen Rückruf anbieten.',
};
