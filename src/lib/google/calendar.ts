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
