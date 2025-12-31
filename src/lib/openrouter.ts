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

  const systemPrompt = `Du bist Experte für die Erstellung von Inhalten für KI-Sprachassistenten, die Telefonanrufe für kleine Unternehmen in Deutschland bearbeiten. Generiere herzliche, hilfsbereite und professionelle Inhalte auf Deutsch.

TONFALL - HERZLICH, NICHT FÖRMLICH:
Der Ton soll "herzlich" (warm, einladend) sein, NICHT "förmlich" (steif, bürokratisch).

Beispiele für HERZLICHEN Ton (so soll es klingen):
- "Gerne helfe ich Ihnen weiter!"
- "Das freut mich, dass Sie anrufen!"
- "Selbstverständlich, bei uns können Sie..."
- "Wunderbar, da kann ich Ihnen sagen..."

Beispiele für ZU FÖRMLICHEN Ton (so NICHT):
- "Wir bitten Sie zur Kenntnis zu nehmen, dass..."
- "Es wird darauf hingewiesen, dass..."
- "Gemäß unseren Richtlinien..."
- "Hiermit teilen wir Ihnen mit..."

WICHTIGE REGELN:
- Alle Inhalte auf Deutsch
- Verwende die formelle Sie-Form (niemals "du")
- Schreibe so, wie es natürlich und warm am Telefon klingt
- Antworte als ob du persönlich am Telefon hilfst

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

TONFALL: Herzlich und einladend, aber professionell. Nicht steif oder bürokratisch.

WICHTIG - BRANCHENSPEZIFISCHE FAQs:
Analysiere den Unternehmenstyp aus der Beschreibung und den Dienstleistungen und generiere passende FAQs:

- Restaurant/Gastro: Reservierungen, Speisekarte, Allergien/Unverträglichkeiten, Parkmöglichkeiten, Gruppengrößen
- Friseur/Salon: Terminvereinbarung, Preise, Wartezeit ohne Termin, Produkte, Beratung
- Arztpraxis/Klinik: Terminvereinbarung, Wartezeit, mitzubringende Unterlagen, Rezepte, Überweisungen
- Handwerker: Anfahrtskosten, Kostenvoranschlag, Dauer, Notdienst, Garantie
- Allgemein/Sonstige: Öffnungszeiten, Standort/Anfahrt, Preise, Kontaktmöglichkeiten, Dienstleistungsumfang

Generiere:
1. **5 FAQs**: Branchenspezifische Fragen, die Anrufer zu DIESEM Unternehmenstyp typischerweise stellen.
   - Antworten sollen herzlich und gesprächsnah sein
   - Starte Antworten mit freundlichen Phrasen wie "Gerne!", "Selbstverständlich!", "Das freut mich!"
   - Schreibe so, als würdest du persönlich am Telefon helfen

2. **Policies (Richtlinien)**: Ein kurzer, freundlich formulierter Absatz über typische Geschäftsrichtlinien.

3. **Greeting (Begrüßung)**:
   - Verwende {businessName} als Platzhalter
   - Soll warm und einladend klingen, nicht wie ein Anrufbeantworter
   - Beispiel herzlich: "{businessName}, guten Tag! Schön, dass Sie anrufen. Wie kann ich Ihnen helfen?"
   - NICHT so: "Sie haben {businessName} erreicht. Bitte nennen Sie Ihr Anliegen."

4. **End Call Message (Verabschiedung)**:
   - Soll herzlich und persönlich klingen
   - Beispiel: "Vielen Dank für Ihren Anruf! Ich wünsche Ihnen noch einen wunderbaren Tag."
   - NICHT so: "Der Anruf wird hiermit beendet. Auf Wiederhören."

Alle Inhalte müssen natürlich klingen, wenn sie laut am Telefon gesprochen werden. Sie-Form verwenden, aber warmherzig und einladend.`;

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

  const systemPrompt = `Du bist Experte für die Erstellung von herzlichen Begrüßungen für KI-Sprachassistenten in Deutschland.

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

Firmenname: ${businessName}
Assistentenname: ${agentName}
Beschreibung: ${businessDescription}
Dienstleistungen: ${servicesText}

BEGRÜSSUNG:
- Verwende {businessName} als Platzhalter für den Firmennamen
- Erwähne den Namen des Assistenten (${agentName})
- Soll herzlich und einladend klingen, wie ein freundlicher Mensch am Telefon
- Beispiel herzlich: "{businessName}, guten Tag! Hier spricht ${agentName}. Schön, dass Sie anrufen! Wie kann ich Ihnen helfen?"
- NICHT so: "Sie haben {businessName} erreicht. Mein Name ist ${agentName}. Bitte nennen Sie Ihr Anliegen."

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
    };
  } catch {
    throw new Error('Failed to parse AI-generated greeting');
  }
}
