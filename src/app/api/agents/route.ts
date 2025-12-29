import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';
import { createBusinessAssistant, deleteAssistant } from '@/lib/vapi';
import type { WizardState } from '@/types/wizard';

/**
 * GET /api/agents - List all agents for authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const agents = await prisma.agent.findMany({
      where: {
        userId: user.id,
      },
      include: {
        phoneNumber: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ agents });
  } catch (error) {
    console.error('Error fetching agents:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch agents' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/agents - Create a new agent
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();

    // Check if this is wizard data (new format) or legacy format
    const isWizardData = 'businessInfo' in body;

    if (isWizardData) {
      // New wizard-based creation
      const wizardData = body as WizardState;

      // Validate required wizard fields
      if (!wizardData.businessInfo?.businessName) {
        return NextResponse.json(
          { error: 'Business name is required' },
          { status: 400 }
        );
      }

      if (!wizardData.greeting?.agentName) {
        return NextResponse.json(
          { error: 'Agent name is required' },
          { status: 400 }
        );
      }

      // Filter out empty FAQs (both question and answer must be filled)
      const validFaqs = wizardData.knowledge.faqs.filter(
        (faq) => faq.question.trim() && faq.answer.trim()
      );

      // Filter out empty services
      const validServices = wizardData.businessInfo.services.filter((s) => s.trim());

      // Check if user has Google Calendar connected
      const userWithGoogle = await prisma.user.findUnique({
        where: { id: user.id },
        select: { googleRefreshToken: true },
      });

      const hasGoogleCalendar = !!userWithGoogle?.googleRefreshToken;

      let vapiAssistantId: string | null = null;

      try {
        // Create Vapi assistant
        const vapiResponse = await createBusinessAssistant({
          name: wizardData.greeting.agentName,
          businessName: wizardData.businessInfo.businessName,
          businessHours: wizardData.businessInfo.businessHours,
          services: validServices,
          faqs: validFaqs,
          voiceId: wizardData.voice.voiceId,
          greeting: wizardData.greeting.greeting.replace(
            /{businessName}/g,
            wizardData.businessInfo.businessName
          ),
          hasGoogleCalendar,
        });

        vapiAssistantId = vapiResponse.id;
      } catch (vapiError) {
        console.error('Error creating Vapi assistant:', vapiError);
        return NextResponse.json(
          { error: 'Failed to create Vapi assistant. Please check your VAPI_API_KEY.' },
          { status: 502 }
        );
      }

      // Build system prompt from wizard data (includes Vapi dynamic date variables if calendar enabled)
      const systemPrompt = buildSystemPrompt({
        businessName: wizardData.businessInfo.businessName,
        businessDescription: wizardData.businessInfo.businessDescription,
        businessHours: wizardData.businessInfo.businessHours,
        services: validServices,
        faqs: validFaqs,
        policies: wizardData.knowledge.policies,
        hasGoogleCalendar,
      });

      try {
        // Create agent in database
        const agent = await prisma.agent.create({
          data: {
            userId: user.id,
            name: wizardData.greeting.agentName,
            greeting: wizardData.greeting.greeting,
            systemPrompt,
            voiceId: wizardData.voice.voiceId,
            businessName: wizardData.businessInfo.businessName,
            businessDescription: wizardData.businessInfo.businessDescription || null,
            vapiAssistantId,
            isActive: true,
          },
          include: {
            phoneNumber: true,
          },
        });

        // Phone numbers are assigned manually by admin via Vapi dashboard
        // After admin assigns phone to assistant in Vapi, they run sync to update our DB

        return NextResponse.json(
          {
            agent,
            message: 'Agent created successfully. Admin will assign a phone number.',
          },
          { status: 201 }
        );
      } catch (dbError) {
        // If DB creation fails but Vapi succeeded, try to cleanup Vapi assistant
        if (vapiAssistantId) {
          try {
            await deleteAssistant(vapiAssistantId);
          } catch (cleanupError) {
            console.error('Failed to cleanup Vapi assistant after DB error:', cleanupError);
          }
        }
        throw dbError;
      }
    } else {
      // Legacy format support (for backward compatibility)
      const { name, greeting, systemPrompt, voiceId, businessName, businessDescription } = body;

      if (!name || !greeting || !systemPrompt || !voiceId || !businessName) {
        return NextResponse.json(
          { error: 'Missing required fields: name, greeting, systemPrompt, voiceId, businessName' },
          { status: 400 }
        );
      }

      // Validate field lengths
      if (name.length > 100) {
        return NextResponse.json(
          { error: 'Name must be 100 characters or less' },
          { status: 400 }
        );
      }

      if (greeting.length > 500) {
        return NextResponse.json(
          { error: 'Greeting must be 500 characters or less' },
          { status: 400 }
        );
      }

      // Create agent (legacy format)
      const agent = await prisma.agent.create({
        data: {
          userId: user.id,
          name,
          greeting,
          systemPrompt,
          voiceId,
          businessName,
          businessDescription: businessDescription || null,
          isActive: true,
        },
      });

      return NextResponse.json({ agent }, { status: 201 });
    }
  } catch (error) {
    console.error('Error creating agent:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to create agent' },
      { status: 500 }
    );
  }
}

/**
 * Build system prompt from wizard data
 *
 * Uses Vapi dynamic variables for real-time date/time substitution:
 * https://docs.vapi.ai/assistants/dynamic-variables#advanced-date-and-time-usage
 */
