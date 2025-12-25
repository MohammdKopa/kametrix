// Vapi client
export { getVapiClient } from './client';

// Assistant operations
export {
  createBusinessAssistant,
  updateAssistant,
  deleteAssistant,
  refreshAssistantDate,
} from './assistants';

// Phone number operations
export {
  listPhoneNumbers,
  assignAssistantToPhoneNumber,
  unassignPhoneNumber,
} from './phone-numbers';

// Types
export type {
  CreateAssistantConfig,
  UpdateAssistantConfig,
  VapiAssistantResponse,
  VapiPhoneNumber,
} from './types';
