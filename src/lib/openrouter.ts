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

  const systemPrompt = `Du bist Experte für die Erstellung von Inhalten für KI-Sprachassistenten, die Telefonanrufe für kleine Unternehmen bearbeiten. Generiere hilfreiche, professionelle und freundliche Inhalte auf Deutsch.

WICHTIG:
- Alle Inhalte müssen auf Deutsch sein
- Verwende die formelle Sie-Form (niemals "du")
- Schreibe so, wie es natürlich am Telefon gesprochen wird

Antworte immer mit gültigem JSON in genau diesem Format:
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

  const userPrompt = `Generiere Inhalte für einen KI-Sprachassistenten für dieses Unternehmen:

Firmenname: ${businessName}
Beschreibung: ${businessDescription}
Öffnungszeiten: ${businessHours}
Dienstleistungen: ${servicesText}

Generiere:
1. **5 FAQs**: Häufige Fragen, die Anrufer zu diesem Unternehmen stellen könnten. Schließe Fragen zu Öffnungszeiten, Dienstleistungen, Preisen und Standort ein. Die Antworten sollen gesprächsnah und hilfreich sein (geeignet zum Vorlesen am Telefon).

2. **Policies (Richtlinien)**: Ein kurzer Absatz über typische Geschäftsrichtlinien (Stornierung, Rückerstattung, Buchungsanforderungen). Kurz und professionell halten.

3. **Greeting (Begrüßung)**: Das Erste, was der Assistent beim Annehmen sagt. Verwende {businessName} als Platzhalter. Soll warm, professionell sein und den Firmennamen erwähnen. Beispiel: "${businessName}, guten Tag! Wie kann ich Ihnen behilflich sein?"

4. **End Call Message (Verabschiedung)**: Was der Assistent zum Abschluss des Gesprächs sagt. Soll dem Anrufer danken.

Alle Inhalte sollen natürlich klingen, wenn sie am Telefon gesprochen werden - keine zu formelle oder schriftliche Sprache. Verwende die Sie-Form.`;

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

  const systemPrompt = `Du bist Experte für die Erstellung von Begrüßungen für KI-Sprachassistenten. Generiere warme, professionelle Begrüßungen auf Deutsch mit Sie-Form.

Antworte immer mit gültigem JSON:
{
  "greeting": "...",
  "endCallMessage": "..."
}`;

  const userPrompt = `Generiere eine Begrüßung und Verabschiedung für einen KI-Sprachassistenten:

Firmenname: ${businessName}
Assistentenname: ${agentName}
Beschreibung: ${businessDescription}
Dienstleistungen: ${servicesText}

Die Begrüßung soll:
- {businessName} als Platzhalter für den Firmennamen verwenden
- Den Namen des Assistenten (${agentName}) erwähnen
- Warm und einladend sein
- Fragen, wie der Assistent helfen kann
- Die formelle Sie-Form verwenden

Die Verabschiedung soll:
- Dem Anrufer danken
- Professionell und freundlich sein
- Auf Deutsch mit Sie-Form sein`;

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
