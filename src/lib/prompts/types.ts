/**
 * Configuration for building system prompts
 */
export interface PromptConfig {
  businessName: string;
  businessDescription?: string;
  businessHours: string;
  services: string[];
  faqs: { question: string; answer: string }[];
  policies?: string;
  hasGoogleCalendar: boolean;
}
