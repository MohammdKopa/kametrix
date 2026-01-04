import { OAuth2Client } from 'google-auth-library';
import { google, calendar_v3 } from 'googleapis';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/**
 * Available time slot structure
 */
export interface TimeSlot {
  start: string; // ISO 8601 format
  end: string; // ISO 8601 format
  displayTime: string; // Human-readable format for voice (e.g., "10:00 AM")
}

/**
 * Recurrence rule types
 */
export type RecurrenceFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

/**
 * Recurrence configuration for recurring events
 */
export interface RecurrenceConfig {
  frequency: RecurrenceFrequency;
  interval?: number; // Every N days/weeks/months/years (default: 1)
  count?: number; // Number of occurrences
  until?: string; // End date in YYYY-MM-DD format
  byDay?: string[]; // For weekly: ['MO', 'WE', 'FR']
  byMonthDay?: number[]; // For monthly: [1, 15] (1st and 15th)
}

/**
 * Booking parameters
 */
export interface BookingParams {
  summary: string; // Event title
  start: string; // ISO 8601 datetime
  end: string; // ISO 8601 datetime
  attendeeEmail?: string; // Optional attendee email
  attendeeEmails?: string[]; // Multiple attendees
  callerName?: string; // Caller's name for description
  callerPhone?: string; // Caller's phone for description
  description?: string; // Additional description
  timeZone: string; // IANA timezone (e.g., "America/New_York")
  recurrence?: RecurrenceConfig; // For recurring events
  location?: string; // Event location
  sendNotifications?: boolean; // Send email notifications (default: true)
}

/**
 * Event update parameters
 */
export interface UpdateEventParams {
  eventId: string;
  summary?: string;
  start?: string;
  end?: string;
  description?: string;
  location?: string;
  attendeeEmails?: string[];
  timeZone?: string;
  sendNotifications?: boolean;
}

/**
 * Booked event result
 */
export interface BookedEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  htmlLink: string; // Link to view event in Google Calendar
  timeZone: string;
  recurrence?: string[]; // Recurrence rules if recurring
  location?: string;
  attendees?: string[];
}

/**
 * Calendar event for querying
 */
export interface CalendarEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
  htmlLink?: string;
  attendees?: { email: string; responseStatus?: string }[];
  recurrence?: string[];
  recurringEventId?: string; // If this is an instance of a recurring event
  status: 'confirmed' | 'tentative' | 'cancelled';
}

/**
 * Calendar sharing configuration
 */
export interface CalendarShareConfig {
  email: string;
  role: 'reader' | 'writer' | 'owner' | 'freeBusyReader';
  sendNotification?: boolean;
}

/**
 * Calendar error types for specific error handling
 */
export enum CalendarErrorType {
  AUTHENTICATION_EXPIRED = 'AUTHENTICATION_EXPIRED',
  CALENDAR_NOT_FOUND = 'CALENDAR_NOT_FOUND',
  EVENT_NOT_FOUND = 'EVENT_NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  RATE_LIMITED = 'RATE_LIMITED',
  CONFLICT = 'CONFLICT',
  INVALID_INPUT = 'INVALID_INPUT',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Custom error class for calendar operations
 */
export class CalendarError extends Error {
  constructor(
    message: string,
    public readonly type: CalendarErrorType,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'CalendarError';
  }

  /**
   * Check if error requires user to reconnect Google account
   */
  get requiresReconnect(): boolean {
    return this.type === CalendarErrorType.AUTHENTICATION_EXPIRED;
  }

