import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';
import { generateWizardContent, generateGreetingOnly } from '@/lib/openrouter';
import type { WizardState } from '@/types/wizard';

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request);

    const body = await request.json();
    const { type, businessInfo, agentName } = body as {
      type: 'all' | 'faqs' | 'greeting';
      businessInfo: WizardState['businessInfo'];
      agentName?: string;
    };

    // Validate business info
    if (!businessInfo?.businessName || !businessInfo?.businessDescription) {
      return NextResponse.json(
        { error: 'Business name and description are required for AI generation' },
        { status: 400 }
      );
    }

    if (type === 'greeting') {
      if (!agentName) {
        return NextResponse.json(
          { error: 'Agent name is required for greeting generation' },
          { status: 400 }
        );
      }

      const result = await generateGreetingOnly(businessInfo, agentName);
      return NextResponse.json(result);
    }

    // Generate all content (FAQs, policies, greeting, endCallMessage)
    const result = await generateWizardContent(businessInfo);
    return NextResponse.json(result);
  } catch (error) {
    console.error('AI generation error:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (error instanceof Error && error.message.includes('OPENROUTER_API_KEY')) {
      return NextResponse.json(
        { error: 'AI generation not configured. Please add OPENROUTER_API_KEY to environment.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate content. Please try again.' },
      { status: 500 }
    );
  }
}
