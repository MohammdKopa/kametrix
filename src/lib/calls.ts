import { prisma } from '@/lib/prisma';
import { CallStatus } from '@/generated/prisma/client';
import { getOAuth2ClientForUser } from '@/lib/google/auth';
import { getOrCreateLogSheet, appendCallLog } from '@/lib/google/sheets';

/**
 * Webhook payload type definitions
 */

export interface WebhookStatusUpdate {
  type: 'status-update';
  call: {
    id: string;
    assistantId: string;
    startedAt?: string;
    customer?: {
      number?: string;
    };
  };
  status: string;
}

export interface WebhookEndOfCall {
  type: 'end-of-call-report';
  call: {
    id: string;
    assistantId: string;
    startedAt?: string;
    endedAt?: string;
    // Vapi may send duration directly as seconds or milliseconds
    duration?: number;
    durationSeconds?: number;
    durationMinutes?: number;
    customer?: {
      number?: string;
    };
  };
  artifact?: {
    transcript?: string;
    messages?: any[];
    summary?: string;
    toolCalls?: Array<{
      function?: {
        name?: string;
        arguments?: any;
      };
    }>;
  };
  endedReason: string;
  // Some reports include duration at message level
  duration?: number;
  durationSeconds?: number;
}

export interface WebhookCallData {
  vapiCallId: string;
  assistantId: string;
  phoneNumber: string;
  status: CallStatus;
  startedAt: Date;
  endedAt?: Date;
  durationSeconds?: number;
  transcript?: string;
}

/**
 * Find agent and user by Vapi assistant ID
 *
 * @param assistantId - Vapi assistant ID
 * @returns Agent with user relation, or null if not found
 */
export async function findAgentByVapiAssistantId(assistantId: string) {
  return prisma.agent.findUnique({
    where: { vapiAssistantId: assistantId },
    include: { user: true },
  });
}

/**
 * Create or update a call record from webhook data
 *
 * @param data - Call data from webhook
 * @returns Created or updated call record
 */
export async function upsertCallFromWebhook(data: WebhookCallData) {
  const agent = await findAgentByVapiAssistantId(data.assistantId);

  if (!agent) {
    console.warn(`Cannot upsert call: agent not found for assistantId ${data.assistantId}`);
    throw new Error(`Agent not found for assistantId: ${data.assistantId}`);
  }

  // Check if call exists
  const existingCall = await prisma.call.findUnique({
    where: { vapiCallId: data.vapiCallId },
  });

  if (existingCall) {
    // Update existing call
    return prisma.call.update({
      where: { vapiCallId: data.vapiCallId },
      data: {
        status: data.status,
        endedAt: data.endedAt,
        durationSeconds: data.durationSeconds,
        transcript: data.transcript,
      },
    });
  } else {
    // Create new call record
    return prisma.call.create({
      data: {
        vapiCallId: data.vapiCallId,
        agentId: agent.id,
        userId: agent.userId,
        phoneNumber: data.phoneNumber,
        status: data.status,
        startedAt: data.startedAt,
        endedAt: data.endedAt,
        durationSeconds: data.durationSeconds,
        transcript: data.transcript,
        creditsUsed: 0, // Phase 5 will handle credit calculation
      },
    });
  }
}

/**
 * Map Vapi endedReason to our CallStatus enum
 *
 * @param endedReason - Reason code from Vapi
 * @returns Corresponding CallStatus
 */
export function mapEndedReasonToStatus(endedReason: string): CallStatus {
  switch (endedReason) {
    case 'assistant-ended':
    case 'customer-ended-call':
    case 'pipeline-error-openai-voice-failed':
      return CallStatus.COMPLETED;

    case 'assistant-error':
    case 'pipeline-error-exceeds-silence-threshold':
      return CallStatus.FAILED;

    case 'customer-did-not-answer':
    case 'customer-did-not-give-microphone-permission':
      return CallStatus.NO_ANSWER;

    default:
      console.log(`Unknown endedReason: ${endedReason}, defaulting to COMPLETED`);
      return CallStatus.COMPLETED;
  }
}

