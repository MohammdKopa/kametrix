/**
 * Transfer Error Handler
 *
 * Comprehensive error handling for failed call transfers including:
 * - Retry logic with fallback numbers
 * - Voicemail fallback option
 * - Callback offer to caller
 * - Status updates for transfer progress
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/errors/logger';
import { AppError, externalServiceError, notFoundError } from '@/lib/errors/app-error';
import { ErrorCode, ErrorSeverity } from '@/lib/errors/types';
import type { EscalationConfig, EscalationStatus, EscalationReason } from '@/generated/prisma/client';
import type {
  TransferFailureType,
  TransferAttemptResult,
  TransferWithRetryResult,
  TransferFallbackOptions,
  RetryConfig,
  TransferStatusUpdate,
  CallbackRequestRecord,
} from '@/types/escalation';
import {
  DEFAULT_TRANSFER_FAILURE_MESSAGES,
} from '@/types/escalation';

// Re-export the enum for use in this module
export { TransferFailureType } from '@/types/escalation';

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  retryDelayMs: 2000,
  useFallbackNumbers: true,
  fallbackNumbers: [],
};

/**
 * TransferErrorHandler class
 *
 * Handles all aspects of transfer failure scenarios including:
 * - Detecting failure types from various error signals
 * - Implementing retry logic with exponential backoff
 * - Managing fallback number sequences
 * - Offering voicemail and callback alternatives
 * - Updating status throughout the process
 */
export class TransferErrorHandler {
  private config: EscalationConfig | null = null;
  private retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG;
  private statusCallbacks: Array<(update: TransferStatusUpdate) => void> = [];

  /**
   * Initialize the handler with escalation configuration
   */
  async initialize(agentId: string): Promise<void> {
    this.config = await prisma.escalationConfig.findUnique({
      where: { agentId },
    });

    if (this.config) {
      // Build fallback numbers list from config
      const fallbackNumbers: string[] = [];
      if (this.config.fallbackNumber) {
        fallbackNumbers.push(this.config.fallbackNumber);
      }
      if (this.config.afterHoursNumber) {
        fallbackNumbers.push(this.config.afterHoursNumber);
      }

      this.retryConfig = {
        maxAttempts: 3,
        retryDelayMs: 2000,
        useFallbackNumbers: true,
        fallbackNumbers,
      };
    }

    logger.info('TransferErrorHandler initialized', {
      agentId,
      hasConfig: !!this.config,
      fallbackCount: this.retryConfig.fallbackNumbers.length,
    });
  }

