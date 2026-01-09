import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';
import {
  withErrorHandling,
  apiResponse,
  validationError,
  databaseError,
  createRequestContext,
  getRequestDuration,
} from '@/lib/errors';
import type { WizardState } from '@/types/wizard';

// Force dynamic rendering since we use cookies() for authentication
export const dynamic = 'force-dynamic';

/**
 * GET /api/wizard-drafts - Get the user's active draft
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const context = createRequestContext(request);

  const user = await requireAuth(request);

  try {
    // Get the user's active draft (status = DRAFT)
    const draft = await prisma.wizardDraft.findFirst({
      where: {
        userId: user.id,
        status: 'DRAFT',
      },
      orderBy: {
        lastSavedAt: 'desc',
      },
    });

    if (!draft) {
      return apiResponse(
        { draft: null },
        200,
        context.requestId
      );
    }

    context.logger.info('Wizard draft retrieved', {
      userId: user.id,
      draftId: draft.id,
      currentStep: draft.currentStep,
      duration: getRequestDuration(context),
    });

    return apiResponse(
      {
        draft: {
          id: draft.id,
          currentStep: draft.currentStep,
          wizardState: draft.wizardState,
          status: draft.status,
          lastSavedAt: draft.lastSavedAt,
          createdAt: draft.createdAt,
        },
      },
      200,
      context.requestId
    );
  } catch (error) {
    throw databaseError('Failed to retrieve wizard draft', error as Error);
  }
});

/**
 * POST /api/wizard-drafts - Create or update a wizard draft (auto-save)
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const context = createRequestContext(request);

  const user = await requireAuth(request);
  const body = await request.json();

  // Validate the incoming data
  const { wizardState, currentStep } = body as {
    wizardState: WizardState;
    currentStep?: number;
  };

  if (!wizardState) {
    throw validationError('wizardState is required', {
      field: 'wizardState',
    });
  }

  const step = currentStep ?? wizardState.step ?? 1;

  try {
    // Check for existing draft
    const existingDraft = await prisma.wizardDraft.findFirst({
      where: {
        userId: user.id,
        status: 'DRAFT',
      },
    });

    let draft;

    if (existingDraft) {
      // Update existing draft
      draft = await prisma.wizardDraft.update({
        where: { id: existingDraft.id },
        data: {
          wizardState: wizardState as unknown as object,
          currentStep: step,
          lastSavedAt: new Date(),
        },
      });

      context.logger.info('Wizard draft updated', {
        userId: user.id,
        draftId: draft.id,
        currentStep: step,
        duration: getRequestDuration(context),
      });
    } else {
      // Create new draft
      draft = await prisma.wizardDraft.create({
        data: {
          userId: user.id,
          wizardState: wizardState as unknown as object,
          currentStep: step,
          status: 'DRAFT',
        },
      });

      context.logger.info('Wizard draft created', {
        userId: user.id,
        draftId: draft.id,
        currentStep: step,
        duration: getRequestDuration(context),
      });
    }

    return apiResponse(
      {
        draft: {
          id: draft.id,
          currentStep: draft.currentStep,
          status: draft.status,
          lastSavedAt: draft.lastSavedAt,
        },
        message: existingDraft ? 'Draft updated' : 'Draft created',
      },
      existingDraft ? 200 : 201,
      context.requestId
    );
  } catch (error) {
    throw databaseError('Failed to save wizard draft', error as Error);
  }
});

/**
 * DELETE /api/wizard-drafts - Delete the user's active draft (abandon or clear after publishing)
 */
export const DELETE = withErrorHandling(async (request: NextRequest) => {
  const context = createRequestContext(request);

  const user = await requireAuth(request);

  // Check for query parameter to determine if abandoning or clearing after publish
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'abandon';

  try {
    const existingDraft = await prisma.wizardDraft.findFirst({
      where: {
        userId: user.id,
        status: 'DRAFT',
      },
    });

    if (!existingDraft) {
      return apiResponse(
        { message: 'No active draft found' },
        200,
        context.requestId
      );
    }

    if (action === 'abandon') {
      // Mark as abandoned (soft delete for analytics)
      await prisma.wizardDraft.update({
        where: { id: existingDraft.id },
        data: {
          status: 'ABANDONED',
          lastSavedAt: new Date(),
        },
      });

      context.logger.info('Wizard draft abandoned', {
        userId: user.id,
        draftId: existingDraft.id,
        duration: getRequestDuration(context),
      });

      return apiResponse(
        { message: 'Draft abandoned' },
        200,
        context.requestId
      );
    } else if (action === 'delete') {
      // Hard delete (for cleanup)
      await prisma.wizardDraft.delete({
        where: { id: existingDraft.id },
      });

      context.logger.info('Wizard draft deleted', {
        userId: user.id,
        draftId: existingDraft.id,
        duration: getRequestDuration(context),
      });

      return apiResponse(
        { message: 'Draft deleted' },
        200,
        context.requestId
      );
    }

    throw validationError('Invalid action', { action, validActions: ['abandon', 'delete'] });
  } catch (error) {
    if (error instanceof Error && 'code' in error) {
      throw error; // Re-throw validation errors
    }
    throw databaseError('Failed to delete wizard draft', error as Error);
  }
});

/**
 * PATCH /api/wizard-drafts - Mark draft as published (link to created agent)
 */
export const PATCH = withErrorHandling(async (request: NextRequest) => {
  const context = createRequestContext(request);

  const user = await requireAuth(request);
  const body = await request.json();

  const { agentId } = body as { agentId: string };

  if (!agentId) {
    throw validationError('agentId is required', { field: 'agentId' });
  }

  try {
    const existingDraft = await prisma.wizardDraft.findFirst({
      where: {
        userId: user.id,
        status: 'DRAFT',
      },
    });

    if (!existingDraft) {
      return apiResponse(
        { message: 'No active draft found to publish' },
        404,
        context.requestId
      );
    }

    // Verify the agent belongs to the user
    const agent = await prisma.agent.findFirst({
      where: {
        id: agentId,
        userId: user.id,
      },
    });

    if (!agent) {
      throw validationError('Agent not found or unauthorized', { agentId });
    }

    // Mark as published and link to agent
    const draft = await prisma.wizardDraft.update({
      where: { id: existingDraft.id },
      data: {
        status: 'PUBLISHED',
        agentId,
        lastSavedAt: new Date(),
      },
    });

    context.logger.info('Wizard draft published', {
      userId: user.id,
      draftId: draft.id,
      agentId,
      duration: getRequestDuration(context),
    });

    return apiResponse(
      {
        draft: {
          id: draft.id,
          status: draft.status,
          agentId: draft.agentId,
        },
        message: 'Draft published successfully',
      },
      200,
      context.requestId
    );
  } catch (error) {
    if (error instanceof Error && 'code' in error) {
      throw error; // Re-throw validation errors
    }
    throw databaseError('Failed to publish wizard draft', error as Error);
  }
});
