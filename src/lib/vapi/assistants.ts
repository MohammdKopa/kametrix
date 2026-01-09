import { getVapiClient } from './client';
import type { CreateAssistantConfig, UpdateAssistantConfig, VapiAssistantResponse, DeletionResult } from './types';
import { buildSystemPrompt, buildCalendarTools } from '@/lib/prompts';
import { buildEscalationTools } from '@/lib/escalation';

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

  // Build tools - ESCALATION TOOLS FIRST for priority, then calendar tools
  // Escalation tools are always included so the AI can recognize human transfer requests
  const escalationTools = buildEscalationTools(serverUrl);
  const calendarTools = hasCalendarTools ? buildCalendarTools(serverUrl) : [];

  // Combine tools with escalation FIRST (so AI prioritizes them when user asks for human)
  const allTools = [...escalationTools, ...calendarTools];
  const tools = allTools.length > 0 ? allTools : undefined;

  console.log(`Building assistant with tools: ${allTools.map(t => t.function.name).join(', ')}`);

  // Build system prompt using consolidated module
  // hasEscalation is always true since we always include escalation tools
  const systemPrompt = buildSystemPrompt({
    businessName: config.businessName,
    businessHours: config.businessHours,
    services: config.services,
    faqs: config.faqs,
    hasGoogleCalendar: hasCalendarTools,
    hasEscalation: true,
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

  console.log(`Created assistant ${assistant.id} with tools: ${allTools.map(t => t.function.name).join(', ') || 'none'}`);

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
      const serverUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

      // Build tools - ESCALATION TOOLS FIRST for priority, then calendar tools
      const escalationTools = buildEscalationTools(serverUrl);
      const calendarTools = hasCalendarTools ? buildCalendarTools(serverUrl) : [];
      const allTools = [...escalationTools, ...calendarTools];

      const systemPrompt = buildSystemPrompt({
        businessName: config.businessName,
        businessHours: config.businessHours,
        services: config.services,
        faqs: config.faqs,
        hasGoogleCalendar: hasCalendarTools,
        hasEscalation: true,
      });
      updatePayload.model = {
        provider: 'openai',
        model: 'gpt-4o',
        messages: [{ role: 'system', content: systemPrompt }],
        tools: allTools.length > 0 ? allTools : undefined,
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
 * Gracefully delete an assistant from Vapi
 * Handles cases where the assistant may already be deleted
 */
export async function deleteAssistantGracefully(assistantId: string): Promise<DeletionResult> {
  const client = getVapiClient();
  try {
    await client.assistants.delete({ id: assistantId });
    return { success: true, alreadyDeleted: false };
  } catch (error) {
    // Check if the error indicates the assistant doesn't exist
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorString = String(error).toLowerCase();

    // Handle "not found" errors gracefully - treat as already deleted
    if (
      errorString.includes('not found') ||
      errorString.includes('assistant not found') ||
      errorString.includes('404') ||
      (error && typeof error === 'object' && 'status' in error && (error as any).status === 404)
    ) {
      console.log(`Assistant ${assistantId} already deleted or not found in Vapi`);
      return { success: true, alreadyDeleted: true };
    }

    // Re-throw other errors
    console.error('Failed to delete Vapi assistant:', error);
    return { success: false, alreadyDeleted: false, error: errorMessage };
  }
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

  // Build tools - ESCALATION TOOLS FIRST for priority, then calendar tools
  const escalationTools = buildEscalationTools(serverUrl);
  const calendarTools = hasCalendarTools ? buildCalendarTools(serverUrl) : [];

  // Combine tools with escalation FIRST
  const allTools = [...escalationTools, ...calendarTools];
  const tools = allTools.length > 0 ? allTools : undefined;

  // Build system prompt using consolidated module
  const systemPrompt = buildSystemPrompt({
    businessName: config.businessName,
    businessHours: config.businessHours,
    services: config.services,
    faqs: config.faqs,
    hasGoogleCalendar: hasCalendarTools,
    hasEscalation: true,
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

  console.log(`Refreshed assistant ${assistantId} with tools: ${allTools.map(t => t.function.name).join(', ') || 'none'}`);

  return {
    id: assistant.id,
    name: assistant.name ?? '',
    createdAt: assistant.createdAt ?? new Date().toISOString(),
    updatedAt: assistant.updatedAt ?? new Date().toISOString(),
  };
}
