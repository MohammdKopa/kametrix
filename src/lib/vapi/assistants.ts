import { getVapiClient } from './client';
import type { CreateAssistantConfig, UpdateAssistantConfig, VapiAssistantResponse } from './types';

/**
 * Build a system prompt from business configuration
 * All prompts are in formal German (Sie-form) for professional business communication
 */
function buildSystemPrompt(config: CreateAssistantConfig, hasCalendarTools: boolean): string {
  // NOTE: Current date is dynamically prepended by the webhook handler at call time
  // Do NOT embed static dates here - they become stale

  const faqSection = config.faqs.length > 0
    ? `\n\n## Häufige Fragen\n${config.faqs.map(faq => `F: ${faq.question}\nA: ${faq.answer}`).join('\n\n')}`
    : '';

  const calendarSection = hasCalendarTools
    ? `\n\n## Kalender-Funktionen
- Sie können die Verfügbarkeit mit dem check_availability-Tool prüfen
- Sie können Termine mit dem book_appointment-Tool buchen
- Erfragen Sie bei Terminbuchungen: Datum, Uhrzeit, Name des Anrufers (erforderlich), Telefonnummer (optional), E-Mail (optional)
- Bestätigen Sie immer die Details vor der Buchung
- Verwenden Sie das aktuelle Datum am Anfang dieses Prompts für Datumsberechnungen`
    : '';

  const appointmentGuideline = hasCalendarTools
    ? '\n- Nutzen Sie bei Terminanfragen Ihre Kalender-Tools'
    : '\n- Bei Terminwünschen: Name, bevorzugtes Datum/Uhrzeit und Grund erfragen';

  return `Sie sind der KI-Assistent für ${config.businessName}.

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
  const tools = hasCalendarTools ? [
    {
      type: 'function',
      async: false,
      server: {
        url: `${serverUrl}/api/webhooks/vapi`,
      },
      function: {
        name: 'check_availability',
        description: 'Check calendar availability for a specific date. Use this when a caller asks about available appointment times.',
        parameters: {
          type: 'object',
          properties: {
            date: {
              type: 'string',
              description: 'Date to check in YYYY-MM-DD format (e.g., 2024-03-15)',
            },
            timeZone: {
              type: 'string',
              description: 'IANA timezone (e.g., Europe/Berlin). Optional, defaults to Europe/Berlin.',
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
        description: 'Book an appointment on the calendar. Use this after confirming the date, time, and caller details.',
        parameters: {
          type: 'object',
          properties: {
            date: {
              type: 'string',
              description: 'Date in YYYY-MM-DD format (e.g., 2024-03-15)',
            },
            time: {
              type: 'string',
              description: 'Time in HH:MM AM/PM format (e.g., 10:00 AM) or 24-hour format (e.g., 14:30)',
            },
            callerName: {
              type: 'string',
              description: "Caller's full name (required)",
            },
            callerPhone: {
              type: 'string',
              description: "Caller's phone number (optional)",
            },
            callerEmail: {
              type: 'string',
              description: "Caller's email address (optional, will send calendar invite if provided)",
            },
            summary: {
              type: 'string',
              description: 'Brief description of the appointment (optional, defaults to "Appointment")',
            },
            timeZone: {
              type: 'string',
              description: 'IANA timezone (e.g., Europe/Berlin). Optional, defaults to Europe/Berlin.',
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
 * Refresh an assistant's system prompt with current date
 * Call this to update the date for agents created days/weeks ago
 */
export async function refreshAssistantDate(
  assistantId: string,
  config: CreateAssistantConfig
): Promise<VapiAssistantResponse> {
  const client = getVapiClient();
  const hasCalendarTools = config.hasGoogleCalendar ?? false;

  const serverUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Rebuild tools with current server URL
  const tools = hasCalendarTools ? [
    {
      type: 'function' as const,
      async: false,
      server: { url: `${serverUrl}/api/webhooks/vapi` },
      function: {
        name: 'check_availability',
        description: 'Check calendar availability for a specific date.',
        parameters: {
          type: 'object' as const,
          properties: {
            date: { type: 'string', description: 'Date in YYYY-MM-DD format' },
            timeZone: { type: 'string', description: 'IANA timezone. Defaults to Europe/Berlin.' },
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
        description: 'Book an appointment on the calendar.',
        parameters: {
          type: 'object' as const,
          properties: {
            date: { type: 'string', description: 'Date in YYYY-MM-DD format' },
            time: { type: 'string', description: 'Time in HH:MM AM/PM or 24-hour format' },
            callerName: { type: 'string', description: "Caller's full name (required)" },
            callerPhone: { type: 'string', description: "Caller's phone number (optional)" },
            callerEmail: { type: 'string', description: "Caller's email (optional)" },
            summary: { type: 'string', description: 'Brief description (optional)' },
            timeZone: { type: 'string', description: 'IANA timezone. Defaults to Europe/Berlin.' },
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

  console.log(`Refreshed assistant ${assistantId} with current date`);

  return {
    id: assistant.id,
    name: assistant.name ?? '',
    createdAt: assistant.createdAt ?? new Date().toISOString(),
    updatedAt: assistant.updatedAt ?? new Date().toISOString(),
  };
}
