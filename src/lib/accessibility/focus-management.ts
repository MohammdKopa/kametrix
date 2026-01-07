/**
 * Focus Management Utilities
 *
 * Provides utilities for managing focus in accessible applications.
 * Implements WCAG 2.1 Success Criteria:
 * - 2.4.3 Focus Order
 * - 2.4.7 Focus Visible
 */

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    'a[href]:not([disabled]):not([tabindex="-1"])',
    'button:not([disabled]):not([tabindex="-1"])',
    'input:not([disabled]):not([tabindex="-1"])',
    'select:not([disabled]):not([tabindex="-1"])',
    'textarea:not([disabled]):not([tabindex="-1"])',
    '[tabindex]:not([tabindex="-1"]):not([disabled])',
    '[contenteditable="true"]',
  ].join(',');

  return Array.from(container.querySelectorAll(focusableSelectors)) as HTMLElement[];
}

/**
 * Focus trap - keeps focus within a container (useful for modals/dialogs)
 */
export function createFocusTrap(container: HTMLElement): {
  activate: () => void;
  deactivate: () => void;
} {
  let previouslyFocusedElement: HTMLElement | null = null;

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key !== 'Tab') return;

    const focusableElements = getFocusableElements(container);
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  return {
    activate() {
      previouslyFocusedElement = document.activeElement as HTMLElement;
      container.addEventListener('keydown', handleKeyDown);

      // Focus first focusable element
      const focusableElements = getFocusableElements(container);
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    },
    deactivate() {
      container.removeEventListener('keydown', handleKeyDown);

      // Restore focus to previously focused element
      if (previouslyFocusedElement && typeof previouslyFocusedElement.focus === 'function') {
        previouslyFocusedElement.focus();
      }
    },
  };
}

/**
 * Focus the first focusable element within a container
 */
export function focusFirstElement(container: HTMLElement): void {
  const focusableElements = getFocusableElements(container);
  if (focusableElements.length > 0) {
    focusableElements[0].focus();
  }
}

/**
 * Focus the last focusable element within a container
 */
export function focusLastElement(container: HTMLElement): void {
  const focusableElements = getFocusableElements(container);
  if (focusableElements.length > 0) {
    focusableElements[focusableElements.length - 1].focus();
  }
}

/**
 * Check if an element is currently focusable
 */
export function isFocusable(element: HTMLElement): boolean {
  if (element.matches('[disabled], [tabindex="-1"]')) {
    return false;
  }

  return element.matches(
    'a[href], button, input, select, textarea, [tabindex], [contenteditable="true"]'
  );
}

/**
 * Set focus to an element after a specified delay
 * Useful for animations or transitions
 */
export function focusWithDelay(element: HTMLElement, delay: number = 0): void {
  setTimeout(() => {
    element.focus();
  }, delay);
}

/**
 * Save and restore focus state
 */
export function createFocusState(): {
  save: () => void;
  restore: () => void;
} {
  let savedElement: HTMLElement | null = null;

  return {
    save() {
      savedElement = document.activeElement as HTMLElement;
    },
    restore() {
      if (savedElement && typeof savedElement.focus === 'function') {
        savedElement.focus();
      }
    },
  };
}