  /**
   * Register a callback for status updates
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

    // Also log the status update
    logger.info('Transfer status update', {
      escalationId: update.escalationId,
      callId: update.callId,
      status: update.status,
      updateType: update.updateType,
      details: update.details,
    });
  }

  /**
   * Detect the type of transfer failure from error signals
   */
  detectFailureType(errorSignal: {
    code?: string;
    message?: string;
    sipCode?: number;
    vapiStatus?: string;
  }): TransferFailureType {
    const { code, message, sipCode, vapiStatus } = errorSignal;
    const lowerMessage = message?.toLowerCase() || '';

    // Check SIP codes first (most reliable)
    if (sipCode) {
      switch (sipCode) {
        case 486:
        case 600:
          return 'BUSY' as TransferFailureType;
        case 480:
        case 408:
          return 'NO_ANSWER' as TransferFailureType;
        case 404:
        case 604:
          return 'INVALID_NUMBER' as TransferFailureType;
        case 603:
        case 607:
          return 'REJECTED' as TransferFailureType;
        case 503:
        case 504:
          return 'NETWORK_ERROR' as TransferFailureType;
      }
    }

    // Check Vapi status
    if (vapiStatus) {
      switch (vapiStatus) {
        case 'busy':
          return 'BUSY' as TransferFailureType;
        case 'no-answer':
          return 'NO_ANSWER' as TransferFailureType;
        case 'failed':
          return 'NETWORK_ERROR' as TransferFailureType;
        case 'voicemail':
          return 'VOICEMAIL_DETECTED' as TransferFailureType;
      }
    }

    // Check error codes
    if (code) {
      if (code.includes('busy') || code.includes('BUSY')) {
        return 'BUSY' as TransferFailureType;
      }
      if (code.includes('no_answer') || code.includes('NO_ANSWER')) {
        return 'NO_ANSWER' as TransferFailureType;
      }
      if (code.includes('invalid') || code.includes('INVALID')) {
        return 'INVALID_NUMBER' as TransferFailureType;
      }
      if (code.includes('timeout') || code.includes('TIMEOUT')) {
        return 'TIMEOUT' as TransferFailureType;
      }
    }

    // Check message content
    if (lowerMessage.includes('busy') || lowerMessage.includes('besetzt')) {
      return 'BUSY' as TransferFailureType;
    }
    if (lowerMessage.includes('no answer') || lowerMessage.includes('keine antwort')) {
      return 'NO_ANSWER' as TransferFailureType;
    }
    if (lowerMessage.includes('invalid') || lowerMessage.includes('ungültig')) {
      return 'INVALID_NUMBER' as TransferFailureType;
    }
    if (lowerMessage.includes('reject') || lowerMessage.includes('abgelehnt')) {
      return 'REJECTED' as TransferFailureType;
    }
    if (lowerMessage.includes('timeout') || lowerMessage.includes('zeitüberschreitung')) {
      return 'TIMEOUT' as TransferFailureType;
    }
    if (lowerMessage.includes('voicemail') || lowerMessage.includes('mailbox')) {
      return 'VOICEMAIL_DETECTED' as TransferFailureType;
    }
    if (lowerMessage.includes('network') || lowerMessage.includes('connection') || lowerMessage.includes('netzwerk')) {
      return 'NETWORK_ERROR' as TransferFailureType;
    }

    return 'UNKNOWN' as TransferFailureType;
  }

  /**
   * Determine if a failure type is retryable
   */
  isRetryable(failureType: TransferFailureType): boolean {
    const retryableTypes: TransferFailureType[] = [
      'BUSY' as TransferFailureType,
      'NO_ANSWER' as TransferFailureType,
      'NETWORK_ERROR' as TransferFailureType,
      'TIMEOUT' as TransferFailureType,
    ];
    return retryableTypes.includes(failureType);
  }

  /**
   * Get the next number to try in the sequence
   */
  getNextNumber(
    primaryNumber: string,
    attemptedNumbers: string[],
    isWithinBusinessHours: boolean
  ): string | null {
    // Build the number sequence
    const numberSequence: string[] = [primaryNumber];

    if (this.retryConfig.useFallbackNumbers) {
      // Add fallback numbers
      for (const fallbackNumber of this.retryConfig.fallbackNumbers) {
        if (!numberSequence.includes(fallbackNumber)) {
          numberSequence.push(fallbackNumber);
        }
      }

      // Add after-hours number if outside business hours
      if (!isWithinBusinessHours && this.config?.afterHoursNumber) {
        if (!numberSequence.includes(this.config.afterHoursNumber)) {
          numberSequence.unshift(this.config.afterHoursNumber); // Priority for after-hours
        }
      }
    }

    // Find the first number not yet attempted
    for (const number of numberSequence) {
      if (!attemptedNumbers.includes(number)) {
        return number;
      }
    }

    return null;
  }

  /**
   * Get fallback options when all transfer attempts fail
   */
  getFallbackOptions(): TransferFallbackOptions {
    return {
      voicemailAvailable: this.config?.voicemailEnabled ?? false,
      callbackAvailable: true, // Always offer callback as last resort
      alternativeNumberAvailable: !!this.config?.afterHoursNumber || !!this.config?.fallbackNumber,
      alternativeNumber: this.config?.afterHoursNumber || this.config?.fallbackNumber || undefined,
      voicemailGreeting: this.config?.voicemailGreeting || undefined,
    };
  }

