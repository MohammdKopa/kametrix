import { NextRequest, NextResponse } from 'next/server';
import {
  findAgentByVapiAssistantId,
  upsertCallFromWebhook,
  mapEndedReasonToStatus,
  extractCallDuration,
  extractTransferFailureInfo,
  logCallToSheets,
  type WebhookStatusUpdate,
  type WebhookEndOfCall,
} from '@/lib/calls';
import { CallStatus } from '@/generated/prisma/client';
import { getOAuth2ClientForUser } from '@/lib/google/auth';
import {
  getAvailableSlots,
  bookAppointment,
  parseDateTime,
  parseDateInput,
  parseTimeInput,
  parseRecurrenceInput,
  rescheduleEvent,
  deleteEvent,
  cancelRecurringInstance,
  listEvents,
  searchEvents,
  findNextAvailableSlot,
  checkConflicts,
  filterSlotsByTimeRange,
  getValidTimezone,
  CalendarError,
  CalendarErrorType,
} from '@/lib/google/calendar';
import { prisma } from '@/lib/prisma';
import { deductCreditsForCall, isLowBalance } from '@/lib/credits';
import { sendLowCreditEmail } from '@/lib/email';
import { formatDateGerman } from '@/lib/localization';
import { verifyVapiWebhook, extractVapiAuthHeaders } from '@/lib/webhook-auth';
import { buildDateHeader, buildCalendarTools } from '@/lib/prompts';
import { logInvalidWebhookSignature } from '@/lib/security';
import {
  EscalationService,
  EscalationDetector,
  logEscalationEvent,
  buildEscalationTools,
  isEscalationTool,
  realTimeTracker,
  type ConversationMessage,
} from '@/lib/escalation';
import { runInBackground, runAllInBackground } from '@/lib/background-jobs';
import { WebhookRequestContext, createWebhookContext } from '@/lib/webhook-request-context';
import { metrics, MetricNames, parallelQueries, queryCache } from '@/lib/performance';
import type { EscalateCallArgs, CheckOperatorAvailabilityArgs, VapiTransferAction, TransferFailureType } from '@/types/escalation';

// ============================================
// Constants and Configuration
// ============================================

/**
 * Vapi webhook timeout constraint (7.5 seconds)
 * We use 7 seconds as our internal limit to leave buffer for response serialization
 */
const VAPI_TIMEOUT_MS = 7500;
const INTERNAL_TIMEOUT_MS = 7000;

/**
 * Tool call timeout - shorter to ensure we respond in time
 */
const TOOL_CALL_TIMEOUT_MS = 6500;

// ============================================
// Type Definitions
// ============================================

/**
 * Tool call payload from Vapi
 */
interface ToolCall {
  id: string; // toolCallId to reference in response
  type: 'function';
  function: {
    name: string;
    arguments: string | Record<string, unknown>; // Can be JSON string or object
  };
}

interface WebhookToolCalls {
  type: 'tool-calls';
  toolCallList: ToolCall[];
  call: {
    id: string;
    assistantId: string;
  };
}

/**
 * Conversation update payload from Vapi
 * Contains real-time messages during active calls
 */
interface WebhookConversationUpdate {
  type: 'conversation-update';
  messages?: Array<{
    role: 'user' | 'assistant' | 'system' | 'tool';
    message?: string;
    content?: string;
    time?: number; // Unix timestamp in milliseconds
  }>;
  call: {
    id: string;
    assistantId: string;
    startedAt?: string;
  };
}

/**
 * Auto-escalation action to inject into Vapi response
 * This allows us to trigger automatic escalation mid-conversation
 */
interface AutoEscalationResult {
  triggered: boolean;
  reason?: string;
  confidence?: number;
}

// ============================================
// Timeout Utilities
// ============================================

/**
 * Wraps an async function with a timeout
 * Returns the result or throws TimeoutError if exceeded
 */
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operationName: string
): Promise<T> {
  let timeoutId: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Operation '${operationName}' timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId!);
    return result;
  } catch (error) {
    clearTimeout(timeoutId!);
    throw error;
  }
}

/**
 * Monitors operation timing and logs warnings for slow operations
 */
function createTimingMonitor(operationName: string, warningThresholdMs = 1000) {
  const startTime = Date.now();

  return {
    checkpoint: (label: string) => {
      const elapsed = Date.now() - startTime;
      if (elapsed > warningThresholdMs) {
        console.warn(`[TIMING] ${operationName}/${label}: ${elapsed}ms (threshold: ${warningThresholdMs}ms)`);
      }
    },
    end: () => {
      const elapsed = Date.now() - startTime;
      if (elapsed > warningThresholdMs) {
        console.warn(`[TIMING] ${operationName} completed in ${elapsed}ms (threshold: ${warningThresholdMs}ms)`);
      }
      return elapsed;
    },
  };
}

// ============================================
// Main Webhook Handler
// ============================================

/**
 * Vapi webhook endpoint - handles server URL events
 *
 * Events received:
 * - status-update: Call status changes (ringing, in-progress, ended)
 * - end-of-call-report: Final call data with transcript
 * - transcript: Real-time transcript updates
 * - tool-calls: Custom function calls (calendar booking, etc.)
 *
 * CRITICAL: Must respond within 7.5 seconds or Vapi will timeout
 * CRITICAL: Uses request.text() NOT request.json() for signature verification
 *
 * PERFORMANCE OPTIMIZATIONS:
 * - Request-level caching via WebhookRequestContext
 * - Background job queue for non-critical operations
 * - Parallel database queries where possible
 * - Timeout monitoring and alerting
 */
