import { NextRequest, NextResponse } from 'next/server';
import {
  findAgentByVapiAssistantId,
  upsertCallFromWebhook,
  mapEndedReasonToStatus,
  extractCallDuration,
  type WebhookStatusUpdate,
  type WebhookEndOfCall,
} from '@/lib/calls';
import { CallStatus } from '@/generated/prisma/client';

/**
 * Tool call payload from Vapi
 */
interface ToolCall {
  id: string; // toolCallId to reference in response
  type: 'function';
  function: {
    name: string;
    arguments: string; // JSON string of arguments
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
 * Vapi webhook endpoint - handles server URL events
 *
 * Events received:
 * - status-update: Call status changes (ringing, in-progress, ended)
 * - end-of-call-report: Final call data with transcript
 * - transcript: Real-time transcript updates
 * - tool-calls: Custom function calls (calendar booking, etc.)
 *
 * CRITICAL: Must respond within 7.5 seconds or Vapi will timeout
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message } = body;

    // Log event type for debugging
    console.log(`Vapi webhook: ${message.type}`);

    // Route based on event type
    switch (message.type) {
      case 'status-update':
        await handleStatusUpdate(message);
        break;

      case 'end-of-call-report':
        await handleEndOfCallReport(message);
        break;

      case 'transcript':
        // Real-time transcript updates - we'll use end-of-call for full transcript
        console.log('Transcript update received (not processed)');
        break;

      case 'tool-calls':
        // Tool calls require a synchronous response with results
        return await handleToolCalls(message);

      default:
        console.log(`Unhandled Vapi event: ${message.type}`);
    }

    // Always respond quickly
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Vapi webhook error:', error);
    // Still return 200 to avoid Vapi retries on our errors
    return NextResponse.json({ received: true, error: 'Processing failed' });
  }
}

/**
 * Handle status-update events
 * Creates or updates call records as status changes
 */
async function handleStatusUpdate(message: WebhookStatusUpdate) {
  try {
    const { call, status } = message;

    if (!call?.id || !call?.assistantId) {
      console.warn('Status update missing required fields:', { call, status });
      return;
    }

    // Find agent by Vapi assistant ID
    const agent = await findAgentByVapiAssistantId(call.assistantId);

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
    } else if (status === 'ended') {
      // Wait for end-of-call-report for final status
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

    console.log(`Call ${call.id} status updated to ${callStatus}`);
  } catch (error) {
    console.error('Error handling status update:', error);
    // Don't throw - we already responded to Vapi
  }
}

/**
 * Handle end-of-call-report events
 * Saves final call data including transcript, duration, and final status
 */
async function handleEndOfCallReport(message: WebhookEndOfCall) {
  try {
    const { call, artifact, endedReason } = message;

    // Debug: log the full call object to understand its structure
    console.log('End of call payload:', JSON.stringify({ call, endedReason }, null, 2));

    if (!call?.id || !call?.assistantId) {
      console.warn('End of call report missing required fields:', { call });
      return;
    }

    // Find agent by Vapi assistant ID
    const agent = await findAgentByVapiAssistantId(call.assistantId);

    if (!agent) {
      console.warn(`Agent not found for assistantId: ${call.assistantId}`);
      return;
    }

    // Map endedReason to CallStatus
    const finalStatus = mapEndedReasonToStatus(endedReason);

    // Extract duration (tries multiple sources in the payload)
    const durationSeconds = extractCallDuration(message);

    // Extract transcript
    const transcript = artifact?.transcript || undefined;

    // Extract phone number
    const phoneNumber = call.customer?.number || 'Unknown';

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

    console.log(`Call ${call.id} completed: ${finalStatus}, duration: ${durationSeconds}s`);
  } catch (error) {
    console.error('Error handling end of call report:', error);
    // Don't throw - we already responded to Vapi
  }
}

/**
 * Handle tool-calls events
 * Executes calendar tools and returns results in Vapi's expected format
 */
async function handleToolCalls(message: WebhookToolCalls) {
  try {
    const { toolCallList, call } = message;

    if (!call?.assistantId) {
      console.warn('Tool calls missing assistant ID:', { call });
      return NextResponse.json({
        results: toolCallList.map(tc => ({
          toolCallId: tc.id,
          result: "I'm sorry, I'm having technical difficulties right now.",
        })),
      });
    }

    // Find agent by Vapi assistant ID
    const agent = await findAgentByVapiAssistantId(call.assistantId);

    if (!agent) {
      console.warn(`Agent not found for assistantId: ${call.assistantId}`);
      return NextResponse.json({
        results: toolCallList.map(tc => ({
          toolCallId: tc.id,
          result: "I'm sorry, I'm having technical difficulties right now.",
        })),
      });
    }

    // Process each tool call
    const results = await Promise.all(
      toolCallList.map(async (toolCall) => {
        try {
          const args = JSON.parse(toolCall.function.arguments);
          const functionName = toolCall.function.name;

          console.log(`Executing tool: ${functionName} with args:`, args);

          let result: string;

          switch (functionName) {
            case 'check_availability': {
              // Call availability endpoint internally
              const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/google/calendar/availability`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  agentId: agent.id,
                  date: args.date,
                  timeZone: args.timeZone || 'America/New_York',
                }),
              });

              const data = await response.json();
              result = data.message || "I'm having trouble checking the calendar right now.";
              break;
            }

            case 'book_appointment': {
              // Call booking endpoint internally
              const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/google/calendar/book`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  agentId: agent.id,
                  date: args.date,
                  time: args.time,
                  callerName: args.callerName,
                  callerPhone: args.callerPhone,
                  callerEmail: args.callerEmail,
                  summary: args.summary || 'Appointment',
                  timeZone: args.timeZone || 'America/New_York',
                }),
              });

              const data = await response.json();
              result = data.message || "I'm having trouble booking that appointment right now.";
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
            result: "I'm sorry, I encountered an error. Could you please try that again?",
          };
        }
      })
    );

    // Return results in Vapi's expected format
    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error handling tool calls:', error);
    // Return error response for all tool calls
    return NextResponse.json({
      results: message.toolCallList.map(tc => ({
        toolCallId: tc.id,
        result: "I'm sorry, I'm having technical difficulties right now.",
      })),
    });
  }
}
