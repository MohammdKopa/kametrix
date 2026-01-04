/**
 * Supported business types for context-aware prompt generation
 */
export type BusinessType =
  | 'gastronomy'
  | 'salon'
  | 'medical'
  | 'trade'
  | 'retail'
  | 'service'
  | 'general';

/**
 * Dynamic variable definition for template substitution
 */
export interface DynamicVariable {
  name: string;
  value: string;
  description?: string;
}

/**
 * FAQ entry with optional category for better organization
 */
export interface FAQ {
  question: string;
  answer: string;
  category?: string;
}

/**
 * Contact information for the business
 */
export interface ContactInfo {
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
}

/**
 * Extended configuration for building enhanced system prompts
 * with better context awareness, clarity, and specificity
 */
export interface PromptConfig {
  // Core business information
  businessName: string;
  businessDescription?: string;
  businessHours: string;
  services: string[];

  // Knowledge base
  faqs: FAQ[];
  policies?: string;

  // Context awareness enhancements
  businessType?: BusinessType;
  contactInfo?: ContactInfo;
  specialInstructions?: string;

  // Dynamic variables for template substitution
  customVariables?: DynamicVariable[];

  // Integration flags
  hasGoogleCalendar: boolean;

  // Style and tone customization
  tone?: 'formal' | 'friendly' | 'professional';
  responseLength?: 'brief' | 'moderate' | 'detailed';
}

/**
 * Template section for modular prompt building
 */
export interface PromptSection {
  id: string;
  title: string;
  content: string;
  priority: number;
  enabled: boolean;
}

/**
 * Generated prompt result with metadata
 */
export interface GeneratedPrompt {
  prompt: string;
  sections: PromptSection[];
  variables: DynamicVariable[];
  metadata: {
    businessType: BusinessType;
    totalLength: number;
    sectionCount: number;
    generatedAt: string;
  };
}
