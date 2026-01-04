/**
 * Calendar tool definitions for Vapi assistants
 *
 * These tools are registered with Vapi and allow the AI to interact with Google Calendar.
 * All descriptions are in German for consistency with the German system prompts.
 *
 * Enhanced with:
 * - Improved intent recognition through detailed descriptions
 * - Better parameter extraction hints for dates, times, attendees
 * - Conflict detection support
 * - Natural language pattern recognition
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
  'check_conflicts',
] as const;

/**
 * Common intent patterns that map to calendar tools (for AI guidance)
 * These help the AI recognize various ways users express calendar intentions
 */
export const CALENDAR_INTENT_PATTERNS = {
  check_availability: [
    'wann haben Sie Zeit',
    'wann ist frei',
    'welche Termine sind verfügbar',
    'haben Sie morgen Zeit',
    'freie Termine',
    'Verfügbarkeit prüfen',
    'wann geht es',
    'wann passt es',
  ],
  book_appointment: [
    'Termin buchen',
    'Termin vereinbaren',
    'Termin machen',
    'ich möchte einen Termin',
    'Termin reservieren',
    'Termin eintragen',
    'buchen Sie mir',
    'ich brauche einen Termin',
  ],
  reschedule_appointment: [
    'Termin verschieben',
    'Termin ändern',
    'Termin verlegen',
    'anderen Termin',
    'umbuchen',
    'neuen Termin statt',
    'Termin auf',
  ],
  cancel_appointment: [
    'Termin absagen',
    'Termin stornieren',
    'Termin löschen',
    'Termin abbrechen',
    'nicht mehr kommen',
    'Termin platzen lassen',
  ],
  list_appointments: [
    'meine Termine',
    'welche Termine habe ich',
    'Terminübersicht',
    'alle Termine',
    'Termine anzeigen',
    'was steht an',
  ],
  search_appointments: [
    'Termin suchen',
    'Termin finden',
    'wann war mein Termin',
    'Termin von',
    'Termin mit',
  ],
  find_next_available: [
    'nächster freier Termin',
    'wann geht es als nächstes',
    'frühester Termin',
    'baldmöglichst',
    'schnellstmöglich',
    'so früh wie möglich',
  ],
} as const;

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
        description: 'Prueft die Kalenderverfuegbarkeit fuer ein bestimmtes Datum. Nutze diese Funktion wenn der Anrufer wissen moechte, wann Zeit ist, welche Termine frei sind, oder nach Verfuegbarkeit fragt. Typische Anfragen: "Wann haben Sie Zeit?", "Haben Sie morgen frei?", "Welche Zeiten gehen am Montag?"',
        parameters: {
          type: 'object',
          properties: {
            date: {
              type: 'string',
              description:
                'Datum fuer die Verfuegbarkeitspruefung. BEVORZUGT relative Begriffe verwenden: "morgen", "heute", "uebermorgen", "naechsten Montag", "Dienstag", "in 3 Tagen", "naechste Woche". Alternativ ISO-Format JJJJ-MM-TT. Beispiele: "morgen" fuer den naechsten Tag, "Freitag" fuer den kommenden Freitag.',
            },
            preferredTimeRange: {
              type: 'string',
              description: 'Bevorzugte Tageszeit des Anrufers (optional). Moegliche Werte: "morgens" (09:00-12:00), "mittags" (12:00-14:00), "nachmittags" (14:00-17:00), "vormittags" (09:00-12:00). Hilft bei der Filterung der verfuegbaren Zeiten.',
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
        name: 'check_conflicts',
        description: 'Prueft ob ein gewuenschter Termin mit bestehenden Terminen kollidiert. Nutze diese Funktion VOR dem Buchen wenn du sicherstellen moechtest, dass der gewaehlte Zeitraum wirklich frei ist. Gibt Konflikte zurueck falls vorhanden und schlaegt Alternativen vor.',
        parameters: {
          type: 'object',
          properties: {
            date: {
              type: 'string',
              description:
                'Datum zu pruefen. Relative Begriffe: "morgen", "heute", "Montag", etc. ODER Format JJJJ-MM-TT.',
            },
            time: {
              type: 'string',
              description: 'Uhrzeit im Format HH:MM (24-Stunden-Format, z.B. 14:30)',
            },
            durationMinutes: {
              type: 'number',
              description: 'Dauer des gewuenschten Termins in Minuten (optional, Standard: konfigurierte Termindauer)',
            },
            timeZone: {
              type: 'string',
              description: 'IANA-Zeitzone. Standard: Europe/Berlin.',
            },
          },
          required: ['date', 'time'] as const,
        },
      },
    },
    {
      type: 'function',
      async: false,
      server: { url: webhookUrl },
      function: {
        name: 'book_appointment',
        description: 'Bucht einen Termin im Kalender. Unterstuetzt auch wiederkehrende Termine und mehrere Teilnehmer. Nutze diese Funktion wenn der Anrufer einen Termin vereinbaren, buchen, reservieren oder eintragen moechte. WICHTIG: Vor dem Buchen immer check_availability oder check_conflicts nutzen um sicherzustellen, dass der Zeitraum frei ist.',
        parameters: {
          type: 'object',
          properties: {
            date: {
              type: 'string',
              description:
                'Termindatum. BEVORZUGT relative Begriffe: "morgen", "heute", "uebermorgen", "naechsten Montag". Alternativ JJJJ-MM-TT. Extrahiere das Datum aus Aussagen wie "Ich haette gerne am Freitag einen Termin" -> "Freitag".',
            },
            time: {
              type: 'string',
              description: 'Terminuhrzeit im Format HH:MM (24-Stunden). Extrahiere aus: "um 14 Uhr" -> "14:00", "halb drei" -> "14:30", "Viertel nach zehn" -> "10:15", "10 Uhr morgens" -> "10:00".',
            },
            callerName: {
              type: 'string',
              description: 'Vollstaendiger Name des Anrufers. ERFORDERLICH. Bei "Mein Name ist Max Mueller" -> "Max Mueller". Frage explizit nach falls nicht genannt.',
            },
            callerPhone: {
              type: 'string',
              description: 'Telefonnummer des Anrufers (optional aber empfohlen). Format flexibel: "0171 1234567" oder "+49 171 1234567".',
            },
            callerEmail: {
              type: 'string',
              description: 'E-Mail-Adresse des Anrufers (optional). Bei gueltiger E-Mail wird eine Kalendereinladung gesendet.',
            },
            summary: {
              type: 'string',
              description: 'Betreff/Grund des Termins. Z.B. "Beratungsgespraech", "Ersttermin", "Nachkontrolle". Falls nicht explizit genannt, aus dem Kontext ableiten.',
            },
            attendees: {
              type: 'string',
              description: 'Weitere Teilnehmer als kommagetrennte E-Mail-Adressen (optional). Z.B. "partner@email.de, kollege@firma.de".',
            },
            recurrence: {
              type: 'string',
              description: 'Wiederholungsmuster (optional). Moeglichkeiten: "taeglich", "woechentlich", "monatlich", "jeden Montag", "alle 2 Wochen", "werktags". Nur setzen wenn Kunde explizit nach wiederkehrendem Termin fragt.',
            },
            location: {
              type: 'string',
              description: 'Ort des Termins (optional). Adresse oder Raumbeschreibung.',
            },
            notes: {
              type: 'string',
              description: 'Zusaetzliche Notizen oder Anmerkungen des Anrufers (optional). Besondere Wuensche, Vorbereitungen, etc.',
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
        description: 'Verschiebt einen bestehenden Termin auf ein neues Datum/Uhrzeit. Nutze diese Funktion wenn der Anrufer einen Termin verlegen, verschieben, aendern oder umbuchen moechte. Der Termin wird anhand des Anrufernamens automatisch gefunden.',
        parameters: {
          type: 'object',
          properties: {
            eventId: {
              type: 'string',
              description: 'Die ID des zu verschiebenden Termins (optional - wird automatisch per callerName gesucht falls nicht angegeben)',
            },
            callerName: {
              type: 'string',
              description: 'Name des Anrufers um den Termin automatisch zu finden. EMPFOHLEN statt eventId.',
            },
            originalDate: {
              type: 'string',
              description: 'Urspruengliches Datum des Termins (optional, hilft bei der Identifikation wenn mehrere Termine existieren). Format: relative Begriffe oder JJJJ-MM-TT.',
            },
            newDate: {
              type: 'string',
              description: 'Neues gewuenschtes Datum. BEVORZUGT relative Begriffe: "morgen", "heute", "uebermorgen", "naechsten Montag", "Freitag". Alternativ JJJJ-MM-TT.',
            },
            newTime: {
              type: 'string',
              description: 'Neue gewuenschte Uhrzeit im Format HH:MM (24-Stunden-Format). Extrahiere aus Aussagen wie "auf 15 Uhr" -> "15:00".',
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
        description: 'Storniert/loescht einen bestehenden Termin. Nutze diese Funktion wenn der Anrufer einen Termin absagen, stornieren, loeschen oder abbrechen moechte. Bei wiederkehrenden Terminen kann einzeln oder alle storniert werden.',
        parameters: {
          type: 'object',
          properties: {
            eventId: {
              type: 'string',
              description: 'Die ID des zu stornierenden Termins (optional - wird automatisch per callerName gesucht)',
            },
            callerName: {
              type: 'string',
              description: 'Name des Anrufers um den Termin automatisch zu finden. EMPFOHLEN.',
            },
            date: {
              type: 'string',
              description: 'Datum des zu stornierenden Termins. Bei wiederkehrenden Terminen: Datum der spezifischen Instanz. Format: relative Begriffe oder JJJJ-MM-TT.',
            },
            reason: {
              type: 'string',
              description: 'Grund fuer die Stornierung (optional). Wird in der Benachrichtigung erwaehnt.',
            },
            cancelAll: {
              type: 'string',
              description: 'Bei wiederkehrenden Terminen: "ja" um alle kuenftigen Termine zu stornieren, "nein" nur diese Instanz. Frage nach wenn unklar.',
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
        description: 'Listet alle Termine in einem Zeitraum auf. Nutze diese Funktion wenn der Anrufer wissen moechte welche Termine anstehen, eine Terminuebersicht benoetigt, oder nach allen Terminen fragt. Zeigt Datum, Uhrzeit und Beschreibung.',
        parameters: {
          type: 'object',
          properties: {
            startDate: {
              type: 'string',
              description: 'Startdatum der Abfrage. BEVORZUGT relative Begriffe: "heute", "morgen", "diese Woche", "naechste Woche". Alternativ JJJJ-MM-TT.',
            },
            endDate: {
              type: 'string',
              description: 'Enddatum der Abfrage (optional). Bei "heute" als startDate wird nur der Tag abgefragt. Bei "diese Woche" wird automatisch bis Sonntag gesucht.',
            },
            callerName: {
              type: 'string',
              description: 'Name des Anrufers um nur dessen Termine zu filtern (optional).',
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
        description: 'Sucht nach Terminen anhand von Name, Beschreibung, Ort oder anderen Kriterien. Nutze diese Funktion wenn der Anrufer einen bestimmten Termin sucht oder nach Terminen mit einer bestimmten Person/Beschreibung fragt.',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Suchbegriff - kann Name, Betreff, Ort oder Beschreibung sein. Z.B. "Mueller", "Beratung", "Zahnarzt".',
            },
            callerName: {
              type: 'string',
              description: 'Name des Anrufers um dessen Termine gezielt zu finden. Besonders nuetzlich wenn der Anrufer "meinen Termin" sucht.',
            },
            dateRange: {
              type: 'string',
              description: 'Zeitraum fuer die Suche (optional). Z.B. "diese Woche", "naechsten Monat", "Januar". Standard: 30 Tage zurueck bis 90 Tage voraus.',
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
        description: 'Findet den naechsten verfuegbaren Termin. Nutze diese Funktion wenn der Anrufer nach dem naechsten freien Termin, dem fruehesten moeglichen Termin, oder einem Termin "so bald wie moeglich" fragt. Durchsucht die naechsten 14 Tage.',
        parameters: {
          type: 'object',
          properties: {
            afterDate: {
              type: 'string',
              description: 'Suche ab diesem Datum (optional). Standard: ab jetzt. Nuetzlich wenn Anrufer sagt "ab naechster Woche" oder "ab Montag".',
            },
            preferredTimeRange: {
              type: 'string',
              description: 'Bevorzugte Tageszeit (optional). Moegliche Werte: "morgens", "vormittags", "mittags", "nachmittags". Hilft bei der Suche nach passenden Zeiten.',
            },
            minDuration: {
              type: 'number',
              description: 'Mindestdauer des Termins in Minuten (optional). Standard: konfigurierte Termindauer.',
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