export async function POST(req: NextRequest) {
  const timing = createTimingMonitor('POST /api/webhooks/vapi');

  try {
    // Get raw body FIRST for signature verification
    const rawBody = await req.text();
    timing.checkpoint('body-read');

    // Verify webhook authentication if VAPI_WEBHOOK_SECRET is configured
    const secret = process.env.VAPI_WEBHOOK_SECRET;
    if (secret) {
      // Extract all possible auth headers
      const authHeaders = extractVapiAuthHeaders(req.headers);

      // Try verification using all supported methods
      const authResult = verifyVapiWebhook(rawBody, authHeaders, secret);

      if (!authResult.isValid) {
        console.error('Vapi webhook: authentication failed', {
          method: authResult.method,
          debug: authResult.debug,
        });

        // Log security audit event for invalid signature (fire-and-forget)
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
          req.headers.get('x-real-ip') || 'unknown';

        runInBackground(
          () => logInvalidWebhookSignature('vapi', ip),
          { name: 'log-invalid-signature' }
        );

        return NextResponse.json(
          {
            error: 'Invalid authentication',
            debug: process.env.NODE_ENV === 'development' ? authResult.debug : undefined,
          },
          { status: 401 }
        );
      }
    }
    timing.checkpoint('auth-verified');

    // Parse JSON AFTER signature verification
    const body = JSON.parse(rawBody);
    const { message } = body;

    // Log only important events (reduce noise from real-time updates)
    const noiseEvents = ['transcript', 'speech-update', 'conversation-update'];
    if (!noiseEvents.includes(message.type)) {
      console.log(`Vapi webhook: ${message.type}`);
    }

    // Create request context for per-request caching
    const ctx = createWebhookContext();

    // Route based on event type
    switch (message.type) {
      case 'status-update':
        // Process asynchronously - don't block response
        handleStatusUpdate(message, ctx).catch(err =>
          console.error('Error handling status update:', err)
        );
        break;

      case 'end-of-call-report':
        // Process asynchronously - don't block response
        handleEndOfCallReport(message, ctx).catch(err =>
          console.error('Error handling end of call:', err)
        );
        break;

      case 'transcript':
      case 'speech-update':
        // Real-time transcript/speech updates - not processed for escalation
        break;

      case 'conversation-update':
        // Process conversation updates for real-time escalation detection
        // Fire-and-forget to avoid blocking the response
        handleConversationUpdate(message, ctx).catch(err =>
          console.error('Error handling conversation update:', err)
        );
        break;

      case 'tool-calls':
        // Tool calls require a synchronous response with results
        // Apply timeout to ensure we respond in time
        try {
          return await withTimeout(
            handleToolCalls(message, ctx),
            TOOL_CALL_TIMEOUT_MS,
            'handleToolCalls'
          );
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          console.error(`Tool calls failed or timed out: ${errorMsg}`);
          metrics.increment(MetricNames.ERROR_COUNT, { handler: 'tool-calls' });

          // Return error response for all tool calls
          return NextResponse.json({
            results: message.toolCallList.map((tc: ToolCall) => ({
              toolCallId: tc.id,
              result: 'Es tut mir leid, ich habe momentan technische Schwierigkeiten.',
            })),
          });
        }

      case 'assistant-request':
        // Dynamic assistant config - return current date in system prompt
        return await handleAssistantRequest(message, ctx);

      default:
        console.log(`Unhandled Vapi event: ${message.type}`);
    }

    timing.end();

    // Always respond quickly (within 7.5s timeout)
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Vapi webhook error:', error);
    metrics.increment(MetricNames.ERROR_COUNT, { handler: 'vapi-webhook' });

    // Still return 200 to avoid Vapi retries on our errors
    return NextResponse.json({ received: true, error: 'Processing failed' });
  }
}

// ============================================
// Event Handlers
// ============================================

/**
 * Handle status-update events
 * Creates or updates call records as status changes
 */
async function handleStatusUpdate(message: WebhookStatusUpdate, ctx: WebhookRequestContext) {
  const timing = createTimingMonitor('handleStatusUpdate', 500);

  try {
    const { call, status } = message;

    if (!call?.id || !call?.assistantId) {
      console.warn('Status update missing required fields:', { call, status });
      return;
    }

    // Find agent by Vapi assistant ID (uses cached lookup)
    const agent = await ctx.getAgentByVapiId(call.assistantId);
    timing.checkpoint('agent-lookup');

    if (!agent) {
      console.warn(`Agent not found for assistantId: ${call.assistantId}`);
      return;
    }

    // Map Vapi status to our CallStatus enum
    let callStatus: CallStatus;
    if (status === 'ringing') {
      callStatus = CallStatus.RINGING;
    } else if (status === 'in-progress') {
      callStatus = CallStatus.IN_PROGRESS;
      // Start real-time tracking for this call
      realTimeTracker.startTracking(call.id, agent.id);
    } else if (status === 'ended') {
      // Stop real-time tracking and wait for end-of-call-report for final status
      realTimeTracker.stopTracking(call.id);
      return;
    } else {
      console.warn(`Unknown status: ${status}`);
      return;
    }

    // Extract phone number from call data
    const phoneNumber = call.customer?.number || 'Unknown';

    // Upsert call record
    await upsertCallFromWebhook({
      vapiCallId: call.id,
      assistantId: call.assistantId,
      phoneNumber,
      status: callStatus,
      startedAt: call.startedAt ? new Date(call.startedAt) : new Date(),
    });

    timing.end();
    console.log(`Call ${call.id} status updated to ${callStatus}`);
  } catch (error) {
    console.error('Error handling status update:', error);
    // Don't throw - we already responded to Vapi
  }
}

/**
 * Handle end-of-call-report events
 * Saves final call data including transcript, duration, and final status
 *
 * OPTIMIZED: Uses parallel queries and background jobs
 */