  /**
   * Check if error is retryable
   */
  get isRetryable(): boolean {
    return [
      CalendarErrorType.RATE_LIMITED,
      CalendarErrorType.NETWORK_ERROR,
    ].includes(this.type);
  }
}

// ============================================================================
// CONSTANTS
// ============================================================================

// Business hours configuration
const DEFAULT_BUSINESS_START_HOUR = 9; // 9 AM
const DEFAULT_BUSINESS_END_HOUR = 17; // 5 PM
const DEFAULT_APPOINTMENT_DURATION_MINUTES = 30;

// ============================================================================
// ERROR HANDLING HELPERS
// ============================================================================

/**
 * Classify Google API errors into our error types
 */
function classifyGoogleError(error: unknown): CalendarErrorType {
  if (!(error instanceof Error)) return CalendarErrorType.UNKNOWN;

  const message = error.message.toLowerCase();
  const anyError = error as any;
  const statusCode = anyError?.response?.status || anyError?.code;

  // Authentication errors
  if (
    message.includes('invalid_grant') ||
    message.includes('token has been revoked') ||
    message.includes('token has been expired') ||
    message.includes('invalid credentials') ||
    statusCode === 401
  ) {
    return CalendarErrorType.AUTHENTICATION_EXPIRED;
  }

  // Not found errors
  if (message.includes('not found') || statusCode === 404) {
    if (message.includes('calendar')) return CalendarErrorType.CALENDAR_NOT_FOUND;
    if (message.includes('event')) return CalendarErrorType.EVENT_NOT_FOUND;
    return CalendarErrorType.EVENT_NOT_FOUND;
  }

  // Permission errors
  if (
    message.includes('forbidden') ||
    message.includes('permission') ||
    message.includes('access denied') ||
    statusCode === 403
  ) {
    return CalendarErrorType.PERMISSION_DENIED;
  }

  // Rate limiting
  if (
    message.includes('rate limit') ||
    message.includes('quota') ||
    statusCode === 429
  ) {
    return CalendarErrorType.RATE_LIMITED;
  }

  // Conflict (e.g., double booking)
  if (message.includes('conflict') || statusCode === 409) {
    return CalendarErrorType.CONFLICT;
  }

  // Invalid input
  if (
    message.includes('invalid') ||
    message.includes('bad request') ||
    statusCode === 400
  ) {
    return CalendarErrorType.INVALID_INPUT;
  }

  // Network errors
  if (
    message.includes('network') ||
    message.includes('econnrefused') ||
    message.includes('timeout')
  ) {
    return CalendarErrorType.NETWORK_ERROR;
  }

  return CalendarErrorType.UNKNOWN;
}

/**
 * Wrap Google API errors in CalendarError for consistent handling
 */
function wrapError(error: unknown, defaultMessage: string): CalendarError {
  const originalError = error instanceof Error ? error : new Error(String(error));
  const errorType = classifyGoogleError(error);
  return new CalendarError(
    originalError.message || defaultMessage,
    errorType,
    originalError
  );
}

// ============================================================================
// RECURRENCE HELPERS
// ============================================================================

/**
 * Build RFC 5545 RRULE string from RecurrenceConfig
 */
export function buildRecurrenceRule(config: RecurrenceConfig): string {
  const parts: string[] = [`FREQ=${config.frequency}`];

  if (config.interval && config.interval > 1) {
    parts.push(`INTERVAL=${config.interval}`);
  }

  if (config.count) {
    parts.push(`COUNT=${config.count}`);
  } else if (config.until) {
    // Convert YYYY-MM-DD to YYYYMMDD
    const untilDate = config.until.replace(/-/g, '');
    parts.push(`UNTIL=${untilDate}T235959Z`);
  }

  if (config.byDay && config.byDay.length > 0) {
    parts.push(`BYDAY=${config.byDay.join(',')}`);
  }

  if (config.byMonthDay && config.byMonthDay.length > 0) {
    parts.push(`BYMONTHDAY=${config.byMonthDay.join(',')}`);
  }

  return `RRULE:${parts.join(';')}`;
}

/**
 * Parse human-readable recurrence to RecurrenceConfig
 * Supports: "daily", "weekly", "monthly", "yearly", "every weekday",
 * "every Monday", "every 2 weeks", etc.
 */
export function parseRecurrenceInput(input: string): RecurrenceConfig | null {
  const normalized = input.toLowerCase().trim();

  // Simple frequencies
  if (normalized === 'daily' || normalized === 'täglich') {
    return { frequency: 'DAILY' };
  }
  if (normalized === 'weekly' || normalized === 'wöchentlich') {
    return { frequency: 'WEEKLY' };
  }
  if (normalized === 'monthly' || normalized === 'monatlich') {
    return { frequency: 'MONTHLY' };
  }
  if (normalized === 'yearly' || normalized === 'jährlich') {
    return { frequency: 'YEARLY' };
  }

  // Every weekday
  if (normalized === 'every weekday' || normalized === 'wochentags' || normalized === 'werktags') {
    return { frequency: 'WEEKLY', byDay: ['MO', 'TU', 'WE', 'TH', 'FR'] };
  }

  // Specific day patterns
  const dayMap: Record<string, string> = {
    'monday': 'MO', 'montag': 'MO',
    'tuesday': 'TU', 'dienstag': 'TU',
    'wednesday': 'WE', 'mittwoch': 'WE',
    'thursday': 'TH', 'donnerstag': 'TH',
    'friday': 'FR', 'freitag': 'FR',
    'saturday': 'SA', 'samstag': 'SA',
    'sunday': 'SU', 'sonntag': 'SU',
  };

  for (const [dayName, dayCode] of Object.entries(dayMap)) {
    if (normalized.includes(dayName)) {
      return { frequency: 'WEEKLY', byDay: [dayCode] };
    }
  }

  // "every N weeks/days/months" pattern
  const intervalMatch = normalized.match(/every\s+(\d+)\s+(day|week|month|year)s?/i) ||
                       normalized.match(/alle\s+(\d+)\s+(tag|woche|monat|jahr)e?n?/i);
  if (intervalMatch) {
    const interval = parseInt(intervalMatch[1], 10);
    const unit = intervalMatch[2].toLowerCase();
    const freqMap: Record<string, RecurrenceFrequency> = {
      'day': 'DAILY', 'tag': 'DAILY',
      'week': 'WEEKLY', 'woche': 'WEEKLY',
      'month': 'MONTHLY', 'monat': 'MONTHLY',
      'year': 'YEARLY', 'jahr': 'YEARLY',
    };
    return { frequency: freqMap[unit] || 'WEEKLY', interval };
  }

  return null;
}

// ============================================================================
// DATE PARSING FUNCTIONS
// ============================================================================

/**
 * Time range definitions for natural language time preferences
 */
export const TIME_RANGES: Record<string, { start: number; end: number }> = {
  'morgens': { start: 9, end: 12 },
  'vormittags': { start: 9, end: 12 },
  'mittags': { start: 12, end: 14 },
  'nachmittags': { start: 14, end: 17 },
  'abends': { start: 17, end: 20 },
  'morning': { start: 9, end: 12 },
  'afternoon': { start: 14, end: 17 },
  'evening': { start: 17, end: 20 },
};

/**
 * Parse a date input that can be either a relative term (morgen, heute, übermorgen)
 * or an ISO date string. Returns the resolved date in YYYY-MM-DD format.
 *
 * Enhanced with:
 * - Extended relative date patterns
 * - Week-based expressions (diese Woche, nächste Woche)
 * - Month expressions (nächsten Monat, Anfang Januar)
 * - Better error handling
 *
 * @param dateInput - Either a relative term or YYYY-MM-DD date string
 * @returns Resolved date in YYYY-MM-DD format
 */
export function parseDateInput(dateInput: string): string {
  const input = dateInput.toLowerCase().trim();
  const now = new Date();

  // German relative date terms (expanded)
  const relativeDates: Record<string, number> = {
    'heute': 0,
    'today': 0,
    'jetzt': 0,
    'now': 0,
    'morgen': 1,
    'tomorrow': 1,
    'übermorgen': 2,
    'ubermorgen': 2,
    'in zwei tagen': 2,
    'in 2 tagen': 2,
  };

  // Check if it's a simple relative term
  if (relativeDates[input] !== undefined) {
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + relativeDates[input]);
    const result = targetDate.toISOString().split('T')[0];
    console.log(`Relative date parsed: "${dateInput}" -> ${result}`);
    return result;
  }

