import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';

/**
 * Available time slot structure
 */
export interface TimeSlot {
  start: string; // ISO 8601 format
  end: string; // ISO 8601 format
  displayTime: string; // Human-readable format for voice (e.g., "10:00 AM")
}

/**
 * Booking parameters
 */
export interface BookingParams {
  summary: string; // Event title
  start: string; // ISO 8601 datetime
  end: string; // ISO 8601 datetime
  attendeeEmail?: string; // Optional attendee email
  callerName?: string; // Caller's name for description
  callerPhone?: string; // Caller's phone for description
  description?: string; // Additional description
  timeZone: string; // IANA timezone (e.g., "America/New_York")
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
}

// Business hours configuration
const DEFAULT_BUSINESS_START_HOUR = 9; // 9 AM
const DEFAULT_BUSINESS_END_HOUR = 17; // 5 PM
const DEFAULT_APPOINTMENT_DURATION_MINUTES = 30;

/**
 * Parse a date input that can be either a relative term (morgen, heute, übermorgen)
 * or an ISO date string. Returns the resolved date in YYYY-MM-DD format.
 *
 * This handles the common case where the AI passes relative terms instead of
 * calculating dates (which it often gets wrong).
 *
 * @param dateInput - Either a relative term or YYYY-MM-DD date string
 * @returns Resolved date in YYYY-MM-DD format
 */
export function parseDateInput(dateInput: string): string {
  const input = dateInput.toLowerCase().trim();
  const now = new Date();

  // German relative date terms
  const relativeDates: Record<string, number> = {
    'heute': 0,
    'today': 0,
    'morgen': 1,
    'tomorrow': 1,
    'übermorgen': 2,
    'ubermorgen': 2,
  };

  // Check if it's a relative term
  if (relativeDates[input] !== undefined) {
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + relativeDates[input]);
    const result = targetDate.toISOString().split('T')[0];
    console.log(`Relative date parsed: "${dateInput}" -> ${result}`);
    return result;
  }

  // Check for "in X tagen" pattern
  const inDaysMatch = input.match(/in\s+(\d+)\s+tag/i);
  if (inDaysMatch) {
    const days = parseInt(inDaysMatch[1], 10);
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + days);
    const result = targetDate.toISOString().split('T')[0];
    console.log(`Relative date parsed: "${dateInput}" -> ${result}`);
    return result;
  }

  // Check for weekday names (nächsten Montag, etc.)
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
    throw new Error('Failed to check calendar availability');
  }
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

  const eventData: any = {
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

  // Add attendee if email provided
  if (params.attendeeEmail) {
    eventData.attendees = [{ email: params.attendeeEmail }];
  }

  try {
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: eventData,
      // Send email notifications to attendees (if any)
      sendUpdates: params.attendeeEmail ? 'all' : 'none',
    });

    const event = response.data;

    return {
      id: event.id!,
      summary: event.summary || params.summary,
      start: event.start?.dateTime || params.start,
      end: event.end?.dateTime || params.end,
      htmlLink: event.htmlLink || '',
      timeZone: params.timeZone,
    };
  } catch (error) {
    console.error('Error booking appointment:', error);
    throw new Error('Failed to book appointment');
  }
}

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
