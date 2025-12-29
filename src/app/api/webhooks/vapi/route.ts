import { NextRequest, NextResponse } from 'next/server';
import {
  findAgentByVapiAssistantId,
  upsertCallFromWebhook,
  mapEndedReasonToStatus,
  extractCallDuration,
  logCallToSheets,
  type WebhookStatusUpdate,
  type WebhookEndOfCall,
} from '@/lib/calls';
import { CallStatus } from '@/generated/prisma/client';
import { getOAuth2ClientForUser } from '@/lib/google/auth';
import { getAvailableSlots, bookAppointment, parseDateTime, validateAndCorrectDate } from '@/lib/google/calendar';
import { prisma } from '@/lib/prisma';
import { deductCreditsForCall, isLowBalance } from '@/lib/credits';
import { sendLowCreditEmail } from '@/lib/email';
import { formatDateGerman } from '@/lib/localization';
import { verifyVapiSignature } from '@/lib/webhook-auth';

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
 */
export async function POST(req: NextRequest) {
  try {
    // Get raw body FIRST for signature verification
    const rawBody = await req.text();

    // Verify signature if VAPI_WEBHOOK_SECRET is configured
    const secret = process.env.VAPI_WEBHOOK_SECRET;
    if (secret) {
      const signature = req.headers.get('x-vapi-signature');
      const isValid = verifyVapiSignature(rawBody, signature, secret);

      if (!isValid) {
        console.error('Vapi webhook: signature verification failed');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    // Parse JSON AFTER signature verification
    const body = JSON.parse(rawBody);
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

      case 'assistant-request':
        // Dynamic assistant config - return current date in system prompt
        return await handleAssistantRequest(message);

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

    // Deduct credits for completed calls with duration
    if (finalStatus === CallStatus.COMPLETED && durationSeconds && durationSeconds > 0) {
      try {
        // Get the call record we just upserted
        const callRecord = await prisma.call.findUnique({
          where: { vapiCallId: call.id },
        });

        if (callRecord) {
          // Get user state BEFORE deduction to check if this is first low balance event
          const userBefore = await prisma.user.findUnique({
            where: { id: agent.userId },
            select: { email: true, name: true, creditBalance: true, graceCreditsUsed: true },
          });

          const wasLowBefore = userBefore ? isLowBalance(userBefore.creditBalance) : false;
          const hadGraceUsageBefore = userBefore ? userBefore.graceCreditsUsed > 0 : false;

          await deductCreditsForCall(
            agent.userId,
            callRecord.id,
            durationSeconds
          );
          console.log(`Deducted credits for call ${call.id}: ${durationSeconds}s`);

          // Send low credit email when crossing threshold for the first time
          // Only send if: now low balance AND wasn't low before AND no grace usage before
          if (userBefore) {
            const userAfter = await prisma.user.findUnique({
              where: { id: agent.userId },
              select: { creditBalance: true, graceCreditsUsed: true },
            });

            if (userAfter) {
              const isNowLow = isLowBalance(userAfter.creditBalance);
              // Send email only when first crossing threshold (wasn't low before, is low now)
              // OR when first entering grace (no grace before, has grace now)
              const justCrossedThreshold = !wasLowBefore && isNowLow;
              const justEnteredGrace = !hadGraceUsageBefore && userAfter.graceCreditsUsed > 0;

              if (justCrossedThreshold || justEnteredGrace) {
                // Fire and forget - don't await
                sendLowCreditEmail({
                  email: userBefore.email,
                  name: userBefore.name,
                  currentBalance: userAfter.creditBalance,
                  graceCreditsUsed: userAfter.graceCreditsUsed,
                }).catch((err) => {
                  console.error('Failed to send low credit email:', err);
                });
                console.log(`Low credit email triggered for user ${agent.userId}`);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error deducting credits:', error);
        // Don't throw - credit deduction failure shouldn't break webhook
      }
    }

    // Log to Google Sheets (non-blocking, fire-and-forget)
    // Check if any book_appointment tool was called
    // Vapi can send toolCalls in different formats, so check multiple paths
    // Also check messages array for tool-call-result messages
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

    // Fire-and-forget pattern - don't await
    Promise.resolve().then(() =>
      logCallToSheets(agent.userId, {
        startedAt: call.startedAt ? new Date(call.startedAt) : new Date(),
        phoneNumber,
        agentName: agent.name,
        durationSeconds: durationSeconds || null,
        status: finalStatus,
        summary: artifact?.summary || null,
        transcript,
        appointmentBooked,
      })
    );
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
          result: 'Es tut mir leid, ich habe momentan technische Schwierigkeiten.',
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
          result: 'Es tut mir leid, ich habe momentan technische Schwierigkeiten.',
        })),
      });
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
              // Get agent's user and check Google connection
              const agentWithUser = await prisma.agent.findUnique({
                where: { id: agent.id },
                include: { user: true },
              });

              if (!agentWithUser?.user) {
                result = 'Es tut mir leid, ich habe momentan technische Schwierigkeiten.';
                break;
              }

              const oauth2Client = await getOAuth2ClientForUser(agentWithUser.user.id);
              if (!oauth2Client) {
                result = 'Leider ist die Kalenderbuchung noch nicht eingerichtet. Bitte rufen Sie später noch einmal an oder hinterlassen Sie Ihre Kontaktdaten.';
                break;
              }

              try {
                const timeZone = args.timeZone || 'Europe/Berlin';
                const correctedDateStr = validateAndCorrectDate(args.date);
                const date = new Date(correctedDateStr);
                const appointmentDuration = agentWithUser.user.appointmentDuration || 30;
                const slots = await getAvailableSlots(oauth2Client, date, timeZone, appointmentDuration);

                // Format date in German
                const formattedDate = formatDateGerman(date);

                if (slots.length === 0) {
                  result = `Am ${formattedDate} sind leider keine Termine mehr frei. Möchten Sie einen anderen Tag versuchen?`;
                } else {
                  const slotList = slots.slice(0, 5).map(s => s.displayTime).join(', ');
                  result = `Am ${formattedDate} habe ich folgende Zeiten verfügbar: ${slotList}. Welche Zeit passt Ihnen am besten?`;
                }
              } catch (error) {
                console.error('Calendar availability error:', error);
                result = 'Ich habe gerade Schwierigkeiten, den Kalender zu prüfen. Bitte versuchen Sie es noch einmal.';
              }
              break;
            }

            case 'book_appointment': {
              // Get agent's user and check Google connection
              const agentWithUser = await prisma.agent.findUnique({
                where: { id: agent.id },
                include: { user: true },
              });

              if (!agentWithUser?.user) {
                result = 'Es tut mir leid, ich habe momentan technische Schwierigkeiten.';
                break;
              }

              const oauth2Client = await getOAuth2ClientForUser(agentWithUser.user.id);
              if (!oauth2Client) {
                result = 'Leider ist die Kalenderbuchung noch nicht eingerichtet. Bitte rufen Sie später noch einmal an oder hinterlassen Sie Ihre Kontaktdaten.';
                break;
              }

              try {
                const timeZone = args.timeZone || 'Europe/Berlin';
                const correctedDateStr = validateAndCorrectDate(args.date);
                const start = parseDateTime(correctedDateStr, args.time, timeZone);

                // Use user's configured appointment duration
                const appointmentDuration = agentWithUser.user.appointmentDuration || 30;

                // Calculate end time based on configured duration
                const [datePart, timePart] = start.split('T');
                const [hh, mm] = timePart.split(':').map(Number);
                let totalMinutes = hh * 60 + mm + appointmentDuration;
                const endHour = Math.floor(totalMinutes / 60) % 24;
                const endMin = totalMinutes % 60;
                const end = `${datePart}T${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}:00`;

                const event = await bookAppointment(oauth2Client, {
                  summary: args.summary || `Termin mit ${args.callerName}`,
                  start,
                  end,
                  timeZone,
                  attendeeEmail: args.callerEmail,
                  description: `Per Sprachassistent gebucht.\n\nAnrufer: ${args.callerName}${args.callerPhone ? `\nTelefon: ${args.callerPhone}` : ''}${args.callerEmail ? `\nE-Mail: ${args.callerEmail}` : ''}`,
                });

                // Format date in German for confirmation (using corrected date)
                const bookingDate = new Date(correctedDateStr);
                const formattedDate = formatDateGerman(bookingDate);
                result = `Ihr Termin am ${formattedDate} um ${args.time} ist eingetragen. Vielen Dank, ${args.callerName}!`;
              } catch (error) {
                console.error('Calendar booking error:', error);
                result = 'Den Termin konnte ich leider nicht eintragen. Dieser Zeitpunkt ist möglicherweise bereits belegt. Möchten Sie eine andere Zeit versuchen?';
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
 * Returns dynamic assistant config with current date in system prompt
 */
async function handleAssistantRequest(message: { call?: { assistantId?: string; phoneNumberId?: string } }) {
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

    // Build dynamic system prompt with current date prepended to stored prompt
    const today = new Date();
    const currentDateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const day = today.getDate();

    // Calculate tomorrow's date
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const tomorrowDay = tomorrow.getDate();
    const tomorrowMonth = tomorrow.getMonth() + 1;
    const tomorrowYear = tomorrow.getFullYear();

    // Format dates in German style (DD.MM.YYYY)
    const todayGerman = `${day}.${month}.${year}`;
    const tomorrowGerman = `${tomorrowDay}.${tomorrowMonth}.${tomorrowYear}`;

    const dateHeader = `[AKTUELLES DATUM UND ZEIT-KONTEXT:
- Heute ist ${todayGerman} (ISO: ${currentDateStr})
- Morgen ist ${tomorrowGerman} (ISO: ${tomorrowStr})
- Aktuelles Jahr: ${year}

WICHTIG FUR TERMINBUCHUNGEN:
- Wenn der Anrufer "morgen" sagt, verwende ${tomorrowStr}
- Wenn der Anrufer einen Monat nennt (z.B. "Januar", "Oktober"), bestimme das richtige Jahr:
  * Wenn der Monat noch nicht vorbei ist dieses Jahr -> verwende ${year}
  * Wenn der Monat bereits vorbei ist dieses Jahr -> verwende ${tomorrowYear}
- NIEMALS vergangene Jahre wie 2023 oder 2024 verwenden
- Datumsformat fur Tools: JJJJ-MM-TT (z.B. ${currentDateStr})
]\n\n`;

    // Use agent's stored system prompt with date header
    const systemPrompt = dateHeader + agent.systemPrompt;

    // Check if user has Google Calendar connected
    const hasCalendarTools = agent.user?.googleRefreshToken ? true : false;

    const serverUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Build dynamic date examples for tool descriptions
    // CRITICAL: These must be very explicit because LLMs often ignore system prompt date info
    const dateRuleForTools = `KRITISCH: Heute ist ${currentDateStr}. "morgen" = ${tomorrowStr}. NIEMALS 2023 oder 2024 verwenden!`;

    // Build tools if calendar connected
    const tools = hasCalendarTools ? [
      {
        type: 'function',
        async: false,
        server: { url: `${serverUrl}/api/webhooks/vapi` },
        function: {
          name: 'check_availability',
          description: `Prüft die Kalenderverfügbarkeit. ${dateRuleForTools}`,
          parameters: {
            type: 'object',
            properties: {
              date: { type: 'string', description: `PFLICHT: Format JJJJ-MM-TT. HEUTE=${currentDateStr}. MORGEN=${tomorrowStr}. Wenn Anrufer "morgen" sagt, MUSS ${tomorrowStr} verwendet werden!` },
              timeZone: { type: 'string', description: 'IANA-Zeitzone. Standard: Europe/Berlin.' },
            },
            required: ['date'],
          },
        },
      },
      {
        type: 'function',
        async: false,
        server: { url: `${serverUrl}/api/webhooks/vapi` },
        function: {
          name: 'book_appointment',
          description: `Bucht einen Termin. ${dateRuleForTools}`,
          parameters: {
            type: 'object',
            properties: {
              date: { type: 'string', description: `PFLICHT: Format JJJJ-MM-TT. HEUTE=${currentDateStr}. MORGEN=${tomorrowStr}. Wenn Anrufer "morgen" sagt, MUSS ${tomorrowStr} verwendet werden!` },
              time: { type: 'string', description: 'Uhrzeit im Format HH:MM (24-Stunden-Format, z.B. 14:30)' },
              callerName: { type: 'string', description: 'Vollständiger Name des Anrufers (erforderlich)' },
              callerPhone: { type: 'string', description: 'Telefonnummer des Anrufers (optional)' },
              callerEmail: { type: 'string', description: 'E-Mail-Adresse des Anrufers (optional)' },
              summary: { type: 'string', description: 'Kurze Beschreibung des Termins (optional)' },
              timeZone: { type: 'string', description: 'IANA-Zeitzone. Standard: Europe/Berlin.' },
            },
            required: ['date', 'time', 'callerName'],
          },
        },
      },
    ] : undefined;

    // Return assistant config
    const assistantConfig = {
      name: agent.name,
      firstMessage: agent.greeting || `${agent.businessName}, guten Tag! Wie kann ich Ihnen behilflich sein?`,
      model: {
        provider: 'openai',
        model: 'gpt-4o',
        messages: [{ role: 'system', content: systemPrompt }],
        ...(tools && { tools }),
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

    console.log(`Assistant request: returning dynamic config for ${agent.name} with date ${currentDateStr}`);
    return NextResponse.json({ assistant: assistantConfig });
  } catch (error) {
    console.error('Error handling assistant request:', error);
    return NextResponse.json({ error: 'Failed to build assistant config' }, { status: 500 });
  }
}
