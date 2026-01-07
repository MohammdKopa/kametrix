import { getCurrentUser } from '@/lib/auth-guard';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ArrowLeft, Bot, AlertTriangle } from 'lucide-react';
import { VoiceAgentTester } from '@/components/testing/VoiceAgentTester';

export const dynamic = 'force-dynamic';

interface TestAgentPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function TestAgentPage({ params }: TestAgentPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // Await params
  const { id } = await params;

  // Fetch agent with necessary details
  const agent = await prisma.agent.findFirst({
    where: {
      id,
      userId: user.id,
    },
    select: {
      id: true,
      name: true,
      businessName: true,
      businessDescription: true,
      vapiAssistantId: true,
      isActive: true,
    },
  });

  // Check if agent exists and user owns it
  if (!agent) {
    redirect('/dashboard/agents');
  }

  // Check if Vapi assistant is configured
  const hasVapiAssistant = !!agent.vapiAssistantId;

  return (
    <div className="space-y-6">
      {/* Back button and header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href="/dashboard/agents"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to agents
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Bot className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Test: {agent.name}</h1>
              <p className="text-muted-foreground">{agent.businessName}</p>
            </div>
          </div>
        </div>

        {/* Agent status indicator */}
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              agent.isActive
                ? 'bg-green-500 shadow-[0_0_6px_oklch(0.72_0.19_142)]'
                : 'bg-muted-foreground'
            }`}
          />
          <span className="text-sm text-muted-foreground">
            {agent.isActive ? 'Agent Active' : 'Agent Inactive'}
          </span>
        </div>
      </div>

      {/* Warning for inactive agent */}
      {!agent.isActive && (
        <div className="glass-card p-4 border border-yellow-500/30 bg-yellow-500/5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-600 dark:text-yellow-400">
                Agent is Currently Inactive
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                You can still test this agent, but it won&apos;t receive real calls until activated.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Warning if no Vapi assistant */}
      {!hasVapiAssistant ? (
        <div className="glass-card p-8 text-center">
          <div className="p-3 rounded-full bg-destructive/10 w-fit mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Voice Assistant Not Configured</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-4">
            This agent doesn&apos;t have a voice assistant configured. Please edit the agent to set up voice capabilities before testing.
          </p>
          <Link
            href={`/dashboard/agents/${agent.id}/edit`}
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary/90 transition-colors"
          >
            Configure Agent
          </Link>
        </div>
      ) : (
        /* Voice Agent Tester */
        <VoiceAgentTester agentId={agent.id} agentName={agent.name} />
      )}

      {/* Instructions */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4">How to Test Your Agent</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-full bg-primary/10 text-primary text-sm font-bold w-7 h-7 flex items-center justify-center flex-shrink-0">
                1
              </div>
              <div>
                <h4 className="font-medium">Allow Microphone Access</h4>
                <p className="text-sm text-muted-foreground">
                  When prompted, allow access to your microphone for voice input
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-full bg-primary/10 text-primary text-sm font-bold w-7 h-7 flex items-center justify-center flex-shrink-0">
                2
              </div>
              <div>
                <h4 className="font-medium">Start the Test Call</h4>
                <p className="text-sm text-muted-foreground">
                  Click &quot;Start Test Call&quot; to begin your conversation with the agent
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-full bg-primary/10 text-primary text-sm font-bold w-7 h-7 flex items-center justify-center flex-shrink-0">
                3
              </div>
              <div>
                <h4 className="font-medium">Speak Naturally</h4>
                <p className="text-sm text-muted-foreground">
                  Talk to your agent as a customer would. Try booking appointments or asking questions
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-full bg-primary/10 text-primary text-sm font-bold w-7 h-7 flex items-center justify-center flex-shrink-0">
                4
              </div>
              <div>
                <h4 className="font-medium">Review the Transcript</h4>
                <p className="text-sm text-muted-foreground">
                  Monitor the conversation in real-time and export for later review
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
