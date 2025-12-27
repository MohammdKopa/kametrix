import { getCurrentUser } from '@/lib/auth-guard';
import { redirect } from 'next/navigation';
import { AgentWizard } from '@/components/wizard/agent-wizard';

export const dynamic = 'force-dynamic';

export default async function NewAgentPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Create Your AI Agent</h1>
        <p className="text-muted-foreground mt-2">
          Follow the steps below to create a fully-configured voice AI agent for your business.
          We&apos;ll guide you through setting up business information, knowledge base, voice selection, and more.
        </p>
      </div>

      <AgentWizard />
    </div>
  );
}
