import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOAuth2ClientForUser } from '@/lib/google/auth';
import { getAvailableSlots } from '@/lib/google/calendar';

/**
 * POST /api/google/calendar/availability
 *
 * Check calendar availability for a given date
 * Used by Vapi tool calls during live conversations
 *
 * Request body:
 * - agentId: string - Agent ID to get user's calendar
 * - date: string - Date in YYYY-MM-DD format
 * - timeZone?: string - IANA timezone (defaults to America/New_York)
 *
 * Response:
 * - slots: Array of available time slots
 * - message: Human-readable message for voice agent
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { agentId, date, timeZone = 'America/New_York' } = body;

    // Validate required fields
    if (!agentId || !date) {
      return NextResponse.json(
        { error: 'Missing required fields: agentId, date' },
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
        available: false,
        message: "I'm sorry, calendar booking isn't set up yet. Please call back later.",
        slots: [],
      });
    }

    // Get OAuth client for user
    const oauth2Client = await getOAuth2ClientForUser(agent.userId);

    if (!oauth2Client) {
      return NextResponse.json({
        available: false,
        message: "I'm having trouble accessing the calendar right now. Please try again later.",
        slots: [],
      });
    }

    // Parse date
    const requestedDate = new Date(date);
    if (isNaN(requestedDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD.' },
        { status: 400 }
      );
    }

    // Get available slots
    const slots = await getAvailableSlots(oauth2Client, requestedDate, timeZone);

    // Format response for voice agent
    if (slots.length === 0) {
      return NextResponse.json({
        available: false,
        message: "I don't see any available slots on that date. Would you like to try a different day?",
        slots: [],
      });
    }

    // Create voice-friendly list of times
    const timeList = slots.slice(0, 5).map(slot => slot.displayTime).join(', ');
    const message = slots.length <= 5
      ? `I have availability at: ${timeList}`
      : `I have availability at: ${timeList}, and ${slots.length - 5} more times`;

    return NextResponse.json({
      available: true,
      message,
      slots,
      count: slots.length,
    });
  } catch (error) {
    console.error('Error checking calendar availability:', error);

    return NextResponse.json({
      available: false,
      message: "I'm having trouble checking the calendar right now. Please try again later.",
      slots: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
