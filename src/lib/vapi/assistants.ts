import { getVapiClient } from './client';
import type { CreateAssistantConfig, UpdateAssistantConfig, VapiAssistantResponse } from './types';

/**
 * Build a system prompt from business configuration
 * All prompts are in formal German (Sie-form) for professional business communication
 *
 * Uses Vapi dynamic variables for real-time date/time:
 * https://docs.vapi.ai/assistants/dynamic-variables#advanced-date-and-time-usage
 */
function buildSystemPrompt(config: CreateAssistantConfig, hasCalendarTools: boolean): string {
  // Vapi dynamic variables - substituted at call time by Vapi
  // Format: {{"now" | date: "format_string", "timezone"}}
  const dateHeader = hasCalendarTools ? `[AKTUELLES DATUM UND UHRZEIT]
Heute: {{"now" | date: "%d.%m.%Y", "Europe/Berlin"}} (ISO: {{"now" | date: "%Y-%m-%d", "Europe/Berlin"}})
Uhrzeit: {{"now" | date: "%H:%M", "Europe/Berlin"}} Uhr
Wochentag: {{"now" | date: "%A", "Europe/Berlin"}}
Jahr: {{"now" | date: "%Y", "Europe/Berlin"}}

WICHTIG - DATUMSREGELN:
- Das aktuelle Jahr ist {{"now" | date: "%Y", "Europe/Berlin"}} - NIEMALS 2023 oder 2024 verwenden!
- Wenn der Kunde "morgen" sagt, berechne das korrekte Datum basierend auf heute
- Wenn der Kunde "Montag" sagt, nimm den NÄCHSTEN Montag (nicht vergangene)
- Übergib Datumsangaben im Format JJJJ-MM-TT an die Tools

` : '';

  const faqSection = config.faqs.length > 0
    ? `\n\n## Häufige Fragen\n${config.faqs.map(faq => `F: ${faq.question}\nA: ${faq.answer}`).join('\n\n')}`
    : '';

  const calendarSection = hasCalendarTools
    ? `\n\n## Kalender-Funktionen
- Sie können die Verfügbarkeit mit dem check_availability-Tool prüfen
- Sie können Termine mit dem book_appointment-Tool buchen
- Erfragen Sie bei Terminbuchungen: Datum, Uhrzeit, Name des Anrufers (erforderlich), Telefonnummer (optional), E-Mail (optional)
- Bestätigen Sie immer die Details vor der Buchung
- Berechnen Sie relative Datumsangaben (morgen, nächsten Montag) anhand des aktuellen Datums oben`
    : '';

  const appointmentGuideline = hasCalendarTools
    ? '\n- Nutzen Sie bei Terminanfragen Ihre Kalender-Tools'
    : '\n- Bei Terminwünschen: Name, bevorzugtes Datum/Uhrzeit und Grund erfragen';

  return `${dateHeader}Sie sind der KI-Assistent für ${config.businessName}.

## Geschäftsinformationen
- Firmenname: ${config.businessName}
- Öffnungszeiten: ${config.businessHours}
- Dienstleistungen: ${config.services.join(', ')}${faqSection}${calendarSection}

## Richtlinien
- Sprechen Sie Anrufer mit "Sie" an (formell)
- Seien Sie freundlich, professionell und präzise
- Beantworten Sie Fragen zum Unternehmen anhand der obigen Informationen
- Wenn Sie etwas nicht wissen, sagen Sie höflich, dass sich jemand bei ihnen melden wird
- Halten Sie Antworten kurz und natürlich für Telefongespräche${appointmentGuideline}`;
}

/**
 * Create a new business assistant in Vapi
 */