  // Check for "in X tagen/wochen" patterns
  const inDaysMatch = input.match(/in\s+(\d+)\s+tag/i);
  if (inDaysMatch) {
    const days = parseInt(inDaysMatch[1], 10);
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + days);
    const result = targetDate.toISOString().split('T')[0];
    console.log(`Relative date parsed: "${dateInput}" -> ${result}`);
    return result;
  }

  const inWeeksMatch = input.match(/in\s+(\d+)\s+woche/i);
  if (inWeeksMatch) {
    const weeks = parseInt(inWeeksMatch[1], 10);
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + weeks * 7);
    const result = targetDate.toISOString().split('T')[0];
    console.log(`Relative weeks parsed: "${dateInput}" -> ${result}`);
    return result;
  }

  // Handle "diese Woche" (this week) - return today
  if (input.includes('diese woche') || input.includes('this week')) {
    const result = now.toISOString().split('T')[0];
    console.log(`This week parsed: "${dateInput}" -> ${result}`);
    return result;
  }

  // Handle "nächste Woche" (next week) - return next Monday
  if (input.includes('naechste woche') || input.includes('nächste woche') || input.includes('next week')) {
    const currentDay = now.getDay();
    const daysToMonday = currentDay === 0 ? 1 : 8 - currentDay;
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + daysToMonday);
    const result = targetDate.toISOString().split('T')[0];
    console.log(`Next week parsed: "${dateInput}" -> ${result}`);
    return result;
  }

  // Check for weekday names (nächsten Montag, am Freitag, etc.)
  const weekdays: Record<string, number> = {
    'sonntag': 0, 'sunday': 0,
    'montag': 1, 'monday': 1,
    'dienstag': 2, 'tuesday': 2,
    'mittwoch': 3, 'wednesday': 3,
    'donnerstag': 4, 'thursday': 4,
    'freitag': 5, 'friday': 5,
    'samstag': 6, 'saturday': 6,
  };

  for (const [dayName, dayNum] of Object.entries(weekdays)) {
    if (input.includes(dayName)) {
      const currentDay = now.getDay();
      let daysToAdd = dayNum - currentDay;
      if (daysToAdd <= 0) daysToAdd += 7; // Next week if today or past
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + daysToAdd);
      const result = targetDate.toISOString().split('T')[0];
      console.log(`Weekday parsed: "${dateInput}" -> ${result}`);
      return result;
    }
  }

  // If it looks like a date (contains numbers), pass to validateAndCorrectDate
  if (/\d{4}-\d{2}-\d{2}/.test(input)) {
    return validateAndCorrectDate(dateInput);
  }

  // Fallback: return as-is and let validateAndCorrectDate handle it
  console.warn(`Could not parse date input: "${dateInput}", attempting validation`);
  return validateAndCorrectDate(dateInput);
}

/**
 * Parse natural language time expressions into HH:MM format
 *
 * Handles German and English time expressions:
 * - "14 Uhr" -> "14:00"
 * - "halb drei" -> "14:30"
 * - "viertel nach zehn" -> "10:15"
 * - "viertel vor elf" -> "10:45"
 * - "10 Uhr morgens" -> "10:00"
 * - "3 Uhr nachmittags" -> "15:00"
 *
 * @param timeInput - Natural language time expression
 * @returns Time string in HH:MM format
 */
