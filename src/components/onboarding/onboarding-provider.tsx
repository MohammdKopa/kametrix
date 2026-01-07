'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingModal } from './onboarding-modal';
import { HelpPanel, HelpButton } from './help-panel';
import { OnboardingState, DEFAULT_ONBOARDING_STATE } from '@/types/onboarding';

const ONBOARDING_STORAGE_KEY = 'kametrix_onboarding';

interface OnboardingContextValue {
  state: OnboardingState;
  showOnboarding: () => void;
  hideOnboarding: () => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  showHelp: () => void;
  hideHelp: () => void;
  toggleTooltips: () => void;
  enableTutorialMode: () => void;
  disableTutorialMode: () => void;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

interface OnboardingProviderProps {
  children: ReactNode;
  isNewUser?: boolean;
}

export function OnboardingProvider({ children, isNewUser = false }: OnboardingProviderProps) {
  const router = useRouter();
  const [state, setState] = useState<OnboardingState>(() => {
    // Initialize from localStorage only on client
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY);
        if (stored) {
          return JSON.parse(stored);
        }
      } catch {
        // Ignore storage errors
      }
    }
    return DEFAULT_ONBOARDING_STATE;
  });

  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Handle mount state for SSR
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Persist state to localStorage
  useEffect(() => {
    if (isMounted) {
      try {
        localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(state));
      } catch {
        // Ignore storage errors
      }
    }
  }, [state, isMounted]);

  // Auto-show onboarding for first-time users (no localStorage entry yet)
  useEffect(() => {
    if (isMounted && !state.hasCompletedOnboarding) {
      // Check if this is truly a first visit (no localStorage entry)
      const hasSeenOnboarding = localStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (!hasSeenOnboarding || isNewUser) {
        setState((prev) => ({ ...prev, isOpen: true }));
      }
    }
  }, [isMounted, isNewUser, state.hasCompletedOnboarding]);

  const showOnboarding = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: true, currentStep: 0 }));
  }, []);

  const hideOnboarding = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const completeOnboarding = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isOpen: false,
      hasCompletedOnboarding: true,
    }));
  }, []);

  const resetOnboarding = useCallback(() => {
    setState(DEFAULT_ONBOARDING_STATE);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    }
  }, []);

  const showHelp = useCallback(() => {
    setIsHelpOpen(true);
  }, []);

  const hideHelp = useCallback(() => {
    setIsHelpOpen(false);
  }, []);

  const toggleTooltips = useCallback(() => {
    setState((prev) => ({ ...prev, showTooltips: !prev.showTooltips }));
  }, []);

  const enableTutorialMode = useCallback(() => {
    setState((prev) => ({ ...prev, tutorialMode: true }));
  }, []);

  const disableTutorialMode = useCallback(() => {
    setState((prev) => ({ ...prev, tutorialMode: false }));
  }, []);

  const handleCreateAgent = useCallback(() => {
    router.push('/dashboard/agents/new');
  }, [router]);

  const handleStartTutorial = useCallback(() => {
    setIsHelpOpen(false);
    setState((prev) => ({ ...prev, isOpen: true, currentStep: 0 }));
  }, []);

  const contextValue: OnboardingContextValue = {
    state,
    showOnboarding,
    hideOnboarding,
    completeOnboarding,
    resetOnboarding,
    showHelp,
    hideHelp,
    toggleTooltips,
    enableTutorialMode,
    disableTutorialMode,
  };

  // Don't render anything until mounted (to avoid hydration issues)
  if (!isMounted) {
    return <OnboardingContext.Provider value={contextValue}>{children}</OnboardingContext.Provider>;
  }

  return (
    <OnboardingContext.Provider value={contextValue}>
      {children}

      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={state.isOpen}
        onClose={hideOnboarding}
        onComplete={completeOnboarding}
        onCreateAgent={handleCreateAgent}
      />

      {/* Help Panel */}
      <HelpPanel
        isOpen={isHelpOpen}
        onClose={hideHelp}
        onStartTutorial={handleStartTutorial}
      />

      {/* Floating Help Button */}
      {!isHelpOpen && !state.isOpen && <HelpButton onClick={showHelp} />}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
