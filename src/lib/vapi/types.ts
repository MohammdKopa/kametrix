/**
 * Configuration for creating a business voice assistant
 */
export interface CreateAssistantConfig {
  /** Assistant display name */
  name: string;
  /** Business name for system prompt context */
  businessName: string;
  /** Business operating hours (e.g., "9am-5pm Mon-Fri") */
  businessHours: string;
  /** List of services offered */
  services: string[];
  /** FAQ pairs for the assistant to answer */
  faqs: { question: string; answer: string }[];
  /** Voice ID for text-to-speech (e.g., "marissa" for ElevenLabs) */
  voiceId?: string;
  /** Custom greeting message (optional, will be generated if not provided) */
  greeting?: string;
  /** Whether user has Google Calendar connected (enables calendar tools) */
  hasGoogleCalendar?: boolean;
}

/**
 * Configuration for updating an existing assistant
 */
export type UpdateAssistantConfig = Partial<CreateAssistantConfig>;

/**
 * Response from Vapi when creating/updating an assistant
 * Subset of fields we care about
 */
export interface VapiAssistantResponse {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Phone number from Vapi
 */
export interface VapiPhoneNumber {
  id: string;
  number: string;
  name?: string;
  assistantId?: string | null;
  createdAt: string;
}

/**
 * Result of a graceful deletion attempt
 */
export interface DeletionResult {
  success: boolean;
  alreadyDeleted: boolean;
  error?: string;
}

/**
 * Result of a graceful phone number operation
 */
export interface PhoneOperationResult {
  success: boolean;
  notFound: boolean;
  error?: string;
}
