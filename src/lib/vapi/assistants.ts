import { getVapiClient } from './client';
import type { CreateAssistantConfig, UpdateAssistantConfig, VapiAssistantResponse } from './types';
import { buildSystemPrompt, buildCalendarTools } from '@/lib/prompts';

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

  // Build calendar tools if Google is connected
  const tools = hasCalendarTools ? buildCalendarTools(serverUrl) : undefined;

  // Build system prompt using consolidated module
  const systemPrompt = buildSystemPrompt({
    businessName: config.businessName,
    businessHours: config.businessHours,
    services: config.services,
    faqs: config.faqs,
    hasGoogleCalendar: hasCalendarTools,
  });

  const assistantConfig: any = {
    name: config.name,
    firstMessage: greeting,
    model: {
      provider: 'openai',
      model: 'gpt-4o',
      messages: [{ role: 'system', content: systemPrompt }],
      ...(tools && { tools }),
    },
    voice: {
      provider: '11labs',
      voiceId: config.voiceId ?? 'EXAVITQu4vr4xnSDxMaL', // Sarah default
      model: 'eleven_turbo_v2_5',
      language: 'de',
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
      provider: '11labs',
      voiceId: config.voiceId,
      model: 'eleven_turbo_v2_5',
      language: 'de',
    };
  }

  // If any business info changed, rebuild system prompt
  if (config.businessName || config.businessHours || config.services || config.faqs) {
    // We need full config to rebuild prompt - this would require fetching current config
    // For now, only update if all required fields are provided
    if (config.businessName && config.businessHours && config.services && config.faqs) {
      const hasCalendarTools = config.hasGoogleCalendar ?? false;
      const systemPrompt = buildSystemPrompt({
        businessName: config.businessName,
        businessHours: config.businessHours,
        services: config.services,
        faqs: config.faqs,
        hasGoogleCalendar: hasCalendarTools,
      });
      updatePayload.model = {
        provider: 'openai',
        model: 'gpt-4o',
        messages: [{ role: 'system', content: systemPrompt }],
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

  // Build tools using consolidated module
  const tools = hasCalendarTools ? buildCalendarTools(serverUrl) : undefined;

  // Build system prompt using consolidated module
  const systemPrompt = buildSystemPrompt({
    businessName: config.businessName,
    businessHours: config.businessHours,
    services: config.services,
    faqs: config.faqs,
    hasGoogleCalendar: hasCalendarTools,
  });

  const assistant = await client.assistants.update({
    id: assistantId,
    model: {
      provider: 'openai',
      model: 'gpt-4o',
      messages: [{ role: 'system', content: systemPrompt }],
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