async function handleEndOfCallReport(message: WebhookEndOfCall, ctx: WebhookRequestContext) {
  const timing = createTimingMonitor('handleEndOfCallReport', 1000);

  try {
    const { call, artifact, endedReason } = message;

    // Debug: log the full call object to understand its structure
    console.log('End of call payload:', JSON.stringify({ call, endedReason }, null, 2));

    if (!call?.id || !call?.assistantId) {
      console.warn('End of call report missing required fields:', { call });
      return;
    }

    // Stop real-time tracking for this call (ensure cleanup)
    const trackedState = realTimeTracker.stopTracking(call.id);
    if (trackedState) {
      console.log(`End of call: Tracked ${trackedState.messages.length} messages, ` +
        `${trackedState.clarificationCount} clarifications, ` +
        `frustration score: ${trackedState.frustrationScore.toFixed(2)}`);
    }

    // Find agent by Vapi assistant ID (uses cached lookup)
    const agent = await ctx.getAgentByVapiId(call.assistantId);
    timing.checkpoint('agent-lookup');

    if (!agent) {
      console.warn(`Agent not found for assistantId: ${call.assistantId}`);
      return;
    }

    // Map endedReason to CallStatus
    const finalStatus = mapEndedReasonToStatus(endedReason);

    // Check if this was a transfer failure
    const transferFailureInfo = extractTransferFailureInfo(endedReason);

    // Extract duration (tries multiple sources in the payload)
    const durationSeconds = extractCallDuration(message);

    // Extract transcript
    const transcript = artifact?.transcript || undefined;

    // Extract phone number
    const phoneNumber = call.customer?.number || 'Unknown';

    // Handle transfer failure in background - log and potentially update escalation status
    if (transferFailureInfo.isTransferFailure) {
      console.log(`Transfer failure detected: ${endedReason}`, {
        failureType: transferFailureInfo.failureType,
        isRetryable: transferFailureInfo.isRetryable,
        callId: call.id,
      });

      // Run in background to avoid blocking
      runInBackground(
        () => handleTransferFailureStatus(
          call.id,
          agent.id,
          transferFailureInfo.failureType as TransferFailureType | null,
          endedReason
        ),
        { name: 'transfer-failure-status', maxRetries: 1 }
      );
    }

    // Update call record with final data
    await upsertCallFromWebhook({
      vapiCallId: call.id,
      assistantId: call.assistantId,
      phoneNumber,
      status: finalStatus,
      startedAt: call.startedAt ? new Date(call.startedAt) : new Date(),
      endedAt: call.endedAt ? new Date(call.endedAt) : new Date(),
      durationSeconds: durationSeconds || undefined,
      transcript,
    });
    timing.checkpoint('call-upserted');

    console.log(`Call ${call.id} completed: ${finalStatus}, duration: ${durationSeconds}s`);

    // Deduct credits for completed calls with duration
    if (finalStatus === CallStatus.COMPLETED && durationSeconds && durationSeconds > 0) {
      try {
        // OPTIMIZED: Use parallel queries for call record and user info
        const [callRecord, userBefore] = await parallelQueries([
          () => prisma.call.findUnique({ where: { vapiCallId: call.id } }),
          () => prisma.user.findUnique({
            where: { id: agent.userId },
            select: { email: true, name: true, creditBalance: true, graceCreditsUsed: true },
          }),
        ]);
        timing.checkpoint('credit-queries');

        if (callRecord && userBefore) {
          const wasLowBefore = isLowBalance(userBefore.creditBalance);
          const hadGraceUsageBefore = userBefore.graceCreditsUsed > 0;

          await deductCreditsForCall(
            agent.userId,
            callRecord.id,
            durationSeconds
          );
          timing.checkpoint('credits-deducted');
          console.log(`Deducted credits for call ${call.id}: ${durationSeconds}s`);

          // Check if we need to send low credit email (in background)
          runInBackground(
            async () => {
              const userAfter = await prisma.user.findUnique({
                where: { id: agent.userId },
                select: { creditBalance: true, graceCreditsUsed: true },
              });

              if (userAfter) {
                const isNowLow = isLowBalance(userAfter.creditBalance);
                const justCrossedThreshold = !wasLowBefore && isNowLow;
                const justEnteredGrace = !hadGraceUsageBefore && userAfter.graceCreditsUsed > 0;

                if (justCrossedThreshold || justEnteredGrace) {
                  await sendLowCreditEmail({
                    email: userBefore.email,
                    name: userBefore.name,
                    currentBalance: userAfter.creditBalance,
                    graceCreditsUsed: userAfter.graceCreditsUsed,
                  });
                  console.log(`Low credit email triggered for user ${agent.userId}`);
                }
              }
            },
            { name: 'low-credit-check', maxRetries: 1 }
          );
        }
      } catch (error) {
        console.error('Error deducting credits:', error);
        // Don't throw - credit deduction failure shouldn't break webhook
      }
    }

    // Log to Google Sheets (non-blocking, background job)
    // Check if any book_appointment tool was called
    let appointmentBooked = false;

    // Check artifact.toolCalls (various possible formats)
    if (artifact?.toolCalls && Array.isArray(artifact.toolCalls)) {
      console.log('Checking artifact.toolCalls:', JSON.stringify(artifact.toolCalls, null, 2));
      appointmentBooked = artifact.toolCalls.some((tc: any) => {
        const name = tc.function?.name || tc.name || tc.toolName || '';
        return name === 'book_appointment';
      });
    }

    // Also check artifact.messages for tool-call-result entries
    if (!appointmentBooked && artifact?.messages && Array.isArray(artifact.messages)) {
      appointmentBooked = artifact.messages.some((msg: any) => {
        if (msg.role === 'tool_call_result' || msg.type === 'tool-call-result' || msg.toolCalls) {
          const name = msg.name || msg.toolName || msg.function?.name || '';
          if (name === 'book_appointment') return true;
          // Check nested toolCalls in message
          if (msg.toolCalls && Array.isArray(msg.toolCalls)) {
            return msg.toolCalls.some((tc: any) =>
              (tc.function?.name || tc.name) === 'book_appointment'
            );
          }
        }
        return false;
      });
    }

    console.log(`Appointment booked detection: ${appointmentBooked}`);

    // Fire-and-forget pattern using background job queue
    runInBackground(
      () => logCallToSheets(agent.userId, {
        startedAt: call.startedAt ? new Date(call.startedAt) : new Date(),
        phoneNumber,
        agentName: agent.name,
        durationSeconds: durationSeconds || null,
        status: finalStatus,
        summary: artifact?.summary || null,
        transcript,
        appointmentBooked,
      }),
      { name: 'sheets-logging', maxRetries: 2 }
    );

    timing.end();
  } catch (error) {
    console.error('Error handling end of call report:', error);
    // Don't throw - we already responded to Vapi
  }
}

/**
 * Handle transfer failure status updates
 * Updates escalation logs and creates appropriate records when a transfer fails
 */
async function handleTransferFailureStatus(
  vapiCallId: string,
  agentId: string,
  failureType: TransferFailureType | null,
  endedReason: string
) {
  try {
    // Find the call record by vapi call ID with relations in single query
    const callRecord = await prisma.call.findUnique({
      where: { vapiCallId },
      include: {
        agent: {
          include: { escalationConfig: true },
        },
      },
    });

    if (!callRecord) {
      console.log(`No call record found for vapiCallId: ${vapiCallId}`);
      return;
    }

    // Find the most recent escalation log for this call
    const escalationLog = await prisma.escalationLog.findFirst({
      where: { callId: callRecord.id },
      orderBy: { createdAt: 'desc' },
    });

    if (!escalationLog) {
      console.log(`No escalation log found for call: ${callRecord.id}`);
      return;
    }

    // OPTIMIZED: Run updates in parallel
    await Promise.all([
      // Update the escalation log with failure information
      prisma.escalationLog.update({
        where: { id: escalationLog.id },
        data: {
          status: 'FAILED',
          failureReason: `Transfer failed: ${failureType || 'UNKNOWN'} (${endedReason})`,
          transferCompletedAt: new Date(),
          resolutionNotes: escalationLog.resolutionNotes
            ? `${escalationLog.resolutionNotes}\n[${new Date().toISOString()}] Transfer failed: ${endedReason}`
            : `[${new Date().toISOString()}] Transfer failed: ${endedReason}`,
        },
      }),
      // Update call record escalation status
      prisma.call.update({
        where: { id: callRecord.id },
        data: {
          escalationStatus: 'FAILED',
        },
      }),
      // Log event for tracking
      prisma.eventLog.create({
        data: {
          userId: callRecord.userId,
          eventType: 'transfer_failed',
          eventData: {
            callId: callRecord.id,
            vapiCallId,
            agentId,
            escalationId: escalationLog.id,
            failureType: failureType || 'UNKNOWN',
            endedReason,
            transferNumber: escalationLog.transferNumber,
            timestamp: new Date().toISOString(),
          },
        },
      }),
    ]);

    console.log(`Transfer failure recorded for escalation ${escalationLog.id}:`, {
      callId: callRecord.id,
      failureType,
      endedReason,
    });
  } catch (error) {
    console.error('Error handling transfer failure status:', error);
  }
}

/**
 * Handle conversation-update events
 * Processes real-time messages for automatic escalation detection.
 *
 * This enables automatic escalation based on:
 * - Sentiment analysis (frustration detection)
 * - Multiple clarification requests
 * - Unrecognized intent patterns
 * - Low confidence AI responses
 * - Explicit escalation trigger phrases
 *
 * OPTIMIZED: Uses request context for caching, parallel queries
 */
