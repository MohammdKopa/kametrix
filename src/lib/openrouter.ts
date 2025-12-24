import { WizardState } from '@/types/wizard';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

async function callOpenRouter(messages: OpenRouterMessage[], model = 'openai/gpt-4o-mini'): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY not configured');
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'Kametrix',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${error}`);
  }

  const data: OpenRouterResponse = await response.json();
  return data.choices[0]?.message?.content || '';
}

export interface GeneratedContent {
  faqs: { question: string; answer: string }[];
  policies: string;
  greeting: string;
  endCallMessage: string;
}

export async function generateWizardContent(
  businessInfo: WizardState['businessInfo']
): Promise<GeneratedContent> {
  const { businessName, businessDescription, businessHours, services } = businessInfo;

  const servicesText = services.filter(s => s.trim()).join(', ') || 'general services';

  const systemPrompt = `You are an expert at creating content for AI voice agents that handle phone calls for small businesses. Generate helpful, professional, and friendly content.

Always respond with valid JSON in this exact format:
{
  "faqs": [
    { "question": "...", "answer": "..." },
    { "question": "...", "answer": "..." },
    { "question": "...", "answer": "..." },
    { "question": "...", "answer": "..." },
    { "question": "...", "answer": "..." }
  ],
  "policies": "...",
  "greeting": "...",
  "endCallMessage": "..."
}`;

  const userPrompt = `Generate content for an AI voice agent for this business:

Business Name: ${businessName}
Description: ${businessDescription}
Business Hours: ${businessHours}
Services Offered: ${servicesText}

Generate:
1. **5 FAQs**: Common questions callers might ask about this business. Include questions about hours, services, pricing, and location. Answers should be conversational and helpful (suitable for speaking aloud).

2. **Policies**: A brief paragraph covering typical business policies (cancellation, refunds, booking requirements). Keep it concise and professional.

3. **Greeting**: The first thing the agent says when answering. Use {businessName} as a placeholder. Should be warm, professional, and mention the business name. Example: "Hello, thank you for calling {businessName}! My name is [agent name]. How can I help you today?"

4. **End Call Message**: What the agent says when ending the call. Should thank the caller and invite them back.

Make all content sound natural when spoken aloud - avoid overly formal or written language.`;

  const content = await callOpenRouter([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]);

  // Parse the JSON response
  try {
    // Extract JSON from the response (in case there's extra text)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]) as GeneratedContent;

    // Validate structure
    if (!Array.isArray(parsed.faqs) || !parsed.policies || !parsed.greeting || !parsed.endCallMessage) {
      throw new Error('Invalid response structure');
    }

    return parsed;
  } catch (parseError) {
    console.error('Failed to parse AI response:', content);
    throw new Error('Failed to parse AI-generated content');
  }
}

export async function generateFAQsOnly(
  businessInfo: WizardState['businessInfo']
): Promise<{ question: string; answer: string }[]> {
  const content = await generateWizardContent(businessInfo);
  return content.faqs;
}

export async function generateGreetingOnly(
  businessInfo: WizardState['businessInfo'],
  agentName: string
): Promise<{ greeting: string; endCallMessage: string }> {
  const { businessName, businessDescription, services } = businessInfo;
  const servicesText = services.filter(s => s.trim()).join(', ') || 'general services';

  const systemPrompt = `You are an expert at creating greetings for AI voice agents. Generate warm, professional greetings.

Always respond with valid JSON:
{
  "greeting": "...",
  "endCallMessage": "..."
}`;

  const userPrompt = `Generate a greeting and end call message for an AI voice agent:

Business Name: ${businessName}
Agent Name: ${agentName}
Description: ${businessDescription}
Services: ${servicesText}

The greeting should:
- Use {businessName} as a placeholder for the business name
- Mention the agent's name (${agentName})
- Be warm and inviting
- Ask how the agent can help

The end call message should:
- Thank the caller
- Mention the business name
- Invite them to call again`;

  const content = await callOpenRouter([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]);

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found');

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      greeting: parsed.greeting || '',
      endCallMessage: parsed.endCallMessage || '',
    };
  } catch {
    throw new Error('Failed to parse AI-generated greeting');
  }
}
