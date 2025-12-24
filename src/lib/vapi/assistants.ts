import { getVapiClient } from './client';
import type { CreateAssistantConfig, UpdateAssistantConfig, VapiAssistantResponse } from './types';

/**
 * Build a system prompt from business configuration
 */
function buildSystemPrompt(config: CreateAssistantConfig): string {
  const faqSection = config.faqs.length > 0
    ? `## Frequently Asked Questions\n${config.faqs.map(faq => `Q: ${faq.question}\nA: ${faq.answer}`).join('\n\n')}`
    : '';

  return `You are an AI assistant for ${config.businessName}.

## Business Information
- Business Name: ${config.businessName}
- Hours: ${config.businessHours}
- Services: ${config.services.join(', ')}

${faqSection}

## Guidelines
- Be friendly, professional, and concise
- Answer questions about the business accurately using the information above
- If you don't know something or it's outside your knowledge, politely say you'll have someone get back to them
- Keep responses brief and natural for voice conversation
- If the caller wants to book an appointment, collect their name, preferred date/time, and reason for visit`;
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

  const assistant = await client.assistants.create({
    name: config.name,
    firstMessage: greeting,
    model: {
      provider: 'openai',
      model: 'gpt-4o',
      messages: [{ role: 'system', content: buildSystemPrompt(config) }],
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
  });

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
      updatePayload.model = {
        provider: 'openai',
        model: 'gpt-4o',
        messages: [{ role: 'system', content: buildSystemPrompt(config as CreateAssistantConfig) }],
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
