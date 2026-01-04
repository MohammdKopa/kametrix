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
  CalendarError,
  CalendarErrorType,
} from '@/lib/google/calendar';
import { prisma } from '@/lib/prisma';
import { deductCreditsForCall, isLowBalance } from '@/lib/credits';
import { sendLowCreditEmail } from '@/lib/email';
import { formatDateGerman } from '@/lib/localization';
import { verifyVapiSignature } from '@/lib/webhook-auth';
import { buildDateHeader, buildCalendarTools } from '@/lib/prompts';

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
                const correctedDateStr = parseDateInput(args.date);
                const date = new Date(correctedDateStr);
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
                result = 'Leider ist die Kalenderbuchung noch nicht eingerichtet.';
                break;
              }

              try {
                const timeZone = args.timeZone || 'Europe/Berlin';
                const correctedDateStr = parseDateInput(args.date);
                const parsedTime = parseTimeInput(args.time);
                const appointmentDuration = args.durationMinutes || agentWithUser.user.appointmentDuration || 30;

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
                const correctedDateStr = parseDateInput(args.date);
                // Enhanced time parsing for natural language times
                const parsedTime = parseTimeInput(args.time);
                const start = parseDateTime(correctedDateStr, parsedTime, timeZone);

                // Use user's configured appointment duration
                const appointmentDuration = agentWithUser.user.appointmentDuration || 30;

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
                result = 'Leider ist die Kalenderbuchung noch nicht eingerichtet.';
                break;
              }

              try {
                const timeZone = args.timeZone || 'Europe/Berlin';
                const appointmentDuration = agentWithUser.user.appointmentDuration || 30;

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
                result = 'Leider ist die Kalenderabfrage noch nicht eingerichtet.';
                break;
              }

              try {
                const timeZone = args.timeZone || 'Europe/Berlin';
                const appointmentDuration = agentWithUser.user.appointmentDuration || 30;

                let afterDate = new Date();
                if (args.afterDate) {
                  const correctedDateStr = parseDateInput(args.afterDate);
                  afterDate = new Date(correctedDateStr);
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
 * Returns dynamic assistant config with Vapi dynamic variables for real-time date
 *
 * Uses Vapi dynamic variables which are substituted at call time:
 * https://docs.vapi.ai/assistants/dynamic-variables#advanced-date-and-time-usage
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

    // Check if the stored prompt already has Vapi dynamic variables
    const hasVapiVariables = agent.systemPrompt.includes('{{"now"');

    // Build date header using consolidated module (only if stored prompt lacks Vapi vars)
    const dateHeader = hasVapiVariables ? '' : buildDateHeader();

    // Use agent's stored system prompt with date header (if needed)
    const systemPrompt = dateHeader + agent.systemPrompt;

    // Check if user has Google Calendar connected
    const hasCalendarTools = agent.user?.googleRefreshToken ? true : false;

    const serverUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Build tools using consolidated module
    const tools = hasCalendarTools ? buildCalendarTools(serverUrl) : undefined;

    // Return assistant config
    const assistantConfig = {
      name: agent.name,
      firstMessage: agent.greeting || `${agent.businessName}, guten Tag! Wie kann ich Ihnen behilflich sein?`,
      model: {
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
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

    console.log(`Assistant request: returning config for ${agent.name} | Using Vapi dynamic date variables`);
    return NextResponse.json({ assistant: assistantConfig });
  } catch (error) {
    console.error('Error handling assistant request:', error);
    return NextResponse.json({ error: 'Failed to build assistant config' }, { status: 500 });
  }
}
