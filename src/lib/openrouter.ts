import { WizardState } from '@/types/wizard';
import {
  detectBusinessType,
  getBusinessTypeContext,
  getBusinessTypeDisplayName,
  type BusinessType,
} from '@/lib/prompts';

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
  faqs: { question: string; answer: string; category?: string }[];
  policies: string;
  greeting: string;
  endCallMessage: string;
  detectedBusinessType?: BusinessType;
}

/**
 * Build context-aware system prompt for FAQ generation
 * Uses centralized business type detection for consistency
 */
function buildFAQGenerationPrompt(businessType: BusinessType): string {
  const context = getBusinessTypeContext(businessType);
  const displayName = getBusinessTypeDisplayName(businessType);

  return `Du bist Experte für die Erstellung von Inhalten für KI-Sprachassistenten, die Telefonanrufe für kleine Unternehmen in Deutschland bearbeiten.

ERKANNTE BRANCHE: ${displayName}

TYPISCHE ANFRAGEN IN DIESER BRANCHE:
${context.typicalQueries.map((q) => `- ${q}`).join('\n')}

HAUPTAUFGABEN DES ASSISTENTEN:
${context.keyResponsibilities.map((r) => `- ${r}`).join('\n')}

EMPFOHLENER TONFALL: ${context.suggestedTone}

TONFALL - HERZLICH, NICHT FÖRMLICH:
Beispiele für HERZLICHEN Ton (so soll es klingen):
- "Gerne helfe ich Ihnen weiter!"
- "Das freut mich, dass Sie anrufen!"
- "Selbstverständlich, bei uns können Sie..."
- "Wunderbar, da kann ich Ihnen sagen..."

Beispiele für ZU FÖRMLICHEN Ton (so NICHT):
- "Wir bitten Sie zur Kenntnis zu nehmen, dass..."
- "Gemäß unseren Richtlinien..."

WICHTIGE REGELN:
- Alle Inhalte auf Deutsch mit Sie-Form
- Schreibe so, wie es natürlich am Telefon klingt
- FAQs müssen spezifisch für die erkannte Branche sein
- Antworten kurz und praezise (2-3 Saetze maximal)

Antworte mit gültigem JSON:
{
  "faqs": [
    { "question": "...", "answer": "...", "category": "..." },
    { "question": "...", "answer": "...", "category": "..." },
    { "question": "...", "answer": "...", "category": "..." },
    { "question": "...", "answer": "...", "category": "..." },
    { "question": "...", "answer": "...", "category": "..." }
  ],
  "policies": "...",
  "greeting": "...",
  "endCallMessage": "..."
}`;
}

