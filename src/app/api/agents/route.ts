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
import {
  withErrorHandling,
  apiResponse,
  validationError,
  vapiError,
  databaseError,
  withCircuitBreaker,
  ServiceCircuitBreakers,
  createRequestContext,
  getRequestDuration,
} from '@/lib/errors';

// Force dynamic rendering since we use cookies() for authentication
export const dynamic = 'force-dynamic';

/**
 * GET /api/agents - List all agents for authenticated user
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const timer = metrics.startTimer(MetricNames.API_AGENTS);
  const context = createRequestContext(request);

  try {
    const user = await requireAuth(request);

    // Use cached query for better performance
    const agents = await getCachedUserAgents(user.id);

    metrics.endTimer(timer);
    context.logger.info('Agents fetched successfully', {
      userId: user.id,
      agentCount: agents.length,
      duration: getRequestDuration(context),
    });

    return apiResponse({ agents }, 200, context.requestId);
  } catch (error) {
    metrics.endTimer(timer, true);
    throw error;
  }
});

/**
 * POST /api/agents - Create a new agent
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const timer = metrics.startTimer(MetricNames.API_AGENTS);
  const context = createRequestContext(request);

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
        throw validationError('Business name is required', {
          field: 'businessInfo.businessName',
        });
      }

      if (!wizardData.greeting?.agentName) {
        throw validationError('Agent name is required', {
          field: 'greeting.agentName',
        });
      }

      // Filter out empty FAQs (both question and answer must be filled)
      const validFaqs = (wizardData.knowledge?.faqs || []).filter(
        (faq) => faq && typeof faq.question === 'string' && typeof faq.answer === 'string' &&
                 faq.question.trim() && faq.answer.trim()
      );

      // Filter out empty services
      const validServices = (wizardData.businessInfo?.services || []).filter(
        (s) => typeof s === 'string' && s.trim()
      );

      // Check if user has Google Calendar connected
      const userWithGoogle = await prisma.user.findUnique({
        where: { id: user.id },
        select: { googleRefreshToken: true },
      });

      const hasGoogleCalendar = !!userWithGoogle?.googleRefreshToken;

      let vapiAssistantId: string | null = null;

      // Create Vapi assistant with circuit breaker protection
      try {
        const vapiResponse = await withCircuitBreaker(
          ServiceCircuitBreakers.VAPI,
          async () => {
            return createBusinessAssistant({
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
          }
        );

        vapiAssistantId = vapiResponse.id;
        context.logger.info('Vapi assistant created', {
          assistantId: vapiAssistantId,
          userId: user.id,
        });
      } catch (error) {
        context.logger.error('Failed to create Vapi assistant', error, {
          userId: user.id,
          agentName: wizardData.greeting.agentName,
        });
        throw vapiError(
          'Failed to create voice assistant. The voice service may be temporarily unavailable.',
          error as Error
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

        // Invalidate user's agent cache
        invalidateUserCache(user.id);

        context.logger.info('Agent created successfully', {
          agentId: agent.id,
          userId: user.id,
          hasGoogleCalendar,
          duration: getRequestDuration(context),
        });

        metrics.endTimer(timer);

        return apiResponse(
          {
            agent,
            message: 'Agent created successfully. Admin will assign a phone number.',
          },
          201,
          context.requestId
        );
      } catch (dbError) {
        // If DB creation fails but Vapi succeeded, try to cleanup Vapi assistant
        if (vapiAssistantId) {
          try {
            await deleteAssistant(vapiAssistantId);
            context.logger.info('Cleaned up Vapi assistant after DB error', {
              assistantId: vapiAssistantId,
            });
          } catch (cleanupError) {
            context.logger.error('Failed to cleanup Vapi assistant after DB error', cleanupError, {
              assistantId: vapiAssistantId,
            });
          }
        }
        throw databaseError('Failed to save agent to database', dbError as Error);
      }
    } else {
      // Legacy format support (for backward compatibility)
      const { name, greeting, systemPrompt, voiceId, businessName, businessDescription } = body;

      if (!name || !greeting || !systemPrompt || !voiceId || !businessName) {
        throw validationError(
          'Missing required fields: name, greeting, systemPrompt, voiceId, businessName',
          {
            required: ['name', 'greeting', 'systemPrompt', 'voiceId', 'businessName'],
            received: Object.keys(body),
          }
        );
      }

      // Validate field lengths
      if (name.length > 100) {
        throw validationError('Name must be 100 characters or less', {
          field: 'name',
          maxLength: 100,
          actualLength: name.length,
        });
      }

      if (greeting.length > 500) {
        throw validationError('Greeting must be 500 characters or less', {
          field: 'greeting',
          maxLength: 500,
          actualLength: greeting.length,
        });
      }

      // Create agent (legacy format) - include phoneNumber for consistency with wizard format
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
        include: {
          phoneNumber: true,
        },
      });

      // Invalidate user's agent cache
      invalidateUserCache(user.id);

      context.logger.info('Agent created (legacy format)', {
        agentId: agent.id,
        userId: user.id,
        duration: getRequestDuration(context),
      });

      metrics.endTimer(timer);

      return apiResponse({ agent }, 201, context.requestId);
    }
  } catch (error) {
    metrics.endTimer(timer, true);
    throw error;
  }
});
