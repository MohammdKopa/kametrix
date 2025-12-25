import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import { prisma } from '@/lib/prisma';

/**
 * Get or create the call log spreadsheet for a user
 *
 * Auto-creates a spreadsheet titled "Kametrix Call Logs" if it doesn't exist
 * Stores the spreadsheet ID in user.googleSheetId for reuse
 *
 * @param oauth2Client - Authenticated OAuth2Client
 * @param userId - User ID to store/retrieve sheet ID
 * @returns Spreadsheet ID
 */
export async function getOrCreateLogSheet(
  oauth2Client: OAuth2Client,
  userId: string
): Promise<string> {
  const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

  // Check if user already has a sheet ID
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { googleSheetId: true },
  });

  // If sheet exists, verify it's still accessible
  if (user?.googleSheetId) {
    try {
      await sheets.spreadsheets.get({
        spreadsheetId: user.googleSheetId,
      });
      // Sheet still exists and is accessible
      return user.googleSheetId;
    } catch (error) {
      console.log('Existing sheet not accessible, will create new one:', error);
      // Sheet was deleted or access revoked - create a new one
    }
  }

  // Create new spreadsheet
  const spreadsheet = await sheets.spreadsheets.create({
    requestBody: {
      properties: {
        title: 'Kametrix Call Logs',
      },
      sheets: [
        {
          properties: {
            title: 'Calls',
          },
          data: [
            {
              rowData: [
                {
                  values: [
                    { userEnteredValue: { stringValue: 'Date' } },
                    { userEnteredValue: { stringValue: 'Time' } },
                    { userEnteredValue: { stringValue: 'Caller' } },
                    { userEnteredValue: { stringValue: 'Agent' } },
                    { userEnteredValue: { stringValue: 'Duration' } },
                    { userEnteredValue: { stringValue: 'Status' } },
                    { userEnteredValue: { stringValue: 'Summary' } },
                    { userEnteredValue: { stringValue: 'Appointment Booked' } },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  });

  const spreadsheetId = spreadsheet.data.spreadsheetId!;

  // Store spreadsheet ID in database
  await prisma.user.update({
    where: { id: userId },
    data: { googleSheetId: spreadsheetId },
  });

  console.log(`Created new call log spreadsheet: ${spreadsheetId}`);
  return spreadsheetId;
}

/**
 * Append a call log entry to the spreadsheet
 *
 * @param oauth2Client - Authenticated OAuth2Client
 * @param sheetId - Spreadsheet ID
 * @param callData - Call data to log
 * @returns Success status
 */
export async function appendCallLog(
  oauth2Client: OAuth2Client,
  sheetId: string,
  callData: {
    startedAt: Date;
    phoneNumber: string;
    agentName: string;
    durationSeconds?: number | null;
    status: string;
    summary?: string | null;
    appointmentBooked?: boolean | string;
  }
): Promise<boolean> {
  try {
    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

    // Format date as YYYY-MM-DD
    const date = callData.startedAt.toISOString().split('T')[0];

    // Format time as HH:MM AM/PM
    const time = callData.startedAt.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    // Format duration as "Xm Ys"
    let duration = 'N/A';
    if (callData.durationSeconds) {
      const minutes = Math.floor(callData.durationSeconds / 60);
      const seconds = callData.durationSeconds % 60;
      duration = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
    }

    // Format appointment booked
    let appointment = 'No';
    if (callData.appointmentBooked) {
      if (typeof callData.appointmentBooked === 'string') {
        appointment = callData.appointmentBooked;
      } else {
        appointment = 'Yes';
      }
    }

    // Prepare row data
    const values = [
      [
        date,
        time,
        callData.phoneNumber,
        callData.agentName,
        duration,
        callData.status,
        callData.summary || '',
        appointment,
      ],
    ];

    // Append to the Calls sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: 'Calls!A:H',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values,
      },
    });

    console.log(`Logged call to sheet ${sheetId}`);
    return true;
  } catch (error) {
    console.error('Error appending call log:', error);
    return false;
  }
}
