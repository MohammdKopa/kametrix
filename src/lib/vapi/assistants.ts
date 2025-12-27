import { getVapiClient } from './client';
import type { CreateAssistantConfig, UpdateAssistantConfig, VapiAssistantResponse } from './types';

/**
 * Build a system prompt from business configuration
 */
function buildSystemPrompt(config: CreateAssistantConfig, hasCalendarTools: boolean): string {
  const faqSection = config.faqs.length > 0
    ? `## Frequently Asked Questions\n${config.faqs.map(faq => `Q: ${faq.question}\nA: ${faq.answer}`).join('\n\n')}`
    : '';

  // NOTE: Current date is dynamically prepended by the webhook handler at call time
  // Do NOT embed static dates here - they become stale

  const calendarSection = hasCalendarTools
    ? `\n\n## Calendar Capabilities
- You can check calendar availability using the check_availability tool
- You can book appointments using the book_appointment tool
- When booking, collect: date, time, caller name (required), phone number (optional), email (optional)
- Always confirm the details before booking
- Use the current date provided at the start of this prompt for date calculations`
    : '';

  return `You are an AI assistant for ${config.businessName}.

## Business Information
- Business Name: ${config.businessName}
- Hours: ${config.businessHours}
- Services: ${config.services.join(', ')}

${faqSection}${calendarSection}

## Guidelines
- Be friendly, professional, and concise
- Answer questions about the business accurately using the information above
- If you don't know something or it's outside your knowledge, politely say you'll have someone get back to them
- Keep responses brief and natural for voice conversation${hasCalendarTools ? '\n- When handling appointments, use your calendar tools to check availability and book time slots' : '\n- If the caller wants to book an appointment, collect their name, preferred date/time, and reason for visit'}`;
}

/**
 * Create a new business assistant in Vapi
 */
export async function createBusinessAssistant(
  config: CreateAssistantConfig
): Promise<VapiAssistantResponse> {
  const client = getVapiClient();

  const greeting = config.greeting ??
    `Hello! Thank you for calling ${config.businessName}. How can I help you today?`;

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
      provider: '11labs',
      voiceId: config.voiceId ?? 'marissa',
    },
    transcriber: {
      provider: 'deepgram',
      model: 'nova-2',
      language: 'en',
    },
    maxDurationSeconds: 600, // 10 minute max call
    endCallMessage: 'Thank you for calling. Have a great day!',
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
      provider: '11labs',
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
