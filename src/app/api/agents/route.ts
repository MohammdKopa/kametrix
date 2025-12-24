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
        });

        vapiAssistantId = vapiResponse.id;
      } catch (vapiError) {
        console.error('Error creating Vapi assistant:', vapiError);
        return NextResponse.json(
          { error: 'Failed to create Vapi assistant. Please check your VAPI_API_KEY.' },
          { status: 502 }
        );
      }

      // Build system prompt from wizard data
      const systemPrompt = buildSystemPrompt({
        businessName: wizardData.businessInfo.businessName,
        businessDescription: wizardData.businessInfo.businessDescription,
        businessHours: wizardData.businessInfo.businessHours,
        services: validServices,
        faqs: validFaqs,
        policies: wizardData.knowledge.policies,
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
        });

        return NextResponse.json({ agent }, { status: 201 });
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
 */
function buildSystemPrompt(config: {
  businessName: string;
  businessDescription: string;
  businessHours: string;
  services: string[];
  faqs: { question: string; answer: string }[];
  policies: string;
}): string {
  const parts: string[] = [];

  parts.push(`You are an AI assistant for ${config.businessName}.`);

  if (config.businessDescription) {
    parts.push(`\n${config.businessDescription}`);
  }

  parts.push('\n## Business Information');
  parts.push(`- Business Name: ${config.businessName}`);
  parts.push(`- Hours: ${config.businessHours}`);
  if (config.services.length > 0) {
    parts.push(`- Services: ${config.services.join(', ')}`);
  }

  if (config.faqs.length > 0) {
    parts.push('\n## Frequently Asked Questions');
    config.faqs.forEach((faq) => {
      parts.push(`Q: ${faq.question}`);
      parts.push(`A: ${faq.answer}`);
      parts.push('');
    });
  }

  if (config.policies) {
    parts.push('## Policies');
    parts.push(config.policies);
  }

  parts.push('\n## Guidelines');
  parts.push('- Be friendly, professional, and concise');
  parts.push('- Answer questions about the business accurately using the information above');
  parts.push("- If you don't know something or it's outside your knowledge, politely say you'll have someone get back to them");
  parts.push('- Keep responses brief and natural for voice conversation');

  return parts.join('\n');
}
