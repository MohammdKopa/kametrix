'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Live Region Component
 *
 * Provides accessible announcements to screen readers.
 * Implements WCAG 2.1 Success Criterion 4.1.3 Status Messages (Level AA)
 */
interface LiveRegionProps {
  children?: React.ReactNode;
  /** The politeness level of the announcement */
  politeness?: 'polite' | 'assertive' | 'off';
  /** Whether the entire region should be announced */
  atomic?: boolean;
  /** The role of the region */
  role?: 'status' | 'alert' | 'log' | 'timer' | 'marquee';
  /** Whether the region should be visually hidden */
  visuallyHidden?: boolean;
  className?: string;
}

export function LiveRegion({
  children,
  politeness = 'polite',
  atomic = true,
  role,
  visuallyHidden = true,
  className,
}: LiveRegionProps) {
  // Determine the role based on politeness if not explicitly provided
  const computedRole = role ?? (politeness === 'assertive' ? 'alert' : 'status');

  return (
    <div
      role={computedRole}
      aria-live={politeness}
      aria-atomic={atomic}
      className={cn(
        visuallyHidden && 'sr-only',
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Hook for managing live region announcements
 */
export function useLiveAnnouncement() {
  const [announcement, setAnnouncement] = React.useState<string>('');
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const announce = React.useCallback((message: string, clearAfter: number = 1000) => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set the announcement
    setAnnouncement(message);

    // Clear the announcement after a delay to allow re-announcements
    timeoutRef.current = setTimeout(() => {
      setAnnouncement('');
    }, clearAfter);
  }, []);

  const clear = React.useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setAnnouncement('');
  }, []);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    announcement,
    announce,
    clear,
  };
}

/**
 * Loading Status Announcer
 *
 * Announces loading states to screen readers
 */
interface LoadingAnnouncerProps {
  isLoading: boolean;
  loadingMessage?: string;
  completedMessage?: string;
}

export function LoadingAnnouncer({
  isLoading,
  loadingMessage = 'Loading...',
  completedMessage = 'Loading complete',
}: LoadingAnnouncerProps) {
  const prevLoadingRef = React.useRef(isLoading);
  const [message, setMessage] = React.useState('');

  React.useEffect(() => {
    if (isLoading && !prevLoadingRef.current) {
      setMessage(loadingMessage);
    } else if (!isLoading && prevLoadingRef.current) {
      setMessage(completedMessage);
      // Clear after announcement
      setTimeout(() => setMessage(''), 1000);
    }
    prevLoadingRef.current = isLoading;
  }, [isLoading, loadingMessage, completedMessage]);

  return (
    <LiveRegion politeness="polite" atomic={true}>
      {message}
    </LiveRegion>
  );
}

/**
 * Toast/Notification Announcer
 *
 * Announces toast notifications to screen readers
 */
interface NotificationAnnouncerProps {
  notification: {
    id: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  } | null;
}

export function NotificationAnnouncer({ notification }: NotificationAnnouncerProps) {
  if (!notification) return null;

  const typeLabels = {
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    info: 'Information',
  };

  return (
    <LiveRegion
      politeness={notification.type === 'error' ? 'assertive' : 'polite'}
      role={notification.type === 'error' ? 'alert' : 'status'}
    >
      {`${typeLabels[notification.type]}: ${notification.message}`}
    </LiveRegion>
  );
}

/**
 * Progress Announcer
 *
 * Announces progress updates to screen readers at intervals
 */
interface ProgressAnnouncerProps {
  progress: number;
  /** How often to announce progress (in percentage points) */
  announceEvery?: number;
  taskName?: string;
}

export function ProgressAnnouncer({
  progress,
  announceEvery = 25,
  taskName = 'Progress',
}: ProgressAnnouncerProps) {
  const lastAnnouncedRef = React.useRef(0);
  const [message, setMessage] = React.useState('');

  React.useEffect(() => {
    const roundedProgress = Math.floor(progress / announceEvery) * announceEvery;

    if (roundedProgress > lastAnnouncedRef.current || progress === 100) {
      lastAnnouncedRef.current = roundedProgress;

      if (progress === 100) {
        setMessage(`${taskName} complete`);
      } else if (roundedProgress > 0) {
        setMessage(`${taskName}: ${roundedProgress}%`);
      }

      // Clear after announcement
      setTimeout(() => setMessage(''), 1000);
    }
  }, [progress, announceEvery, taskName]);

  return (
    <LiveRegion politeness="polite">
      {message}
    </LiveRegion>
  );
}

/**
 * Form Validation Announcer
 *
 * Announces form validation errors to screen readers
 */
interface ValidationAnnouncerProps {
  errors: Record<string, string>;
}

export function ValidationAnnouncer({ errors }: ValidationAnnouncerProps) {
  const errorMessages = Object.entries(errors)
    .filter(([, message]) => message)
    .map(([field, message]) => `${field}: ${message}`);

  if (errorMessages.length === 0) return null;

  return (
    <LiveRegion politeness="assertive" role="alert">
      {`Form has ${errorMessages.length} error${errorMessages.length > 1 ? 's' : ''}: ${errorMessages.join('. ')}`}
    </LiveRegion>
  );
}
