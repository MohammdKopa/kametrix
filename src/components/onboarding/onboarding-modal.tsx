'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Bot,
  Calendar,
  Wallet,
  Rocket,
  ChevronRight,
  ChevronLeft,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ONBOARDING_STEPS } from '@/types/onboarding';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles,
  Bot,
  Calendar,
  Wallet,
  Rocket,
};

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  onCreateAgent?: () => void;
}

export function OnboardingModal({
  isOpen,
  onClose,
  onComplete,
  onCreateAgent,
}: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = ONBOARDING_STEPS.length;

  const handleNext = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      onComplete();
      if (onCreateAgent) {
        onCreateAgent();
      }
    }
  }, [currentStep, totalSteps, onComplete, onCreateAgent]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const handleSkip = useCallback(() => {
    onComplete();
    onClose();
  }, [onComplete, onClose]);

  const step = ONBOARDING_STEPS[currentStep];
  const IconComponent = ICON_MAP[step.icon] || Sparkles;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="sm:max-w-lg p-0 overflow-hidden glass-card border-0"
        showCloseButton={false}
      >
        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-accent"
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          />
        </div>

        {/* Skip button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Überspringen"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Content */}
        <div className="px-6 pt-8 pb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              {/* Icon */}
              <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-6 relative">
                <div className="absolute inset-0 rounded-2xl glow-atmospheric glow-atmospheric--breathe bg-gradient-to-br from-primary/30 to-accent/30 blur-xl" />
                <IconComponent className="w-10 h-10 text-primary relative z-10" />
              </div>

              <DialogHeader className="text-center">
                <DialogTitle className="text-2xl font-semibold mb-2">
                  {step.title}
                </DialogTitle>
                <DialogDescription className="text-base text-muted-foreground leading-relaxed">
                  {step.description}
                </DialogDescription>
              </DialogHeader>

              {/* Feature highlights for specific steps */}
              {currentStep === 1 && (
                <div className="mt-6 grid grid-cols-2 gap-3 text-left">
                  <FeatureHighlight
                    icon="phone"
                    text="Anrufe automatisch beantworten"
                  />
                  <FeatureHighlight
                    icon="message"
                    text="Fragen intelligent beantworten"
                  />
                  <FeatureHighlight
                    icon="calendar"
                    text="Termine vereinbaren"
                  />
                  <FeatureHighlight
                    icon="clock"
                    text="24/7 verfügbar"
                  />
                </div>
              )}

              {currentStep === 2 && (
                <div className="mt-6 grid grid-cols-2 gap-3 text-left">
                  <FeatureHighlight
                    icon="sync"
                    text="Automatische Synchronisation"
                  />
                  <FeatureHighlight
                    icon="check"
                    text="Konflikterkennung"
                  />
                  <FeatureHighlight
                    icon="users"
                    text="Einladungen versenden"
                  />
                  <FeatureHighlight
                    icon="shield"
                    text="Sichere Verbindung"
                  />
                </div>
              )}

              {currentStep === 3 && (
                <div className="mt-6 grid grid-cols-2 gap-3 text-left">
                  <FeatureHighlight
                    icon="credit"
                    text="Pay-per-Use"
                  />
                  <FeatureHighlight
                    icon="chart"
                    text="Transparente Abrechnung"
                  />
                  <FeatureHighlight
                    icon="infinity"
                    text="Kein Verfall"
                  />
                  <FeatureHighlight
                    icon="secure"
                    text="Sichere Zahlung"
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Step indicators */}
        <div className="flex justify-center gap-2 pb-4">
          {ONBOARDING_STEPS.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={cn(
                'w-2 h-2 rounded-full transition-all duration-300',
                index === currentStep
                  ? 'w-6 bg-primary'
                  : index < currentStep
                  ? 'bg-primary/50'
                  : 'bg-muted-foreground/30'
              )}
              aria-label={`Schritt ${index + 1}`}
            />
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="px-6 pb-6 flex gap-3">
          {currentStep > 0 && (
            <Button
              variant="outline"
              onClick={handlePrev}
              className="flex-1 gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Zurück
            </Button>
          )}
          <Button
            onClick={handleNext}
            className={cn(
              'gap-2',
              currentStep === 0 ? 'w-full' : 'flex-1'
            )}
          >
            {currentStep === totalSteps - 1 ? (
              <>
                <Rocket className="w-4 h-4" />
                Los geht&apos;s!
              </>
            ) : (
              <>
                Weiter
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface FeatureHighlightProps {
  icon: string;
  text: string;
}

function FeatureHighlight({ icon, text }: FeatureHighlightProps) {
  const iconElement = {
    phone: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
    message: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    calendar: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    clock: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    sync: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    check: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    users: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    shield: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    credit: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
    chart: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    infinity: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.178 8c5.096 0 5.096 8 0 8-5.095 0-7.133-8-12.739-8-4.476 0-4.476 8 0 8 5.606 0 7.644-8 12.74-8z" />
      </svg>
    ),
    secure: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  }[icon];

  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
      <div className="text-primary">{iconElement}</div>
      <span className="text-xs text-muted-foreground">{text}</span>
    </div>
  );
}
