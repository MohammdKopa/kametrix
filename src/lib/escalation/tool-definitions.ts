/**
 * Escalation Tool Definitions for Vapi Voice Agent
 *
 * Defines the tools that allow the AI to escalate calls to human operators.
 * All descriptions are in German for consistency with the voice agent's language.
 */

/**
 * Names of available escalation tools
 */
export const ESCALATION_TOOL_NAMES = [
  'escalate_to_human',
  'check_operator_availability',
] as const;

/**
 * Intent patterns that suggest escalation is needed
 */
export const ESCALATION_INTENT_PATTERNS = {
  escalate_to_human: [
    'ich moechte mit einem menschen sprechen',
    'verbinden sie mich',
    'weiterleiten',
    'einen mitarbeiter bitte',
    'echte person',
    'menschlicher support',
    'agent',
    'representative',
    'speak to a human',
    'real person',
  ],
} as const;

/**
 * Type for escalation tool function definitions
 */
interface EscalationToolFunction {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, { type: string; description: string; enum?: string[] }>;
    required: readonly string[];
  };
}

interface EscalationTool {
  type: 'function';
  async: boolean;
  server: { url: string };
  function: EscalationToolFunction;
}

/**
 * Build escalation tools with server URL injected
 *
 * @param serverUrl - Base URL for the webhook endpoint (e.g., https://example.com)
 * @returns Array of Vapi tool definitions for escalation
 */
export function buildEscalationTools(serverUrl: string): EscalationTool[] {
  const webhookUrl = `${serverUrl}/api/webhooks/vapi`;

  return [
    {
      type: 'function',
      async: false,
      server: { url: webhookUrl },
      function: {
        name: 'escalate_to_human',
        description: `[PRIORITAET 1] WEITERLEITUNG ZU MENSCHLICHEM MITARBEITER. Bei diesen Woertern SOFORT diese Funktion aufrufen: "Mitarbeiter", "Mensch", "Person sprechen", "verbinden", "weiterleiten", "echter Mensch", "human agent". NICHT nachfragen - SOFORT weiterleiten! Parameter: reason="user_request", summary=Zusammenfassung des Gespraechs.`,
        parameters: {
          type: 'object',
          properties: {
            reason: {
              type: 'string',
              description: `Grund fuer die Weiterleitung. Waehle den passendsten Grund:
- "user_request": Anrufer hat explizit nach einem Menschen gefragt
- "confused": Du bist unsicher oder verstehst das Anliegen nicht
- "frustrated": Anrufer klingt frustriert oder veraergert
- "complex": Das Problem ist zu komplex fuer KI-Bearbeitung
- "repeated_clarification": Du hast mehrfach nachfragen muessen
- "other": Sonstiger Grund`,
              enum: ['user_request', 'confused', 'frustrated', 'complex', 'repeated_clarification', 'other'],
            },
            summary: {
              type: 'string',
              description: 'Kurze Zusammenfassung des bisherigen Gespraechs fuer den Mitarbeiter. Was hat der Anrufer gewollt? Was wurde bereits besprochen? ERFORDERLICH.',
            },
            callerName: {
              type: 'string',
              description: 'Name des Anrufers (falls bekannt). Hilft dem Mitarbeiter bei der Begruessing.',
            },
            urgency: {
              type: 'string',
              description: 'Dringlichkeit der Weiterleitung. "normal" fuer Standard, "high" fuer dringende Anliegen, "critical" fuer Notfaelle.',
              enum: ['normal', 'high', 'critical'],
            },
          },
          required: ['reason', 'summary'] as const,
        },
      },
    },
    {
      type: 'function',
      async: false,
      server: { url: webhookUrl },
      function: {
        name: 'check_operator_availability',
        description: `Prueft ob menschliche Mitarbeiter verfuegbar sind und gibt die geschaetzte Wartezeit zurueck.
Nutze diese Funktion VOR einer Weiterleitung wenn du dem Anrufer die Wartezeit mitteilen moechtest.
Die Antwort enthaelt:
- Ob Mitarbeiter verfuegbar sind
- Geschaetzte Wartezeit
- Ob wir uns innerhalb der Geschaeftszeiten befinden
- Alternative Optionen (Voicemail, Rueckruf) falls keine Mitarbeiter verfuegbar`,
        parameters: {
          type: 'object',
          properties: {
            department: {
              type: 'string',
              description: 'Optionale Abteilung (z.B. "Vertrieb", "Support", "Buchhaltung"). Falls nicht angegeben wird die Standard-Weiterleitung verwendet.',
            },
          },
          required: [] as const,
        },
      },
    },
  ];
}

/**
 * Get escalation tool names as array
 */
export function getEscalationToolNames(): string[] {
  return [...ESCALATION_TOOL_NAMES];
}

/**
 * Check if a tool name is an escalation tool
 */
export function isEscalationTool(toolName: string): boolean {
  return ESCALATION_TOOL_NAMES.includes(toolName as typeof ESCALATION_TOOL_NAMES[number]);
}
