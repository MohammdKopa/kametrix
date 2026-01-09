'use client';

import { Cloud, CloudOff, Loader2, Check, AlertCircle } from 'lucide-react';
import type { AutoSaveMetadata } from '@/types/wizard';

interface AutoSaveIndicatorProps {
  metadata: AutoSaveMetadata;
  className?: string;
}

/**
 * Visual indicator for auto-save status in the wizard
 * Shows saving, saved, error states with appropriate icons and messages
 */
export function AutoSaveIndicator({ metadata, className = '' }: AutoSaveIndicatorProps) {
  const { status, lastSavedAt, error } = metadata;

  // Format the last saved time
  const formatLastSaved = (date?: Date) => {
    if (!date) return null;

    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);

    if (seconds < 5) {
      return 'Gerade eben';
    } else if (seconds < 60) {
      return `vor ${seconds} Sekunden`;
    } else if (minutes < 60) {
      return `vor ${minutes} Minute${minutes > 1 ? 'n' : ''}`;
    } else {
      return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    }
  };

  const getStatusContent = () => {
    switch (status) {
      case 'saving':
        return (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
            <span className="text-blue-600 dark:text-blue-400">Speichern...</span>
          </>
        );

      case 'saved':
        return (
          <>
            <Check className="w-4 h-4 text-green-500" />
            <span className="text-green-600 dark:text-green-400">
              Gespeichert {lastSavedAt && formatLastSaved(lastSavedAt)}
            </span>
          </>
        );

      case 'error':
        return (
          <>
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-red-600 dark:text-red-400" title={error}>
              Speichern fehlgeschlagen
            </span>
          </>
        );

      case 'idle':
      default:
        return (
          <>
            <Cloud className="w-4 h-4 text-gray-400" />
            <span className="text-gray-500 dark:text-gray-400">Auto-Speichern aktiv</span>
          </>
        );
    }
  };

  return (
    <div
      className={`flex items-center gap-2 text-xs transition-all duration-300 ${className}`}
      role="status"
      aria-live="polite"
    >
      {getStatusContent()}
    </div>
  );
}

interface DraftRecoveryBannerProps {
  lastSavedAt?: Date;
  onRestore: () => void;
  onDiscard: () => void;
  className?: string;
}

/**
 * Banner shown when a draft is available for recovery
 */
export function DraftRecoveryBanner({
  lastSavedAt,
  onRestore,
  onDiscard,
  className = ''
}: DraftRecoveryBannerProps) {
  const formatDate = (date?: Date) => {
    if (!date) return 'kürzlich';
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      className={`p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl ${className}`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <Cloud className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-medium text-amber-800 dark:text-amber-300">
            Entwurf gefunden
          </h3>
          <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
            Es wurde ein nicht abgeschlossener Entwurf gefunden (zuletzt gespeichert: {formatDate(lastSavedAt)}).
            Möchten Sie fortfahren oder neu beginnen?
          </p>
          <div className="flex gap-3 mt-3">
            <button
              onClick={onRestore}
              className="px-3 py-1.5 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors"
            >
              Fortfahren
            </button>
            <button
              onClick={onDiscard}
              className="px-3 py-1.5 text-sm font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-500/20 rounded-lg transition-colors"
            >
              Neu beginnen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
