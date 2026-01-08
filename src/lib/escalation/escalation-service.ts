/**
 * Escalation Service
 *
 * Main service for handling call escalations and transfers.
 * Coordinates between detection, configuration, and transfer execution.
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/errors/logger';
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
} from '@/types/escalation';
import { EscalationDetector, type ConversationContext } from './escalation-detector';

/**
 * EscalationService class
 *
 * Handles the full lifecycle of call escalation:
 * 1. Detecting when escalation is needed
 * 2. Checking operator availability
 * 3. Initiating and managing transfers
 * 4. Recording escalation events
 */
export class EscalationService {
  private detector: EscalationDetector;

  constructor() {
    this.detector = new EscalationDetector();
  }

  /**
   * Initialize detector with agent-specific configuration
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
}

// Export a singleton instance
export const escalationService = new EscalationService();
