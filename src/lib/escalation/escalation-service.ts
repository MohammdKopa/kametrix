/**
 * Escalation Service
 *
 * Main service for handling call escalations and transfers.
 * Coordinates between detection, configuration, and transfer execution.
 * Includes comprehensive error handling for failed transfers with retry logic,
 * fallback numbers, voicemail fallback, and callback offers.
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/errors/logger';
import { notFoundError } from '@/lib/errors/app-error';
import type {
  EscalationReason,
  EscalationStatus,
  EscalationConfig,
  Call,
} from '@/generated/prisma/client';
import type {
  EscalationContext,
  TransferResult,
  TransferAnnouncement,
  OperatorAvailability,
  InitiateEscalationRequest,
  InitiateEscalationResponse,
  TransferWithRetryResult,
  TransferAttemptResult,
  TransferStatusUpdate,
  TransferFallbackOptions,
  CallbackRequestRecord,
} from '@/types/escalation';
import { TransferFailureType, DEFAULT_TRANSFER_FAILURE_MESSAGES } from '@/types/escalation';
import { EscalationDetector, type ConversationContext } from './escalation-detector';
import { TransferErrorHandler, transferErrorHandler } from './transfer-error-handler';

/**
 * EscalationService class
 *
 * Handles the full lifecycle of call escalation:
 * 1. Detecting when escalation is needed
 * 2. Checking operator availability
 * 3. Initiating and managing transfers
 * 4. Recording escalation events
 * 5. Handling transfer failures with retry logic
 * 6. Managing fallback options (voicemail, callback)
 */
export class EscalationService {
  private detector: EscalationDetector;
  private errorHandler: TransferErrorHandler;
  private transferAttempts: Map<string, TransferAttemptResult[]> = new Map();
  private statusCallbacks: Array<(update: TransferStatusUpdate) => void> = [];

  constructor() {
    this.detector = new EscalationDetector();
    this.errorHandler = new TransferErrorHandler();
  }

  /**
   * Initialize detector and error handler with agent-specific configuration
   */
  async initializeForAgent(agentId: string): Promise<void> {
    const config = await prisma.escalationConfig.findUnique({
      where: { agentId },
    });

    if (config) {
      this.detector.updateConfig({
        maxClarifications: config.maxClarifications,
        maxCallDuration: config.maxCallDuration,
        sentimentThreshold: config.sentimentThreshold,
        triggerPhrases: config.triggerPhrases as string[],
      });
    }

    // Initialize error handler for transfer failures
    await this.errorHandler.initialize(agentId);

    // Forward status updates from error handler
    this.errorHandler.onStatusUpdate((update) => {
      this.emitStatusUpdate(update);
    });

    logger.info('EscalationService initialized for agent', { agentId, hasConfig: !!config });
  }

  /**
   * Register a callback for transfer status updates
   */
  onStatusUpdate(callback: (update: TransferStatusUpdate) => void): void {
    this.statusCallbacks.push(callback);
  }

  /**
   * Emit a status update to all registered callbacks
   */
  private emitStatusUpdate(update: TransferStatusUpdate): void {
    for (const callback of this.statusCallbacks) {
      try {
        callback(update);
      } catch (error) {
        logger.warn('Status callback error', { error });
      }
    }
  }

  /**
   * Check if a call should be escalated based on current context
   */
  shouldEscalate(context: ConversationContext): {
    shouldEscalate: boolean;
    reason?: EscalationReason;
    confidence: number;
  } {
    return this.detector.evaluate(context);
  }