  /**
   * Get the appropriate user message for a failure type
   */
  getFailureMessage(failureType: TransferFailureType): string {
    return DEFAULT_TRANSFER_FAILURE_MESSAGES[failureType] || DEFAULT_TRANSFER_FAILURE_MESSAGES['UNKNOWN' as TransferFailureType];
  }

  /**
   * Handle a transfer failure and determine next steps
   */
  async handleTransferFailure(
    escalationId: string,
    callId: string,
    primaryNumber: string,
    failureSignal: {
      code?: string;
      message?: string;
      sipCode?: number;
      vapiStatus?: string;
    },
    previousAttempts: TransferAttemptResult[],
    isWithinBusinessHours: boolean
  ): Promise<TransferWithRetryResult> {
    const failureType = this.detectFailureType(failureSignal);
    const attemptNumber = previousAttempts.length + 1;

    // Record this attempt
    const thisAttempt: TransferAttemptResult = {
      success: false,
      attemptedNumber: primaryNumber,
      failureType,
      errorMessage: failureSignal.message,
      timestamp: new Date(),
    };
    const allAttempts = [...previousAttempts, thisAttempt];

    // Emit status update for the failed attempt
    this.emitStatusUpdate({
      escalationId,
      callId,
      status: 'PENDING',
      updateType: 'ATTEMPT_FAILED',
      details: {
        attemptNumber,
        targetNumber: primaryNumber,
        failureType,
        errorMessage: failureSignal.message,
      },
      timestamp: new Date(),
    });

    // Log the failure
    logger.warn('Transfer attempt failed', {
      escalationId,
      callId,
      attemptNumber,
      failureType,
      targetNumber: primaryNumber,
      errorMessage: failureSignal.message,
    });

    // Update escalation log with attempt info
    await this.updateEscalationAttemptInfo(escalationId, thisAttempt).catch(err => {
      logger.error('Failed to update escalation attempt info', { error: err });
    });

    // Check if we should retry
    const shouldRetry = this.isRetryable(failureType) && attemptNumber < this.retryConfig.maxAttempts;
    const attemptedNumbers = allAttempts.map(a => a.attemptedNumber);

    if (shouldRetry) {
      // Try the same number again or get next fallback
      const nextNumber = this.getNextNumber(primaryNumber, attemptedNumbers, isWithinBusinessHours);

      if (nextNumber) {
        const isFallback = nextNumber !== primaryNumber;

        // Emit status update for fallback/retry
        this.emitStatusUpdate({
          escalationId,
          callId,
          status: 'PENDING',
          updateType: isFallback ? 'FALLBACK_STARTED' : 'ATTEMPT_STARTED',
          details: {
            attemptNumber: attemptNumber + 1,
            targetNumber: nextNumber,
            nextAction: 'retry',
          },
          timestamp: new Date(),
        });

        return {
          success: false,
          status: 'PENDING',
          attempts: allAttempts,
          totalAttempts: attemptNumber,
          fallbackUsed: isFallback,
          callerMessage: this.getRetryMessage(failureType, attemptNumber),
        };
      }
    }

    // All retries exhausted or not retryable - get fallback options
    const fallbackOptions = this.getFallbackOptions();

    // Determine final status and message
    let finalStatus: EscalationStatus = 'FAILED';
    let callerMessage = this.getFailureMessage(failureType);

    // Customize message based on available options
    if (fallbackOptions.voicemailAvailable) {
      callerMessage += ' Möchten Sie eine Nachricht auf der Mailbox hinterlassen?';
    } else if (fallbackOptions.callbackAvailable) {
      callerMessage += ' Kann ich einen Rückruf für Sie vereinbaren?';
    }

    // Emit final failure status
    this.emitStatusUpdate({
      escalationId,
      callId,
      status: finalStatus,
      updateType: 'TRANSFER_FAILED',
      details: {
        attemptNumber,
        failureType,
        errorMessage: `All ${attemptNumber} attempts failed`,
        nextAction: fallbackOptions.voicemailAvailable ? 'voicemail' : 'callback',
      },
      timestamp: new Date(),
    });

    // Update database with final status
    await this.updateEscalationStatus(escalationId, callId, finalStatus, failureType, failureSignal.message);

    return {
      success: false,
      status: finalStatus,
      attempts: allAttempts,
      totalAttempts: attemptNumber,
      fallbackUsed: attemptedNumbers.length > 1,
      finalFailureReason: failureSignal.message || `Transfer failed: ${failureType}`,
      finalFailureType: failureType,
      fallbackOptions,
      callerMessage,
    };
  }

