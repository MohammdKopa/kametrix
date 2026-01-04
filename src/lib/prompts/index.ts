/**
 * Prompts module - Single source of truth for all system prompt and tool definitions
 *
 * This module consolidates prompt building logic that was previously
 * duplicated across:
 * - src/lib/vapi/assistants.ts
 * - src/app/api/agents/route.ts
 * - src/app/api/webhooks/vapi/route.ts
 *
 * Enhanced with:
 * - Context-aware business type detection
 * - Dynamic variable substitution system
 * - Modular section-based templates
 * - Improved clarity and specificity
 */

// Core prompt building functions
export {
  buildSystemPrompt,
  buildSystemPromptWithMetadata,
  buildDateHeader,
  getBusinessType,
  validatePromptConfig,
} from './system-prompt';

// Calendar tool definitions
export { buildCalendarTools, CALENDAR_TOOL_NAMES } from './tool-definitions';

// Business type detection
export {
  detectBusinessType,
  getBusinessTypeContext,
  getBusinessTypeDisplayName,
  BUSINESS_TYPE_CONTEXT,
} from './business-type-detector';

// Template builder utilities
export {
  buildPromptSections,
  buildEnhancedPrompt,
  renderSections,
  SECTION_IDS,
} from './template-builder';

// Variable handling utilities
export {
  getSystemVariables,
  mergeVariables,
  interpolateVariables,
  validateVariables,
  extractVariableNames,
  createVariableContext,
} from './variable-handler';

// Types
export type {
  PromptConfig,
  BusinessType,
  DynamicVariable,
  FAQ,
  ContactInfo,
  PromptSection,
  GeneratedPrompt,
} from './types';
