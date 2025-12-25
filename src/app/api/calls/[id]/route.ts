import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-guard';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    // Authenticate user
    const user = await requireAuth(request);

    // Await params
    const { id } = await context.params;

    // Fetch call with agent relation
    const call = await prisma.call.findUnique({
      where: { id },
      include: {
        agent: true,
      },
    });

    // Check if call exists
    if (!call) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 });
    }

    // Verify ownership
    if (call.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({ call });
  } catch (error) {
    console.error('Error fetching call:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch call' },
      { status: 500 }
    );
  }
}