export function parseTimeInput(timeInput: string): string {
  const input = timeInput.toLowerCase().trim();

  // Already in HH:MM format
  if (/^\d{1,2}:\d{2}$/.test(input)) {
    const [hours, minutes] = input.split(':').map(Number);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  // German number words to digits
  const numberWords: Record<string, number> = {
    'eins': 1, 'ein': 1, 'eine': 1,
    'zwei': 2,
    'drei': 3,
    'vier': 4,
    'fünf': 5, 'fuenf': 5,
    'sechs': 6,
    'sieben': 7,
    'acht': 8,
    'neun': 9,
    'zehn': 10,
    'elf': 11,
    'zwölf': 12, 'zwoelf': 12,
  };

  // "X Uhr" pattern (e.g., "14 Uhr", "zehn Uhr")
  const uhrMatch = input.match(/(\d{1,2}|eins?|zwei|drei|vier|fuenf|fünf|sechs|sieben|acht|neun|zehn|elf|zwoelf|zwölf)\s*uhr/i);
  if (uhrMatch) {
    let hours = numberWords[uhrMatch[1]] || parseInt(uhrMatch[1], 10);

    // Check for AM/PM indicators
    if (input.includes('nachmittag') || input.includes('abend')) {
      if (hours < 12) hours += 12;
    } else if (input.includes('morgen') || input.includes('vormittag')) {
      // Keep as-is (morning hours)
    }

    return `${hours.toString().padStart(2, '0')}:00`;
  }

  // "halb X" pattern (half past the previous hour, e.g., "halb drei" = 14:30 or 2:30)
  const halbMatch = input.match(/halb\s*(\d{1,2}|eins?|zwei|drei|vier|fuenf|fünf|sechs|sieben|acht|neun|zehn|elf|zwoelf|zwölf)/i);
  if (halbMatch) {
    let hours = numberWords[halbMatch[1]] || parseInt(halbMatch[1], 10);
    hours = hours - 1; // "halb drei" means 2:30 in German
    if (hours < 0) hours = 23;

    // Default to afternoon for small numbers
    if (hours > 0 && hours < 8 && !input.includes('morgen') && !input.includes('vormittag')) {
      hours += 12;
    }

    return `${hours.toString().padStart(2, '0')}:30`;
  }

  // "viertel nach X" pattern (quarter past)
  const viertelNachMatch = input.match(/viertel\s*nach\s*(\d{1,2}|eins?|zwei|drei|vier|fuenf|fünf|sechs|sieben|acht|neun|zehn|elf|zwoelf|zwölf)/i);
  if (viertelNachMatch) {
    let hours = numberWords[viertelNachMatch[1]] || parseInt(viertelNachMatch[1], 10);
    return `${hours.toString().padStart(2, '0')}:15`;
  }

  // "viertel vor X" pattern (quarter to)
  const viertelVorMatch = input.match(/viertel\s*vor\s*(\d{1,2}|eins?|zwei|drei|vier|fuenf|fünf|sechs|sieben|acht|neun|zehn|elf|zwoelf|zwölf)/i);
  if (viertelVorMatch) {
    let hours = numberWords[viertelVorMatch[1]] || parseInt(viertelVorMatch[1], 10);
    hours = hours - 1;
    if (hours < 0) hours = 23;
    return `${hours.toString().padStart(2, '0')}:45`;
  }

  // Bare number with context (e.g., "um 14", "um 3")
  const bareNumberMatch = input.match(/(?:um\s*)?(\d{1,2})(?:\s|$)/);
  if (bareNumberMatch) {
    let hours = parseInt(bareNumberMatch[1], 10);

    // Apply AM/PM logic
    if (input.includes('nachmittag') || input.includes('abend')) {
      if (hours < 12) hours += 12;
    }

    return `${hours.toString().padStart(2, '0')}:00`;
  }

  // Return original if no pattern matched
  console.warn(`Could not parse time input: "${timeInput}"`);
  return timeInput;
}

/**
 * Validate and correct date string to ensure the date is not in the past.
 * LLMs can sometimes hallucinate incorrect dates (e.g., 2023 instead of 2025,
 * or wrong months entirely). This function auto-corrects past dates using
 * smart year inference.
 *
 * Logic:
 * 1. If incoming year is clearly wrong (past years like 2023, 2024 when we're in 2025), ignore it
 * 2. Use month/day to determine the correct year:
 *    - If month/day is in the future THIS year -> use current year
 *    - If month/day has already passed THIS year -> use next year
 * 3. If incoming year matches current or next year AND date is in future -> trust it
 * 4. If incoming year is future but > 1 year away -> log warning but allow
 *
 * Examples (assuming today is 2025-12-29):
 * - Input: 2023-10-06 -> Output: 2026-10-06 (October has passed this year)
 * - Input: 2023-01-15 -> Output: 2026-01-15 (January is coming but year was wrong)
 * - Input: 2025-12-30 -> Output: 2025-12-30 (tomorrow, correct as-is)
 * - Input: 2025-12-28 -> Output: 2026-12-28 (yesterday -> next year)
 *
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns Corrected date string in YYYY-MM-DD format
 */
export function validateAndCorrectDate(dateStr: string): string {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-indexed
  const currentDay = now.getDate();

  // Parse the date string
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    console.warn(`Invalid date format: ${dateStr}, expected YYYY-MM-DD`);
    return dateStr; // Return as-is, let downstream handle the error
  }

  const [, yearStr, monthStr, dayStr] = match;
  const inputYear = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  // Helper: check if a given month/day is in the future relative to today
  const isDateInFuture = (m: number, d: number): boolean => {
    if (m > currentMonth) return true;
    if (m === currentMonth && d >= currentDay) return true;
    return false;
  };

  let correctedYear: number;

  // Case 1: Input year is in the past (e.g., 2023, 2024 when we're in 2025)
  // The LLM hallucinated a wrong year - ignore it entirely and infer from month/day
  if (inputYear < currentYear) {
    console.warn(`Date has past year ${inputYear}, ignoring and inferring correct year`);
    if (isDateInFuture(month, day)) {
      // Month/day hasn't passed yet this year
      correctedYear = currentYear;
    } else {
      // Month/day has already passed this year -> schedule for next year
      correctedYear = currentYear + 1;
    }
  }
  // Case 2: Input year matches current year
  else if (inputYear === currentYear) {
    if (isDateInFuture(month, day)) {
      // Date is in the future this year - keep it
      correctedYear = currentYear;
    } else {
      // Date has already passed this year -> move to next year
      correctedYear = currentYear + 1;
      console.warn(`Date ${dateStr} has passed this year, moving to next year`);
    }
  }
  // Case 3: Input year is next year
  else if (inputYear === currentYear + 1) {
    // Trust it - the LLM correctly identified a date for next year
    correctedYear = inputYear;
  }
  // Case 4: Input year is more than 1 year in the future
  else {
    // Log warning but allow it - user might genuinely want a far future date
    console.warn(`Date is more than a year in the future: ${dateStr}`);
    correctedYear = inputYear;
  }

  const correctedDate = `${correctedYear}-${monthStr}-${dayStr}`;
  if (correctedDate !== dateStr) {
    console.log(`Date validation: ${dateStr} -> ${correctedDate}`);
  }

  return correctedDate;
}

/**
 * Get available time slots for a given date
 *
 * @param oauth2Client - Authenticated OAuth2 client
 * @param date - Date to check availability for
 * @param timeZone - IANA timezone (e.g., "America/New_York")
 * @param durationMinutes - Appointment duration in minutes (default 30)
 * @returns Array of available time slots with specified duration
 */
