/**
 * Onboarding types for new user onboarding flow
 */

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface OnboardingState {
  isOpen: boolean;
  currentStep: number;
  hasCompletedOnboarding: boolean;
  showTooltips: boolean;
  tutorialMode: boolean;
}

export interface TooltipConfig {
  id: string;
  targetSelector: string;
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  feature: 'calendar' | 'voice-agent' | 'credits' | 'agents' | 'general';
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'getting-started' | 'calendar' | 'voice-agent' | 'billing' | 'troubleshooting';
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Willkommen bei Kametrix!',
    description: 'Ihr KI-Telefonassistent wartet auf Sie. Lassen Sie uns gemeinsam die wichtigsten Funktionen kennenlernen.',
    icon: 'Sparkles',
  },
  {
    id: 'voice-agent',
    title: 'KI-Sprachassistent',
    description: 'Erstellen Sie intelligente Telefonassistenten, die Anrufe entgegennehmen, Fragen beantworten und Termine vereinbaren.',
    icon: 'Bot',
  },
  {
    id: 'calendar',
    title: 'Kalender-Integration',
    description: 'Verbinden Sie Ihren Google Kalender und lassen Sie Ihren Assistenten automatisch Termine buchen.',
    icon: 'Calendar',
  },
  {
    id: 'credits',
    title: 'Guthaben-System',
    description: 'Kaufen Sie Credits, um Anrufe zu finanzieren. Jeder Anruf wird minutengenau abgerechnet.',
    icon: 'Wallet',
  },
  {
    id: 'first-agent',
    title: 'Ersten Assistenten erstellen',
    description: 'Bereit? Erstellen Sie jetzt Ihren ersten KI-Telefonassistenten in nur wenigen Minuten!',
    icon: 'Rocket',
  },
];

export const DEFAULT_ONBOARDING_STATE: OnboardingState = {
  isOpen: false,
  currentStep: 0,
  hasCompletedOnboarding: false,
  showTooltips: true,
  tutorialMode: false,
};
