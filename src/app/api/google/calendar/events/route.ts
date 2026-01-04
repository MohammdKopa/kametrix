import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOAuth2ClientForUser } from '@/lib/google/auth';
import { listEvents, searchEvents, findEventsByAttendee, getEvent, findNextAvailableSlot } from '@/lib/google/calendar';
import { isAuthenticationError } from '@/lib/google/sheets';

/**
 * POST /api/google/calendar/events
 *
 * Query calendar events
 * Used by Vapi tool calls during live conversations
 *
 * Request body:
 * - agentId: string - Agent ID to get user's calendar
 * - action: 'list' | 'search' | 'get' | 'findByAttendee' | 'nextAvailable'
 * - startDate?: string - Start date for listing (YYYY-MM-DD)
 * - endDate?: string - End date for listing (YYYY-MM-DD)
 * - eventId?: string - Event ID for 'get' action
 * - query?: string - Search query for 'search' action
 * - attendeeEmail?: string - Email for 'findByAttendee' action
 * - maxResults?: number - Maximum results to return
 * - timeZone?: string - IANA timezone
 *
 * Response:
 * - success: boolean
 * - message: Human-readable message for voice agent
 * - events?: Array of events
 * - event?: Single event (for 'get' action)
 * - nextSlot?: Next available slot (for 'nextAvailable' action)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      agentId,
      action,
      startDate,
      endDate,
      eventId,
      query,
      attendeeEmail,
      maxResults = 10,
      timeZone = 'America/New_York',
    } = body;

    // Validate required fields
    if (!agentId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: agentId, action' },
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
        message: "I'm sorry, calendar access isn't set up yet. Please try again later.",
        events: [],
      });
    }

    // Get OAuth client for user
    const oauth2Client = await getOAuth2ClientForUser(agent.userId);

    if (!oauth2Client) {
      return NextResponse.json({
        success: false,
        message: "I'm having trouble accessing the calendar right now. Please try again later.",
        events: [],
      });
    }

    try {
      switch (action) {
        case 'list': {
          if (!startDate || !endDate) {
            return NextResponse.json({
              success: false,
              message: "Please specify a date range to view appointments.",
              events: [],
            });
          }

          const events = await listEvents(oauth2Client, startDate, endDate, {
            maxResults,
          });

          if (events.length === 0) {
            return NextResponse.json({
              success: true,
              message: "You don't have any appointments scheduled during that time.",
              events: [],
              count: 0,
            });
          }

          const eventList = events.slice(0, 5).map(e => {
            const startTime = new Intl.DateTimeFormat('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              timeZone,
            }).format(new Date(e.start));
            return `${e.summary} on ${startTime}`;
          }).join('; ');

          return NextResponse.json({
            success: true,
            message: events.length <= 5
              ? `You have ${events.length} appointment${events.length > 1 ? 's' : ''}: ${eventList}`
              : `You have ${events.length} appointments. Here are the next few: ${eventList}`,
            events: events.map(e => ({
              id: e.id,
              summary: e.summary,
              start: e.start,
              end: e.end,
              location: e.location,
            })),
            count: events.length,
          });
        }

        case 'search': {
          if (!query) {
            return NextResponse.json({
              success: false,
              message: "Please tell me what you're looking for.",
              events: [],
            });
          }

          const events = await searchEvents(oauth2Client, query, {
            maxResults,
          });

          if (events.length === 0) {
            return NextResponse.json({
              success: true,
              message: `I couldn't find any appointments matching "${query}".`,
              events: [],
              count: 0,
            });
          }

          const firstEvent = events[0];
          const startTime = new Intl.DateTimeFormat('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            timeZone,
          }).format(new Date(firstEvent.start));

          return NextResponse.json({
            success: true,
            message: events.length === 1
              ? `I found your appointment: ${firstEvent.summary} on ${startTime}.`
              : `I found ${events.length} appointments matching "${query}". The first is ${firstEvent.summary} on ${startTime}.`,
            events: events.map(e => ({
              id: e.id,
              summary: e.summary,
              start: e.start,
              end: e.end,
              location: e.location,
            })),
            count: events.length,
          });
        }

        case 'get': {
          if (!eventId) {
            return NextResponse.json({
              success: false,
              message: "Please provide an event ID.",
            });
          }

          const event = await getEvent(oauth2Client, eventId);

          if (!event) {
            return NextResponse.json({
              success: false,
              message: "I couldn't find that appointment.",
            });
          }

          const startTime = new Intl.DateTimeFormat('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            timeZone,
          }).format(new Date(event.start));

          return NextResponse.json({
            success: true,
            message: `Your appointment "${event.summary}" is scheduled for ${startTime}${event.location ? ` at ${event.location}` : ''}.`,
            event: {
              id: event.id,
              summary: event.summary,
              start: event.start,
              end: event.end,
              description: event.description,
              location: event.location,
              attendees: event.attendees,
            },
          });
        }

        case 'findByAttendee': {
          if (!attendeeEmail) {
            return NextResponse.json({
              success: false,
              message: "Please provide an email address to search for.",
              events: [],
            });
          }

          const events = await findEventsByAttendee(oauth2Client, attendeeEmail, {
            maxResults,
          });

          if (events.length === 0) {
            return NextResponse.json({
              success: true,
              message: `I couldn't find any appointments with ${attendeeEmail}.`,
              events: [],
              count: 0,
            });
          }

          const firstEvent = events[0];
          const startTime = new Intl.DateTimeFormat('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            timeZone,
          }).format(new Date(firstEvent.start));

          return NextResponse.json({
            success: true,
            message: events.length === 1
              ? `I found an appointment with ${attendeeEmail}: ${firstEvent.summary} on ${startTime}.`
              : `I found ${events.length} appointments with ${attendeeEmail}. The first is ${firstEvent.summary} on ${startTime}.`,
            events: events.map(e => ({
              id: e.id,
              summary: e.summary,
              start: e.start,
              end: e.end,
              location: e.location,
            })),
            count: events.length,
          });
        }

        case 'nextAvailable': {
          const appointmentDuration = agent.user.appointmentDuration || 30;
          const nextSlot = await findNextAvailableSlot(
            oauth2Client,
            new Date(),
            timeZone,
            appointmentDuration
          );

          if (!nextSlot) {
            return NextResponse.json({
              success: false,
              message: "I couldn't find any available slots in the next two weeks.",
            });
          }

          const slotTime = new Intl.DateTimeFormat('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            timeZone,
          }).format(new Date(nextSlot.start));

          return NextResponse.json({
            success: true,
            message: `The next available slot is ${slotTime}.`,
            nextSlot: {
              start: nextSlot.start,
              end: nextSlot.end,
              displayTime: nextSlot.displayTime,
            },
          });
        }

        default:
          return NextResponse.json({
            success: false,
            message: "I don't understand that request. Please try again.",
          });
      }
    } catch (error) {
      console.error('Error querying events:', error);

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
        message: "I'm having trouble accessing your calendar. Please try again later.",
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  } catch (error) {
    console.error('Error in events endpoint:', error);

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
      message: "I'm having trouble with calendar operations right now. Please try again later.",
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