async function handleConversationUpdate(message: WebhookConversationUpdate, ctx: WebhookRequestContext) {
  try {
    const { messages, call } = message;

    if (!call?.id || !call?.assistantId || !messages || messages.length === 0) {
      return;
    }

    // Find agent by Vapi assistant ID (uses cached lookup)
    const agent = await ctx.getAgentByVapiId(call.assistantId);
    if (!agent) {
      return;
    }

    // Ensure we're tracking this call
    if (!realTimeTracker.getCallState(call.id)) {
      realTimeTracker.startTracking(call.id, agent.id);

      // Load agent-specific escalation config (uses request context cache)
      const escalationConfig = await ctx.getEscalationConfig(agent.id);

      if (escalationConfig) {
        realTimeTracker.updateDetectorConfig({
          maxClarifications: escalationConfig.maxClarifications,
          maxCallDuration: escalationConfig.maxCallDuration,
          sentimentThreshold: escalationConfig.sentimentThreshold,
          triggerPhrases: escalationConfig.triggerPhrases as string[],
        });
      }
    }

    // Process each new message
    for (const msg of messages) {
      const content = msg.message || msg.content || '';
      if (!content) continue;

      const conversationMessage: ConversationMessage = {
        role: msg.role,
        content,
        timestamp: msg.time ? new Date(msg.time).toISOString() : new Date().toISOString(),
      };

      const { needsEscalation, result } = realTimeTracker.processMessage(
        call.id,
        conversationMessage
      );

      // If automatic escalation is triggered, log it
      if (needsEscalation && result) {
        console.log(`Auto-escalation triggered for call ${call.id}`, {
          reason: result.reason,
          confidence: result.confidence,
        });

        // Run database operations in background
        runInBackground(
          async () => {
            // Find or create the call record
            const callRecord = await prisma.call.findFirst({
              where: {
                OR: [
                  { vapiCallId: call.id },
                  {
                    agentId: agent.id,
                    status: { in: ['RINGING', 'IN_PROGRESS'] },
                  },
                ],
              },
              orderBy: { startedAt: 'desc' },
            });

            if (callRecord) {
              // Run call update and event log creation in parallel
              await Promise.all([
                // Mark call as needing escalation (pre-emptive flag)
                prisma.call.update({
                  where: { id: callRecord.id },
                  data: {
                    escalationNotes: `Auto-detected: ${result.reason} (confidence: ${result.confidence?.toFixed(2)})`,
                  },
                }),
                // Log event for analytics
                prisma.eventLog.create({
                  data: {
                    userId: agent.userId,
                    eventType: 'auto_escalation_detected',
                    eventData: {
                      callId: call.id,
                      agentId: agent.id,
                      reason: result.reason,
                      confidence: result.confidence,
                      triggerDetails: result.triggerDetails,
                    },
                  },
                }),
              ]);
            }
          },
          { name: 'auto-escalation-log', maxRetries: 1 }
        );
      }
    }
  } catch (error) {
    console.error('Error handling conversation update:', error);
    // Don't throw - we already responded to Vapi
  }
}

/**
 * Handle tool-calls events
 * Executes calendar tools and returns results in Vapi's expected format
 *
 * OPTIMIZED: Uses request context for OAuth2 client caching
 */
