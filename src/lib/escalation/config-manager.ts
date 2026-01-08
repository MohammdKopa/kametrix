/**
 * Escalation Configuration Manager
 *
 * Handles CRUD operations for escalation configurations.
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/errors/logger';
import type { EscalationConfig } from '@/generated/prisma/client';
import type { EscalationConfigInput } from '@/types/escalation';
import { DEFAULT_TRIGGER_PHRASES } from '@/types/escalation';

/**
 * Get escalation configuration for an agent
 */
export async function getEscalationConfig(
  agentId: string
): Promise<EscalationConfig | null> {
  return prisma.escalationConfig.findUnique({
    where: { agentId },
  });
}

/**
 * Create escalation configuration for an agent
 */
export async function createEscalationConfig(
  agentId: string,
  input: EscalationConfigInput
): Promise<EscalationConfig> {
  // Verify agent exists
  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
  });

  if (!agent) {
    throw new Error(`Agent not found: ${agentId}`);
  }

  const config = await prisma.escalationConfig.create({
    data: {
      agentId,
      enabled: input.enabled ?? true,

      // Forwarding destinations
      forwardingNumber: input.forwardingNumber,
      forwardingQueue: input.forwardingQueue,
      forwardingDepartment: input.forwardingDepartment,
      fallbackNumber: input.fallbackNumber,

      // Voicemail settings
      voicemailEnabled: input.voicemailEnabled ?? true,
      voicemailGreeting: input.voicemailGreeting,

      // Business hours
      businessHoursStart: input.businessHoursStart,
      businessHoursEnd: input.businessHoursEnd,
      businessDays: input.businessDays ?? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      afterHoursNumber: input.afterHoursNumber,
      afterHoursMessage: input.afterHoursMessage,
      timezone: input.timezone ?? 'Europe/Berlin',

      // Trigger thresholds
      maxCallDuration: input.maxCallDuration ?? 300,
      maxClarifications: input.maxClarifications ?? 3,
      sentimentThreshold: input.sentimentThreshold ?? -0.5,
      triggerPhrases: input.triggerPhrases ?? [...DEFAULT_TRIGGER_PHRASES],

      // Transfer settings
      maxTransferWaitTime: input.maxTransferWaitTime ?? 60,
      announceTransfer: input.announceTransfer ?? true,
      transferMessage: input.transferMessage,
      holdMusicUrl: input.holdMusicUrl,

      // Context sharing
      shareTranscript: input.shareTranscript ?? true,
      shareSummary: input.shareSummary ?? true,
      shareCallerInfo: input.shareCallerInfo ?? true,
    },
  });

  logger.info('Escalation config created', { agentId, configId: config.id });

  return config;
}

/**
 * Update escalation configuration for an agent
 */
export async function updateEscalationConfig(
  agentId: string,
  input: Partial<EscalationConfigInput>
): Promise<EscalationConfig> {
  const existing = await prisma.escalationConfig.findUnique({
    where: { agentId },
  });

  if (!existing) {
    // Create if doesn't exist
    return createEscalationConfig(agentId, input);
  }

  const config = await prisma.escalationConfig.update({
    where: { agentId },
    data: {
      ...(input.enabled !== undefined && { enabled: input.enabled }),

      // Forwarding destinations
      ...(input.forwardingNumber !== undefined && {
        forwardingNumber: input.forwardingNumber,
      }),
      ...(input.forwardingQueue !== undefined && {
        forwardingQueue: input.forwardingQueue,
      }),
      ...(input.forwardingDepartment !== undefined && {
        forwardingDepartment: input.forwardingDepartment,
      }),
      ...(input.fallbackNumber !== undefined && {
        fallbackNumber: input.fallbackNumber,
      }),

      // Voicemail settings
      ...(input.voicemailEnabled !== undefined && {
        voicemailEnabled: input.voicemailEnabled,
      }),
      ...(input.voicemailGreeting !== undefined && {
        voicemailGreeting: input.voicemailGreeting,
      }),

      // Business hours
      ...(input.businessHoursStart !== undefined && {
        businessHoursStart: input.businessHoursStart,
      }),
      ...(input.businessHoursEnd !== undefined && {
        businessHoursEnd: input.businessHoursEnd,
      }),
      ...(input.businessDays !== undefined && { businessDays: input.businessDays }),
      ...(input.afterHoursNumber !== undefined && {
        afterHoursNumber: input.afterHoursNumber,
      }),
      ...(input.afterHoursMessage !== undefined && {
        afterHoursMessage: input.afterHoursMessage,
      }),
      ...(input.timezone !== undefined && { timezone: input.timezone }),

      // Trigger thresholds
      ...(input.maxCallDuration !== undefined && {
        maxCallDuration: input.maxCallDuration,
      }),
      ...(input.maxClarifications !== undefined && {
        maxClarifications: input.maxClarifications,
      }),
      ...(input.sentimentThreshold !== undefined && {
        sentimentThreshold: input.sentimentThreshold,
      }),
      ...(input.triggerPhrases !== undefined && {
        triggerPhrases: input.triggerPhrases,
      }),

      // Transfer settings
      ...(input.maxTransferWaitTime !== undefined && {
        maxTransferWaitTime: input.maxTransferWaitTime,
      }),
      ...(input.announceTransfer !== undefined && {
        announceTransfer: input.announceTransfer,
      }),
      ...(input.transferMessage !== undefined && {
        transferMessage: input.transferMessage,
      }),
      ...(input.holdMusicUrl !== undefined && { holdMusicUrl: input.holdMusicUrl }),

      // Context sharing
      ...(input.shareTranscript !== undefined && {
        shareTranscript: input.shareTranscript,
      }),
      ...(input.shareSummary !== undefined && { shareSummary: input.shareSummary }),
      ...(input.shareCallerInfo !== undefined && {
        shareCallerInfo: input.shareCallerInfo,
      }),
    },
  });

  logger.info('Escalation config updated', { agentId, configId: config.id });

  return config;
}

/**
 * Delete escalation configuration for an agent
 */
export async function deleteEscalationConfig(agentId: string): Promise<void> {
  await prisma.escalationConfig.delete({
    where: { agentId },
  });

  logger.info('Escalation config deleted', { agentId });
}

/**
 * Check if escalation is enabled for an agent
 */
export async function isEscalationEnabled(agentId: string): Promise<boolean> {
  const config = await prisma.escalationConfig.findUnique({
    where: { agentId },
    select: { enabled: true },
  });

  return config?.enabled ?? false;
}

/**
 * Get default escalation configuration template
 */
export function getDefaultEscalationConfig(): EscalationConfigInput {
  return {
    enabled: true,
    voicemailEnabled: true,
    businessDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    timezone: 'Europe/Berlin',
    maxCallDuration: 300,
    maxClarifications: 3,
    sentimentThreshold: -0.5,
    triggerPhrases: [...DEFAULT_TRIGGER_PHRASES],
    maxTransferWaitTime: 60,
    announceTransfer: true,
    shareTranscript: true,
    shareSummary: true,
    shareCallerInfo: true,
  };
}
