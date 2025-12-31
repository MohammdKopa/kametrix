/**
 * Calendar tool definitions for Vapi assistants
 *
 * These tools are registered with Vapi and allow the AI to interact with Google Calendar.
 * All descriptions are in German for consistency with the German system prompts.
 */

/**
 * Names of available calendar tools
 */
export const CALENDAR_TOOL_NAMES = ['check_availability', 'book_appointment'] as const;

/**
 * Type for calendar tool function definitions
 */
interface CalendarToolFunction {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, { type: string; description: string }>;
    required: readonly string[];
  };
}

interface CalendarTool {
  type: 'function';
  async: boolean;
  server: { url: string };
  function: CalendarToolFunction;
}

/**
 * Build calendar tools with server URL injected
 *
 * @param serverUrl - Base URL for the webhook endpoint (e.g., https://example.com)
 * @returns Array of Vapi tool definitions
 */
export function buildCalendarTools(serverUrl: string): CalendarTool[] {
  const webhookUrl = `${serverUrl}/api/webhooks/vapi`;

  return [
    {
      type: 'function',
      async: false,
      server: { url: webhookUrl },
      function: {
        name: 'check_availability',
        description: 'Prueft die Kalenderverfuegbarkeit fuer ein Datum.',
        parameters: {
          type: 'object',
          properties: {
            date: {
              type: 'string',
              description:
                'Datum als Text. BEVORZUGT relative Begriffe: "morgen", "heute", "uebermorgen", "Montag", "Dienstag", etc. ODER Format JJJJ-MM-TT.',
            },
            timeZone: {
              type: 'string',
              description: 'IANA-Zeitzone. Standard: Europe/Berlin.',
            },
          },
          required: ['date'] as const,
        },
      },
    },
    {
      type: 'function',
      async: false,
      server: { url: webhookUrl },
      function: {
        name: 'book_appointment',
        description: 'Bucht einen Termin im Kalender.',
        parameters: {
          type: 'object',
          properties: {
            date: {
              type: 'string',
              description:
                'Datum als Text. BEVORZUGT relative Begriffe: "morgen", "heute", "uebermorgen", "Montag", "Dienstag", etc. ODER Format JJJJ-MM-TT.',
            },
            time: {
              type: 'string',
              description: 'Uhrzeit im Format HH:MM (24-Stunden-Format, z.B. 14:30)',
            },
            callerName: {
              type: 'string',
              description: 'Vollstaendiger Name des Anrufers (erforderlich)',
            },
            callerPhone: {
              type: 'string',
              description: 'Telefonnummer des Anrufers (optional)',
            },
            callerEmail: {
              type: 'string',
              description: 'E-Mail-Adresse des Anrufers (optional)',
            },
            summary: {
              type: 'string',
              description: 'Kurze Beschreibung des Termins (optional)',
            },
            timeZone: {
              type: 'string',
              description: 'IANA-Zeitzone. Standard: Europe/Berlin.',
            },
          },
          required: ['date', 'time', 'callerName'] as const,
        },
      },
    },
  ];
}
