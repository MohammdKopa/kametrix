'use client';

import { Check } from 'lucide-react';

interface WizardProgressProps {
  currentStep: number;
  totalSteps: number;
}

const STEP_LABELS = [
  'Business Info',
  'Knowledge',
  'Voice',
  'Greeting',
  'Review',
];

export function WizardProgress({ currentStep, totalSteps }: WizardProgressProps) {
  return (
    <div className="mb-8">
      {/* Desktop view - horizontal */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between">
          {STEP_LABELS.slice(0, totalSteps).map((label, index) => {
            const stepNumber = index + 1;
            const isCompleted = stepNumber < currentStep;
            const isCurrent = stepNumber === currentStep;

            return (
              <div key={stepNumber} className="flex items-center flex-1">
                {/* Step indicator */}
                <div className="flex flex-col items-center">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                      isCompleted
                        ? 'bg-[var(--accent)] border-[var(--accent)] text-white'
                        : isCurrent
                        ? 'border-[var(--accent)] text-[var(--accent)] bg-white dark:bg-[var(--background)]'
                        : 'border-gray-300 dark:border-[var(--border)] text-gray-400 dark:text-[var(--muted-foreground)] bg-white dark:bg-[var(--background)]'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-semibold">{stepNumber}</span>
                    )}
                  </div>
                  <span
                    className={`mt-2 text-xs font-medium ${
                      isCurrent
                        ? 'text-[var(--accent)]'
                        : isCompleted
                        ? 'text-gray-700 dark:text-[var(--foreground)]'
                        : 'text-gray-500 dark:text-[var(--muted-foreground)]'
                    }`}
                  >
                    {label}
                  </span>
                </div>

                {/* Connector line */}
                {index < totalSteps - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-4 transition-colors ${
                      stepNumber < currentStep
                        ? 'bg-[var(--accent)]'
                        : 'bg-gray-300 dark:bg-[var(--border)]'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile view - compact */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-[var(--foreground)]">
            Step {currentStep} of {totalSteps}
          </span>
          <span className="text-sm text-gray-500 dark:text-[var(--muted-foreground)]">
            {STEP_LABELS[currentStep - 1]}
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-[var(--border)] rounded-full h-2">
          <div
            className="bg-[var(--accent)] h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
