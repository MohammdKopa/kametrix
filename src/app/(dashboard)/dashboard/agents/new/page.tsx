import { getCurrentUser } from '@/lib/auth-guard';
import { redirect } from 'next/navigation';
import { AgentForm } from '@/components/dashboard/agent-form';

export const dynamic = 'force-dynamic';

export default async function NewAgentPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Create Agent</h1>
        <p className="text-gray-500 mt-1">
          Set up a new voice AI agent for your business
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <AgentForm mode="create" />
      </div>
    </div>
  );
}
