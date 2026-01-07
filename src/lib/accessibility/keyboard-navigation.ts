/**
 * Keyboard Navigation Utilities
 *
 * Provides utilities for implementing keyboard navigation patterns.
 * Implements WCAG 2.1 Success Criteria:
 * - 2.1.1 Keyboard
 * - 2.1.2 No Keyboard Trap
 */

export const Keys = {
  ENTER: 'Enter',
  SPACE: ' ',
  TAB: 'Tab',
  ESCAPE: 'Escape',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown',
} as const;

export type KeyType = typeof Keys[keyof typeof Keys];

/**
 * Handle arrow key navigation within a list of elements
 */
export function handleArrowNavigation(
  event: KeyboardEvent,
  elements: HTMLElement[],
  options: {
    vertical?: boolean;
    horizontal?: boolean;
    loop?: boolean;
  } = {}
): number | null {
  const { vertical = true, horizontal = false, loop = true } = options;
  const currentIndex = elements.findIndex(el => el === document.activeElement);

  if (currentIndex === -1) return null;

  let newIndex: number | null = null;

  // Vertical navigation
  if (vertical) {
    if (event.key === Keys.ARROW_DOWN) {
      event.preventDefault();
      newIndex = currentIndex + 1;
      if (newIndex >= elements.length) {
        newIndex = loop ? 0 : elements.length - 1;
      }
    } else if (event.key === Keys.ARROW_UP) {
      event.preventDefault();
      newIndex = currentIndex - 1;
      if (newIndex < 0) {
        newIndex = loop ? elements.length - 1 : 0;
      }
    }
  }

  // Horizontal navigation
  if (horizontal) {
    if (event.key === Keys.ARROW_RIGHT) {
      event.preventDefault();
      newIndex = currentIndex + 1;
      if (newIndex >= elements.length) {
        newIndex = loop ? 0 : elements.length - 1;
      }
    } else if (event.key === Keys.ARROW_LEFT) {
      event.preventDefault();
      newIndex = currentIndex - 1;
      if (newIndex < 0) {
        newIndex = loop ? elements.length - 1 : 0;
      }
    }
  }

  // Home/End navigation
  if (event.key === Keys.HOME) {
    event.preventDefault();
    newIndex = 0;
  } else if (event.key === Keys.END) {
    event.preventDefault();
    newIndex = elements.length - 1;
  }

  if (newIndex !== null && elements[newIndex]) {
    elements[newIndex].focus();
    return newIndex;
  }

  return null;
}

/**
 * Handle keyboard activation (Enter/Space)
 */
export function handleKeyboardActivation(
  event: KeyboardEvent,
  callback: () => void,
  options: {
    preventDefault?: boolean;
    stopPropagation?: boolean;
  } = {}
): void {
  const { preventDefault = true, stopPropagation = false } = options;

  if (event.key === Keys.ENTER || event.key === Keys.SPACE) {
    if (preventDefault) event.preventDefault();
    if (stopPropagation) event.stopPropagation();
    callback();
  }
}

/**
 * Handle escape key to close/dismiss
 */
export function handleEscape(
  event: KeyboardEvent,
  callback: () => void,
  options: {
    preventDefault?: boolean;
    stopPropagation?: boolean;
  } = {}
): void {
  const { preventDefault = true, stopPropagation = true } = options;

  if (event.key === Keys.ESCAPE) {
    if (preventDefault) event.preventDefault();
    if (stopPropagation) event.stopPropagation();
    callback();
  }
}

/**
 * Create a roving tabindex handler for a group of elements
 * This pattern allows only one element in a group to be tabbable
 */
export function createRovingTabIndex(container: HTMLElement, selector: string): {
  init: () => void;
  destroy: () => void;
  setCurrentIndex: (index: number) => void;
} {
  let elements: HTMLElement[] = [];
  let currentIndex = 0;

  function handleKeyDown(event: KeyboardEvent) {
    const newIndex = handleArrowNavigation(event, elements, {
      vertical: true,
      horizontal: true,
      loop: true,
    });

    if (newIndex !== null) {
      updateTabIndex(newIndex);
    }
  }

  function updateTabIndex(newIndex: number) {
    elements.forEach((el, i) => {
      el.setAttribute('tabindex', i === newIndex ? '0' : '-1');
    });
    currentIndex = newIndex;
  }

  return {
    init() {
      elements = Array.from(container.querySelectorAll(selector)) as HTMLElement[];
      if (elements.length > 0) {
        updateTabIndex(0);
        container.addEventListener('keydown', handleKeyDown);
      }
    },
    destroy() {
      container.removeEventListener('keydown', handleKeyDown);
    },
    setCurrentIndex(index: number) {
      if (index >= 0 && index < elements.length) {
        updateTabIndex(index);
      }
    },
  };
}

/**
 * Check if keyboard navigation is being used (vs mouse)
 */
export function detectKeyboardNavigation(): {
  isKeyboardUser: () => boolean;
  addListeners: () => void;
  removeListeners: () => void;
} {
  let isKeyboard = false;

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === Keys.TAB) {
      isKeyboard = true;
      document.body.classList.add('keyboard-navigation');
    }
  }

  function handleMouseDown() {
    isKeyboard = false;
    document.body.classList.remove('keyboard-navigation');
  }

  return {
    isKeyboardUser: () => isKeyboard,
    addListeners() {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleMouseDown);
    },
    removeListeners() {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    },
  };
}
