'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  announce,
  announcePolite,
  announceAssertive,
  AnnouncementPatterns,
  initializeAnnouncer,
} from '@/lib/accessibility/announcer';
import {
  createFocusTrap,
  focusFirstElement,
  focusLastElement,
  getFocusableElements,
  createFocusState,
} from '@/lib/accessibility/focus-management';
import {
  handleArrowNavigation,
  handleKeyboardActivation,
  handleEscape,
  detectKeyboardNavigation,
} from '@/lib/accessibility/keyboard-navigation';
import {
  generateAriaId,
  setAriaExpanded,
  setAriaCurrent,
  setAriaInvalid,
  setAriaBusy,
} from '@/lib/accessibility/aria-utils';

/**
 * Hook for screen reader announcements
 */
export function useAnnounce() {
  useEffect(() => {
    initializeAnnouncer();
  }, []);

  return {
    announce,
    announcePolite,
    announceAssertive,
    patterns: AnnouncementPatterns,
  };
}

/**
 * Hook for managing focus trap within a container
 */
export function useFocusTrap<T extends HTMLElement>(active: boolean = false) {
  const containerRef = useRef<T>(null);
  const focusTrap = useRef<ReturnType<typeof createFocusTrap> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    focusTrap.current = createFocusTrap(containerRef.current);

    if (active) {
      focusTrap.current.activate();
    }

    return () => {
      focusTrap.current?.deactivate();
    };
  }, [active]);

  const activate = useCallback(() => {
    focusTrap.current?.activate();
  }, []);

  const deactivate = useCallback(() => {
    focusTrap.current?.deactivate();
  }, []);

  return {
    containerRef,
    activate,
    deactivate,
  };
}

/**
 * Hook for roving tabindex pattern
 */
export function useRovingTabIndex<T extends HTMLElement>(
  itemSelector: string,
  options: {
    vertical?: boolean;
    horizontal?: boolean;
    loop?: boolean;
  } = {}
) {
  const containerRef = useRef<T>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const { vertical = true, horizontal = false, loop = true } = options;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const elements = Array.from(
      container.querySelectorAll(itemSelector)
    ) as HTMLElement[];

    // Initialize tabindex
    elements.forEach((el, i) => {
      el.setAttribute('tabindex', i === currentIndex ? '0' : '-1');
    });

    function handleKeyDown(event: KeyboardEvent) {
      const newIndex = handleArrowNavigation(event, elements, {
        vertical,
        horizontal,
        loop,
      });

      if (newIndex !== null) {
        elements.forEach((el, i) => {
          el.setAttribute('tabindex', i === newIndex ? '0' : '-1');
        });
        setCurrentIndex(newIndex);
      }
    }

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [itemSelector, currentIndex, vertical, horizontal, loop]);

  return {
    containerRef,
    currentIndex,
    setCurrentIndex,
  };
}

/**
 * Hook for detecting keyboard vs mouse navigation
 */
export function useKeyboardNavigation() {
  const [isKeyboardUser, setIsKeyboardUser] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Tab') {
        setIsKeyboardUser(true);
      }
    }

    function handleMouseDown() {
      setIsKeyboardUser(false);
    }

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  return isKeyboardUser;
}

/**
 * Hook for generating unique ARIA IDs
 */
export function useAriaIds(prefix: string = 'aria') {
  const idsRef = useRef<Map<string, string>>(new Map());

  const getId = useCallback(
    (key: string): string => {
      if (!idsRef.current.has(key)) {
        idsRef.current.set(key, generateAriaId(`${prefix}-${key}`));
      }
      return idsRef.current.get(key)!;
    },
    [prefix]
  );

  return { getId };
}

/**
 * Hook for managing aria-describedby relationships
 */
export function useAriaDescribedBy() {
  const [describedByIds, setDescribedByIds] = useState<string[]>([]);

  const addDescription = useCallback((id: string) => {
    setDescribedByIds(prev => [...new Set([...prev, id])]);
  }, []);

  const removeDescription = useCallback((id: string) => {
    setDescribedByIds(prev => prev.filter(d => d !== id));
  }, []);

  const describedBy = describedByIds.length > 0 ? describedByIds.join(' ') : undefined;

  return {
    describedBy,
    addDescription,
    removeDescription,
  };
}

/**
 * Hook for form field accessibility
 */
export function useAccessibleFormField(options: {
  errorMessage?: string;
  helpText?: string;
  required?: boolean;
}) {
  const { errorMessage, helpText, required } = options;
  const { getId } = useAriaIds('field');

  const inputId = getId('input');
  const errorId = getId('error');
  const helpId = getId('help');

  const describedByIds: string[] = [];
  if (helpText) describedByIds.push(helpId);
  if (errorMessage) describedByIds.push(errorId);

  return {
    inputProps: {
      id: inputId,
      'aria-invalid': !!errorMessage,
      'aria-required': required,
      'aria-describedby': describedByIds.length > 0 ? describedByIds.join(' ') : undefined,
    },
    labelProps: {
      htmlFor: inputId,
    },
    errorProps: {
      id: errorId,
      role: 'alert' as const,
      'aria-live': 'polite' as const,
    },
    helpProps: {
      id: helpId,
    },
    hasError: !!errorMessage,
  };
}

/**
 * Hook for accessible loading states
 */
export function useAccessibleLoading(isLoading: boolean, loadingText?: string) {
  const { announcePolite } = useAnnounce();
  const prevLoadingRef = useRef(isLoading);

  useEffect(() => {
    if (isLoading && !prevLoadingRef.current) {
      announcePolite(loadingText || 'Loading...');
    } else if (!isLoading && prevLoadingRef.current) {
      announcePolite('Loading complete');
    }
    prevLoadingRef.current = isLoading;
  }, [isLoading, loadingText, announcePolite]);

  return {
    'aria-busy': isLoading,
    'aria-live': 'polite' as const,
  };
}

/**
 * Hook for managing skip links
 */
export function useSkipLink(targetId: string) {
  const skipToContent = useCallback(() => {
    const target = document.getElementById(targetId);
    if (target) {
      target.setAttribute('tabindex', '-1');
      target.focus();
      target.removeAttribute('tabindex');
    }
  }, [targetId]);

  return { skipToContent };
}

/**
 * Hook for accessible expanded/collapsed state
 */
export function useAccessibleExpanded(initialExpanded: boolean = false) {
  const [expanded, setExpanded] = useState(initialExpanded);
  const contentId = generateAriaId('expandable-content');

  const toggle = useCallback(() => {
    setExpanded(prev => !prev);
  }, []);

  return {
    expanded,
    setExpanded,
    toggle,
    triggerProps: {
      'aria-expanded': expanded,
      'aria-controls': contentId,
    },
    contentProps: {
      id: contentId,
      hidden: !expanded,
    },
  };
}

/**
 * Hook for voice call accessibility
 */
export function useVoiceCallAccessibility(status: string) {
  const { patterns } = useAnnounce();
  const prevStatusRef = useRef(status);

  useEffect(() => {
    if (status !== prevStatusRef.current) {
      patterns.voiceCallStatus(status);
      prevStatusRef.current = status;
    }
  }, [status, patterns]);

  return {
    statusProps: {
      role: 'status' as const,
      'aria-live': 'polite' as const,
      'aria-label': `Call status: ${status}`,
    },
  };
}