export async function getAvailableSlots(
  oauth2Client: OAuth2Client,
  date: Date,
  timeZone: string = 'America/New_York',
  durationMinutes: number = DEFAULT_APPOINTMENT_DURATION_MINUTES
): Promise<TimeSlot[]> {
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  // Set start and end of business day in the specified timezone
  const startOfDay = new Date(date);
  startOfDay.setHours(DEFAULT_BUSINESS_START_HOUR, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(DEFAULT_BUSINESS_END_HOUR, 0, 0, 0);

  try {
    // Query freebusy to get busy periods
    const freebusyResponse = await calendar.freebusy.query({
      requestBody: {
        timeMin: startOfDay.toISOString(),
        timeMax: endOfDay.toISOString(),
        timeZone,
        items: [{ id: 'primary' }], // Check primary calendar only
      },
    });

    const busyPeriods = freebusyResponse.data.calendars?.primary?.busy || [];

    // Generate all possible slots within business hours
    const allSlots: TimeSlot[] = [];
    let currentTime = new Date(startOfDay);

    while (currentTime < endOfDay) {
      const slotEnd = new Date(currentTime);
      slotEnd.setMinutes(slotEnd.getMinutes() + durationMinutes);

      // Don't include slots that would end after business hours
      if (slotEnd <= endOfDay) {
        allSlots.push({
          start: currentTime.toISOString(),
          end: slotEnd.toISOString(),
          displayTime: formatTimeForVoice(currentTime, timeZone),
        });
      }

      currentTime = new Date(slotEnd);
    }

    // Filter out slots that overlap with busy periods
    const availableSlots = allSlots.filter(slot => {
      const slotStart = new Date(slot.start).getTime();
      const slotEnd = new Date(slot.end).getTime();

      // Check if this slot overlaps with any busy period
      return !busyPeriods.some(busy => {
        if (!busy.start || !busy.end) return false;

        const busyStart = new Date(busy.start).getTime();
        const busyEnd = new Date(busy.end).getTime();

        // Check for any overlap
        return (slotStart < busyEnd && slotEnd > busyStart);
      });
    });

    return availableSlots;
  } catch (error) {
    console.error('Error fetching calendar availability:', error);
    throw wrapError(error, 'Failed to check calendar availability');
  }
}

/**
 * Check if a specific time slot is available
 *
 * @param oauth2Client - Authenticated OAuth2 client
 * @param startTime - Start time to check (ISO datetime)
 * @param endTime - End time to check (ISO datetime)
 * @param timeZone - IANA timezone
 * @returns true if the slot is available, false if busy
 */
export async function isSlotAvailable(
  oauth2Client: OAuth2Client,
  startTime: string,
  endTime: string,
  timeZone: string = 'America/New_York'
): Promise<boolean> {
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  try {
    const freebusyResponse = await calendar.freebusy.query({
      requestBody: {
        timeMin: startTime,
        timeMax: endTime,
        timeZone,
        items: [{ id: 'primary' }],
      },
    });

    const busyPeriods = freebusyResponse.data.calendars?.primary?.busy || [];
    return busyPeriods.length === 0;
  } catch (error) {
    console.error('Error checking slot availability:', error);
    throw wrapError(error, 'Failed to check slot availability');
  }
}

/**
 * Conflict check result with alternative slots
 */
export interface ConflictCheckResult {
  hasConflict: boolean;
  conflictingEvents: Array<{
    summary: string;
    start: string;
    end: string;
  }>;
  alternativeSlots: TimeSlot[];
  message: string;
}

/**
 * Check for conflicts with existing appointments and suggest alternatives
 *
 * This enhanced conflict detection:
 * - Checks if the requested time slot conflicts with existing events
 * - Returns details about conflicting events
 * - Suggests up to 3 alternative time slots on the same day
 * - Provides a human-readable message for the voice assistant
 *
 * @param oauth2Client - Authenticated OAuth2 client
 * @param date - Date to check (YYYY-MM-DD)
 * @param time - Time to check (HH:MM)
 * @param durationMinutes - Duration of the requested appointment
 * @param timeZone - IANA timezone
 * @returns Conflict check result with alternatives
 */
export async function checkConflicts(
  oauth2Client: OAuth2Client,
  date: string,
  time: string,
  durationMinutes: number = DEFAULT_APPOINTMENT_DURATION_MINUTES,
  timeZone: string = 'Europe/Berlin'
): Promise<ConflictCheckResult> {
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  // Parse the requested time slot
  const startDateTime = parseDateTime(date, time, timeZone);
  const [datePart, timePart] = startDateTime.split('T');
  const [hh, mm] = timePart.split(':').map(Number);
  let totalMinutes = hh * 60 + mm + durationMinutes;
  const endHour = Math.floor(totalMinutes / 60) % 24;
  const endMin = totalMinutes % 60;
  const endDateTime = `${datePart}T${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}:00`;

  try {
    // Check freebusy for the requested time slot
    const freebusyResponse = await calendar.freebusy.query({
      requestBody: {
        timeMin: `${startDateTime}`,
        timeMax: `${endDateTime}`,
        timeZone,
        items: [{ id: 'primary' }],
      },
    });

    const busyPeriods = freebusyResponse.data.calendars?.primary?.busy || [];

    if (busyPeriods.length === 0) {
      // No conflict - slot is available
      return {
        hasConflict: false,
        conflictingEvents: [],
        alternativeSlots: [],
        message: `Der Termin um ${time} Uhr ist verfügbar.`,
      };
    }

    // Get details about conflicting events
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const eventsResponse = await calendar.events.list({
      calendarId: 'primary',
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = eventsResponse.data.items || [];
    const conflictingEvents = events
      .filter(event => {
        if (!event.start?.dateTime || !event.end?.dateTime) return false;
        const eventStart = new Date(event.start.dateTime).getTime();
        const eventEnd = new Date(event.end.dateTime).getTime();
        const requestedStart = new Date(`${startDateTime}`).getTime();
        const requestedEnd = new Date(`${endDateTime}`).getTime();
        return (requestedStart < eventEnd && requestedEnd > eventStart);
      })
      .map(event => ({
        summary: event.summary || 'Termin',
        start: event.start?.dateTime || '',
        end: event.end?.dateTime || '',
      }));

    // Find alternative slots on the same day
    const targetDate = new Date(date);
    const availableSlots = await getAvailableSlots(oauth2Client, targetDate, timeZone, durationMinutes);
    const alternativeSlots = availableSlots
      .filter(slot => new Date(slot.start) > new Date()) // Only future slots
      .slice(0, 3); // Limit to 3 alternatives

    // Build human-readable message
    let message = `Um ${time} Uhr ist leider bereits ein Termin eingetragen.`;
    if (alternativeSlots.length > 0) {
      const times = alternativeSlots.map(s => s.displayTime).join(', ');
      message += ` Alternativ sind folgende Zeiten verfügbar: ${times}.`;
    } else {
      message += ` Leider sind heute keine weiteren Termine mehr frei.`;
    }

    return {
      hasConflict: true,
      conflictingEvents,
      alternativeSlots,
      message,
    };
  } catch (error) {
    console.error('Error checking conflicts:', error);
    throw wrapError(error, 'Failed to check for conflicts');
  }
}

/**
 * Filter available slots by preferred time range
 *
 * @param slots - Available slots to filter
 * @param preferredTimeRange - Time range preference (morgens, nachmittags, etc.)
 * @param timeZone - IANA timezone
 * @returns Filtered slots within the preferred time range
 */
export function filterSlotsByTimeRange(
  slots: TimeSlot[],
  preferredTimeRange: string,
  timeZone: string = 'Europe/Berlin'
): TimeSlot[] {
  const range = TIME_RANGES[preferredTimeRange.toLowerCase()];
  if (!range) return slots;

  return slots.filter(slot => {
    const slotDate = new Date(slot.start);
    const hours = parseInt(
      slotDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        hour12: false,
        timeZone,
      }),
      10
    );
    return hours >= range.start && hours < range.end;
  });
}

/**
 * Get busy periods within a date range
 *
 * @param oauth2Client - Authenticated OAuth2 client
 * @param startDate - Start date
 * @param endDate - End date
 * @param timeZone - IANA timezone
 * @returns Array of busy periods
 */
export async function getBusyPeriods(
  oauth2Client: OAuth2Client,
  startDate: Date,
  endDate: Date,
  timeZone: string = 'America/New_York'
): Promise<Array<{ start: string; end: string }>> {
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  try {
    const freebusyResponse = await calendar.freebusy.query({
      requestBody: {
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        timeZone,
        items: [{ id: 'primary' }],
      },
    });

    const busyPeriods = freebusyResponse.data.calendars?.primary?.busy || [];
    return busyPeriods.map(period => ({
      start: period.start!,
      end: period.end!,
    }));
  } catch (error) {
    console.error('Error getting busy periods:', error);
    throw wrapError(error, 'Failed to get busy periods');
  }
}

/**
 * Get available slots across multiple days
 *
 * @param oauth2Client - Authenticated OAuth2 client
 * @param startDate - First date to check
 * @param numDays - Number of days to check
 * @param timeZone - IANA timezone
 * @param durationMinutes - Appointment duration
 * @returns Map of date strings to available slots
 */
export async function getAvailableSlotsMultiDay(
  oauth2Client: OAuth2Client,
  startDate: Date,
  numDays: number,
  timeZone: string = 'America/New_York',
  durationMinutes: number = DEFAULT_APPOINTMENT_DURATION_MINUTES
): Promise<Map<string, TimeSlot[]>> {
  const result = new Map<string, TimeSlot[]>();

  const promises: Promise<void>[] = [];
  for (let i = 0; i < numDays; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];

    promises.push(
      getAvailableSlots(oauth2Client, date, timeZone, durationMinutes)
        .then(slots => {
          result.set(dateStr, slots);
        })
        .catch(error => {
          console.error(`Error getting slots for ${dateStr}:`, error);
          result.set(dateStr, []); // Empty on error
        })
    );
  }

  await Promise.all(promises);
  return result;
}

