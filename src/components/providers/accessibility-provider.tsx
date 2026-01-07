'use client';

import * as React from 'react';
import { initializeAnnouncer, destroyAnnouncer } from '@/lib/accessibility/announcer';

interface AccessibilityContextValue {
  isKeyboardUser: boolean;
  prefersReducedMotion: boolean;
  prefersHighContrast: boolean;
  announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void;
}

const AccessibilityContext = React.createContext<AccessibilityContextValue | null>(null);

export function useAccessibilityContext() {
  const context = React.useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibilityContext must be used within AccessibilityProvider');
  }
  return context;
}

interface AccessibilityProviderProps {
  children: React.ReactNode;
}

/**
 * Accessibility Provider
 *
 * Provides accessibility context and utilities across the application.
 * Features:
 * - Keyboard navigation detection
 * - Reduced motion preference detection
 * - High contrast mode detection
 * - Screen reader announcements
 */
export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const [isKeyboardUser, setIsKeyboardUser] = React.useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);
  const [prefersHighContrast, setPrefersHighContrast] = React.useState(false);

  // Initialize announcer on mount
  React.useEffect(() => {
    initializeAnnouncer();
    return () => {
      destroyAnnouncer();
    };
  }, []);

  // Detect keyboard vs mouse navigation
  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Tab') {
        setIsKeyboardUser(true);
        document.body.classList.add('keyboard-navigation');
      }
    }

    function handleMouseDown() {
      setIsKeyboardUser(false);
      document.body.classList.remove('keyboard-navigation');
    }

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  // Detect reduced motion preference
  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  // Detect high contrast preference
  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: more)');

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersHighContrast(event.matches);
    };

    setPrefersHighContrast(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  // Announce to screen reader function
  const announceToScreenReader = React.useCallback(
    (message: string, priority: 'polite' | 'assertive' = 'polite') => {
      const element = document.createElement('div');
      element.setAttribute('role', priority === 'assertive' ? 'alert' : 'status');
      element.setAttribute('aria-live', priority);
      element.setAttribute('aria-atomic', 'true');
      element.className = 'sr-only';
      element.textContent = message;

      document.body.appendChild(element);

      // Remove after announcement
      setTimeout(() => {
        document.body.removeChild(element);
      }, 1000);
    },
    []
  );

  const value: AccessibilityContextValue = {
    isKeyboardUser,
    prefersReducedMotion,
    prefersHighContrast,
    announceToScreenReader,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

/**
 * Hook to detect if reduced motion is preferred
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

/**
 * Hook to detect if high contrast is preferred
 */
export function usePrefersHighContrast(): boolean {
  const [prefersHighContrast, setPrefersHighContrast] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: more)');
    setPrefersHighContrast(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersHighContrast(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersHighContrast;
}
