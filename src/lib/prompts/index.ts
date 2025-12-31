/**
 * Prompts module - Single source of truth for all system prompt and tool definitions
 *
 * This module consolidates prompt building logic that was previously
 * duplicated across:
 * - src/lib/vapi/assistants.ts
 * - src/app/api/agents/route.ts
 * - src/app/api/webhooks/vapi/route.ts
 */

export { buildSystemPrompt, buildDateHeader } from './system-prompt';
export { buildCalendarTools, CALENDAR_TOOL_NAMES } from './tool-definitions';
export type { PromptConfig } from './types';
