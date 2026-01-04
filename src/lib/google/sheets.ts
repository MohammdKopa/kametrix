import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import { prisma } from '@/lib/prisma';

/**
 * Retry configuration for Google API calls
 */
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
};

/**
 * HTTP status codes that indicate a retryable error
 */
const RETRYABLE_ERROR_CODES = [
  429, // Rate limit exceeded
  500, // Internal server error
  502, // Bad gateway
  503, // Service unavailable
  504, // Gateway timeout
];

/**
 * Sleep for a specified number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay with jitter
 */
function calculateBackoffDelay(attemptNum: number): number {
  const delay = Math.min(
    RETRY_CONFIG.baseDelayMs * Math.pow(2, attemptNum),
    RETRY_CONFIG.maxDelayMs
  );
  // Add jitter (+-25%) to prevent thundering herd
  const jitter = delay * 0.25 * (Math.random() * 2 - 1);
  return Math.floor(delay + jitter);
}

/**
 * Check if an error is an authentication/authorization error that requires user action
 * These errors should NOT be retried and should prompt user to reconnect
 */
export function isAuthenticationError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const message = (error as Error).message?.toLowerCase() || '';

  // Check for OAuth-related errors
  if (
    message.includes('invalid_grant') ||
    message.includes('token has been expired') ||
    message.includes('token has been revoked') ||
    message.includes('invalid_token') ||
    message.includes('token expired') ||
    message.includes('access_denied')
  ) {
    return true;
  }

  // Check for 401 status codes (unauthorized)
  const err = error as { code?: number; status?: number; response?: { status?: number } };
  const statusCode = err.code || err.status || err.response?.status;

  if (statusCode === 401) {
    return true;
  }

  return false;
}

/**
 * Check if an error is retryable based on status code or error type
 */
function isRetryableError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  // Authentication errors should never be retried
  if (isAuthenticationError(error)) {
    return false;
  }

  // Check for Google API error codes
  const err = error as { code?: number; status?: number; response?: { status?: number } };
  const statusCode = err.code || err.status || err.response?.status;

  if (statusCode && RETRYABLE_ERROR_CODES.includes(statusCode)) {
    return true;
  }

  // Check for network errors
  const message = (error as Error).message?.toLowerCase() || '';
  return (
    message.includes('econnreset') ||
    message.includes('etimedout') ||
    message.includes('socket hang up') ||
    message.includes('network error')
  );
}

/**
 * Execute an operation with automatic retry and exponential backoff
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt < RETRY_CONFIG.maxRetries && isRetryableError(error)) {
        const delay = calculateBackoffDelay(attempt);
        console.log(
          `${operationName} failed (attempt ${attempt + 1}/${RETRY_CONFIG.maxRetries + 1}), ` +
          `retrying in ${delay}ms...`
        );
        await sleep(delay);
      } else {
        // Non-retryable error or max retries reached
        break;
      }
    }
  }

  throw lastError;
}

/**
 * Result type for sheets operations with detailed status
 */
export interface SheetsOperationResult {
  success: boolean;
  error?: string;
  errorCode?: string;
  /** True if the error is due to authentication issues requiring user to reconnect */
  requiresReconnect?: boolean;
}

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
      await withRetry(
        () => sheets.spreadsheets.get({ spreadsheetId: user.googleSheetId! }),
        'Sheets.get'
      );
      // Sheet still exists and is accessible
      return user.googleSheetId;
    } catch (error) {
      // If it's an authentication error, don't try to create a new sheet
      // Re-throw so the caller knows the user needs to reconnect
      if (isAuthenticationError(error)) {
        console.error('Google authentication error - user needs to reconnect:', error);
        throw error;
      }
      // Sheet was deleted or not found - we can create a new one
      console.log('Existing sheet not accessible, will create new one:', error);
    }
  }

  // Create new spreadsheet with retry
  const spreadsheet = await withRetry(
    () =>
      sheets.spreadsheets.create({
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
      }),
    'Sheets.create'
  );

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
 * Append a call log entry to the spreadsheet with automatic retry
 *
 * @param oauth2Client - Authenticated OAuth2Client
 * @param sheetId - Spreadsheet ID
 * @param callData - Call data to log
 * @returns Operation result with success status and error details
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
): Promise<SheetsOperationResult> {
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

    // Append to the Calls sheet with retry
    await withRetry(
      () =>
        sheets.spreadsheets.values.append({
          spreadsheetId: sheetId,
          range: 'Calls!A:H',
          valueInputOption: 'USER_ENTERED',
          insertDataOption: 'INSERT_ROWS',
          requestBody: {
            values,
          },
        }),
      'Sheets.append'
    );

    console.log(`Logged call to sheet ${sheetId}`);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorCode = (error as { code?: string })?.code;
    const requiresReconnect = isAuthenticationError(error);

    if (requiresReconnect) {
      console.error('Google authentication error - user needs to reconnect:', error);
    } else {
      console.error('Error appending call log:', error);
    }

    return {
      success: false,
      error: requiresReconnect
        ? 'Google authentication expired. Please reconnect your Google account.'
        : errorMessage,
      errorCode,
      requiresReconnect,
    };
  }
}

/**
 * Verify that the Google Sheets connection is working
 *
 * @param oauth2Client - Authenticated OAuth2Client
 * @returns Health check result with status and any error details
 */
export async function verifySheetConnection(
  oauth2Client: OAuth2Client
): Promise<{ healthy: boolean; error?: string }> {
  try {
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // Try to list files to verify connection (minimal API call)
    await withRetry(
      () =>
        drive.files.list({
          pageSize: 1,
          q: "mimeType='application/vnd.google-apps.spreadsheet'",
        }),
      'Drive.list'
    );

    return { healthy: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Check for authentication errors that require reconnection
    if (isAuthenticationError(error)) {
      return {
        healthy: false,
        error: 'Token expired or revoked. Please reconnect your Google account.',
      };
    }

    return { healthy: false, error: errorMessage };
  }
}
