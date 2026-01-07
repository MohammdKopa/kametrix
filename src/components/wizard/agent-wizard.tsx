'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Play, ArrowRight } from 'lucide-react';
import { WizardProgress } from './wizard-progress';
import { DEFAULT_WIZARD_STATE, type WizardState } from '@/types/wizard';
import { BusinessInfoStep } from './steps/business-info-step';
import { KnowledgeStep } from './steps/knowledge-step';
import { VoiceStep } from './steps/voice-step';
import { GreetingStep } from './steps/greeting-step';
import { ReviewStep } from './steps/review-step';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const TOTAL_STEPS = 5;

interface CreatedAgent {
  id: string;
  name: string;
  phoneNumber?: { number: string } | null;
}

export function AgentWizard() {
  const router = useRouter();
  const [state, setState] = useState<WizardState>(DEFAULT_WIZARD_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [createdAgent, setCreatedAgent] = useState<CreatedAgent | null>(null);

  const updateState = <K extends keyof Omit<WizardState, 'step'>>(
    section: K,
    data: Partial<WizardState[K]>
  ) => {
    setState((prev) => {
      const currentSection = prev[section];
      // Type assertion is safe here because we're excluding 'step' and only handling object sections
      const updatedSection = {
        ...(currentSection as object),
        ...(data as object)
      } as WizardState[K];
      return {
        ...prev,
        [section]: updatedSection,
      };
    });
  };

  const nextStep = () => {
    // Validate current step before advancing
    if (!validateStep(state.step)) {
      return;
    }
    setState((prev) => ({ ...prev, step: prev.step + 1 }));
  };

  const prevStep = () => {
    setState((prev) => ({ ...prev, step: Math.max(1, prev.step - 1) }));
  };

  const goToStep = (step: number) => {
    setState((prev) => ({ ...prev, step }));
  };

  const validateStep = (step: number): boolean => {
    setError(null);

    switch (step) {
      case 1: // Business Info
        if (!state.businessInfo.businessName.trim()) {
          setError('Unternehmensname ist erforderlich');
          return false;
        }
        if (!state.businessInfo.businessDescription.trim()) {
          setError('Unternehmensbeschreibung ist erforderlich');
          return false;
        }
        if (!state.businessInfo.businessHours.trim()) {
          setError('Öffnungszeiten sind erforderlich');
          return false;
        }
        if (state.businessInfo.services.length === 0) {
          setError('Mindestens eine Dienstleistung ist erforderlich');
          return false;
        }
        return true;

      case 2: // Knowledge
        // FAQs are optional, but if provided, both question and answer must be filled
        const incompleteFaqs = state.knowledge.faqs.filter(
          (faq) =>
            (faq.question.trim() && !faq.answer.trim()) ||
            (!faq.question.trim() && faq.answer.trim())
        );
        if (incompleteFaqs.length > 0) {
          setError('Bitte füllen Sie Frage und Antwort für alle FAQs aus');
          return false;
        }
        return true;

      case 3: // Voice
        if (!state.voice.voiceId) {
          setError('Bitte wählen Sie eine Stimme');
          return false;
        }
        return true;

      case 4: // Greeting
        if (!state.greeting.agentName.trim()) {
          setError('Name des Assistenten ist erforderlich');
          return false;
        }
        if (!state.greeting.greeting.trim()) {
          setError('Begrüßung ist erforderlich');
          return false;
        }
        if (!state.greeting.endCallMessage.trim()) {
          setError('Verabschiedung ist erforderlich');
          return false;
        }
        return true;

      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create agent');
      }

      const { agent } = await response.json();

      // Show success dialog with test option
      setCreatedAgent({
        id: agent.id,
        name: agent.name,
        phoneNumber: agent.phoneNumber,
      });
      setShowSuccessDialog(true);
      setIsSubmitting(false);
    } catch (err) {
      console.error('Error creating agent:', err);
      setError(err instanceof Error ? err.message : 'Failed to create agent');
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <WizardProgress currentStep={state.step} totalSteps={TOTAL_STEPS} />

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Step content */}
      <div className="glass-card p-6">
        {state.step === 1 && (
          <BusinessInfoStep
            data={state.businessInfo}
            onChange={(data) => updateState('businessInfo', data)}
          />
        )}
        {state.step === 2 && (
          <KnowledgeStep
            data={state.knowledge}
            businessInfo={state.businessInfo}
            onChange={(data) => updateState('knowledge', data)}
            onUpdateGreeting={(data) => updateState('greeting', data)}
          />
        )}
        {state.step === 3 && (
          <VoiceStep
            data={state.voice}
            onChange={(data) => updateState('voice', data)}
          />
        )}
        {state.step === 4 && (
          <GreetingStep
            data={state.greeting}
            businessInfo={state.businessInfo}
            onChange={(data) => updateState('greeting', data)}
          />
        )}
        {state.step === 5 && <ReviewStep data={state} onEdit={goToStep} />}
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between mt-6">
        <button
          type="button"
          onClick={prevStep}
          disabled={state.step === 1 || isSubmitting}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-[var(--foreground)] bg-white dark:bg-white/10 border border-gray-300 dark:border-[var(--border)] rounded-xl hover:bg-gray-50 dark:hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Zurück
        </button>

        {state.step < TOTAL_STEPS ? (
          <button
            type="button"
            onClick={nextStep}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-[var(--accent)] rounded-xl hover:bg-[var(--accent-secondary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Weiter
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-[var(--accent)] rounded-xl hover:bg-[var(--accent-secondary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Wird erstellt...' : 'Assistent erstellen'}
          </button>
        )}
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="glass sm:max-w-md" showCloseButton={false}>
          <DialogHeader className="text-center sm:text-center">
            <div className="mx-auto p-3 rounded-full bg-green-500/10 w-fit mb-4">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <DialogTitle className="text-xl">Assistent erfolgreich erstellt!</DialogTitle>
            <DialogDescription className="space-y-2">
              <p>
                Ihr Assistent <strong>&quot;{createdAgent?.name}&quot;</strong> wurde erfolgreich erstellt.
              </p>
              {createdAgent?.phoneNumber?.number ? (
                <p>
                  Telefonnummer: <strong>{createdAgent.phoneNumber.number}</strong>
                </p>
              ) : (
                <p className="text-muted-foreground">
                  Eine Telefonnummer wird in Kürze vom Admin zugewiesen.
                </p>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex-col sm:flex-col gap-2">
            <Button asChild className="w-full gap-2">
              <Link href={`/dashboard/agents/${createdAgent?.id}/test`}>
                <Play className="w-4 h-4" />
                Assistent testen
              </Link>
            </Button>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => {
                setShowSuccessDialog(false);
                router.push('/dashboard/agents');
                router.refresh();
              }}
            >
              <ArrowRight className="w-4 h-4" />
              Zur Übersicht
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
