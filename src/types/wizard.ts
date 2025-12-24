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
    voiceProvider: 'elevenlabs' | 'vapi' | 'cartesia';
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
    voiceId: 'marissa',
    voiceProvider: 'elevenlabs',
  },
  greeting: {
    agentName: '',
    greeting: '',
    endCallMessage: 'Thank you for calling. Have a great day!',
  },
};
