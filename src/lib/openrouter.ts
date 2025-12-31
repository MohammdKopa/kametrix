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

  const systemPrompt = `Du bist Experte für die Erstellung von Inhalten für KI-Sprachassistenten, die Telefonanrufe für kleine Unternehmen in Deutschland bearbeiten.

SCHRITT 1 - BRANCHENERKENNUNG:
Analysiere zuerst den Unternehmenstyp anhand von Schlüsselwörtern:

GASTRONOMIE erkennen an: Restaurant, Ristorante, Pizzeria, Bistro, Café, Kaffee, Bäckerei, Konditorei, Bar, Kneipe, Imbiss, Döner, Sushi, Küche, Speisen, Essen, Koch, kulinarisch, Gasthaus, Wirtshaus, Trattoria
→ FAQs über: Reservierung, Tischverfügbarkeit, Speisekarte, Allergien, vegetarisch/vegan, Lieferung, Parken, Gruppenreservierung, Kindermenü, Mittagstisch

FRISEUR/KOSMETIK erkennen an: Friseur, Salon, Haare, Schnitt, Färben, Styling, Kosmetik, Nagel, Maniküre, Pediküre, Wellness, Spa, Massage, Beauty, Pflege, Frisör
→ FAQs über: Terminvereinbarung, Wartezeit ohne Termin, Preisliste, Dauer der Behandlung, Beratung, Produkte, Parken, Absage/Umbuchung

MEDIZIN/GESUNDHEIT erkennen an: Arzt, Praxis, Klinik, Zahnarzt, Orthopäde, Physiotherapie, Heilpraktiker, Therapeut, Psychologe, Apotheke, medizinisch, Gesundheit, Patient, Behandlung
→ FAQs über: Terminvereinbarung, Wartezeit, mitzubringende Unterlagen, Rezeptbestellung, Überweisung, Notfälle, Privatpatienten/Kassen, Parkplätze

HANDWERK erkennen an: Handwerker, Elektriker, Klempner, Sanitär, Heizung, Maler, Schreiner, Tischler, Dachdecker, Installateur, Reparatur, Montage, Renovierung, Bauarbeiten
→ FAQs über: Kostenvoranschlag, Anfahrtskosten, Terminvereinbarung, Notdienst, Dauer, Garantie, Zahlungsmöglichkeiten

EINZELHANDEL erkennen an: Laden, Shop, Geschäft, Boutique, Kaufen, Verkauf, Produkte, Waren, Sortiment, Bestellung
→ FAQs über: Öffnungszeiten, Verfügbarkeit, Bestellung, Lieferung, Umtausch, Rückgabe, Parken

DIENSTLEISTUNG (Allgemein): Beratung, Service, Agentur, Büro, Versicherung, Steuerberater, Rechtsanwalt, IT
→ FAQs über: Terminvereinbarung, Leistungsumfang, Preise/Kosten, Erstberatung, Erreichbarkeit

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

Antworte mit gültigem JSON:
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

  const userPrompt = `Generiere Inhalte für einen KI-Sprachassistenten:

UNTERNEHMENSDATEN:
- Firmenname: ${businessName}
- Beschreibung: ${businessDescription}
- Öffnungszeiten: ${businessHours}
- Dienstleistungen: ${servicesText}

AUFGABE:
1. Erkenne zuerst die Branche aus Name, Beschreibung und Dienstleistungen
2. Generiere 5 FAQs, die SPEZIFISCH für diese Branche sind

BEISPIELE FÜR BRANCHENSPEZIFISCHE FAQs:

Wenn RESTAURANT/GASTRO erkannt:
- "Kann ich bei Ihnen einen Tisch reservieren?" → "Gerne! Für wie viele Personen und wann möchten Sie kommen?"
- "Haben Sie vegetarische Gerichte?" → "Selbstverständlich! Wir haben eine schöne Auswahl..."
- "Kann man bei Ihnen auch bestellen und abholen?" → "Ja, das geht! Sie können telefonisch bestellen..."
- "Haben Sie Parkmöglichkeiten?" → "..."
- "Gibt es ein Mittagsmenü?" → "..."

Wenn FRISEUR/SALON erkannt:
- "Kann ich einen Termin vereinbaren?" → "Gerne! Wann würde es Ihnen passen?"
- "Was kostet ein Haarschnitt bei Ihnen?" → "Das hängt von der Behandlung ab..."
- "Muss ich vorher einen Termin machen oder kann ich auch spontan kommen?" → "..."
- "Wie lange dauert eine Färbung?" → "..."
- "Verkaufen Sie auch Haarpflegeprodukte?" → "..."

Wenn ARZTPRAXIS erkannt:
- "Ich brauche einen Termin, wann haben Sie frei?" → "Gerne schaue ich nach. Ist es dringend?"
- "Brauche ich eine Überweisung?" → "..."
- "Kann ich ein Rezept abholen?" → "..."
- "Was muss ich zum Termin mitbringen?" → "..."
- "Behandeln Sie auch Privatpatienten?" → "..."

Wenn HANDWERKER erkannt:
- "Können Sie vorbeikommen für einen Kostenvoranschlag?" → "Gerne! Worum geht es?"
- "Was kostet bei Ihnen die Anfahrt?" → "..."
- "Haben Sie auch einen Notdienst?" → "..."
- "Wie schnell können Sie kommen?" → "..."
- "Geben Sie Garantie auf Ihre Arbeit?" → "..."

WICHTIG:
- FAQs müssen zur erkannten Branche passen, NICHT generisch sein
- Antworten herzlich formulieren, mit "Gerne!", "Selbstverständlich!", "Natürlich!"
- Konkrete, hilfreiche Antworten basierend auf den Unternehmensdaten

GREETING: Verwende {businessName} als Platzhalter. Herzlich, nicht "Sie haben X erreicht."
VERABSCHIEDUNG: Warmherzig, nicht "Der Anruf wird beendet."`;

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