  /**
   * Initiate an escalation for a call
   */
  async initiateEscalation(
    request: InitiateEscalationRequest
  ): Promise<InitiateEscalationResponse> {
    const { callId, reason, callerName, conversationSummary, lastUserMessage, urgency } = request;

    logger.info('Initiating escalation', {
      callId,
      reason,
      urgency: urgency || 'normal',
    });

    // Get call and agent information
    const call = await prisma.call.findUnique({
      where: { id: callId },
      include: {
        agent: {
          include: {
            escalationConfig: true,
          },
        },
      },
    });

    if (!call) {
      throw new Error(`Call not found: ${callId}`);
    }

    const config = call.agent.escalationConfig;
    if (!config || !config.enabled) {
      logger.warn('Escalation not configured or disabled', { agentId: call.agentId });
      return {
        escalationId: '',
        status: 'FAILED',
        callerMessage: 'Leider kann ich Sie momentan nicht weiterleiten. Ein Mitarbeiter wird Sie baldmöglichst zurückrufen.',
      };
    }

    // Check operator availability
    const availability = await this.checkOperatorAvailability(config);

    // Determine transfer number based on availability and time
    const transferNumber = this.getTransferNumber(config, availability);

    // Create escalation log entry
    const escalationLog = await prisma.escalationLog.create({
      data: {
        callId: call.id,
        agentId: call.agentId,
        userId: call.userId,
        reason,
        status: availability.available ? 'PENDING' : 'NO_OPERATORS',
        transferNumber,
        conversationSummary,
        lastUserMessage,
        lastAiMessage: call.summary || undefined,
        callerSentiment: call.sentiment || undefined,
        sentimentScore: call.sentimentScore || undefined,
        callDurationAtEscalation: call.durationSeconds || 0,
        transferStartedAt: new Date(),
      },
    });

    // Update call record
    await prisma.call.update({
      where: { id: callId },
      data: {
        escalatedAt: new Date(),
        escalationReason: reason,
        escalationStatus: availability.available ? 'PENDING' : 'NO_OPERATORS',
        escalatedToNumber: transferNumber,
        escalationNotes: conversationSummary,
        status: 'ESCALATED',
      },
    });

    // Generate messages
    const announcement = this.generateTransferAnnouncement(
      call,
      config,
      reason,
      availability,
      callerName
    );

    logger.info('Escalation initiated', {
      escalationId: escalationLog.id,
      status: escalationLog.status,
      transferNumber,
    });

    return {
      escalationId: escalationLog.id,
      status: escalationLog.status as EscalationStatus,
      transferNumber: transferNumber || undefined,
      estimatedWaitTime: availability.estimatedWaitTime,
      callerMessage: announcement.callerMessage,
      operatorBriefing: announcement.operatorContext,
    };
  }

  /**
   * Check if operators are available
   */
  async checkOperatorAvailability(
    config: EscalationConfig
  ): Promise<OperatorAvailability> {
    const isWithinBusinessHours = this.isWithinBusinessHours(config);

    // For now, we assume operators are available during business hours
    // In a real implementation, this would check a queue system or availability API
    const available = isWithinBusinessHours && !!config.forwardingNumber;

    return {
      available,
      isWithinBusinessHours,
      estimatedWaitTime: available ? 30 : undefined, // Estimated 30 seconds wait
      alternativeOptions: {
        voicemail: config.voicemailEnabled,
        callback: true,
        afterHoursNumber: !isWithinBusinessHours ? config.afterHoursNumber || undefined : undefined,
      },
    };
  }