async function handleToolCalls(message: WebhookToolCalls, ctx: WebhookRequestContext) {
  const timing = createTimingMonitor('handleToolCalls', 2000);

  try {
    const { toolCallList, call } = message;

    if (!call?.assistantId) {
      console.warn('Tool calls missing assistant ID:', { call });
      return NextResponse.json({
        results: toolCallList.map(tc => ({
          toolCallId: tc.id,
          result: 'Es tut mir leid, ich habe momentan technische Schwierigkeiten.',
        })),
      });
    }

    // Find agent by Vapi assistant ID (uses cached lookup)
    const agent = await ctx.getAgentByVapiId(call.assistantId);
    timing.checkpoint('agent-lookup');

    if (!agent) {
      console.warn(`Agent not found for assistantId: ${call.assistantId}`);
      return NextResponse.json({
        results: toolCallList.map(tc => ({
          toolCallId: tc.id,
          result: 'Es tut mir leid, ich habe momentan technische Schwierigkeiten.',
        })),
      });
    }

    // Pre-fetch agent with user for calendar operations (single query, cached for all tool calls)
    const agentWithUser = await ctx.getAgentWithConfig(agent.id);
    timing.checkpoint('agent-with-user');

    // Pre-fetch OAuth2 client for calendar operations (cached for all tool calls)
    let oauth2Client: Awaited<ReturnType<typeof getOAuth2ClientForUser>> | null = null;
    if (agentWithUser?.user) {
      oauth2Client = await ctx.getOAuth2Client(agentWithUser.user.id);
      timing.checkpoint('oauth2-client');
    }

    // Process each tool call
    const results = await Promise.all(
      toolCallList.map(async (toolCall) => {
        try {
          // Arguments can be string or object depending on Vapi version
          const args = typeof toolCall.function.arguments === 'string'
            ? JSON.parse(toolCall.function.arguments)
            : toolCall.function.arguments;
          const functionName = toolCall.function.name;

          console.log(`Executing tool: ${functionName} with args:`, args);

          let result: string;

          switch (functionName) {
            case 'check_availability': {
              if (!agentWithUser?.user) {
                result = 'Es tut mir leid, ich habe momentan technische Schwierigkeiten.';
                break;
              }

              // Use cached OAuth2 client
              if (!oauth2Client) {
                result = 'Leider ist die Kalenderbuchung noch nicht eingerichtet. Bitte rufen Sie später noch einmal an oder hinterlassen Sie Ihre Kontaktdaten.';
                break;
              }

              try {
                const timeZone = getValidTimezone(args.timeZone, 'Europe/Berlin');
                const correctedDateStr = parseDateInput(args.date);
                const date = new Date(correctedDateStr);

                // Validate that the date is valid
                if (isNaN(date.getTime())) {
                  result = 'Ich konnte das Datum nicht verstehen. Könnten Sie es bitte noch einmal nennen?';
                  break;
                }

                const appointmentDuration = agentWithUser.user.appointmentDuration || 30;
                let slots = await getAvailableSlots(oauth2Client, date, timeZone, appointmentDuration);

                // Filter by preferred time range if specified
                if (args.preferredTimeRange && slots.length > 0) {
                  const filteredSlots = filterSlotsByTimeRange(slots, args.preferredTimeRange, timeZone);
                  if (filteredSlots.length > 0) {
                    slots = filteredSlots;
                  }
                }

                // Format date in German
                const formattedDate = formatDateGerman(date);

                if (slots.length === 0) {
                  // Try to find the next available day
                  const nextSlot = await findNextAvailableSlot(oauth2Client, date, timeZone, appointmentDuration);
                  if (nextSlot) {
                    const nextDate = new Date(nextSlot.start);
                    const nextFormattedDate = formatDateGerman(nextDate);
                    result = `Am ${formattedDate} sind leider keine Termine mehr frei. Der nächste freie Termin wäre am ${nextFormattedDate} um ${nextSlot.displayTime}. Passt Ihnen das?`;
                  } else {
                    result = `Am ${formattedDate} sind leider keine Termine mehr frei. Möchten Sie einen anderen Tag versuchen?`;
                  }
                } else {
                  const slotList = slots.slice(0, 5).map(s => s.displayTime).join(', ');
                  if (args.preferredTimeRange) {
                    result = `Am ${formattedDate} habe ich ${args.preferredTimeRange} folgende Zeiten verfügbar: ${slotList}. Welche Zeit passt Ihnen am besten?`;
                  } else {
                    result = `Am ${formattedDate} habe ich folgende Zeiten verfügbar: ${slotList}. Welche Zeit passt Ihnen am besten?`;
                  }
                }
              } catch (error) {
                console.error('Calendar availability error:', error);
                result = 'Ich habe gerade Schwierigkeiten, den Kalender zu prüfen. Bitte versuchen Sie es noch einmal.';
              }
              break;
            }

            case 'check_conflicts': {
              if (!agentWithUser?.user) {
                result = 'Es tut mir leid, ich habe momentan technische Schwierigkeiten.';
                break;
              }

              if (!oauth2Client) {
                result = 'Leider ist die Kalenderbuchung noch nicht eingerichtet.';
                break;
              }

              try {
                const timeZone = getValidTimezone(args.timeZone, 'Europe/Berlin');
                const correctedDateStr = parseDateInput(args.date);
                const parsedTime = parseTimeInput(args.time);

                // Validate duration is a reasonable number
                let appointmentDuration = args.durationMinutes || agentWithUser.user.appointmentDuration || 30;
                if (typeof appointmentDuration !== 'number' || appointmentDuration < 5 || appointmentDuration > 480) {
                  appointmentDuration = 30; // Default to 30 minutes for invalid values
                }

                const conflictResult = await checkConflicts(
                  oauth2Client,
                  correctedDateStr,
                  parsedTime,
                  appointmentDuration,
                  timeZone
                );

                result = conflictResult.message;
              } catch (error) {
                console.error('Conflict check error:', error);
                result = 'Ich konnte die Verfügbarkeit nicht prüfen. Bitte versuchen Sie es noch einmal.';
              }
              break;
            }

            case 'book_appointment': {
              if (!agentWithUser?.user) {
                result = 'Es tut mir leid, ich habe momentan technische Schwierigkeiten.';
                break;
              }

              if (!oauth2Client) {
                result = 'Leider ist die Kalenderbuchung noch nicht eingerichtet. Bitte rufen Sie später noch einmal an oder hinterlassen Sie Ihre Kontaktdaten.';
                break;
              }

              try {
                const timeZone = getValidTimezone(args.timeZone, 'Europe/Berlin');
                const correctedDateStr = parseDateInput(args.date);
                // Enhanced time parsing for natural language times
                const parsedTime = parseTimeInput(args.time);

                // Validate date and time before proceeding
                const testDate = new Date(correctedDateStr);
                if (isNaN(testDate.getTime())) {
                  result = 'Ich konnte das Datum nicht verstehen. Könnten Sie es bitte noch einmal nennen?';
                  break;
                }

                const start = parseDateTime(correctedDateStr, parsedTime, timeZone);

                // Use user's configured appointment duration with validation
                let appointmentDuration = agentWithUser.user.appointmentDuration || 30;
                if (appointmentDuration < 5 || appointmentDuration > 480) {
                  appointmentDuration = 30;
                }

                // Calculate end time based on configured duration
                const [datePart, timePart] = start.split('T');
                const [hh, mm] = timePart.split(':').map(Number);
                let totalMinutes = hh * 60 + mm + appointmentDuration;
                const endHour = Math.floor(totalMinutes / 60) % 24;
                const endMin = totalMinutes % 60;
                const end = `${datePart}T${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}:00`;

                // Parse recurrence if provided
                const recurrence = args.recurrence ? parseRecurrenceInput(args.recurrence) : undefined;

                // Build description with all available information
                let description = 'Per Sprachassistent gebucht.';
                description += `\n\nAnrufer: ${args.callerName}`;
                if (args.callerPhone) description += `\nTelefon: ${args.callerPhone}`;
                if (args.callerEmail) description += `\nE-Mail: ${args.callerEmail}`;
                if (args.notes) description += `\n\nNotizen: ${args.notes}`;

                // Handle multiple attendees if provided
                const attendeeEmails: string[] = [];
                if (args.callerEmail) attendeeEmails.push(args.callerEmail);
                if (args.attendees) {
                  const additionalAttendees = args.attendees.split(',').map((e: string) => e.trim()).filter((e: string) => e);
                  attendeeEmails.push(...additionalAttendees);
                }

                const event = await bookAppointment(oauth2Client, {
                  summary: args.summary || `Termin mit ${args.callerName}`,
                  start,
                  end,
                  timeZone,
                  attendeeEmail: attendeeEmails[0],
                  attendeeEmails: attendeeEmails.length > 1 ? attendeeEmails : undefined,
                  description,
                  recurrence: recurrence || undefined,
                  location: args.location,
                });

                // Format date in German for confirmation (using corrected date)
                const bookingDate = new Date(correctedDateStr);
                const formattedDate = formatDateGerman(bookingDate);
                const displayTime = parsedTime;

                // Build confirmation message
                let confirmationMsg = `Wunderbar, Ihr Termin am ${formattedDate} um ${displayTime} Uhr ist eingetragen.`;

                if (recurrence) {
                  const recurrenceText = args.recurrence.toLowerCase();
                  confirmationMsg = `Wunderbar, Ihr wiederkehrender Termin (${recurrenceText}) beginnend am ${formattedDate} um ${displayTime} Uhr ist eingetragen.`;
                }

                if (args.callerEmail) {
                  confirmationMsg += ' Sie erhalten eine Kalendereinladung per E-Mail.';
                }

                confirmationMsg += ` Vielen Dank, ${args.callerName}!`;

                if (args.location) {
                  confirmationMsg += ` Der Termin findet statt in: ${args.location}.`;
                }

                result = confirmationMsg;
              } catch (error) {
                console.error('Calendar booking error:', error);
                if (error instanceof CalendarError) {
                  if (error.type === CalendarErrorType.AUTHENTICATION_EXPIRED) {
                    result = 'Die Kalenderverbindung muss erneuert werden. Bitte versuchen Sie es später noch einmal.';
                  } else if (error.type === CalendarErrorType.CONFLICT) {
                    result = 'Dieser Zeitpunkt ist leider bereits belegt. Möchten Sie eine andere Zeit versuchen? Ich kann Ihnen gerne die verfügbaren Zeiten nennen.';
                  } else {
                    result = 'Den Termin konnte ich leider nicht eintragen. Möchten Sie eine andere Zeit versuchen?';
                  }
                } else {
                  result = 'Den Termin konnte ich leider nicht eintragen. Dieser Zeitpunkt ist möglicherweise bereits belegt. Möchten Sie eine andere Zeit versuchen?';
                }
              }
              break;
            }

            case 'reschedule_appointment': {
              if (!agentWithUser?.user) {
                result = 'Es tut mir leid, ich habe momentan technische Schwierigkeiten.';
                break;
              }

              if (!oauth2Client) {
                result = 'Leider ist die Kalenderbuchung noch nicht eingerichtet.';
                break;
              }

              try {
                const timeZone = getValidTimezone(args.timeZone, 'Europe/Berlin');
                let appointmentDuration = agentWithUser.user.appointmentDuration || 30;
                if (appointmentDuration < 5 || appointmentDuration > 480) {
                  appointmentDuration = 30;
                }

                // If no eventId, try to find by caller name
                let eventId = args.eventId;
                let originalEventSummary = '';
                if (!eventId && args.callerName) {
                  const events = await searchEvents(oauth2Client, args.callerName, { maxResults: 5, daysAhead: 30 });
                  if (events.length > 0) {
                    // If multiple events found and originalDate provided, try to match
                    if (events.length > 1 && args.originalDate) {
                      const originalDateStr = parseDateInput(args.originalDate);
                      const matchingEvent = events.find(e => e.start.includes(originalDateStr));
                      if (matchingEvent) {
                        eventId = matchingEvent.id;
                        originalEventSummary = matchingEvent.summary;
                      }
                    }
                    if (!eventId) {
                      eventId = events[0].id;
                      originalEventSummary = events[0].summary;
                    }
                  }
                }

                if (!eventId) {
                  result = 'Ich konnte keinen Termin unter diesem Namen finden. Könnten Sie mir den Namen nennen, unter dem der Termin gebucht wurde?';
                  break;
                }

                const correctedDateStr = parseDateInput(args.newDate);
                const parsedTime = parseTimeInput(args.newTime);
                const start = parseDateTime(correctedDateStr, parsedTime, timeZone);

                // Check if new slot is available before rescheduling
                const conflictCheck = await checkConflicts(oauth2Client, correctedDateStr, parsedTime, appointmentDuration, timeZone);
                if (conflictCheck.hasConflict) {
                  result = `Der neue Zeitpunkt um ${parsedTime} Uhr ist leider bereits belegt. ` +
                    (conflictCheck.alternativeSlots.length > 0
                      ? `Stattdessen wären verfügbar: ${conflictCheck.alternativeSlots.map(s => s.displayTime).join(', ')}. Möchten Sie eine dieser Zeiten?`
                      : 'Möchten Sie einen anderen Zeitpunkt versuchen?');
                  break;
                }

                // Calculate end time
                const [datePart, timePart] = start.split('T');
                const [hh, mm] = timePart.split(':').map(Number);
                let totalMinutes = hh * 60 + mm + appointmentDuration;
                const endHour = Math.floor(totalMinutes / 60) % 24;
                const endMin = totalMinutes % 60;
                const end = `${datePart}T${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}:00`;

                await rescheduleEvent(oauth2Client, eventId, start, end, timeZone);

                const newDate = new Date(correctedDateStr);
                const formattedDate = formatDateGerman(newDate);
                result = `Alles klar, Ihr Termin wurde erfolgreich auf ${formattedDate} um ${parsedTime} Uhr verschoben. Alle Teilnehmer werden benachrichtigt.`;
              } catch (error) {
                console.error('Calendar reschedule error:', error);
                if (error instanceof CalendarError) {
                  if (error.type === CalendarErrorType.EVENT_NOT_FOUND) {
                    result = 'Ich konnte diesen Termin nicht finden. Wurde er möglicherweise bereits storniert?';
                  } else if (error.type === CalendarErrorType.AUTHENTICATION_EXPIRED) {
                    result = 'Die Kalenderverbindung muss erneuert werden. Bitte versuchen Sie es später noch einmal.';
                  } else if (error.type === CalendarErrorType.CONFLICT) {
                    result = 'Der gewünschte Zeitpunkt ist leider bereits belegt. Möchten Sie eine andere Zeit versuchen?';
                  } else {
                    result = 'Das Verschieben des Termins ist leider fehlgeschlagen. Möchten Sie es noch einmal versuchen?';
                  }
                } else {
                  result = 'Das Verschieben des Termins ist leider fehlgeschlagen. Möchten Sie es noch einmal versuchen?';
                }
              }
              break;
            }

            case 'cancel_appointment': {
              if (!agentWithUser?.user) {
                result = 'Es tut mir leid, ich habe momentan technische Schwierigkeiten.';
                break;
              }

              if (!oauth2Client) {
                result = 'Leider ist die Kalenderbuchung noch nicht eingerichtet.';
                break;
              }

              try {
                // If no eventId, try to find by caller name
                let eventId = args.eventId;
                let eventSummary = '';
                let eventDate = '';

                if (!eventId && args.callerName) {
                  const events = await searchEvents(oauth2Client, args.callerName, { maxResults: 5, daysAhead: 30 });
                  if (events.length > 0) {
                    // If date is provided, try to match the specific event
                    if (events.length > 1 && args.date) {
                      const targetDateStr = parseDateInput(args.date);
                      const matchingEvent = events.find(e => e.start.includes(targetDateStr));
                      if (matchingEvent) {
                        eventId = matchingEvent.id;
                        eventSummary = matchingEvent.summary;
                        eventDate = matchingEvent.start;
                      }
                    }
                    if (!eventId) {
                      eventId = events[0].id;
                      eventSummary = events[0].summary;
                      eventDate = events[0].start;
                    }
                  }
                }

                if (!eventId) {
                  result = 'Ich konnte keinen Termin unter diesem Namen finden. Könnten Sie mir bitte den Namen nennen, unter dem der Termin gebucht wurde?';
                  break;
                }

                // Check if this is a recurring event and user wants to cancel only one instance
                if (args.date && args.cancelAll !== 'ja') {
                  const cancelDateStr = parseDateInput(args.date);
                  await cancelRecurringInstance(oauth2Client, eventId, cancelDateStr);
                  const formattedDate = formatDateGerman(new Date(cancelDateStr));
                  result = `Der Termin am ${formattedDate} wurde storniert. Die anderen Termine der Serie bleiben bestehen.`;
                } else {
                  await deleteEvent(oauth2Client, eventId);
                  // Build a more informative cancellation message
                  let cancelMsg = 'Ihr Termin wurde erfolgreich storniert.';
                  if (eventDate) {
                    const formattedDate = formatDateGerman(new Date(eventDate));
                    cancelMsg = `Ihr Termin am ${formattedDate} wurde erfolgreich storniert.`;
                  }
                  if (args.reason) {
                    cancelMsg += ` Grund: ${args.reason}.`;
                  }
                  cancelMsg += ' Alle Teilnehmer werden benachrichtigt.';
                  result = cancelMsg;
                }
              } catch (error) {
                console.error('Calendar cancel error:', error);
                if (error instanceof CalendarError) {
                  if (error.type === CalendarErrorType.EVENT_NOT_FOUND) {
                    result = 'Ich konnte diesen Termin nicht finden. Wurde er möglicherweise bereits storniert?';
                  } else if (error.type === CalendarErrorType.AUTHENTICATION_EXPIRED) {
                    result = 'Die Kalenderverbindung muss erneuert werden. Bitte versuchen Sie es später noch einmal.';
                  } else {
                    result = 'Das Stornieren des Termins ist leider fehlgeschlagen. Möchten Sie es noch einmal versuchen?';
                  }
                } else {
                  result = 'Das Stornieren des Termins ist leider fehlgeschlagen. Möchten Sie es noch einmal versuchen?';
                }
              }
              break;
            }

            case 'list_appointments': {
              if (!agentWithUser?.user) {
                result = 'Es tut mir leid, ich habe momentan technische Schwierigkeiten.';
                break;
              }

              if (!oauth2Client) {
                result = 'Leider ist die Kalenderabfrage noch nicht eingerichtet.';
                break;
              }

              try {
                const startDateStr = parseDateInput(args.startDate);
                let endDateStr = args.endDate ? parseDateInput(args.endDate) : startDateStr;

                // If no end date, show appointments for the day
                if (!args.endDate) {
                  const endDate = new Date(startDateStr);
                  endDate.setDate(endDate.getDate() + 1);
                  endDateStr = endDate.toISOString().split('T')[0];
                }

                const events = await listEvents(oauth2Client, startDateStr, endDateStr, { maxResults: 10 });

                if (events.length === 0) {
                  const formattedDate = formatDateGerman(new Date(startDateStr));
                  result = `Am ${formattedDate} sind keine Termine eingetragen.`;
                } else {
                  const eventList = events.slice(0, 5).map(e => {
                    const startTime = new Date(e.start).toLocaleTimeString('de-DE', {
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZone: args.timeZone || 'Europe/Berlin',
                    });
                    return `${startTime} Uhr: ${e.summary}`;
                  }).join('; ');

                  if (events.length <= 5) {
                    result = `Sie haben ${events.length} Termin${events.length > 1 ? 'e' : ''}: ${eventList}`;
                  } else {
                    result = `Sie haben ${events.length} Termine. Hier sind die ersten fünf: ${eventList}`;
                  }
                }
              } catch (error) {
                console.error('Calendar list error:', error);
                result = 'Ich habe gerade Schwierigkeiten, die Termine abzurufen. Bitte versuchen Sie es noch einmal.';
              }
              break;
            }

            case 'search_appointments': {
              if (!agentWithUser?.user) {
                result = 'Es tut mir leid, ich habe momentan technische Schwierigkeiten.';
                break;
              }

              if (!oauth2Client) {
                result = 'Leider ist die Kalenderabfrage noch nicht eingerichtet.';
                break;
              }

              try {
                const searchQuery = args.callerName || args.query;
                const events = await searchEvents(oauth2Client, searchQuery, { maxResults: 5 });

                if (events.length === 0) {
                  result = `Ich konnte keine Termine für "${searchQuery}" finden.`;
                } else {
                  const firstEvent = events[0];
                  const eventDate = new Date(firstEvent.start);
                  const formattedDate = formatDateGerman(eventDate);
                  const startTime = eventDate.toLocaleTimeString('de-DE', {
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: args.timeZone || 'Europe/Berlin',
                  });

                  if (events.length === 1) {
                    result = `Ich habe einen Termin gefunden: ${firstEvent.summary} am ${formattedDate} um ${startTime} Uhr.`;
                  } else {
                    result = `Ich habe ${events.length} Termine gefunden. Der nächste ist ${firstEvent.summary} am ${formattedDate} um ${startTime} Uhr.`;
                  }
                }
              } catch (error) {
                console.error('Calendar search error:', error);
                result = 'Ich habe gerade Schwierigkeiten, die Termine zu suchen. Bitte versuchen Sie es noch einmal.';
              }
              break;
            }

            case 'find_next_available': {
              if (!agentWithUser?.user) {
                result = 'Es tut mir leid, ich habe momentan technische Schwierigkeiten.';
                break;
              }

              if (!oauth2Client) {
                result = 'Leider ist die Kalenderabfrage noch nicht eingerichtet.';
                break;
              }

              try {
                const timeZone = getValidTimezone(args.timeZone, 'Europe/Berlin');
                let appointmentDuration = agentWithUser.user.appointmentDuration || 30;
                if (appointmentDuration < 5 || appointmentDuration > 480) {
                  appointmentDuration = 30;
                }

                let afterDate = new Date();
                if (args.afterDate) {
                  const correctedDateStr = parseDateInput(args.afterDate);
                  afterDate = new Date(correctedDateStr);
                  // Validate the date
                  if (isNaN(afterDate.getTime())) {
                    afterDate = new Date(); // Fall back to now
                  }
                }

                const nextSlot = await findNextAvailableSlot(oauth2Client, afterDate, timeZone, appointmentDuration);

                if (!nextSlot) {
                  result = 'In den nächsten zwei Wochen sind leider keine Termine verfügbar.';
                } else {
                  const slotDate = new Date(nextSlot.start);
                  const formattedDate = formatDateGerman(slotDate);
                  result = `Der nächste freie Termin ist am ${formattedDate} um ${nextSlot.displayTime}. Soll ich diesen für Sie buchen?`;
                }
              } catch (error) {
                console.error('Find next available error:', error);
                result = 'Ich habe gerade Schwierigkeiten, freie Termine zu finden. Bitte versuchen Sie es noch einmal.';
              }
              break;
            }

            // ============================================
            // Escalation Tool Handlers
            // ============================================

            case 'escalate_to_human': {
              console.log('Escalate to human tool called', args);

              try {
                const escalateArgs = args as EscalateCallArgs;

                // Get agent with escalation config (uses request context cache)
                const agentWithConfig = await ctx.getAgentWithConfig(agent.id);

                if (!agentWithConfig) {
                  result = 'Es tut mir leid, ich habe momentan technische Schwierigkeiten.';
                  break;
                }

                const config = agentWithConfig.escalationConfig;

                // Log escalation request regardless of config
                console.log('Escalation requested:', {
                  agentId: agent.id,
                  reason: escalateArgs.reason,
                  summary: escalateArgs.summary,
                  hasConfig: !!config,
                  configEnabled: config?.enabled,
                  hasForwardingNumber: !!config?.forwardingNumber,
                });

                // Check if escalation is configured with a forwarding number
                if (!config || !config.enabled || !config.forwardingNumber) {
                  // No forwarding configured - acknowledge the request and offer callback
                  console.log('Escalation requested but no forwarding configured for agent', agent.id);

                  // Log to EventLog for tracking in background
                  runInBackground(
                    () => prisma.eventLog.create({
                      data: {
                        userId: agent.userId,
                        eventType: 'escalation_requested',
                        eventData: {
                          agentId: agent.id,
                          agentName: agent.name,
                          reason: escalateArgs.reason,
                          summary: escalateArgs.summary,
                          callerName: escalateArgs.callerName,
                          configStatus: !config ? 'no_config' : !config.enabled ? 'disabled' : 'no_forwarding_number',
                        },
                      },
                    }),
                    { name: 'escalation-event-log' }
                  );

                  result = `Ich verstehe, dass Sie mit einem Mitarbeiter sprechen möchten. Leider ist die direkte Weiterleitung momentan nicht verfügbar. Ich notiere mir Ihr Anliegen: "${escalateArgs.summary}". Ein Mitarbeiter wird sich schnellstmöglich bei Ihnen melden. Können Sie mir bitte Ihren Namen und Ihre Rückrufnummer nennen?`;
                  break;
                }

                // Find or create the call record
                let callRecord = await prisma.call.findFirst({
                  where: {
                    agentId: agent.id,
                    status: { in: ['RINGING', 'IN_PROGRESS'] },
                  },
                  orderBy: { startedAt: 'desc' },
                });

                if (!callRecord) {
                  // Create a placeholder call record if not found
                  callRecord = await prisma.call.create({
                    data: {
                      agentId: agent.id,
                      userId: agent.userId,
                      phoneNumber: 'Unknown',
                      status: 'IN_PROGRESS',
                      startedAt: new Date(),
                    },
                  });
                }

                // Map reason string to enum
                const reason = EscalationDetector.mapReasonString(escalateArgs.reason);

                // Initialize escalation service
                const escalationService = new EscalationService();
                await escalationService.initializeForAgent(agent.id);

                // Initiate escalation
                const escalationResult = await escalationService.initiateEscalation({
                  callId: callRecord.id,
                  reason,
                  callerName: escalateArgs.callerName,
                  conversationSummary: escalateArgs.summary,
                  lastUserMessage: escalateArgs.lastUserMessage,
                  urgency: escalateArgs.urgency as 'low' | 'normal' | 'high' | 'critical' | undefined,
                });

                console.log('Escalation initiated', {
                  escalationId: escalationResult.escalationId,
                  status: escalationResult.status,
                  transferNumber: escalationResult.transferNumber,
                });

                // If we have a transfer number and escalation is pending, return a transfer action
                if (escalationResult.transferNumber && escalationResult.status === 'PENDING') {
                  // Build operator briefing message for warm transfer
                  const operatorBriefing = escalationResult.operatorBriefing ||
                    `Eingehender Anruf von ${agentWithConfig.businessName}. Grund: ${escalateArgs.reason}. Zusammenfassung: ${escalateArgs.summary}`;

                  // Determine transfer mode based on config
                  const useWarmTransfer = config.shareSummary || config.shareTranscript;

                  // Build Vapi transfer action object with proper typing
                  const transferAction: VapiTransferAction = {
                    action: 'transferCall',
                    destination: {
                      type: 'number',
                      number: escalationResult.transferNumber,
                      message: escalationResult.callerMessage,
                      transferPlan: useWarmTransfer ? {
                        mode: 'warm-transfer-with-message',
                        message: operatorBriefing,
                      } : {
                        mode: 'blind-transfer',
                      },
                    },
                  };

                  // Return Vapi transfer destination object as JSON string
                  result = JSON.stringify(transferAction);

                  console.log('Returning transfer action to Vapi:', {
                    transferNumber: escalationResult.transferNumber,
                    mode: useWarmTransfer ? 'warm-transfer-with-message' : 'blind-transfer',
                    hasOperatorBriefing: !!operatorBriefing,
                  });
                } else {
                  // No transfer possible (no operators, after hours, etc.)
                  result = escalationResult.callerMessage;
                }
              } catch (error) {
                console.error('Escalation error:', error);
                result = 'Es tut mir leid, die Weiterleitung ist momentan nicht möglich. Kann ich Ihnen anders helfen oder möchten Sie Ihre Kontaktdaten hinterlassen?';
              }
              break;
            }

            case 'check_operator_availability': {
              console.log('Check operator availability tool called', args);

              try {
                const availabilityArgs = args as CheckOperatorAvailabilityArgs;

                // Get agent with escalation config (uses request context cache)
                const agentWithConfig = await ctx.getAgentWithConfig(agent.id);

                if (!agentWithConfig?.escalationConfig) {
                  result = 'Die Verfügbarkeitsprüfung ist momentan nicht verfügbar.';
                  break;
                }

                const config = agentWithConfig.escalationConfig;
                const escalationService = new EscalationService();
                const availability = await escalationService.checkOperatorAvailability(config);

                if (availability.available) {
                  const waitMinutes = availability.estimatedWaitTime
                    ? Math.ceil(availability.estimatedWaitTime / 60)
                    : 1;
                  result = `Ja, Mitarbeiter sind verfügbar. Die geschätzte Wartezeit beträgt etwa ${waitMinutes} Minute${waitMinutes > 1 ? 'n' : ''}.`;
                } else if (!availability.isWithinBusinessHours) {
                  result = `Momentan sind wir außerhalb unserer Geschäftszeiten. ${
                    availability.alternativeOptions?.voicemail
                      ? 'Sie können uns aber gerne eine Nachricht hinterlassen.'
                      : 'Bitte rufen Sie während unserer Geschäftszeiten erneut an.'
                  }`;
                } else {
                  result = `Momentan sind leider alle Mitarbeiter im Gespräch. ${
                    availability.alternativeOptions?.voicemail
                      ? 'Möchten Sie eine Nachricht hinterlassen?'
                      : 'Bitte versuchen Sie es in einigen Minuten erneut.'
                  }`;
                }
              } catch (error) {
                console.error('Availability check error:', error);
                result = 'Ich konnte die Verfügbarkeit leider nicht prüfen. Möchten Sie es trotzdem versuchen?';
              }
              break;
            }

            default:
              result = `Unknown function: ${functionName}`;
              console.warn(`Unknown tool function: ${functionName}`);
          }

          return {
            toolCallId: toolCall.id,
            result,
          };
        } catch (error) {
          console.error(`Error executing tool ${toolCall.function.name}:`, error);
          return {
            toolCallId: toolCall.id,
            result: 'Es tut mir leid, es ist ein Fehler aufgetreten. Könnten Sie das bitte noch einmal versuchen?',
          };
        }
      })
    );

    timing.end();

    // Return results in Vapi's expected format
    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error handling tool calls:', error);
    // Return error response for all tool calls
    return NextResponse.json({
      results: message.toolCallList.map(tc => ({
        toolCallId: tc.id,
        result: 'Es tut mir leid, ich habe momentan technische Schwierigkeiten.',
      })),
    });
  }
}

