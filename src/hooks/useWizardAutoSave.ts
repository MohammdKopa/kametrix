'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { WizardState, AutoSaveStatus, AutoSaveMetadata } from '@/types/wizard';

const AUTO_SAVE_DEBOUNCE_MS = 1500; // 1.5 seconds debounce
const AUTO_SAVE_STORAGE_KEY = 'wizard_draft_backup';

interface UseWizardAutoSaveOptions {
  /** Whether auto-save is enabled (default: true) */
  enabled?: boolean;
  /** Debounce time in milliseconds (default: 1500) */
  debounceMs?: number;
  /** Callback when save succeeds */
  onSaveSuccess?: (draftId: string) => void;
  /** Callback when save fails */
  onSaveError?: (error: Error) => void;
}

interface UseWizardAutoSaveReturn {
  /** Current auto-save metadata */
  autoSaveMetadata: AutoSaveMetadata;
  /** Trigger an immediate save */
  saveNow: () => Promise<void>;
  /** Load existing draft from server */
  loadDraft: () => Promise<WizardState | null>;
  /** Clear the current draft (after publishing) */
  clearDraft: (agentId?: string) => Promise<void>;
  /** Get local backup from localStorage */
  getLocalBackup: () => WizardState | null;
  /** Check if there's an existing draft on the server */
  hasDraft: boolean;
  /** The draft ID if one exists */
  draftId: string | null;
}

/**
 * Hook for auto-saving wizard state to the backend with debouncing
 * Also maintains a localStorage backup for additional resilience
 */
export function useWizardAutoSave(
  wizardState: WizardState,
  options: UseWizardAutoSaveOptions = {}
): UseWizardAutoSaveReturn {
  const {
    enabled = true,
    debounceMs = AUTO_SAVE_DEBOUNCE_MS,
    onSaveSuccess,
    onSaveError,
  } = options;

  const [autoSaveMetadata, setAutoSaveMetadata] = useState<AutoSaveMetadata>({
    status: 'idle',
    draftStatus: 'draft',
  });

  const [hasDraft, setHasDraft] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);

  // Refs to track state changes and avoid stale closures
  const lastSavedStateRef = useRef<string>('');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const isSavingRef = useRef(false);

  // Serialize state for comparison (excluding step to avoid unnecessary saves)
  const serializeForComparison = useCallback((state: WizardState): string => {
    // Create a copy without step for comparison
    const { step, ...stateWithoutStep } = state;
    return JSON.stringify(stateWithoutStep);
  }, []);

  // Save to localStorage as backup
  const saveToLocalStorage = useCallback((state: WizardState) => {
    try {
      localStorage.setItem(AUTO_SAVE_STORAGE_KEY, JSON.stringify({
        wizardState: state,
        savedAt: new Date().toISOString(),
      }));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }, []);

  // Get backup from localStorage
  const getLocalBackup = useCallback((): WizardState | null => {
    try {
      const stored = localStorage.getItem(AUTO_SAVE_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.wizardState;
      }
    } catch (error) {
      console.warn('Failed to read from localStorage:', error);
    }
    return null;
  }, []);

  // Clear localStorage backup
  const clearLocalBackup = useCallback(() => {
    try {
      localStorage.removeItem(AUTO_SAVE_STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  }, []);

  // Save to backend
  const saveToBackend = useCallback(async (state: WizardState): Promise<void> => {
    if (isSavingRef.current) {
      return; // Skip if already saving
    }

    isSavingRef.current = true;
    setAutoSaveMetadata(prev => ({ ...prev, status: 'saving', error: undefined }));

    try {
      const response = await fetch('/api/wizard-drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wizardState: state,
          currentStep: state.step,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save draft');
      }

      const data = await response.json();
      const draft = data.data?.draft;

      if (isMountedRef.current) {
        setDraftId(draft?.id || null);
        setHasDraft(true);
        setAutoSaveMetadata(prev => ({
          ...prev,
          status: 'saved',
          draftId: draft?.id,
          lastSavedAt: new Date(),
          error: undefined,
        }));
        lastSavedStateRef.current = serializeForComparison(state);
        onSaveSuccess?.(draft?.id);
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
      if (isMountedRef.current) {
        setAutoSaveMetadata(prev => ({
          ...prev,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        }));
        onSaveError?.(error instanceof Error ? error : new Error('Unknown error'));
      }
    } finally {
      isSavingRef.current = false;
    }
  }, [serializeForComparison, onSaveSuccess, onSaveError]);

  // Trigger immediate save
  const saveNow = useCallback(async (): Promise<void> => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    await saveToBackend(wizardState);
  }, [saveToBackend, wizardState]);

  // Load existing draft from server
  const loadDraft = useCallback(async (): Promise<WizardState | null> => {
    try {
      const response = await fetch('/api/wizard-drafts', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const draft = data.data?.draft;

      if (draft && draft.wizardState) {
        setDraftId(draft.id);
        setHasDraft(true);
        setAutoSaveMetadata(prev => ({
          ...prev,
          draftId: draft.id,
          lastSavedAt: new Date(draft.lastSavedAt),
          draftStatus: 'draft',
        }));
        lastSavedStateRef.current = serializeForComparison(draft.wizardState as WizardState);
        return draft.wizardState as WizardState;
      }

      return null;
    } catch (error) {
      console.error('Failed to load draft:', error);
      return null;
    }
  }, [serializeForComparison]);

  // Clear draft (after publishing or abandoning)
  const clearDraft = useCallback(async (agentId?: string): Promise<void> => {
    try {
      if (agentId) {
        // Mark as published
        await fetch('/api/wizard-drafts', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ agentId }),
        });
        setAutoSaveMetadata(prev => ({ ...prev, draftStatus: 'published' }));
      } else {
        // Delete the draft
        await fetch('/api/wizard-drafts?action=delete', {
          method: 'DELETE',
        });
      }

      setDraftId(null);
      setHasDraft(false);
      lastSavedStateRef.current = '';
      clearLocalBackup();
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  }, [clearLocalBackup]);

  // Auto-save effect with debouncing
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const currentSerialized = serializeForComparison(wizardState);

    // Only save if state has actually changed
    if (currentSerialized === lastSavedStateRef.current) {
      return;
    }

    // Always save to localStorage immediately (for backup)
    saveToLocalStorage(wizardState);

    // Debounce backend save
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      saveToBackend(wizardState);
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [wizardState, enabled, debounceMs, serializeForComparison, saveToLocalStorage, saveToBackend]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Save on page unload (best effort)
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Save to localStorage synchronously on unload
      saveToLocalStorage(wizardState);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [wizardState, saveToLocalStorage]);

  return {
    autoSaveMetadata,
    saveNow,
    loadDraft,
    clearDraft,
    getLocalBackup,
    hasDraft,
    draftId,
  };
}
