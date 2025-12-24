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
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : isCurrent
                        ? 'border-blue-600 text-blue-600 bg-white'
                        : 'border-gray-300 text-gray-400 bg-white'
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
                      isCurrent ? 'text-blue-600' : 'text-gray-500'
                    }`}
                  >
                    {label}
                  </span>
                </div>

                {/* Connector line */}
                {index < totalSteps - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-4 transition-colors ${
                      stepNumber < currentStep ? 'bg-blue-600' : 'bg-gray-300'
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
          <span className="text-sm font-medium text-gray-700">
            Step {currentStep} of {totalSteps}
          </span>
          <span className="text-sm text-gray-500">{STEP_LABELS[currentStep - 1]}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