/**
 * Extract call duration in seconds from Vapi payload
 *
 * Tries multiple sources as Vapi payload structure can vary:
 * 1. Direct durationSeconds field
 * 2. Duration in seconds from call object
 * 3. Duration in minutes (converted)
 * 4. Calculated from startedAt/endedAt timestamps
 *
 * @param message - Full end-of-call-report message
 * @returns Duration in seconds, or null if not available
 */
export function extractCallDuration(message: WebhookEndOfCall): number | null {
  const { call } = message;

  // Try durationSeconds at message level
  if (typeof message.durationSeconds === 'number') {
    return Math.floor(message.durationSeconds);
  }

  // Try duration at message level (might be seconds)
  if (typeof message.duration === 'number') {
    // If > 1000, likely milliseconds
    if (message.duration > 1000) {
      return Math.floor(message.duration / 1000);
    }
    return Math.floor(message.duration);
  }

  // Try durationSeconds at call level
  if (typeof call.durationSeconds === 'number') {
    return Math.floor(call.durationSeconds);
  }

  // Try duration at call level
  if (typeof call.duration === 'number') {
    // If > 1000, likely milliseconds
    if (call.duration > 1000) {
      return Math.floor(call.duration / 1000);
    }
    return Math.floor(call.duration);
  }

  // Try durationMinutes (convert to seconds)
  if (typeof call.durationMinutes === 'number') {
    return Math.floor(call.durationMinutes * 60);
  }

  // Fall back to calculating from timestamps
  return calculateCallDuration(call.startedAt, call.endedAt);
}

/**
 * Calculate call duration in seconds from start and end timestamps
 *
 * @param startedAt - ISO timestamp when call started
 * @param endedAt - ISO timestamp when call ended
 * @returns Duration in seconds, or null if timestamps invalid
 */
export function calculateCallDuration(
  startedAt: string | undefined,
  endedAt: string | undefined
): number | null {
  if (!startedAt || !endedAt) {
    return null;
  }

  try {
    const start = new Date(startedAt).getTime();
    const end = new Date(endedAt).getTime();

    if (isNaN(start) || isNaN(end)) {
      return null;
    }

    return Math.floor((end - start) / 1000);
  } catch (error) {
    console.error('Error calculating duration:', error);
    return null;
  }
}

/**
 * Log a call to Google Sheets (non-blocking, fire-and-forget)
 *
 * @param userId - User ID to get Google credentials
 * @param callData - Call data from webhook
 */
export async function logCallToSheets(
  userId: string,
  callData: {
    startedAt: Date;
    phoneNumber: string;
    agentName: string;
    durationSeconds?: number | null;
    status: CallStatus;
    summary?: string | null;
    transcript?: string | null;
    appointmentBooked?: boolean;
  }
): Promise<void> {
  try {
    // Get OAuth client for user
    const oauth2Client = await getOAuth2ClientForUser(userId);
    if (!oauth2Client) {
      // User hasn't connected Google - skip silently
      return;
    }

    // Get or create the log sheet
    const sheetId = await getOrCreateLogSheet(oauth2Client, userId);

    // Format status for display
    const statusDisplay = callData.status
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());

    // Extract summary from transcript if no summary provided
    let summary = callData.summary || '';
    if (!summary && callData.transcript) {
      // Use first 100 chars of transcript as summary
      summary = callData.transcript.substring(0, 100);
      if (callData.transcript.length > 100) {
        summary += '...';
      }
    }

    // Append call log to sheet
    await appendCallLog(oauth2Client, sheetId, {
      startedAt: callData.startedAt,
      phoneNumber: callData.phoneNumber,
      agentName: callData.agentName,
      durationSeconds: callData.durationSeconds,
      status: statusDisplay,
      summary,
      appointmentBooked: callData.appointmentBooked,
    });
  } catch (error) {
    // Log error but don't throw - this is fire-and-forget
    console.error('Error logging call to Sheets:', error);
  }
}