/**
 * Handle assistant-request events
 * Returns dynamic assistant config with Vapi dynamic variables for real-time date
 *
 * Uses Vapi dynamic variables which are substituted at call time:
 * https://docs.vapi.ai/assistants/dynamic-variables#advanced-date-and-time-usage
 */
async function handleAssistantRequest(
  message: { call?: { assistantId?: string; phoneNumberId?: string } },
  ctx: WebhookRequestContext
) {
  try {
    const { call } = message;

    // Try to find agent by assistant ID first, then by phone number
    let agent = null;

    if (call?.assistantId) {
      agent = await prisma.agent.findFirst({
        where: { vapiAssistantId: call.assistantId },
        include: { user: true },
      });
    }

    if (!agent && call?.phoneNumberId) {
      // Look up by phone number
      const phoneNumber = await prisma.phoneNumber.findFirst({
        where: { vapiPhoneId: call.phoneNumberId },
        include: { agent: { include: { user: true } } },
      });
      agent = phoneNumber?.agent;
    }

    if (!agent) {
      console.warn('Assistant request: agent not found', { call });
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Check if the stored prompt already has Vapi dynamic variables
    const hasVapiVariables = agent.systemPrompt.includes('{{"now"');

    // Build date header using consolidated module (only if stored prompt lacks Vapi vars)
    const dateHeader = hasVapiVariables ? '' : buildDateHeader();

    // Use agent's stored system prompt with date header (if needed)
    const systemPrompt = dateHeader + agent.systemPrompt;

    // Check if user has Google Calendar connected
    const hasCalendarTools = agent.user?.googleRefreshToken ? true : false;

    // Always include escalation tools - they handle gracefully when not fully configured
    const hasEscalationTools = true;

    const serverUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Build tools using consolidated modules
    // IMPORTANT: Escalation tools MUST come FIRST so the AI prioritizes them
    const escalationTools = hasEscalationTools ? buildEscalationTools(serverUrl) : [];
    const calendarTools = hasCalendarTools ? buildCalendarTools(serverUrl) : [];

    // Combine all tools - escalation FIRST for priority
    const tools = [...escalationTools, ...calendarTools];
    const hasTools = tools.length > 0;

    // Log tools being sent for debugging
    console.log('Assistant request: tools being sent:', tools.map(t => t.function.name));

    // Return assistant config
    const assistantConfig = {
      name: agent.name,
      firstMessage: agent.greeting || `${agent.businessName}, guten Tag! Wie kann ich Ihnen behilflich sein?`,
      model: {
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
        messages: [{ role: 'system', content: systemPrompt }],
        ...(hasTools && { tools }),
      },
      voice: {
        provider: 'azure',
        voiceId: agent.voiceId || 'de-DE-KatjaNeural',
      },
      transcriber: {
        provider: 'deepgram',
        model: 'nova-2',
        language: 'de',
      },
      maxDurationSeconds: 600,
      endCallMessage: 'Vielen Dank für Ihren Anruf. Auf Wiederhören!',
    };

    console.log(`Assistant request: returning config for ${agent.name} | Using Vapi dynamic date variables`);
    return NextResponse.json({ assistant: assistantConfig });
  } catch (error) {
    console.error('Error handling assistant request:', error);
    return NextResponse.json({ error: 'Failed to build assistant config' }, { status: 500 });
  }
}