export async function generateWizardContent(
  businessInfo: WizardState['businessInfo']
): Promise<GeneratedContent> {
  const { businessName, businessDescription, businessHours, services } = businessInfo;

  const servicesText = services.filter(s => s.trim()).join(', ') || 'general services';

  // Use centralized business type detection for consistency
  const detectedType = detectBusinessType(businessName, businessDescription, services);
  const typeContext = getBusinessTypeContext(detectedType);
  const displayName = getBusinessTypeDisplayName(detectedType);

  // Build context-aware system prompt
  const systemPrompt = buildFAQGenerationPrompt(detectedType);

  // Build enhanced user prompt with business-specific examples
  const userPrompt = `Generiere Inhalte für einen KI-Sprachassistenten:

UNTERNEHMENSDATEN:
- Firmenname: ${businessName}
- Beschreibung: ${businessDescription || 'Keine Beschreibung angegeben'}
- Öffnungszeiten: ${businessHours || 'Nicht angegeben'}
- Dienstleistungen: ${servicesText}

ERKANNTE BRANCHE: ${displayName}

AUFGABE:
Generiere 5 FAQs, die SPEZIFISCH für diese Branche sind und typische Kundenanfragen abdecken:
${typeContext.typicalQueries.map((q, i) => `${i + 1}. ${q}`).join('\n')}

FAQ-KATEGORIEN für diese Branche:
- Termine/Verfuegbarkeit
- Preise/Kosten
- Ablauf/Dauer
- Sonstiges

QUALITAETSKRITERIEN FÜR DIE FAQs:
1. Fragen muessen natuerlich klingen (so wie Kunden wirklich fragen)
2. Antworten muessen spezifisch und hilfreich sein
3. Antworten muessen zum Unternehmen passen
4. Herzlicher, freundlicher Ton mit "Gerne!", "Selbstverstaendlich!", "Natuerlich!"
5. Kurz und praezise (2-3 Saetze)

RICHTLINIEN:
Erstelle kurze, klare Richtlinien fuer das Unternehmen (Stornierung, Bezahlung, etc.)

BEGRUESSUNG:
- Verwende {{businessName}} als Platzhalter fuer den Firmennamen
- Herzlich und einladend, nicht "Sie haben X erreicht"
- Beispiel: "{{businessName}}, guten Tag! Schoen, dass Sie anrufen. Wie kann ich Ihnen helfen?"

VERABSCHIEDUNG:
- Warmherzig und persoenlich
- Beispiel: "Vielen herzlichen Dank fuer Ihren Anruf! Ich wuensche Ihnen noch einen wunderschoenen Tag."`;

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

    // Add detected business type to response
    return {
      ...parsed,
      detectedBusinessType: detectedType,
    };
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
): Promise<{ greeting: string; endCallMessage: string; detectedBusinessType?: BusinessType }> {
  const { businessName, businessDescription, services } = businessInfo;
  const servicesText = services.filter(s => s.trim()).join(', ') || 'general services';

  // Use centralized business type detection
  const detectedType = detectBusinessType(businessName, businessDescription, services);
  const typeContext = getBusinessTypeContext(detectedType);
  const displayName = getBusinessTypeDisplayName(detectedType);

  const systemPrompt = `Du bist Experte für die Erstellung von herzlichen Begrüßungen für KI-Sprachassistenten in Deutschland.

ERKANNTE BRANCHE: ${displayName}
EMPFOHLENER TONFALL: ${typeContext.suggestedTone}

TONFALL - HERZLICH, NICHT FÖRMLICH:
Der Ton soll "herzlich" (warm, einladend) sein, NICHT "förmlich" (steif, bürokratisch).

Beispiele für HERZLICHEN Ton:
- "Schön, dass Sie anrufen!"
- "Gerne helfe ich Ihnen!"
- "Wunderbar, wie kann ich Ihnen heute helfen?"

Beispiele für ZU FÖRMLICHEN Ton (NICHT so):
- "Sie haben ... erreicht. Nennen Sie Ihr Anliegen."
- "Hiermit begrüße ich Sie..."
- "Der Anruf wird entgegengenommen."

Antworte immer mit gültigem JSON:
{
  "greeting": "...",
  "endCallMessage": "..."
}`;

  const userPrompt = `Generiere eine herzliche Begrüßung und Verabschiedung für einen KI-Sprachassistenten:

UNTERNEHMENSDATEN:
- Firmenname: ${businessName}
- Assistentenname: ${agentName}
- Beschreibung: ${businessDescription || 'Keine Beschreibung angegeben'}
- Dienstleistungen: ${servicesText}
- Branche: ${displayName}

BEGRÜSSUNG:
- Verwende {{businessName}} als Platzhalter für den Firmennamen
- Erwähne den Namen des Assistenten (${agentName})
- Soll herzlich und einladend klingen, wie ein freundlicher Mensch am Telefon
- Passe den Ton an die Branche an (${typeContext.suggestedTone})
- Beispiel herzlich: "{{businessName}}, guten Tag! Hier spricht ${agentName}. Schön, dass Sie anrufen! Wie kann ich Ihnen helfen?"
- NICHT so: "Sie haben {{businessName}} erreicht. Mein Name ist ${agentName}. Bitte nennen Sie Ihr Anliegen."

VERABSCHIEDUNG:
- Soll persönlich und warmherzig klingen
- Dem Anrufer herzlich danken
- Beispiel: "Vielen herzlichen Dank für Ihren Anruf! Ich wünsche Ihnen noch einen wunderschönen Tag. Bis bald!"
- NICHT so: "Vielen Dank. Der Anruf wird beendet. Auf Wiederhören."

Verwende die Sie-Form, aber schreibe so, dass es natürlich und warm klingt wenn laut gesprochen.`;

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
      detectedBusinessType: detectedType,
    };
  } catch {
    throw new Error('Failed to parse AI-generated greeting');
  }
}