export async function createBusinessAssistant(
  config: CreateAssistantConfig
): Promise<VapiAssistantResponse> {
  const client = getVapiClient();

  const greeting = config.greeting ??
    `${config.businessName}, guten Tag! Wie kann ich Ihnen behilflich sein?`;

  // Check if user has Google Calendar connected
  const hasCalendarTools = config.hasGoogleCalendar ?? false;

  // Get the server URL for tool callbacks
  const serverUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Build calendar tools if Google is connected (Vapi SDK format)
  // Tool descriptions in German for consistency with system prompt
  const tools = hasCalendarTools ? [
    {
      type: 'function',
      async: false,
      server: {
        url: `${serverUrl}/api/webhooks/vapi`,
      },
      function: {
        name: 'check_availability',
        description: 'Prüft die Kalenderverfügbarkeit für ein bestimmtes Datum. Verwende dies, wenn ein Anrufer nach freien Terminen fragt. Verwende immer das aktuelle Jahr aus dem AKTUELLES DATUM Header.',
        parameters: {
          type: 'object',
          properties: {
            date: {
              type: 'string',
              description: 'Datum im Format JJJJ-MM-TT (z.B. 2025-01-15). WICHTIG: Immer das aktuelle Jahr verwenden!',
            },
            timeZone: {
              type: 'string',
              description: 'IANA-Zeitzone (z.B. Europe/Berlin). Optional, Standard ist Europe/Berlin.',
            },
          },
          required: ['date'],
        },
      },
    },
    {
      type: 'function',
      async: false,
      server: {
        url: `${serverUrl}/api/webhooks/vapi`,
      },
      function: {
        name: 'book_appointment',
        description: 'Bucht einen Termin im Kalender. Verwende dies nach Bestätigung von Datum, Uhrzeit und Anruferdaten. Verwende immer das aktuelle Jahr aus dem AKTUELLES DATUM Header.',
        parameters: {
          type: 'object',
          properties: {
            date: {
              type: 'string',
              description: 'Datum im Format JJJJ-MM-TT (z.B. 2025-01-15). WICHTIG: Immer das aktuelle Jahr verwenden!',
            },
            time: {
              type: 'string',
              description: 'Uhrzeit im 24-Stunden-Format (z.B. 14:30)',
            },
            callerName: {
              type: 'string',
              description: 'Vollständiger Name des Anrufers (erforderlich)',
            },
            callerPhone: {
              type: 'string',
              description: 'Telefonnummer des Anrufers (optional)',
            },
            callerEmail: {
              type: 'string',
              description: 'E-Mail-Adresse des Anrufers (optional, erhält Kalendereinladung)',
            },
            summary: {
              type: 'string',
              description: 'Kurze Beschreibung des Termins (optional, Standard ist "Termin")',
            },
            timeZone: {
              type: 'string',
              description: 'IANA-Zeitzone (z.B. Europe/Berlin). Optional, Standard ist Europe/Berlin.',
            },
          },
          required: ['date', 'time', 'callerName'],
        },
      },
    },
  ] : undefined;

  const assistantConfig: any = {
    name: config.name,
    firstMessage: greeting,
    model: {
      provider: 'openai',
      model: 'gpt-4o',
      messages: [{ role: 'system', content: buildSystemPrompt(config, hasCalendarTools) }],
      ...(tools && { tools }),
    },
    voice: {
      provider: 'azure',
      voiceId: config.voiceId ?? 'de-DE-KatjaNeural',
    },
    transcriber: {
      provider: 'deepgram',
      model: 'nova-2',
      language: 'de',
    },
    maxDurationSeconds: 600, // 10 minute max call
    endCallMessage: 'Vielen Dank für Ihren Anruf. Auf Wiederhören!',
  };

  const assistant = await client.assistants.create(assistantConfig);

  if (hasCalendarTools) {
    console.log(`Created assistant ${assistant.id} with calendar tools enabled`);
  } else {
    console.log(`Created assistant ${assistant.id} without calendar tools (Google not connected)`);
  }

  return {
    id: assistant.id,
    name: assistant.name ?? config.name,
    createdAt: assistant.createdAt ?? new Date().toISOString(),
    updatedAt: assistant.updatedAt ?? new Date().toISOString(),
  };
}

/**
 * Update an existing assistant in Vapi
 */