function buildSystemPrompt(config: {
  businessName: string;
  businessDescription: string;
  businessHours: string;
  services: string[];
  faqs: { question: string; answer: string }[];
  policies: string;
  hasGoogleCalendar?: boolean;
}): string {
  const parts: string[] = [];

  // Add Vapi dynamic date header for calendar-enabled agents
  // These variables are substituted by Vapi at call time
  if (config.hasGoogleCalendar) {
    parts.push(`[AKTUELLES DATUM UND UHRZEIT]
Heute: {{"now" | date: "%d.%m.%Y", "Europe/Berlin"}} (ISO: {{"now" | date: "%Y-%m-%d", "Europe/Berlin"}})
Uhrzeit: {{"now" | date: "%H:%M", "Europe/Berlin"}} Uhr
Wochentag: {{"now" | date: "%A", "Europe/Berlin"}}
Jahr: {{"now" | date: "%Y", "Europe/Berlin"}}

WICHTIG - DATUMSREGELN:
- Das aktuelle Jahr ist {{"now" | date: "%Y", "Europe/Berlin"}} - NIEMALS 2023 oder 2024 verwenden!
- Wenn der Kunde "morgen" sagt, berechne das korrekte Datum basierend auf heute
- Wenn der Kunde "Montag" sagt, nimm den NÄCHSTEN Montag (nicht vergangene)
- Übergib Datumsangaben im Format JJJJ-MM-TT an die Tools
`);
  }

  parts.push(`Sie sind der KI-Assistent für ${config.businessName}.`);

  if (config.businessDescription) {
    parts.push(`\n${config.businessDescription}`);
  }

  parts.push('\n## Geschäftsinformationen');
  parts.push(`- Firmenname: ${config.businessName}`);
  parts.push(`- Öffnungszeiten: ${config.businessHours}`);
  if (config.services.length > 0) {
    parts.push(`- Dienstleistungen: ${config.services.join(', ')}`);
  }

  if (config.faqs.length > 0) {
    parts.push('\n## Häufige Fragen');
    config.faqs.forEach((faq) => {
      parts.push(`F: ${faq.question}`);
      parts.push(`A: ${faq.answer}`);
      parts.push('');
    });
  }

  if (config.policies) {
    parts.push('## Richtlinien');
    parts.push(config.policies);
  }

  if (config.hasGoogleCalendar) {
    parts.push('\n## Kalender-Funktionen');
    parts.push('- Sie können die Verfügbarkeit mit dem check_availability-Tool prüfen');
    parts.push('- Sie können Termine mit dem book_appointment-Tool buchen');
    parts.push('- Erfragen Sie bei Terminbuchungen: Datum, Uhrzeit, Name des Anrufers (erforderlich), Telefonnummer (optional), E-Mail (optional)');
    parts.push('- Bestätigen Sie immer die Details vor der Buchung');
    parts.push('- Berechnen Sie relative Datumsangaben (morgen, nächsten Montag) anhand des aktuellen Datums oben');
  }

  parts.push('\n## Richtlinien');
  parts.push('- Sprechen Sie Anrufer mit "Sie" an (formell)');
  parts.push('- Seien Sie freundlich, professionell und präzise');
  parts.push('- Beantworten Sie Fragen zum Unternehmen anhand der obigen Informationen');
  parts.push('- Wenn Sie etwas nicht wissen, sagen Sie höflich, dass sich jemand bei ihnen melden wird');
  parts.push('- Halten Sie Antworten kurz und natürlich für Telefongespräche');

  return parts.join('\n');
}
