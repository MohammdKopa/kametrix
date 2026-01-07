/**
 * Screen Reader Announcer
 *
 * Provides utilities for announcing content to screen readers.
 * Implements WCAG 2.1 Success Criteria:
 * - 4.1.3 Status Messages
 */

type Politeness = 'polite' | 'assertive';

/**
 * Singleton announcer instance
 */
let announcerElement: HTMLElement | null = null;
let politeAnnouncerElement: HTMLElement | null = null;
let assertiveAnnouncerElement: HTMLElement | null = null;

/**
 * Create a visually hidden element for screen reader announcements
 */
function createAnnouncerElement(politeness: Politeness): HTMLElement {
  const element = document.createElement('div');
  element.setAttribute('aria-live', politeness);
  element.setAttribute('aria-atomic', 'true');
  element.setAttribute('role', politeness === 'assertive' ? 'alert' : 'status');
  element.className = 'sr-only';
  element.style.cssText = `
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  `;
  document.body.appendChild(element);
  return element;
}

/**
 * Initialize the announcer elements
 */
export function initializeAnnouncer(): void {
  if (typeof document === 'undefined') return;

  if (!politeAnnouncerElement) {
    politeAnnouncerElement = createAnnouncerElement('polite');
  }
  if (!assertiveAnnouncerElement) {
    assertiveAnnouncerElement = createAnnouncerElement('assertive');
  }
}

/**
 * Announce a message to screen readers
 * @param message - The message to announce
 * @param politeness - 'polite' (default) or 'assertive'
 */
export function announce(
  message: string,
  politeness: Politeness = 'polite'
): void {
  if (typeof document === 'undefined') return;

  initializeAnnouncer();

  const element = politeness === 'assertive' ? assertiveAnnouncerElement : politeAnnouncerElement;
  if (!element) return;

  // Clear the element first to ensure the announcement is read
  element.textContent = '';

  // Use requestAnimationFrame to ensure the DOM updates
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (element) {
        element.textContent = message;
      }
    });
  });
}

/**
 * Announce a polite message (doesn't interrupt current speech)
 */
export function announcePolite(message: string): void {
  announce(message, 'polite');
}

/**
 * Announce an assertive message (interrupts current speech)
 */
export function announceAssertive(message: string): void {
  announce(message, 'assertive');
}

/**
 * Clear any pending announcements
 */
export function clearAnnouncements(): void {
  if (politeAnnouncerElement) {
    politeAnnouncerElement.textContent = '';
  }
  if (assertiveAnnouncerElement) {
    assertiveAnnouncerElement.textContent = '';
  }
}

/**
 * Destroy the announcer elements
 */
export function destroyAnnouncer(): void {
  if (politeAnnouncerElement) {
    politeAnnouncerElement.remove();
    politeAnnouncerElement = null;
  }
  if (assertiveAnnouncerElement) {
    assertiveAnnouncerElement.remove();
    assertiveAnnouncerElement = null;
  }
}

/**
 * Common announcement patterns
 */
export const AnnouncementPatterns = {
  /**
   * Announce navigation to a new page/section
   */
  navigation: (pageName: string) => announce(`Navigated to ${pageName}`),

  /**
   * Announce form submission result
   */
  formSubmitted: (success: boolean, message?: string) =>
    announce(
      success
        ? message || 'Form submitted successfully'
        : message || 'Form submission failed',
      success ? 'polite' : 'assertive'
    ),

  /**
   * Announce loading state
   */
  loading: (isLoading: boolean, itemName?: string) =>
    announce(
      isLoading
        ? `Loading ${itemName || 'content'}...`
        : `${itemName || 'Content'} loaded`,
      'polite'
    ),

  /**
   * Announce error
   */
  error: (message: string) => announce(`Error: ${message}`, 'assertive'),

  /**
   * Announce success
   */
  success: (message: string) => announce(message, 'polite'),

  /**
   * Announce item added/removed from list
   */
  listUpdate: (action: 'added' | 'removed', itemName: string) =>
    announce(`${itemName} ${action}`, 'polite'),

  /**
   * Announce dialog opened/closed
   */
  dialog: (isOpen: boolean, dialogName?: string) =>
    announce(
      isOpen
        ? `${dialogName || 'Dialog'} opened`
        : `${dialogName || 'Dialog'} closed`,
      'polite'
    ),

  /**
   * Announce progress
   */
  progress: (percentage: number, taskName?: string) =>
    announce(
      `${taskName || 'Progress'}: ${percentage}%`,
      'polite'
    ),

  /**
   * Announce selection change
   */
  selection: (selectedItem: string) =>
    announce(`Selected: ${selectedItem}`, 'polite'),

  /**
   * Announce toggle state
   */
  toggle: (itemName: string, isOn: boolean) =>
    announce(`${itemName} ${isOn ? 'enabled' : 'disabled'}`, 'polite'),

  /**
   * Announce voice call status
   */
  voiceCallStatus: (status: string) =>
    announce(`Voice call: ${status}`, 'polite'),

  /**
   * Announce voice agent speaking
   */
  voiceAgentSpeaking: (isSpeaking: boolean) =>
    announce(
      isSpeaking ? 'Voice agent is speaking' : 'Voice agent finished speaking',
      'polite'
    ),
};
