/**
 * Wizard state types for agent creation wizard
 */

/**
 * Auto-save status for the wizard
 */
export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

/**
 * Draft status for incomplete configurations
 */
export type DraftStatus = 'draft' | 'submitted' | 'published' | 'abandoned';

/**
 * Auto-save metadata tracked alongside wizard state
 */
export interface AutoSaveMetadata {
  draftId?: string;
  status: AutoSaveStatus;
  lastSavedAt?: Date;
  draftStatus: DraftStatus;
  error?: string;
}

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
  escalation: {
    enabled: boolean;
    forwardingNumber: string;
    businessHoursStart: string;
    businessHoursEnd: string;
    businessDays: string[];
    voicemailEnabled: boolean;
    maxClarifications: number;
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
  escalation: {
    enabled: false,
    forwardingNumber: '',
    businessHoursStart: '09:00',
    businessHoursEnd: '18:00',
    businessDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    voicemailEnabled: true,
    maxClarifications: 3,
  },
};