/**
 * Find the next available slot after a given time
 *
 * @param oauth2Client - Authenticated OAuth2 client
 * @param afterTime - Start searching after this time
 * @param timeZone - IANA timezone
 * @param durationMinutes - Appointment duration
 * @param maxDaysToSearch - Maximum days to search ahead
 * @returns The next available slot or null if none found
 */
export async function findNextAvailableSlot(
  oauth2Client: OAuth2Client,
  afterTime: Date = new Date(),
  timeZone: string = 'America/New_York',
  durationMinutes: number = DEFAULT_APPOINTMENT_DURATION_MINUTES,
  maxDaysToSearch: number = 14
): Promise<TimeSlot | null> {
  let currentDate = new Date(afterTime);

  for (let i = 0; i < maxDaysToSearch; i++) {
    const slots = await getAvailableSlots(oauth2Client, currentDate, timeZone, durationMinutes);

    // Filter slots that are after the requested time
    const validSlots = slots.filter(slot => new Date(slot.start) > afterTime);

    if (validSlots.length > 0) {
      return validSlots[0];
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
    currentDate.setHours(DEFAULT_BUSINESS_START_HOUR, 0, 0, 0);
  }

  return null;
}

/**
 * Book an appointment on the calendar
 *
 * @param oauth2Client - Authenticated OAuth2 client
 * @param params - Booking parameters
 * @returns Created event details
 */
export async function bookAppointment(
  oauth2Client: OAuth2Client,
  params: BookingParams
): Promise<BookedEvent> {
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  // Build event description with caller info
  let description = params.description || '';
  if (params.callerName || params.callerPhone) {
    const callerInfo: string[] = [];
    if (params.callerName) callerInfo.push(`Name: ${params.callerName}`);
    if (params.callerPhone) callerInfo.push(`Phone: ${params.callerPhone}`);

    const callerSection = `\n\n--- Caller Information ---\n${callerInfo.join('\n')}`;
    description += callerSection;
  }

  const eventData: calendar_v3.Schema$Event = {
    summary: params.summary,
    description: description.trim(),
    start: {
      dateTime: params.start,
      timeZone: params.timeZone,
    },
    end: {
      dateTime: params.end,
      timeZone: params.timeZone,
    },
  };

  // Add location if provided
  if (params.location) {
    eventData.location = params.location;
  }

  // Add attendees - support both single email and multiple emails
  const attendees: calendar_v3.Schema$EventAttendee[] = [];
  if (params.attendeeEmail) {
    attendees.push({ email: params.attendeeEmail });
  }
  if (params.attendeeEmails) {
    for (const email of params.attendeeEmails) {
      if (!attendees.find(a => a.email === email)) {
        attendees.push({ email });
      }
    }
  }
  if (attendees.length > 0) {
    eventData.attendees = attendees;
  }

  // Add recurrence rule if provided
  if (params.recurrence) {
    eventData.recurrence = [buildRecurrenceRule(params.recurrence)];
  }

  try {
    const sendUpdates = params.sendNotifications === false ? 'none' :
                        (attendees.length > 0 ? 'all' : 'none');

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: eventData,
      sendUpdates,
    });

    const event = response.data;

    return {
      id: event.id!,
      summary: event.summary || params.summary,
      start: event.start?.dateTime || params.start,
      end: event.end?.dateTime || params.end,
      htmlLink: event.htmlLink || '',
      timeZone: params.timeZone,
      recurrence: event.recurrence || undefined,
      location: event.location || undefined,
      attendees: event.attendees?.map(a => a.email!).filter(Boolean),
    };
  } catch (error) {
    console.error('Error booking appointment:', error);
    throw wrapError(error, 'Failed to book appointment');
  }
}

// ============================================================================
// EVENT MODIFICATION FUNCTIONS
// ============================================================================

/**
 * Update an existing calendar event
 *
 * @param oauth2Client - Authenticated OAuth2 client
 * @param params - Update parameters
 * @returns Updated event details
 */
