import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';
import { createBusinessAssistant, deleteAssistant } from '@/lib/vapi';
import { buildSystemPrompt } from '@/lib/prompts';
import type { WizardState } from '@/types/wizard';
import {
  getCachedUserAgents,
  invalidateUserCache,
  metrics,
  MetricNames,
} from '@/lib/performance';

/**
 * GET /api/agents - List all agents for authenticated user
 */
export async function GET(request: NextRequest) {
  const timer = metrics.startTimer(MetricNames.API_AGENTS);

  try {
    const user = await requireAuth(request);

    // Use cached query for better performance
    const agents = await getCachedUserAgents(user.id);

    metrics.endTimer(timer);
    return NextResponse.json({ agents });
  } catch (error) {
    metrics.endTimer(timer, true);
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

        // Invalidate user's agent cache
        invalidateUserCache(user.id);

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

      // Invalidate user's agent cache
      invalidateUserCache(user.id);

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

