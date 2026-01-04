import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOAuth2ClientForUser } from '@/lib/google/auth';
import { deleteEvent, cancelRecurringInstance } from '@/lib/google/calendar';
import { isAuthenticationError } from '@/lib/google/sheets';

/**
 * POST /api/google/calendar/delete
 *
 * Delete/cancel a calendar event
 * Used by Vapi tool calls during live conversations
 *
 * Request body:
 * - agentId: string - Agent ID to get user's calendar
 * - eventId: string - Event ID to delete
 * - instanceDate?: string - For recurring events, the specific instance date (YYYY-MM-DD)
 * - sendNotifications?: boolean - Whether to notify attendees (default: true)
 *
 * Response:
 * - success: boolean
 * - message: Human-readable message for voice agent
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      agentId,
      eventId,
      instanceDate,
      sendNotifications = true,
    } = body;

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

    // Check if Google is connected
    if (!agent.user.googleRefreshToken) {
      return NextResponse.json({
        success: false,
        message: "I'm sorry, calendar access isn't set up yet. Please try again later.",
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

    try {
      if (instanceDate) {
        // Cancel a specific instance of a recurring event
        await cancelRecurringInstance(oauth2Client, eventId, instanceDate);
        return NextResponse.json({
          success: true,
          message: "I've cancelled that occurrence of the recurring appointment.",
        });
      } else {
        // Delete the entire event
        await deleteEvent(oauth2Client, eventId, sendNotifications);
        return NextResponse.json({
          success: true,
          message: "I've cancelled the appointment. All attendees will be notified.",
        });
      }
    } catch (error) {
      console.error('Error deleting event:', error);

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
          message: "I couldn't find that appointment. It may have already been cancelled.",
        });
      }

      return NextResponse.json({
        success: false,
        message: "I wasn't able to cancel that appointment. Would you like to try again?",
        error: errorMessage,
      });
    }
  } catch (error) {
    console.error('Error in delete endpoint:', error);

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
