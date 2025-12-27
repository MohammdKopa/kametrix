import { getCurrentUser } from '@/lib/auth-guard';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { AgentCard } from '@/components/dashboard/agent-card';
import Link from 'next/link';
import { Bot, Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AgentsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch agents for the current user
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-[var(--foreground)]">
            Agents
          </h1>
          <p className="text-gray-500 dark:text-[var(--muted-foreground)] mt-1">
            Manage your voice AI agents
          </p>
        </div>
        <Link
          href="/dashboard/agents/new"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl text-white bg-[var(--accent)] hover:bg-[var(--accent-secondary)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent)] dark:focus:ring-offset-[var(--background)] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Agent
        </Link>
      </div>

      {/* Agent Cards Grid */}
      {agents.length === 0 ? (
        <div className="glass-card text-center py-12 px-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 dark:bg-[var(--accent)]/20 flex items-center justify-center mb-4">
            <Bot className="w-8 h-8 text-gray-400 dark:text-[var(--accent)]" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-[var(--foreground)]">
            No agents yet
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-[var(--muted-foreground)] max-w-sm mx-auto">
            Create your first AI voice agent to start handling calls and booking appointments.
          </p>
          <div className="mt-6">
            <Link
              href="/dashboard/agents/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl text-white bg-[var(--accent)] hover:bg-[var(--accent-secondary)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent)] dark:focus:ring-offset-[var(--background)] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Agent
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      )}
    </div>
  );
}
