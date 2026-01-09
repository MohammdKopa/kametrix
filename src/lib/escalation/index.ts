/**
 * Call Escalation Module
 *
 * Provides functionality for:
 * - Detecting when calls should be escalated to human operators
 * - Managing escalation configuration
 * - Handling call transfers
 * - Logging escalation events
 * - Real-time conversation tracking for automatic escalation
 */

export { EscalationService } from './escalation-service';
export { EscalationDetector } from './escalation-detector';
export {
  getEscalationConfig,
  createEscalationConfig,
  updateEscalationConfig,
} from './config-manager';
export {
  logEscalationEvent,
  getEscalationAnalytics,
  getEscalationHistory,
} from './escalation-logger';
export {
  buildEscalationTools,
  isEscalationTool,
  getEscalationToolNames,
} from './tool-definitions';
export {
  RealTimeConversationTracker,
  realTimeTracker,
  type ConversationMessage,
} from './real-time-tracker';