  /**
   * Get a message for when retrying the transfer
   */
  private getRetryMessage(failureType: TransferFailureType, attemptNumber: number): string {
    const baseMessages: Record<string, string> = {
      'BUSY': 'Die Leitung war besetzt. Ich versuche es noch einmal.',
      'NO_ANSWER': 'Es hat niemand abgenommen. Einen Moment bitte, ich versuche es erneut.',
      'NETWORK_ERROR': 'Es gab ein technisches Problem. Ich versuche es noch einmal.',
      'TIMEOUT': 'Die Verbindung hat zu lange gedauert. Ich versuche es erneut.',
    };

    const baseMessage = baseMessages[failureType] || 'Einen Moment bitte, ich versuche es erneut.';

    if (attemptNumber >= 2) {
      return `${baseMessage} Dies ist der ${attemptNumber + 1}. Versuch.`;
    }

    return baseMessage;
  }

  /**
   * Update escalation record with attempt information
   */
  private async updateEscalationAttemptInfo(
    escalationId: string,
    attempt: TransferAttemptResult
  ): Promise<void> {
    // Get current escalation log
    const log = await prisma.escalationLog.findUnique({
      where: { id: escalationId },
    });

    if (!log) {
      logger.warn('Escalation log not found for attempt update', { escalationId });
      return;
    }

    // Update with attempt info - store in resolutionNotes and increment transferAttempts
    const currentNotes = log.resolutionNotes || '';
    const attemptNote = `[${attempt.timestamp.toISOString()}] Attempt to ${attempt.attemptedNumber}: ${attempt.success ? 'SUCCESS' : `FAILED (${attempt.failureType})`}${attempt.errorMessage ? ` - ${attempt.errorMessage}` : ''}`;

    await prisma.escalationLog.update({
      where: { id: escalationId },
      data: {
        resolutionNotes: currentNotes ? `${currentNotes}\n${attemptNote}` : attemptNote,
        transferAttempts: { increment: 1 },
      },
    });
  }

