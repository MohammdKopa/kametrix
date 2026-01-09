// Vapi client
export { getVapiClient } from './client';

// Assistant operations
export {
  createBusinessAssistant,
  updateAssistant,
  deleteAssistant,
  deleteAssistantGracefully,
  refreshAssistantDate,
} from './assistants';

// Phone number operations
export {
  listPhoneNumbers,
  assignAssistantToPhoneNumber,
  unassignPhoneNumber,
  unassignPhoneNumberGracefully,
} from './phone-numbers';

// Types
export type {
  CreateAssistantConfig,
  UpdateAssistantConfig,
  VapiAssistantResponse,
  VapiPhoneNumber,
  DeletionResult,
  PhoneOperationResult,
} from './types';
