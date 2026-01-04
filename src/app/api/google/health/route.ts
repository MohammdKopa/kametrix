import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSessionFromCookies, validateSession } from '@/lib/auth';
import { getOAuth2ClientForUser } from '@/lib/google/auth';
import { verifySheetConnection } from '@/lib/google/sheets';

/**
 * Health check endpoint for Google integration
 *
 * GET /api/google/health
 *
 * Returns the status of the Google integration for the authenticated user:
 * - connected: Whether the user has connected their Google account
 * - sheets: Health status of Google Sheets integration
 * - calendar: Health status of Google Calendar integration (if applicable)
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user via session cookies
    const cookieStore = await cookies();
    const token = getSessionFromCookies(cookieStore);

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const sessionData = await validateSession(token);
    if (!sessionData) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      );
    }

    const userId = sessionData.user.id;

    // Try to get OAuth2 client for the user
    const oauth2Client = await getOAuth2ClientForUser(userId);

    if (!oauth2Client) {
      return NextResponse.json({
        connected: false,
        sheets: { healthy: false, error: 'Google account not connected' },
        calendar: { healthy: false, error: 'Google account not connected' },
        message: 'Please connect your Google account to use Google integrations.',
      });
    }

    // Check Sheets connection
    const sheetsHealth = await verifySheetConnection(oauth2Client);

    // Check Calendar connection (simple token validation via freebusy query)
    let calendarHealth: { healthy: boolean; error?: string } = { healthy: false };
    try {
      const { google } = await import('googleapis');
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      // Try a simple API call to verify calendar access
      await calendar.calendarList.list({ maxResults: 1 });
      calendarHealth = { healthy: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (
        errorMessage.includes('invalid_grant') ||
        errorMessage.includes('Token has been expired') ||
        errorMessage.includes('Token has been revoked')
      ) {
        calendarHealth = {
          healthy: false,
          error: 'Token expired or revoked. Please reconnect your Google account.',
        };
      } else {
        calendarHealth = { healthy: false, error: errorMessage };
      }
    }

    // Determine overall health
    const isHealthy = sheetsHealth.healthy && calendarHealth.healthy;

    return NextResponse.json({
      connected: true,
      healthy: isHealthy,
      sheets: sheetsHealth,
      calendar: calendarHealth,
      message: isHealthy
        ? 'Google integration is working correctly.'
        : 'Some Google services are experiencing issues.',
    });
  } catch (error) {
    console.error('Error checking Google health:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        connected: false,
        healthy: false,
        error: errorMessage,
        message: 'Failed to check Google integration health.',
      },
      { status: 500 }
    );
  }
}