  /**
   * Update escalation and call status after final failure
   */
  private async updateEscalationStatus(
    escalationId: string,
    callId: string,
    status: EscalationStatus,
    failureType: TransferFailureType,
    errorMessage?: string
  ): Promise<void> {
    try {
      // Update escalation log
      await prisma.escalationLog.update({
        where: { id: escalationId },
        data: {
          status,
          failureReason: `${failureType}${errorMessage ? `: ${errorMessage}` : ''}`,
          transferCompletedAt: new Date(),
        },
      });

      // Update call record
      await prisma.call.update({
        where: { id: callId },
        data: {
          escalationStatus: status,
        },
      });

      logger.info('Updated escalation status after failure', {
        escalationId,
        callId,
        status,
        failureType,
      });
    } catch (error) {
      logger.error('Failed to update escalation status', {
        escalationId,
        callId,
        error,
      });
    }
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
    const callbackId = `cb_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Get the call record to find user/agent info
    const call = await prisma.call.findUnique({
      where: { id: callId },
      include: { agent: true },
    });

    if (!call) {
      throw notFoundError('Call', callId);
    }

    // Calculate due by time based on priority
    const dueByHours: Record<string, number> = {
      'urgent': 1,
      'high': 4,
      'normal': 24,
      'low': 48,
    };
    const priority = options?.priority || 'normal';
    const dueBy = new Date(Date.now() + dueByHours[priority] * 60 * 60 * 1000);

    // Create callback request in event log (using existing table)
    await prisma.eventLog.create({
      data: {
        userId: call.userId,
        eventType: 'callback_requested',
        eventData: {
          callbackId,
          escalationId,
          callId,
          callerPhone,
          callerName: options?.callerName,
          reason,
          priority,
          preferredTime: options?.preferredTime,
          status: 'PENDING',
          dueBy: dueBy.toISOString(),
          notes: options?.notes,
          agentId: call.agentId,
          agentName: call.agent.name,
        },
      },
    });

    // Emit status update
    this.emitStatusUpdate({
      escalationId,
      callId,
      status: 'FAILED',
      updateType: 'CALLBACK_OFFERED',
      details: {
        nextAction: 'callback_scheduled',
      },
      timestamp: new Date(),
    });

    logger.info('Callback request created', {
      callbackId,
      escalationId,
      callId,
      callerPhone,
      priority,
      dueBy,
    });

    return {
      id: callbackId,
      callId,
      escalationId,
      callerPhone,
      callerName: options?.callerName,
      preferredTime: options?.preferredTime,
      reason: reason,
      priority,
      status: 'PENDING',
      createdAt: new Date(),
      dueBy,
      notes: options?.notes,
    };
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
    const voicemailGreeting = this.config?.voicemailGreeting ||
      'Sie haben die Mailbox erreicht. Bitte hinterlassen Sie nach dem Signalton eine Nachricht mit Ihrem Namen und Ihrer Rückrufnummer. Wir werden Sie schnellstmöglich zurückrufen.';

    // Update escalation status
    await prisma.escalationLog.update({
      where: { id: escalationId },
      data: {
        status: 'FAILED',
        failureReason: 'Voicemail fallback - all transfer attempts failed',
        resolutionNotes: conversationSummary ? `Voicemail fallback. Summary: ${conversationSummary}` : 'Voicemail fallback',
        voicemailLeft: true,
      },
    });

    // Update call status
    await prisma.call.update({
      where: { id: callId },
      data: {
        escalationStatus: 'FAILED',
      },
    });

    // Emit status update
    this.emitStatusUpdate({
      escalationId,
      callId,
      status: 'FAILED',
      updateType: 'VOICEMAIL_FALLBACK',
      details: {
        nextAction: 'voicemail',
      },
      timestamp: new Date(),
    });

    logger.info('Voicemail fallback activated', {
      escalationId,
      callId,
      reason,
    });

    return {
      voicemailGreeting,
      status: 'FAILED',
    };
  }

  /**
   * Generate comprehensive status message for the caller
   */
  generateCallerStatusMessage(
    failureType: TransferFailureType,
    attemptNumber: number,
    fallbackOptions: TransferFallbackOptions,
    isRetrying: boolean
  ): string {
    if (isRetrying) {
      return this.getRetryMessage(failureType, attemptNumber);
    }

    let message = this.getFailureMessage(failureType);

    // Build options message
    const options: string[] = [];
    if (fallbackOptions.voicemailAvailable) {
      options.push('eine Nachricht hinterlassen');
    }
    if (fallbackOptions.callbackAvailable) {
      options.push('einen Rückruf vereinbaren');
    }
    if (fallbackOptions.alternativeNumberAvailable) {
      options.push('eine alternative Nummer versuchen');
    }

    if (options.length > 0) {
      const optionsText = options.join(', oder ');
      message += ` Möchten Sie ${optionsText}?`;
    }

    return message;
  }
}

// Export singleton instance
export const transferErrorHandler = new TransferErrorHandler();
