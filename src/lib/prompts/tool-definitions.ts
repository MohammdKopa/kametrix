/**
 * Calendar tool definitions for Vapi assistants
 *
 * These tools are registered with Vapi and allow the AI to interact with Google Calendar.
 * All descriptions are in German for consistency with the German system prompts.
 */

/**
 * Names of available calendar tools
 */
export const CALENDAR_TOOL_NAMES = [
  'check_availability',
  'book_appointment',
  'reschedule_appointment',
  'cancel_appointment',
  'list_appointments',
  'search_appointments',
  'find_next_available',
] as const;

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
        description: 'Bucht einen Termin im Kalender. Unterstuetzt auch wiederkehrende Termine.',
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
            recurrence: {
              type: 'string',
              description: 'Wiederholung: "taeglich", "woechentlich", "monatlich", "jeden Montag", "alle 2 Wochen", etc. (optional)',
            },
            location: {
              type: 'string',
              description: 'Ort des Termins (optional)',
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
    {
      type: 'function',
      async: false,
      server: { url: webhookUrl },
      function: {
        name: 'reschedule_appointment',
        description: 'Verschiebt einen bestehenden Termin auf ein neues Datum/Uhrzeit.',
        parameters: {
          type: 'object',
          properties: {
            eventId: {
              type: 'string',
              description: 'Die ID des zu verschiebenden Termins',
            },
            callerName: {
              type: 'string',
              description: 'Name des Anrufers um den Termin zu finden',
            },
            newDate: {
              type: 'string',
              description: 'Neues Datum. BEVORZUGT relative Begriffe: "morgen", "heute", "uebermorgen", "Montag", etc. ODER Format JJJJ-MM-TT.',
            },
            newTime: {
              type: 'string',
              description: 'Neue Uhrzeit im Format HH:MM (24-Stunden-Format, z.B. 14:30)',
            },
            timeZone: {
              type: 'string',
              description: 'IANA-Zeitzone. Standard: Europe/Berlin.',
            },
          },
          required: ['newDate', 'newTime'] as const,
        },
      },
    },
    {
      type: 'function',
      async: false,
      server: { url: webhookUrl },
      function: {
        name: 'cancel_appointment',
        description: 'Storniert/loescht einen bestehenden Termin.',
        parameters: {
          type: 'object',
          properties: {
            eventId: {
              type: 'string',
              description: 'Die ID des zu stornierenden Termins',
            },
            callerName: {
              type: 'string',
              description: 'Name des Anrufers um den Termin zu finden',
            },
            date: {
              type: 'string',
              description: 'Datum des Termins (fuer wiederkehrende Termine: nur diese Instanz). Format JJJJ-MM-TT.',
            },
            cancelAll: {
              type: 'string',
              description: 'Bei wiederkehrenden Terminen: "ja" um alle kuenftigen Termine zu stornieren, "nein" nur diese Instanz.',
            },
          },
          required: [] as const,
        },
      },
    },
    {
      type: 'function',
      async: false,
      server: { url: webhookUrl },
      function: {
        name: 'list_appointments',
        description: 'Listet alle Termine in einem Zeitraum auf.',
        parameters: {
          type: 'object',
          properties: {
            startDate: {
              type: 'string',
              description: 'Startdatum. BEVORZUGT relative Begriffe: "heute", "morgen", etc. ODER Format JJJJ-MM-TT.',
            },
            endDate: {
              type: 'string',
              description: 'Enddatum. BEVORZUGT relative Begriffe oder Format JJJJ-MM-TT.',
            },
            timeZone: {
              type: 'string',
              description: 'IANA-Zeitzone. Standard: Europe/Berlin.',
            },
          },
          required: ['startDate'] as const,
        },
      },
    },
    {
      type: 'function',
      async: false,
      server: { url: webhookUrl },
      function: {
        name: 'search_appointments',
        description: 'Sucht nach Terminen anhand von Name, Beschreibung oder anderen Kriterien.',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Suchbegriff (Name, Betreff, Ort, etc.)',
            },
            callerName: {
              type: 'string',
              description: 'Name des Anrufers um dessen Termine zu finden',
            },
            timeZone: {
              type: 'string',
              description: 'IANA-Zeitzone. Standard: Europe/Berlin.',
            },
          },
          required: ['query'] as const,
        },
      },
    },
    {
      type: 'function',
      async: false,
      server: { url: webhookUrl },
      function: {
        name: 'find_next_available',
        description: 'Findet den naechsten verfuegbaren Termin.',
        parameters: {
          type: 'object',
          properties: {
            afterDate: {
              type: 'string',
              description: 'Suche nach diesem Datum. Standard: jetzt.',
            },
            timeZone: {
              type: 'string',
              description: 'IANA-Zeitzone. Standard: Europe/Berlin.',
            },
          },
          required: [] as const,
        },
      },
    },
  ];
}
