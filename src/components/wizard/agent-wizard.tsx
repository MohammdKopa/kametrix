'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WizardProgress } from './wizard-progress';
import { DEFAULT_WIZARD_STATE, type WizardState } from '@/types/wizard';
import { BusinessInfoStep } from './steps/business-info-step';
import { KnowledgeStep } from './steps/knowledge-step';
import { VoiceStep } from './steps/voice-step';
import { GreetingStep } from './steps/greeting-step';
import { ReviewStep } from './steps/review-step';

const TOTAL_STEPS = 5;

export function AgentWizard() {
  const router = useRouter();
  const [state, setState] = useState<WizardState>(DEFAULT_WIZARD_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          setError('Business name is required');
          return false;
        }
        if (!state.businessInfo.businessDescription.trim()) {
          setError('Business description is required');
          return false;
        }
        if (!state.businessInfo.businessHours.trim()) {
          setError('Business hours are required');
          return false;
        }
        if (state.businessInfo.services.length === 0) {
          setError('At least one service is required');
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
          setError('Please complete both question and answer for all FAQs');
          return false;
        }
        return true;

      case 3: // Voice
        if (!state.voice.voiceId) {
          setError('Please select a voice');
          return false;
        }
        return true;

      case 4: // Greeting
        if (!state.greeting.agentName.trim()) {
          setError('Agent name is required');
          return false;
        }
        if (!state.greeting.greeting.trim()) {
          setError('Greeting message is required');
          return false;
        }
        if (!state.greeting.endCallMessage.trim()) {
          setError('End call message is required');
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

      // Show success message - phone number will be assigned by admin later
      if (agent.phoneNumber?.number) {
        alert(`Agent created successfully!\n\nYour agent is ready to receive calls at:\n${agent.phoneNumber.number}`);
      } else {
        alert('Agent created successfully!\n\nA phone number will be assigned shortly by admin.');
      }

      router.push('/dashboard/agents');
      router.refresh();
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
          Previous
        </button>

        {state.step < TOTAL_STEPS ? (
          <button
            type="button"
            onClick={nextStep}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-[var(--accent)] rounded-xl hover:bg-[var(--accent-secondary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-[var(--accent)] rounded-xl hover:bg-[var(--accent-secondary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Creating Agent...' : 'Create Agent'}
          </button>
        )}
      </div>
    </div>
  );
}
