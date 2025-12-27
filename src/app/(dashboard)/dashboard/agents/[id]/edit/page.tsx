import { getCurrentUser } from '@/lib/auth-guard';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { AgentForm } from '@/components/dashboard/agent-form';

export const dynamic = 'force-dynamic';

export default async function EditAgentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const { id } = await params;

  // Fetch the agent
  const agent = await prisma.agent.findFirst({
    where: {
      id,
      userId: user.id,
    },
  });

  if (!agent) {
    notFound();
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Edit Agent</h1>
        <p className="text-muted-foreground mt-1">
          Update your agent&apos;s configuration
        </p>
      </div>

      <AgentForm mode="edit" agent={agent} />
    </div>
  );
}
