/**
 * Escalation Logger
 *
 * Handles logging and analytics for escalation events.
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/errors/logger';
import type { EscalationReason, EscalationStatus, EscalationLog } from '@/generated/prisma/client';
import type { EscalationAnalytics } from '@/types/escalation';

/**
 * Log an escalation event
 */
export async function logEscalationEvent(
  data: {
    callId: string;
    agentId: string;
    userId: string;
    reason: EscalationReason;
    status: EscalationStatus;
    transferNumber?: string;
    transferQueue?: string;
    conversationSummary?: string;
    lastAiMessage?: string;
    lastUserMessage?: string;
    callerSentiment?: string;
    sentimentScore?: number;
    clarificationCount?: number;
    callDurationAtEscalation?: number;
  }
): Promise<EscalationLog> {
  const log = await prisma.escalationLog.create({
    data: {
      callId: data.callId,
      agentId: data.agentId,
      userId: data.userId,
      reason: data.reason,
      status: data.status,
      transferNumber: data.transferNumber,
      transferQueue: data.transferQueue,
      transferStartedAt: new Date(),
      conversationSummary: data.conversationSummary,
      lastAiMessage: data.lastAiMessage,
      lastUserMessage: data.lastUserMessage,
      callerSentiment: data.callerSentiment,
      sentimentScore: data.sentimentScore,
      clarificationCount: data.clarificationCount || 0,
      callDurationAtEscalation: data.callDurationAtEscalation,
    },
  });

  logger.info('Escalation event logged', {
    escalationId: log.id,
    callId: data.callId,
    reason: data.reason,
    status: data.status,
  });

  // Also log to EventLog for audit trail
  await prisma.eventLog.create({
    data: {
      userId: data.userId,
      eventType: 'call_escalated',
      eventData: {
        callId: data.callId,
        agentId: data.agentId,
        escalationId: log.id,
        reason: data.reason,
        status: data.status,
      },
    },
  });

  return log;
}

/**
 * Get escalation history for a user or agent
 */
export async function getEscalationHistory(
  params: {
    userId?: string;
    agentId?: string;
    status?: EscalationStatus;
    reason?: EscalationReason;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    cursor?: string;
  }
): Promise<{
  escalations: EscalationLog[];
  nextCursor?: string;
  total: number;
}> {
  const {
    userId,
    agentId,
    status,
    reason,
    startDate,
    endDate,
    limit = 20,
    cursor,
  } = params;

  const where = {
    ...(userId && { userId }),
    ...(agentId && { agentId }),
    ...(status && { status }),
    ...(reason && { reason }),
    ...((startDate || endDate) && {
      triggeredAt: {
        ...(startDate && { gte: startDate }),
        ...(endDate && { lte: endDate }),
      },
    }),
    ...(cursor && { id: { lt: cursor } }),
  };

  const [escalations, total] = await Promise.all([
    prisma.escalationLog.findMany({
      where,
      orderBy: { triggeredAt: 'desc' },
      take: limit + 1, // Fetch one extra to check if there are more
    }),
    prisma.escalationLog.count({ where: { ...where, id: undefined } }),
  ]);

  const hasMore = escalations.length > limit;
  if (hasMore) {
    escalations.pop();
  }

  return {
    escalations,
    nextCursor: hasMore ? escalations[escalations.length - 1]?.id : undefined,
    total,
  };
}

/**
 * Get escalation analytics for reporting
 */
