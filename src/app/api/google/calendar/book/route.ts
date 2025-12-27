import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOAuth2ClientForUser } from '@/lib/google/auth';
import { bookAppointment, parseDateTime } from '@/lib/google/calendar';

/**
 * POST /api/google/calendar/book
 *
 * Book an appointment on the calendar
 * Used by Vapi tool calls during live conversations
 *
 * Request body:
 * - agentId: string - Agent ID to get user's calendar
 * - date: string - Date in YYYY-MM-DD format
 * - time: string - Time in HH:MM AM/PM or HH:MM format
 * - callerName?: string - Caller's name
 * - callerPhone?: string - Caller's phone number
 * - callerEmail?: string - Caller's email address
 * - summary?: string - Event title (defaults to "Appointment")
 * - timeZone?: string - IANA timezone (defaults to America/New_York)
 *
 * Response:
 * - success: boolean
 * - message: Human-readable message for voice agent
 * - event?: Booked event details
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      agentId,
      date,
      time,
      callerName,
      callerPhone,
      callerEmail,
      summary = 'Appointment',
      timeZone = 'America/New_York',
    } = body;

    // Validate required fields
    if (!agentId || !date || !time) {
      return NextResponse.json(
        { error: 'Missing required fields: agentId, date, time' },
        { status: 400 }
      );
    }

    // Find agent and get user
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: { user: true },
    });

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Check if Google is connected
    if (!agent.user.googleRefreshToken) {
      return NextResponse.json({
        success: false,
        message: "I'm sorry, calendar booking isn't set up yet. Please call back later.",
      });
    }

    // Get OAuth client for user
    const oauth2Client = await getOAuth2ClientForUser(agent.userId);

    if (!oauth2Client) {
      return NextResponse.json({
        success: false,
        message: "I'm having trouble accessing the calendar right now. Please try again later.",
      });
    }

    // Parse date and time
    let startDateTime: string;
    try {
      startDateTime = parseDateTime(date, time, timeZone);
    } catch (error) {
      return NextResponse.json({
        success: false,
        message: "I couldn't understand that time. Could you please repeat it?",
        error: error instanceof Error ? error.message : 'Invalid date/time format',
      });
    }

    // Calculate end time based on user's configured appointment duration
    const appointmentDuration = agent.user.appointmentDuration || 30;
    const endDateTime = new Date(startDateTime);
    endDateTime.setMinutes(endDateTime.getMinutes() + appointmentDuration);

    // Build appointment title with caller name if provided
    const appointmentTitle = callerName
      ? `${summary} - ${callerName}`
      : summary;

    // Book the appointment
    try {
      const event = await bookAppointment(oauth2Client, {
        summary: appointmentTitle,
        start: startDateTime,
        end: endDateTime.toISOString(),
        attendeeEmail: callerEmail,
        callerName,
        callerPhone,
        timeZone,
      });

      // Format confirmation message
      const confirmationTime = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone,
      }).format(new Date(startDateTime));

      const confirmationDate = new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        timeZone,
      }).format(new Date(startDateTime));

      const message = callerEmail
        ? `Perfect! I've booked your appointment for ${confirmationDate} at ${confirmationTime}. You'll receive a confirmation email at ${callerEmail}.`
        : `Perfect! I've booked your appointment for ${confirmationDate} at ${confirmationTime}.`;

      return NextResponse.json({
        success: true,
        message,
        event: {
          id: event.id,
          summary: event.summary,
          start: event.start,
          end: event.end,
          htmlLink: event.htmlLink,
        },
      });
    } catch (error) {
      console.error('Error booking appointment:', error);

      // Check for specific error types
      const errorMessage = error instanceof Error ? error.message : '';

      if (errorMessage.includes('already booked') || errorMessage.includes('conflict')) {
        return NextResponse.json({
          success: false,
          message: "I'm sorry, that time slot is no longer available. Would you like to try a different time?",
        });
      }

      return NextResponse.json({
        success: false,
        message: "I wasn't able to book that appointment. Would you like to try a different time?",
        error: errorMessage,
      });
    }
  } catch (error) {
    console.error('Error in booking endpoint:', error);

    return NextResponse.json({
      success: false,
      message: "I'm having trouble booking appointments right now. Please try again later.",
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