export async function updateAssistant(
  assistantId: string,
  config: UpdateAssistantConfig
): Promise<VapiAssistantResponse> {
  const client = getVapiClient();

  // Build update payload based on what's provided
  const updatePayload: Record<string, unknown> = {};

  if (config.name) {
    updatePayload.name = config.name;
  }

  if (config.greeting) {
    updatePayload.firstMessage = config.greeting;
  }

  if (config.voiceId) {
    updatePayload.voice = {
      provider: 'azure',
      voiceId: config.voiceId,
    };
  }

  // If any business info changed, rebuild system prompt
  if (config.businessName || config.businessHours || config.services || config.faqs) {
    // We need full config to rebuild prompt - this would require fetching current config
    // For now, only update if all required fields are provided
    if (config.businessName && config.businessHours && config.services && config.faqs) {
      const hasCalendarTools = config.hasGoogleCalendar ?? false;
      updatePayload.model = {
        provider: 'openai',
        model: 'gpt-4o',
        messages: [{ role: 'system', content: buildSystemPrompt(config as CreateAssistantConfig, hasCalendarTools) }],
      };
    }
  }

  const assistant = await client.assistants.update({
    id: assistantId,
    ...updatePayload,
  });

  return {
    id: assistant.id,
    name: assistant.name ?? '',
    createdAt: assistant.createdAt ?? new Date().toISOString(),
    updatedAt: assistant.updatedAt ?? new Date().toISOString(),
  };
}

/**
 * Delete an assistant from Vapi
 */
export async function deleteAssistant(assistantId: string): Promise<void> {
  const client = getVapiClient();
  await client.assistants.delete({ id: assistantId });
}

/**
 * Refresh an assistant's system prompt with Vapi dynamic date variables
 * Call this to update existing agents to use Vapi's native date substitution
 */
export async function refreshAssistantDate(
  assistantId: string,
  config: CreateAssistantConfig
): Promise<VapiAssistantResponse> {
  const client = getVapiClient();
  const hasCalendarTools = config.hasGoogleCalendar ?? false;

  const serverUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Rebuild tools with current server URL and German descriptions
  const tools = hasCalendarTools ? [
    {
      type: 'function' as const,
      async: false,
      server: { url: `${serverUrl}/api/webhooks/vapi` },
      function: {
        name: 'check_availability',
        description: 'Prüft die Kalenderverfügbarkeit für ein bestimmtes Datum.',
        parameters: {
          type: 'object' as const,
          properties: {
            date: { type: 'string', description: 'Datum im Format JJJJ-MM-TT (z.B. 2025-01-15)' },
            timeZone: { type: 'string', description: 'IANA-Zeitzone. Standard: Europe/Berlin.' },
          },
          required: ['date'],
        },
      },
    },
    {
      type: 'function' as const,
      async: false,
      server: { url: `${serverUrl}/api/webhooks/vapi` },
      function: {
        name: 'book_appointment',
        description: 'Bucht einen Termin im Kalender.',
        parameters: {
          type: 'object' as const,
          properties: {
            date: { type: 'string', description: 'Datum im Format JJJJ-MM-TT (z.B. 2025-01-15)' },
            time: { type: 'string', description: 'Uhrzeit im 24-Stunden-Format (z.B. 14:30)' },
            callerName: { type: 'string', description: 'Vollständiger Name des Anrufers (erforderlich)' },
            callerPhone: { type: 'string', description: 'Telefonnummer des Anrufers (optional)' },
            callerEmail: { type: 'string', description: 'E-Mail-Adresse des Anrufers (optional)' },
            summary: { type: 'string', description: 'Kurze Beschreibung des Termins (optional)' },
            timeZone: { type: 'string', description: 'IANA-Zeitzone. Standard: Europe/Berlin.' },
          },
          required: ['date', 'time', 'callerName'] as const,
        },
      },
    },
  ] : undefined;

  const assistant = await client.assistants.update({
    id: assistantId,
    model: {
      provider: 'openai',
      model: 'gpt-4o',
      messages: [{ role: 'system', content: buildSystemPrompt(config, hasCalendarTools) }],
      ...(tools && { tools }),
    } as any,
  });

  console.log(`Refreshed assistant ${assistantId} with Vapi dynamic date variables`);

  return {
    id: assistant.id,
    name: assistant.name ?? '',
    createdAt: assistant.createdAt ?? new Date().toISOString(),
    updatedAt: assistant.updatedAt ?? new Date().toISOString(),
  };
}