export async function getEscalationAnalytics(
  params: {
    userId?: string;
    agentId?: string;
    startDate: Date;
    endDate: Date;
  }
): Promise<EscalationAnalytics> {
  const { userId, agentId, startDate, endDate } = params;

  const where = {
    ...(userId && { userId }),
    ...(agentId && { agentId }),
    triggeredAt: {
      gte: startDate,
      lte: endDate,
    },
  };

  // Get all escalations in the period
  const escalations = await prisma.escalationLog.findMany({
    where,
    select: {
      reason: true,
      status: true,
      waitTimeSeconds: true,
      wasResolved: true,
      callDurationAtEscalation: true,
      triggeredAt: true,
      lastUserMessage: true,
    },
  });

  // Calculate totals by reason
  const byReason: Record<EscalationReason, number> = {
    USER_REQUEST: 0,
    LOW_CONFIDENCE: 0,
    REPEATED_CLARIFICATION: 0,
    UNRECOGNIZED_INTENT: 0,
    COMPLEX_ISSUE: 0,
    SENTIMENT_NEGATIVE: 0,
    MAX_DURATION: 0,
    EXPLICIT_TRIGGER: 0,
  };

  // Calculate totals by status
  const byStatus: Record<EscalationStatus, number> = {
    PENDING: 0,
    IN_QUEUE: 0,
    CONNECTED: 0,
    FAILED: 0,
    NO_OPERATORS: 0,
    TIMEOUT: 0,
    CANCELLED: 0,
  };

  let totalWaitTime = 0;
  let waitTimeCount = 0;
  let successCount = 0;
  let resolvedCount = 0;
  let totalDurationBeforeEscalation = 0;
  let durationCount = 0;
  const hourCounts: number[] = new Array(24).fill(0);
  const triggerPhraseMap = new Map<string, number>();

  for (const escalation of escalations) {
    // Count by reason
    byReason[escalation.reason]++;

    // Count by status
    byStatus[escalation.status]++;

    // Calculate wait time
    if (escalation.waitTimeSeconds) {
      totalWaitTime += escalation.waitTimeSeconds;
      waitTimeCount++;
    }

    // Count successes
    if (escalation.status === 'CONNECTED') {
      successCount++;
    }

    // Count resolutions
    if (escalation.wasResolved) {
      resolvedCount++;
    }

    // Calculate duration before escalation
    if (escalation.callDurationAtEscalation) {
      totalDurationBeforeEscalation += escalation.callDurationAtEscalation;
      durationCount++;
    }

    // Track peak hours
    const hour = escalation.triggeredAt.getHours();
    hourCounts[hour]++;

    // Track trigger phrases from user messages that led to USER_REQUEST escalations
    if (escalation.reason === 'USER_REQUEST' && escalation.lastUserMessage) {
      const normalizedMsg = escalation.lastUserMessage.toLowerCase().substring(0, 100);
      triggerPhraseMap.set(
        normalizedMsg,
        (triggerPhraseMap.get(normalizedMsg) || 0) + 1
      );
    }
  }

  // Find peak hours (hours with above-average escalations)
  const avgHourCount = escalations.length / 24;
  const peakHours = hourCounts
    .map((count, hour) => ({ hour, count }))
    .filter(({ count }) => count > avgHourCount)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map(({ hour }) => hour);

  // Get top trigger phrases
  const commonTriggerPhrases = Array.from(triggerPhraseMap.entries())
    .map(([phrase, count]) => ({ phrase, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalEscalations: escalations.length,
    byReason,
    byStatus,
    averageWaitTime: waitTimeCount > 0 ? totalWaitTime / waitTimeCount : 0,
    successRate: escalations.length > 0 ? successCount / escalations.length : 0,
    resolutionRate: successCount > 0 ? resolvedCount / successCount : 0,
    averageCallDurationBeforeEscalation:
      durationCount > 0 ? totalDurationBeforeEscalation / durationCount : 0,
    peakEscalationHours: peakHours,
    commonTriggerPhrases,
  };
}

/**
 * Update escalation log with resolution data
 */
export async function updateEscalationResolution(
  escalationId: string,
  data: {
    wasResolved?: boolean;
    customerSatisfied?: boolean;
    resolutionNotes?: string;
    humanAgentId?: string;
  }
): Promise<EscalationLog> {
  return prisma.escalationLog.update({
    where: { id: escalationId },
    data: {
      wasResolved: data.wasResolved,
      customerSatisfied: data.customerSatisfied,
      resolutionNotes: data.resolutionNotes,
      humanAgentId: data.humanAgentId,
    },
  });
}

/**
 * Get escalation summary for a specific call
 */
export async function getCallEscalationSummary(
  callId: string
): Promise<EscalationLog | null> {
  return prisma.escalationLog.findUnique({
    where: { callId },
  });
}
