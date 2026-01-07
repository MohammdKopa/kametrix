/**
 * Tooltip configuration for contextual help throughout the app
 */

import { TooltipConfig } from '@/types/onboarding';

export const TOOLTIPS: TooltipConfig[] = [
  // Dashboard Tooltips
  {
    id: 'credit-balance',
    targetSelector: '[data-tooltip="credit-balance"]',
    title: 'Ihr Guthaben',
    content: 'Dies ist Ihr aktuelles Guthaben für Anrufe. Kaufen Sie Credits unter "Credits kaufen" wenn es niedrig wird.',
    position: 'bottom',
    feature: 'credits',
  },
  {
    id: 'active-agents',
    targetSelector: '[data-tooltip="active-agents"]',
    title: 'Aktive Assistenten',
    content: 'Die Anzahl Ihrer derzeit aktiven KI-Assistenten. Aktive Assistenten können Anrufe entgegennehmen.',
    position: 'bottom',
    feature: 'agents',
  },
  {
    id: 'calls-month',
    targetSelector: '[data-tooltip="calls-month"]',
    title: 'Anrufe diesen Monat',
    content: 'Die Gesamtzahl der Anrufe, die Ihre Assistenten in diesem Monat bearbeitet haben.',
    position: 'bottom',
    feature: 'general',
  },

  // Agent Tooltips
  {
    id: 'agent-status',
    targetSelector: '[data-tooltip="agent-status"]',
    title: 'Assistenten-Status',
    content: 'Grün bedeutet aktiv und bereit für Anrufe. Klicken Sie zum Aktivieren/Deaktivieren.',
    position: 'left',
    feature: 'agents',
  },
  {
    id: 'agent-phone',
    targetSelector: '[data-tooltip="agent-phone"]',
    title: 'Telefonnummer',
    content: 'Die zugewiesene Telefonnummer Ihres Assistenten. Anrufer können diese Nummer anrufen um mit dem Assistenten zu sprechen.',
    position: 'top',
    feature: 'voice-agent',
  },

  // Calendar Tooltips
  {
    id: 'google-connect',
    targetSelector: '[data-tooltip="google-connect"]',
    title: 'Google Kalender verbinden',
    content: 'Verbinden Sie Ihren Google Kalender, damit Ihr Assistent automatisch Termine buchen kann.',
    position: 'right',
    feature: 'calendar',
  },
  {
    id: 'appointment-duration',
    targetSelector: '[data-tooltip="appointment-duration"]',
    title: 'Standard-Termindauer',
    content: 'Diese Dauer wird für alle automatisch gebuchten Termine verwendet. Sie können zwischen 15, 30, 45 oder 60 Minuten wählen.',
    position: 'top',
    feature: 'calendar',
  },

  // Voice Agent Creation Tooltips
  {
    id: 'business-name',
    targetSelector: '[data-tooltip="business-name"]',
    title: 'Unternehmensname',
    content: 'Der Name Ihres Unternehmens wird vom Assistenten verwendet, um sich professionell vorzustellen.',
    position: 'right',
    feature: 'voice-agent',
  },
  {
    id: 'business-description',
    targetSelector: '[data-tooltip="business-description"]',
    title: 'Unternehmensbeschreibung',
    content: 'Beschreiben Sie Ihr Unternehmen kurz. Der Assistent nutzt diese Information, um Fragen über Ihr Geschäft zu beantworten.',
    position: 'right',
    feature: 'voice-agent',
  },
  {
    id: 'faqs',
    targetSelector: '[data-tooltip="faqs"]',
    title: 'Häufige Fragen (FAQs)',
    content: 'Fügen Sie hier häufig gestellte Fragen und Antworten hinzu. Der Assistent nutzt diese, um Anrufern schnell und präzise zu antworten.',
    position: 'right',
    feature: 'voice-agent',
  },
  {
    id: 'voice-selection',
    targetSelector: '[data-tooltip="voice-selection"]',
    title: 'Stimme auswählen',
    content: 'Wählen Sie eine Stimme, die zu Ihrem Unternehmen passt. Sie können jede Stimme vor der Auswahl anhören.',
    position: 'top',
    feature: 'voice-agent',
  },
  {
    id: 'greeting-message',
    targetSelector: '[data-tooltip="greeting-message"]',
    title: 'Begrüßung',
    content: 'Dies ist der erste Satz, den Anrufer hören. Gestalten Sie ihn freundlich und professionell.',
    position: 'right',
    feature: 'voice-agent',
  },
];

export const FEATURE_DESCRIPTIONS = {
  calendar: {
    title: 'Kalender-Integration',
    description: 'Verbinden Sie Ihren Google Kalender für automatische Terminbuchung',
    icon: 'Calendar',
  },
  'voice-agent': {
    title: 'KI-Sprachassistent',
    description: 'Intelligente Telefonassistenten für Ihr Unternehmen',
    icon: 'Bot',
  },
  credits: {
    title: 'Guthaben-System',
    description: 'Flexibles Pay-per-Use Abrechnungsmodell',
    icon: 'Wallet',
  },
  agents: {
    title: 'Assistenten-Verwaltung',
    description: 'Erstellen und verwalten Sie Ihre KI-Assistenten',
    icon: 'Users',
  },
  general: {
    title: 'Allgemein',
    description: 'Allgemeine Funktionen und Einstellungen',
    icon: 'Settings',
  },
};