  /**
   * Check if current time is within business hours
   */
  private isWithinBusinessHours(config: EscalationConfig): boolean {
    if (!config.businessHoursStart || !config.businessHoursEnd) {
      return true; // If not configured, assume always available
    }

    const now = new Date();

    // Get current time in the configured timezone
    const options: Intl.DateTimeFormatOptions = {
      timeZone: config.timezone || 'Europe/Berlin',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      weekday: 'short',
    };

    const formatter = new Intl.DateTimeFormat('en-US', options);
    const parts = formatter.formatToParts(now);

    const hour = parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10);
    const minute = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10);
    const weekday = parts.find((p) => p.type === 'weekday')?.value || '';

    // Check day of week
    if (!config.businessDays.includes(weekday)) {
      return false;
    }

    // Check time range
    const [startHour, startMinute] = config.businessHoursStart.split(':').map(Number);
    const [endHour, endMinute] = config.businessHoursEnd.split(':').map(Number);

    const currentMinutes = hour * 60 + minute;
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  }

  /**
   * Determine which number to transfer to
   */
  private getTransferNumber(
    config: EscalationConfig,
    availability: OperatorAvailability
  ): string | null {
    if (availability.isWithinBusinessHours) {
      return config.forwardingNumber || config.fallbackNumber || null;
    }

    return config.afterHoursNumber || config.fallbackNumber || null;
  }

  /**
   * Generate transfer announcement messages
   */
  private generateTransferAnnouncement(
    call: Call & { agent: { businessName: string; name: string } },
    config: EscalationConfig,
    reason: EscalationReason,
    availability: OperatorAvailability,
    callerName?: string
  ): TransferAnnouncement {
    let callerMessage: string;
    let operatorContext: string;

    const greeting = callerName ? `, ${callerName}` : '';

    if (availability.available) {
      // Operators are available
      if (config.transferMessage) {
        callerMessage = config.transferMessage;
      } else {
        callerMessage = `Einen Moment bitte${greeting}, ich verbinde Sie mit einem Mitarbeiter. ${
          availability.estimatedWaitTime
            ? `Die geschätzte Wartezeit beträgt etwa ${Math.ceil(availability.estimatedWaitTime / 60)} Minute${availability.estimatedWaitTime > 60 ? 'n' : ''}.`
            : ''
        }`;
      }
    } else if (!availability.isWithinBusinessHours) {
      // Outside business hours
      if (config.afterHoursMessage) {
        callerMessage = config.afterHoursMessage;
      } else {
        callerMessage = `Es tut mir leid${greeting}, aber Sie erreichen uns außerhalb unserer Geschäftszeiten. ${
          config.voicemailEnabled
            ? 'Sie können uns gerne eine Nachricht hinterlassen und wir rufen Sie baldmöglichst zurück.'
            : 'Bitte rufen Sie uns während unserer Geschäftszeiten erneut an.'
        }`;
      }
    } else {
      // No operators available
      callerMessage = `Es tut mir leid${greeting}, momentan sind leider alle Mitarbeiter im Gespräch. ${
        config.voicemailEnabled
          ? 'Möchten Sie eine Nachricht hinterlassen? Wir rufen Sie dann so schnell wie möglich zurück.'
          : 'Bitte versuchen Sie es in einigen Minuten erneut.'
      }`;
    }

    // Build operator context
    const reasonDescriptions: Record<EscalationReason, string> = {
      USER_REQUEST: 'Kunde hat explizit nach einem Mitarbeiter gefragt',
      LOW_CONFIDENCE: 'KI-Assistent war unsicher bei der Beantwortung',
      REPEATED_CLARIFICATION: 'Mehrfache Nachfragen des Kunden',
      UNRECOGNIZED_INTENT: 'Kundenanliegen konnte nicht verstanden werden',
      COMPLEX_ISSUE: 'Komplexes Anliegen erfordert menschliche Bearbeitung',
      SENTIMENT_NEGATIVE: 'Kunde scheint unzufrieden oder frustriert zu sein',
      MAX_DURATION: 'Maximale Gesprächsdauer erreicht',
      EXPLICIT_TRIGGER: 'Eskalation durch Schlüsselwort ausgelöst',
    };

    operatorContext = `Eingehende Weiterleitung von ${call.agent.businessName} (${call.agent.name}).\n`;
    operatorContext += `Grund: ${reasonDescriptions[reason]}\n`;
    operatorContext += `Anrufer-Telefon: ${call.phoneNumber}\n`;

    if (callerName) {
      operatorContext += `Anrufer-Name: ${callerName}\n`;
    }

    return { callerMessage, operatorContext };
  }

  /**
   * Update escalation status
   */
  async updateEscalationStatus(
    escalationId: string,
    status: EscalationStatus,
    additionalData?: {
      humanConnectedAt?: Date;
      humanAgentId?: string;
      failureReason?: string;
      waitTimeSeconds?: number;
    }
  ): Promise<void> {
    await prisma.escalationLog.update({
      where: { id: escalationId },
      data: {
        status,
        ...(status === 'CONNECTED' && {
          transferCompletedAt: new Date(),
          humanConnectedAt: additionalData?.humanConnectedAt || new Date(),
        }),
        ...(status === 'FAILED' && {
          transferCompletedAt: new Date(),
          failureReason: additionalData?.failureReason,
        }),
        humanAgentId: additionalData?.humanAgentId,
        waitTimeSeconds: additionalData?.waitTimeSeconds,
      },
    });

    // Also update the call record
    const log = await prisma.escalationLog.findUnique({
      where: { id: escalationId },
    });

    if (log) {
      await prisma.call.update({
        where: { id: log.callId },
        data: {
          escalationStatus: status,
          ...(status === 'CONNECTED' && {
            humanConnectedAt: additionalData?.humanConnectedAt || new Date(),
            status: 'TRANSFERRED',
          }),
        },
      });
    }

    logger.info('Escalation status updated', { escalationId, status });
  }

  /**
   * Build escalation context for human operator
   */
  async buildEscalationContext(callId: string): Promise<EscalationContext | null> {
    const call = await prisma.call.findUnique({
      where: { id: callId },
      include: {
        agent: true,
      },
    });

    if (!call || !call.escalationReason) {
      return null;
    }

    return {
      callId: call.id,
      callerPhone: call.phoneNumber,
      agentName: call.agent.name,
      businessName: call.agent.businessName,
      escalationReason: call.escalationReason,
      conversationSummary: call.summary || undefined,
      transcript: call.transcript || undefined,
      callerSentiment: call.sentiment || undefined,
      sentimentScore: call.sentimentScore || undefined,
      callDuration: call.durationSeconds || 0,
      keyTopics: call.keyTopics || undefined,
      customerIntents: call.customerIntents || undefined,
    };
  }

  /**
   * Get the escalation detector instance
   */
  getDetector(): EscalationDetector {
    return this.detector;
  }

  /**
   * Get the transfer error handler instance
   */
  getErrorHandler(): TransferErrorHandler {
    return this.errorHandler;
  }

  // ============================================================================
  // Transfer Error Handling Methods
  // ============================================================================

  /**
   * Handle a transfer failure with comprehensive retry logic
   *
   * This method processes transfer failures and determines the next action:
   * - Retry with the same number
   * - Try a fallback number
   * - Offer voicemail
   * - Offer callback
   */
  async handleTransferFailure(
    escalationId: string,
    callId: string,
    targetNumber: string,
    failureSignal: {
      code?: string;
      message?: string;
      sipCode?: number;
      vapiStatus?: string;
    }
  ): Promise<TransferWithRetryResult> {
    logger.info('Handling transfer failure', {
      escalationId,
      callId,
      targetNumber,
      failureSignal,
    });

    // Get or initialize attempt tracking for this escalation
    const previousAttempts = this.transferAttempts.get(escalationId) || [];

    // Get the call and config for business hours check
    const call = await prisma.call.findUnique({
      where: { id: callId },
      include: {
        agent: {
          include: { escalationConfig: true },
        },
      },
    });

    if (!call) {
      throw notFoundError('Call', callId);
    }

    const config = call.agent.escalationConfig;
    const isWithinBusinessHours = config ? this.isWithinBusinessHours(config) : true;

    // Delegate to error handler
    const result = await this.errorHandler.handleTransferFailure(
      escalationId,
      callId,
      targetNumber,
      failureSignal,
      previousAttempts,
      isWithinBusinessHours
    );

    // Update attempt tracking
    this.transferAttempts.set(escalationId, result.attempts);

    // Emit status update
    this.emitStatusUpdate({
      escalationId,
      callId,
      status: result.status,
      updateType: result.success ? 'TRANSFER_COMPLETE' : 'TRANSFER_FAILED',
      details: {
        attemptNumber: result.totalAttempts,
        failureType: result.finalFailureType,
        errorMessage: result.finalFailureReason,
      },
      timestamp: new Date(),
    });

    return result;
  }

  /**
   * Get the next transfer number to try after a failure
   */
  async getNextTransferNumber(
    escalationId: string,
    callId: string
  ): Promise<{
    number: string | null;
    isFallback: boolean;
    attemptNumber: number;
  }> {
    // Get previous attempts
    const previousAttempts = this.transferAttempts.get(escalationId) || [];
    const attemptedNumbers = previousAttempts.map(a => a.attemptedNumber);

    // Get call and config
    const call = await prisma.call.findUnique({
      where: { id: callId },
      include: {
        agent: {
          include: { escalationConfig: true },
        },
      },
    });

    if (!call?.agent.escalationConfig) {
      return { number: null, isFallback: false, attemptNumber: previousAttempts.length };
    }

    const config = call.agent.escalationConfig;
    const isWithinBusinessHours = this.isWithinBusinessHours(config);
    const primaryNumber = isWithinBusinessHours
      ? config.forwardingNumber
      : config.afterHoursNumber || config.forwardingNumber;

    if (!primaryNumber) {
      return { number: null, isFallback: false, attemptNumber: previousAttempts.length };
    }

    // Get next number from error handler
    const nextNumber = this.errorHandler.getNextNumber(
      primaryNumber,
      attemptedNumbers,
      isWithinBusinessHours
    );

    return {
      number: nextNumber,
      isFallback: nextNumber !== null && nextNumber !== primaryNumber,
      attemptNumber: previousAttempts.length + 1,
    };
  }

  /**
   * Record a successful transfer
   */
  async recordSuccessfulTransfer(
    escalationId: string,
    callId: string,
    transferredTo: string
  ): Promise<void> {
    // Record the successful attempt
    const attempts = this.transferAttempts.get(escalationId) || [];
    attempts.push({
      success: true,
      attemptedNumber: transferredTo,
      timestamp: new Date(),
    });
    this.transferAttempts.set(escalationId, attempts);

    // Update escalation status
    await this.updateEscalationStatus(escalationId, 'CONNECTED', {
      humanConnectedAt: new Date(),
    });

    // Emit status update
    this.emitStatusUpdate({
      escalationId,
      callId,
      status: 'CONNECTED',
      updateType: 'TRANSFER_COMPLETE',
      details: {
        attemptNumber: attempts.length,
        targetNumber: transferredTo,
      },
      timestamp: new Date(),
    });

    // Clear attempt tracking
    this.transferAttempts.delete(escalationId);

    logger.info('Transfer completed successfully', {
      escalationId,
      callId,
      transferredTo,
      totalAttempts: attempts.length,
    });
  }

  /**
   * Create a callback request when transfer fails
   */
  async createCallbackRequest(
    escalationId: string,
    callId: string,
    callerPhone: string,
    reason: EscalationReason,
    options?: {
      callerName?: string;
      preferredTime?: string;
      priority?: 'low' | 'normal' | 'high' | 'urgent';
      notes?: string;
    }
  ): Promise<CallbackRequestRecord> {
    logger.info('Creating callback request', {
      escalationId,
      callId,
      callerPhone,
      reason,
      priority: options?.priority || 'normal',
    });

    const callbackRecord = await this.errorHandler.createCallbackRequest(
      escalationId,
      callId,
      callerPhone,
      reason,
      options
    );

    // Clear attempt tracking since we're moving to callback
    this.transferAttempts.delete(escalationId);

    return callbackRecord;
  }

  /**
   * Handle voicemail fallback when transfer fails
   */
  async handleVoicemailFallback(
    escalationId: string,
    callId: string,
    reason: EscalationReason,
    conversationSummary?: string
  ): Promise<{
    voicemailGreeting: string;
    status: EscalationStatus;
  }> {
    logger.info('Handling voicemail fallback', {
      escalationId,
      callId,
      reason,
    });

    const result = await this.errorHandler.handleVoicemailFallback(
      escalationId,
      callId,
      reason,
      conversationSummary
    );

    // Clear attempt tracking since we're moving to voicemail
    this.transferAttempts.delete(escalationId);

    return result;
  }

  /**
   * Get available fallback options after transfer failure
   */
  getFallbackOptions(): TransferFallbackOptions {
    return this.errorHandler.getFallbackOptions();
  }

  /**
   * Get a user-friendly message for a specific failure type
   */
  getFailureMessage(failureType: TransferFailureType): string {
    return DEFAULT_TRANSFER_FAILURE_MESSAGES[failureType] ||
      DEFAULT_TRANSFER_FAILURE_MESSAGES[TransferFailureType.UNKNOWN];
  }

  /**
   * Check if a failure type is retryable
   */
  isFailureRetryable(failureType: TransferFailureType): boolean {
    return this.errorHandler.isRetryable(failureType);
  }

  /**
   * Detect failure type from error signals
   */
  detectFailureType(errorSignal: {
    code?: string;
    message?: string;
    sipCode?: number;
    vapiStatus?: string;
  }): TransferFailureType {
    return this.errorHandler.detectFailureType(errorSignal);
  }

  /**
   * Get transfer attempt history for an escalation
   */
  getTransferAttempts(escalationId: string): TransferAttemptResult[] {
    return this.transferAttempts.get(escalationId) || [];
  }

  /**
   * Clear transfer attempt history for an escalation
   */
  clearTransferAttempts(escalationId: string): void {
    this.transferAttempts.delete(escalationId);
  }

  /**
   * Generate a comprehensive status message for the caller based on transfer state
   */
  generateCallerStatusMessage(
    failureType: TransferFailureType,
    attemptNumber: number,
    isRetrying: boolean
  ): string {
    const fallbackOptions = this.getFallbackOptions();
    return this.errorHandler.generateCallerStatusMessage(
      failureType,
      attemptNumber,
      fallbackOptions,
      isRetrying
    );
  }
}

// Export a singleton instance
export const escalationService = new EscalationService();