export async function updateEvent(
  oauth2Client: OAuth2Client,
  params: UpdateEventParams
): Promise<BookedEvent> {
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  try {
    // First, get the existing event
    const existingResponse = await calendar.events.get({
      calendarId: 'primary',
      eventId: params.eventId,
    });

    const existingEvent = existingResponse.data;

    // Build updated event data
    const eventData: calendar_v3.Schema$Event = {
      summary: params.summary ?? existingEvent.summary,
      description: params.description ?? existingEvent.description,
      location: params.location ?? existingEvent.location,
      start: params.start ? {
        dateTime: params.start,
        timeZone: params.timeZone || existingEvent.start?.timeZone || 'UTC',
      } : existingEvent.start,
      end: params.end ? {
        dateTime: params.end,
        timeZone: params.timeZone || existingEvent.end?.timeZone || 'UTC',
      } : existingEvent.end,
    };

    // Update attendees if provided
    if (params.attendeeEmails !== undefined) {
      eventData.attendees = params.attendeeEmails.map(email => ({ email }));
    }

    const sendUpdates = params.sendNotifications === false ? 'none' : 'all';

    const response = await calendar.events.update({
      calendarId: 'primary',
      eventId: params.eventId,
      requestBody: eventData,
      sendUpdates,
    });

    const event = response.data;
    const timeZone = params.timeZone || existingEvent.start?.timeZone || 'UTC';

    return {
      id: event.id!,
      summary: event.summary || '',
      start: event.start?.dateTime || event.start?.date || '',
      end: event.end?.dateTime || event.end?.date || '',
      htmlLink: event.htmlLink || '',
      timeZone,
      location: event.location || undefined,
      attendees: event.attendees?.map(a => a.email!).filter(Boolean),
    };
  } catch (error) {
    console.error('Error updating event:', error);
    throw wrapError(error, 'Failed to update event');
  }
}

/**
 * Reschedule an event to a new date/time
 *
 * @param oauth2Client - Authenticated OAuth2 client
 * @param eventId - Event ID to reschedule
 * @param newStart - New start datetime
 * @param newEnd - New end datetime
 * @param timeZone - IANA timezone
 * @param sendNotifications - Whether to notify attendees
 * @returns Updated event details
 */
export async function rescheduleEvent(
  oauth2Client: OAuth2Client,
  eventId: string,
  newStart: string,
  newEnd: string,
  timeZone: string,
  sendNotifications: boolean = true
): Promise<BookedEvent> {
  return updateEvent(oauth2Client, {
    eventId,
    start: newStart,
    end: newEnd,
    timeZone,
    sendNotifications,
  });
}

/**
 * Delete a calendar event
 *
 * @param oauth2Client - Authenticated OAuth2 client
 * @param eventId - Event ID to delete
 * @param sendNotifications - Whether to notify attendees about cancellation
 */
export async function deleteEvent(
  oauth2Client: OAuth2Client,
  eventId: string,
  sendNotifications: boolean = true
): Promise<void> {
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  try {
    await calendar.events.delete({
      calendarId: 'primary',
      eventId,
      sendUpdates: sendNotifications ? 'all' : 'none',
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    throw wrapError(error, 'Failed to delete event');
  }
}

/**
 * Cancel a specific instance of a recurring event
 *
 * @param oauth2Client - Authenticated OAuth2 client
 * @param recurringEventId - The recurring event ID
 * @param instanceDate - The date of the instance to cancel (YYYY-MM-DD)
 */
export async function cancelRecurringInstance(
  oauth2Client: OAuth2Client,
  recurringEventId: string,
  instanceDate: string
): Promise<void> {
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  try {
    // Get the specific instance
    const instancesResponse = await calendar.events.instances({
      calendarId: 'primary',
      eventId: recurringEventId,
      timeMin: `${instanceDate}T00:00:00Z`,
      timeMax: `${instanceDate}T23:59:59Z`,
      maxResults: 1,
    });

    const instances = instancesResponse.data.items || [];
    if (instances.length === 0) {
      throw new CalendarError(
        'No event instance found on the specified date',
        CalendarErrorType.EVENT_NOT_FOUND
      );
    }

    // Delete the specific instance
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: instances[0].id!,
      sendUpdates: 'all',
    });
  } catch (error) {
    if (error instanceof CalendarError) throw error;
    console.error('Error canceling recurring instance:', error);
    throw wrapError(error, 'Failed to cancel recurring instance');
  }
}

// ============================================================================
// EVENT QUERYING FUNCTIONS
// ============================================================================

/**
 * Get an event by ID
 *
 * @param oauth2Client - Authenticated OAuth2 client
 * @param eventId - Event ID to retrieve
 * @returns Event details or null if not found
 */
export async function getEvent(
  oauth2Client: OAuth2Client,
  eventId: string
): Promise<CalendarEvent | null> {
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  try {
    const response = await calendar.events.get({
      calendarId: 'primary',
      eventId,
    });

    return mapEventToCalendarEvent(response.data);
  } catch (error) {
    const errorType = classifyGoogleError(error);
    if (errorType === CalendarErrorType.EVENT_NOT_FOUND) {
      return null;
    }
    console.error('Error getting event:', error);
    throw wrapError(error, 'Failed to get event');
  }
}

/**
 * List events within a date range
 *
 * @param oauth2Client - Authenticated OAuth2 client
 * @param startDate - Start date (YYYY-MM-DD or ISO datetime)
 * @param endDate - End date (YYYY-MM-DD or ISO datetime)
 * @param options - Additional options
 * @returns Array of events
 */
export async function listEvents(
  oauth2Client: OAuth2Client,
  startDate: string,
  endDate: string,
  options: {
    maxResults?: number;
    searchQuery?: string;
    showDeleted?: boolean;
    singleEvents?: boolean; // Expand recurring events
  } = {}
): Promise<CalendarEvent[]> {
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  try {
    // Ensure dates are in ISO format
    const timeMin = startDate.includes('T') ? startDate : `${startDate}T00:00:00Z`;
    const timeMax = endDate.includes('T') ? endDate : `${endDate}T23:59:59Z`;

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin,
      timeMax,
      maxResults: options.maxResults || 250,
      singleEvents: options.singleEvents ?? true,
      orderBy: 'startTime',
      showDeleted: options.showDeleted || false,
      q: options.searchQuery,
    });

    return (response.data.items || []).map(mapEventToCalendarEvent);
  } catch (error) {
    console.error('Error listing events:', error);
    throw wrapError(error, 'Failed to list events');
  }
}

/**
 * Search for events by query string
 *
 * @param oauth2Client - Authenticated OAuth2 client
 * @param query - Search query (searches in summary, description, location, attendees)
 * @param options - Search options
 * @returns Array of matching events
 */
