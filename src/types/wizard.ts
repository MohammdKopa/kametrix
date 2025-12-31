/**
 * Wizard state types for agent creation wizard
 */

export interface WizardState {
  step: number;
  businessInfo: {
    businessName: string;
    businessDescription: string;
    businessHours: string;
    services: string[];
  };
  knowledge: {
    faqs: { question: string; answer: string }[];
    policies: string;
  };
  voice: {
    voiceId: string;
    voiceProvider: 'azure' | '11labs';
  };
  greeting: {
    agentName: string;
    greeting: string;
    endCallMessage: string;
  };
}

export const DEFAULT_WIZARD_STATE: WizardState = {
  step: 1,
  businessInfo: {
    businessName: '',
    businessDescription: '',
    businessHours: '',
    services: [],
  },
  knowledge: {
    faqs: [
      { question: '', answer: '' },
      { question: '', answer: '' },
      { question: '', answer: '' },
    ],
    policies: '',
  },
  voice: {
    voiceId: 'EXAVITQu4vr4xnSDxMaL',
    voiceProvider: '11labs',
  },
  greeting: {
    agentName: '',
    greeting: '',
    endCallMessage: 'Vielen Dank für Ihren Anruf. Auf Wiederhören!',
  },
};
