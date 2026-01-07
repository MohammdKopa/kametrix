import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOAuth2ClientForUser } from '@/lib/google/auth';
import { updateEvent, rescheduleEvent, parseDateTime } from '@/lib/google/calendar';
import { isAuthenticationError } from '@/lib/google/sheets';
import {
  applyGoogleCalendarRateLimit,
  recordGoogleCalendarSuccess,
  recordGoogleCalendarError,
} from '@/lib/quota';

/**
 * POST /api/google/calendar/update
 *
 * Update an existing calendar event
 * Used by Vapi tool calls during live conversations
 *
 * Request body:
 * - agentId: string - Agent ID to get user's calendar
 * - eventId: string - Event ID to update
 * - date?: string - New date in YYYY-MM-DD format (for rescheduling)
 * - time?: string - New time in HH:MM AM/PM or HH:MM format (for rescheduling)
 * - summary?: string - New event title
 * - description?: string - New description
 * - location?: string - New location
 * - timeZone?: string - IANA timezone (defaults to America/New_York)
 *
 * Response:
 * - success: boolean
 * - message: Human-readable message for voice agent
 * - event?: Updated event details
 */
export async function POST(req: NextRequest) {
  let userId: string | null = null;
  let agentId: string | null = null;

  try {
    const body = await req.json();
    const {
      eventId,
      date,
      time,
      summary,
      description,
      location,
      timeZone = 'America/New_York',
    } = body;
    agentId = body.agentId;

    // Validate required fields
    if (!agentId || !eventId) {
      return NextResponse.json(
        { error: 'Missing required fields: agentId, eventId' },
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

    userId = agent.userId;

    // Check if Google is connected
    if (!agent.user.googleRefreshToken) {
      return NextResponse.json({
        success: false,
        message: "I'm sorry, calendar access isn't set up yet. Please try again later.",
      });
    }

    // Apply rate limiting
    const rateLimitResult = await applyGoogleCalendarRateLimit(req, userId, agentId);
    if (!rateLimitResult.allowed && rateLimitResult.response) {
      return rateLimitResult.response;
    }

    // Get OAuth client for user
    const oauth2Client = await getOAuth2ClientForUser(agent.userId);

    if (!oauth2Client) {
      return NextResponse.json({
        success: false,
        message: "I'm having trouble accessing the calendar right now. Please try again later.",
      });
    }

    try {
      const appointmentDuration = agent.user.appointmentDuration || 30;

      // If date and time are provided, this is a reschedule
      if (date && time) {
        const startDateTime = parseDateTime(date, time, timeZone);
        const endDateTime = new Date(startDateTime);
        endDateTime.setMinutes(endDateTime.getMinutes() + appointmentDuration);

        const event = await rescheduleEvent(
          oauth2Client,
          eventId,
          startDateTime,
          endDateTime.toISOString(),
          timeZone
        );

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

        // Record successful API call
        if (userId) {
          await recordGoogleCalendarSuccess(userId);
        }

        return NextResponse.json({
          success: true,
          message: `I've rescheduled your appointment to ${confirmationDate} at ${confirmationTime}.`,
          event: {
            id: event.id,
            summary: event.summary,
            start: event.start,
            end: event.end,
            htmlLink: event.htmlLink,
          },
        });
      }

      // Otherwise, update other fields
      const event = await updateEvent(oauth2Client, {
        eventId,
        summary,
        description,
        location,
        timeZone,
      });

      // Record successful API call
      if (userId) {
        await recordGoogleCalendarSuccess(userId);
      }

      return NextResponse.json({
        success: true,
        message: "I've updated your appointment details.",
        event: {
          id: event.id,
          summary: event.summary,
          start: event.start,
          end: event.end,
          htmlLink: event.htmlLink,
        },
      });
    } catch (error) {
      console.error('Error updating event:', error);

      // Record API error for quota tracking
      if (userId) {
        const isRateLimitError = error instanceof Error &&
          (error.message.includes('rate limit') || error.message.includes('quota'));
        await recordGoogleCalendarError(userId, isRateLimitError);
      }

      // Check if this is an authentication error requiring reconnection
      if (isAuthenticationError(error)) {
        return NextResponse.json({
          success: false,
          message: "I'm sorry, the calendar connection needs to be refreshed. Please try again later.",
          error: 'Google authentication expired',
          requiresReconnect: true,
        });
      }

      const errorMessage = error instanceof Error ? error.message : '';

      if (errorMessage.includes('not found')) {
        return NextResponse.json({
          success: false,
          message: "I couldn't find that appointment. Could you please provide more details?",
        });
      }

      return NextResponse.json({
        success: false,
        message: "I wasn't able to update that appointment. Would you like to try again?",
        error: errorMessage,
      });
    }
  } catch (error) {
    console.error('Error in update endpoint:', error);

    // Record API error for quota tracking
    if (userId) {
      const isRateLimitError = error instanceof Error &&
        (error.message.includes('rate limit') || error.message.includes('quota'));
      await recordGoogleCalendarError(userId, isRateLimitError);
    }

    // Check if this is an authentication error requiring reconnection
    if (isAuthenticationError(error)) {
      return NextResponse.json({
        success: false,
        message: "I'm sorry, the calendar connection needs to be refreshed. Please try again later.",
        error: 'Google authentication expired',
        requiresReconnect: true,
      });
    }

    return NextResponse.json({
      success: false,
      message: "I'm having trouble with calendar updates right now. Please try again later.",
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