export async function searchEvents(
  oauth2Client: OAuth2Client,
  query: string,
  options: {
    maxResults?: number;
    daysAhead?: number;
    daysBehind?: number;
  } = {}
): Promise<CalendarEvent[]> {
  const now = new Date();
  const daysBehind = options.daysBehind ?? 30;
  const daysAhead = options.daysAhead ?? 90;

  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - daysBehind);

  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + daysAhead);

  return listEvents(oauth2Client, startDate.toISOString(), endDate.toISOString(), {
    maxResults: options.maxResults || 50,
    searchQuery: query,
    singleEvents: true,
  });
}

/**
 * Find events by attendee email
 *
 * @param oauth2Client - Authenticated OAuth2 client
 * @param attendeeEmail - Email to search for
 * @param options - Search options
 * @returns Events where the email is an attendee
 */
export async function findEventsByAttendee(
  oauth2Client: OAuth2Client,
  attendeeEmail: string,
  options: {
    maxResults?: number;
    daysAhead?: number;
  } = {}
): Promise<CalendarEvent[]> {
  const events = await searchEvents(oauth2Client, attendeeEmail, options);

  // Filter to only events where the email is actually an attendee
  return events.filter(event =>
    event.attendees?.some(a =>
      a.email.toLowerCase() === attendeeEmail.toLowerCase()
    )
  );
}

/**
 * Map Google Calendar event to our CalendarEvent interface
 */
function mapEventToCalendarEvent(event: calendar_v3.Schema$Event): CalendarEvent {
  return {
    id: event.id!,
    summary: event.summary || '',
    start: event.start?.dateTime || event.start?.date || '',
    end: event.end?.dateTime || event.end?.date || '',
    description: event.description || undefined,
    location: event.location || undefined,
    htmlLink: event.htmlLink || undefined,
    attendees: event.attendees?.map(a => ({
      email: a.email!,
      responseStatus: a.responseStatus || undefined,
    })),
    recurrence: event.recurrence || undefined,
    recurringEventId: event.recurringEventId || undefined,
    status: (event.status as 'confirmed' | 'tentative' | 'cancelled') || 'confirmed',
  };
}

// ============================================================================
// CALENDAR SHARING FUNCTIONS
// ============================================================================

/**
 * Share a calendar with another user
 *
 * @param oauth2Client - Authenticated OAuth2 client
 * @param config - Sharing configuration
 * @param calendarId - Calendar ID to share (defaults to 'primary')
 */
export async function shareCalendar(
  oauth2Client: OAuth2Client,
  config: CalendarShareConfig,
  calendarId: string = 'primary'
): Promise<void> {
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  try {
    await calendar.acl.insert({
      calendarId,
      sendNotifications: config.sendNotification ?? true,
      requestBody: {
        role: config.role,
        scope: {
          type: 'user',
          value: config.email,
        },
      },
    });
  } catch (error) {
    console.error('Error sharing calendar:', error);
    throw wrapError(error, 'Failed to share calendar');
  }
}

/**
 * Remove calendar sharing for a user
 *
 * @param oauth2Client - Authenticated OAuth2 client
 * @param email - Email of user to remove access for
 * @param calendarId - Calendar ID (defaults to 'primary')
 */
export async function unshareCalendar(
  oauth2Client: OAuth2Client,
  email: string,
  calendarId: string = 'primary'
): Promise<void> {
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  try {
    // List ACL rules to find the one for this email
    const aclList = await calendar.acl.list({ calendarId });
    const rule = aclList.data.items?.find(
      item => item.scope?.type === 'user' && item.scope?.value === email
    );

    if (rule?.id) {
      await calendar.acl.delete({
        calendarId,
        ruleId: rule.id,
      });
    }
  } catch (error) {
    console.error('Error unsharing calendar:', error);
    throw wrapError(error, 'Failed to unshare calendar');
  }
}

/**
 * List calendar sharing rules
 *
 * @param oauth2Client - Authenticated OAuth2 client
 * @param calendarId - Calendar ID (defaults to 'primary')
 * @returns List of sharing rules
 */
export async function listCalendarSharing(
  oauth2Client: OAuth2Client,
  calendarId: string = 'primary'
): Promise<Array<{ email: string; role: string }>> {
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  try {
    const response = await calendar.acl.list({ calendarId });
    return (response.data.items || [])
      .filter(item => item.scope?.type === 'user')
      .map(item => ({
        email: item.scope?.value || '',
        role: item.role || '',
      }));
  } catch (error) {
    console.error('Error listing calendar sharing:', error);
    throw wrapError(error, 'Failed to list calendar sharing');
  }
}

// ============================================================================
// AVAILABILITY FUNCTIONS
// ============================================================================

/**
 * Format time for voice-friendly output
 *
 * @param date - Date to format
 * @param timeZone - IANA timezone
 * @returns Human-readable time string (e.g., "10:00 AM")
 */
function formatTimeForVoice(date: Date, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone,
    }).format(date);
  } catch {
    // Fallback if timezone is invalid
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  }
}

/**
 * Parse date string (YYYY-MM-DD) and time string (HH:MM or HH:MM AM/PM) into local datetime
 *
 * @param dateStr - Date string in YYYY-MM-DD format
 * @param timeStr - Time string (e.g., "10:00 AM" or "14:30")
 * @param timeZone - IANA timezone (used by Google Calendar API with the returned datetime)
 * @returns Local datetime string in format YYYY-MM-DDTHH:MM:SS (no Z suffix)
 *          Google Calendar interprets this with the timeZone parameter we pass
 */
export function parseDateTime(dateStr: string, timeStr: string, timeZone: string): string {
  // Parse time string to 24-hour format
  let hours: number;
  let minutes: number;

  const time12hrMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (time12hrMatch) {
    hours = parseInt(time12hrMatch[1], 10);
    minutes = parseInt(time12hrMatch[2], 10);
    const period = time12hrMatch[3].toUpperCase();

    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
  } else {
    // Assume 24-hour format (HH:MM)
    const time24hrMatch = timeStr.match(/(\d{1,2}):(\d{2})/);
    if (!time24hrMatch) {
      throw new Error(`Invalid time format: ${timeStr}`);
    }
    hours = parseInt(time24hrMatch[1], 10);
    minutes = parseInt(time24hrMatch[2], 10);
  }

  // Return local datetime string (no Z suffix)
  // Google Calendar will use the timeZone parameter to interpret this correctly
  const hh = hours.toString().padStart(2, '0');
  const mm = minutes.toString().padStart(2, '0');
  return `${dateStr}T${hh}:${mm}:00`;
}
