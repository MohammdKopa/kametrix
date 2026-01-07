/**
 * FAQ data for the help system
 */

import { FAQItem } from '@/types/onboarding';

export const FAQ_DATA: FAQItem[] = [
  // Getting Started
  {
    id: 'what-is-kametrix',
    question: 'Was ist Kametrix?',
    answer: 'Kametrix ist eine Plattform für KI-Telefonassistenten. Sie können intelligente Sprachassistenten erstellen, die Anrufe für Ihr Unternehmen entgegennehmen, Fragen beantworten und sogar Termine vereinbaren.',
    category: 'getting-started',
  },
  {
    id: 'how-to-start',
    question: 'Wie starte ich mit Kametrix?',
    answer: 'Beginnen Sie mit der Erstellung Ihres ersten Assistenten unter "Agenten" > "Neuer Assistent". Folgen Sie dem Assistenten-Wizard und konfigurieren Sie Ihren Bot mit Unternehmensinformationen, FAQs und einer passenden Stimme.',
    category: 'getting-started',
  },
  {
    id: 'first-agent',
    question: 'Wie erstelle ich meinen ersten Assistenten?',
    answer: 'Klicken Sie auf "Neuer Assistent" und folgen Sie den 5 Schritten: 1) Unternehmensinformationen eingeben, 2) FAQs und Richtlinien hinzufügen, 3) Stimme auswählen, 4) Begrüßung konfigurieren, 5) Überprüfen und erstellen.',
    category: 'getting-started',
  },

  // Calendar
  {
    id: 'calendar-integration',
    question: 'Wie verbinde ich meinen Google Kalender?',
    answer: 'Gehen Sie zum Dashboard und klicken Sie auf "Mit Google verbinden" im Integrationen-Bereich. Erlauben Sie Kametrix den Zugriff auf Ihren Kalender. Ihr Assistent kann dann automatisch Termine buchen.',
    category: 'calendar',
  },
  {
    id: 'calendar-booking',
    question: 'Wie bucht mein Assistent Termine?',
    answer: 'Wenn ein Anrufer einen Termin wünscht, prüft der Assistent Ihre verfügbaren Zeiten im Google Kalender, schlägt passende Slots vor und erstellt bei Bestätigung automatisch einen Kalendereintrag.',
    category: 'calendar',
  },
  {
    id: 'calendar-conflicts',
    question: 'Was passiert bei Terminüberschneidungen?',
    answer: 'Der Assistent prüft automatisch auf Konflikte in allen verbundenen Kalendern. Bereits belegte Zeiten werden nicht für Buchungen angeboten, sodass Doppelbuchungen vermieden werden.',
    category: 'calendar',
  },
  {
    id: 'appointment-duration',
    question: 'Kann ich die Standard-Termindauer ändern?',
    answer: 'Ja! In den Einstellungen unter "Integrations" können Sie die Standard-Termindauer (15, 30, 45 oder 60 Minuten) festlegen. Diese wird für alle automatisch gebuchten Termine verwendet.',
    category: 'calendar',
  },

  // Voice Agent
  {
    id: 'voice-selection',
    question: 'Welche Stimmen stehen zur Verfügung?',
    answer: 'Wir bieten verschiedene deutsche Stimmen von ElevenLabs an: Sarah (weiblich, professionell), Matilda (weiblich, freundlich), Adam (männlich, vertrauenswürdig) und Antoni (männlich, freundlich).',
    category: 'voice-agent',
  },
  {
    id: 'agent-testing',
    question: 'Wie teste ich meinen Assistenten?',
    answer: 'Nach der Erstellung können Sie Ihren Assistenten direkt über den Browser testen. Klicken Sie auf "Testen" beim jeweiligen Assistenten und führen Sie einen Testanruf durch.',
    category: 'voice-agent',
  },
  {
    id: 'customize-responses',
    question: 'Kann ich die Antworten meines Assistenten anpassen?',
    answer: 'Ja! Beim Erstellen des Assistenten können Sie FAQs, Unternehmensinformationen, Begrüßung und Verabschiedung individuell gestalten. Der Assistent nutzt diese Informationen für seine Antworten.',
    category: 'voice-agent',
  },
  {
    id: 'phone-number',
    question: 'Wie bekommt mein Assistent eine Telefonnummer?',
    answer: 'Nach der Erstellung wird Ihrem Assistenten automatisch eine deutsche Telefonnummer zugewiesen. Diese finden Sie in der Assistenten-Übersicht. Kunden können dann direkt diese Nummer anrufen.',
    category: 'voice-agent',
  },

  // Billing
  {
    id: 'credit-system',
    question: 'Wie funktioniert das Guthaben-System?',
    answer: 'Sie kaufen Credits vorab, die für Anrufe verwendet werden. Die Abrechnung erfolgt minutengenau nach Gesprächszeit. Ihr aktuelles Guthaben sehen Sie jederzeit im Dashboard.',
    category: 'billing',
  },
  {
    id: 'credit-packages',
    question: 'Welche Guthaben-Pakete gibt es?',
    answer: 'Wir bieten verschiedene Pakete an, die Sie unter "Credits kaufen" einsehen können. Größere Pakete bieten oft einen besseren Minutenpreis. Guthaben verfällt nicht.',
    category: 'billing',
  },
  {
    id: 'low-balance',
    question: 'Was passiert bei niedrigem Guthaben?',
    answer: 'Bei niedrigem Guthaben werden Sie im Dashboard gewarnt. Sinkt das Guthaben auf 0, können weiterhin Anrufe angenommen werden (Grace Period), aber Sie sollten zeitnah aufladen.',
    category: 'billing',
  },
  {
    id: 'payment-methods',
    question: 'Welche Zahlungsmethoden werden akzeptiert?',
    answer: 'Wir akzeptieren alle gängigen Kreditkarten (Visa, Mastercard, American Express) sowie SEPA-Lastschrift über unseren sicheren Zahlungspartner Stripe.',
    category: 'billing',
  },

  // Troubleshooting
  {
    id: 'agent-not-responding',
    question: 'Mein Assistent reagiert nicht - was tun?',
    answer: 'Prüfen Sie zuerst Ihr Guthaben. Stellen Sie sicher, dass der Assistent aktiviert ist (grüner Status). Testen Sie den Assistenten über die Test-Funktion. Bei weiteren Problemen kontaktieren Sie uns.',
    category: 'troubleshooting',
  },
  {
    id: 'calendar-not-syncing',
    question: 'Kalender synchronisiert nicht?',
    answer: 'Trennen Sie die Google-Verbindung unter "Integrations" und verbinden Sie erneut. Stellen Sie sicher, dass Kametrix die nötigen Berechtigungen hat. Der Kalender muss öffentlich oder geteilt sein.',
    category: 'troubleshooting',
  },
  {
    id: 'call-quality',
    question: 'Die Sprachqualität ist schlecht - was kann ich tun?',
    answer: 'Die Sprachqualität hängt von der Telefonverbindung des Anrufers ab. Bei Testanrufen über den Browser sollte die Qualität sehr gut sein. Nutzen Sie eine stabile Internetverbindung.',
    category: 'troubleshooting',
  },
  {
    id: 'support-contact',
    question: 'Wie erreiche ich den Support?',
    answer: 'Kontaktieren Sie uns per E-Mail unter support@kametrix.de. Beschreiben Sie Ihr Problem möglichst genau und nennen Sie Ihre Account-E-Mail-Adresse für schnellere Hilfe.',
    category: 'troubleshooting',
  },
];

export const FAQ_CATEGORIES = [
  { id: 'getting-started', label: 'Erste Schritte', icon: 'Rocket' },
  { id: 'calendar', label: 'Kalender', icon: 'Calendar' },
  { id: 'voice-agent', label: 'Sprachassistent', icon: 'Bot' },
  { id: 'billing', label: 'Abrechnung', icon: 'Wallet' },
  { id: 'troubleshooting', label: 'Problemlösung', icon: 'Wrench' },
] as const;

export type FAQCategory = typeof FAQ_CATEGORIES[number]['id'];
