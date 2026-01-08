import { getCurrentUser } from '@/lib/auth-guard';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { EscalationForm } from '@/components/dashboard/escalation-form';
import { getEscalationConfig, getDefaultEscalationConfig } from '@/lib/escalation/config-manager';
import Link from 'next/link';
import { ArrowLeft, PhoneForwarded } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function EscalationSettingsPage({
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

  // Fetch existing escalation config
  const config = await getEscalationConfig(id);
  const defaults = getDefaultEscalationConfig();

  // Merge existing config with defaults, converting nulls to undefined
  const initialConfig = config
    ? {
        enabled: config.enabled,
        forwardingNumber: config.forwardingNumber ?? undefined,
        forwardingQueue: config.forwardingQueue ?? undefined,
        forwardingDepartment: config.forwardingDepartment ?? undefined,
        fallbackNumber: config.fallbackNumber ?? undefined,
        voicemailEnabled: config.voicemailEnabled,
        voicemailGreeting: config.voicemailGreeting ?? undefined,
        businessHoursStart: config.businessHoursStart ?? undefined,
        businessHoursEnd: config.businessHoursEnd ?? undefined,
        businessDays: config.businessDays,
        afterHoursNumber: config.afterHoursNumber ?? undefined,
        afterHoursMessage: config.afterHoursMessage ?? undefined,
        timezone: config.timezone,
        maxCallDuration: config.maxCallDuration,
        maxClarifications: config.maxClarifications,
        sentimentThreshold: config.sentimentThreshold,
        triggerPhrases: config.triggerPhrases as string[],
        maxTransferWaitTime: config.maxTransferWaitTime,
        announceTransfer: config.announceTransfer,
        transferMessage: config.transferMessage ?? undefined,
        holdMusicUrl: config.holdMusicUrl ?? undefined,
        shareTranscript: config.shareTranscript,
        shareSummary: config.shareSummary,
        shareCallerInfo: config.shareCallerInfo,
        id: config.id,
        configured: true,
      }
    : {
        ...defaults,
        configured: false,
      };

  return (
    <div className="max-w-3xl">
      {/* Back navigation */}
      <Link
        href="/dashboard/agents"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Agents
      </Link>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <PhoneForwarded className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Escalation Settings</h1>
            <p className="text-sm text-muted-foreground">
              {agent.name} &bull; {agent.businessName}
            </p>
          </div>
        </div>
        <p className="text-muted-foreground mt-2">
          Configure when and how the AI voice agent should transfer calls to human operators.
          {!config && (
            <span className="text-amber-500 ml-2">
              (Not yet configured)
            </span>
          )}
        </p>
      </div>

      <EscalationForm
        agentId={id}
        agentName={agent.name}
        initialConfig={initialConfig}
      />
    </div>
  );
}
