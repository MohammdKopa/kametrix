'use client';

import { useState } from 'react';
import { Check, Loader2, ExternalLink } from 'lucide-react';

interface GoogleConnectButtonProps {
  isConnected: boolean;
  connectedAt?: Date | null;
  googleSheetId?: string | null;
  appointmentDuration?: number;
}

// Google logo SVG component
function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

const DURATION_OPTIONS = [
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
];

export function GoogleConnectButton({
  isConnected,
  connectedAt,
  googleSheetId,
  appointmentDuration = 30,
}: GoogleConnectButtonProps) {
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [duration, setDuration] = useState(appointmentDuration);
  const [isSavingDuration, setIsSavingDuration] = useState(false);

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your Google account? This will disable Calendar booking and Sheets logging.')) {
      return;
    }

    setIsDisconnecting(true);
    try {
      const response = await fetch('/api/auth/google/disconnect', {
        method: 'POST',
      });

      if (response.ok) {
        // Reload page to reflect the change
        window.location.reload();
      } else {
        alert('Failed to disconnect Google account');
      }
    } catch {
      alert('Failed to disconnect Google account');
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleDurationChange = async (newDuration: number) => {
    setDuration(newDuration);
    setIsSavingDuration(true);
    try {
      const response = await fetch('/api/settings/appointment-duration', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration: newDuration }),
      });

      if (!response.ok) {
        alert('Failed to save appointment duration');
        setDuration(appointmentDuration); // Revert on failure
      }
    } catch {
      alert('Failed to save appointment duration');
      setDuration(appointmentDuration); // Revert on failure
    } finally {
      setIsSavingDuration(false);
    }
  };

  if (isConnected) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <GoogleLogo className="w-5 h-5" />
                <span className="font-medium text-gray-900">Google Connected</span>
              </div>
              {connectedAt && (
                <p className="text-sm text-gray-500 mt-0.5">
                  Connected {new Date(connectedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleDisconnect}
            disabled={isDisconnecting}
            className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >
            {isDisconnecting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Disconnect'
            )}
          </button>
        </div>

        {/* Integration Status */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Calendar: Ready for bookings</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>
              {googleSheetId
                ? 'Call Logging: Active'
                : 'Call Logging: Sheet will be created on first call'}
            </span>
          </div>
        </div>

        {/* Appointment Duration Setting */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <label htmlFor="appointment-duration" className="block text-sm font-medium text-gray-700 mb-2">
            Appointment Duration
          </label>
          <div className="flex items-center gap-2">
            <select
              id="appointment-duration"
              value={duration}
              onChange={(e) => handleDurationChange(Number(e.target.value))}
              disabled={isSavingDuration}
              className="block w-full max-w-xs rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
            >
              {DURATION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {isSavingDuration && <Loader2 className="w-4 h-4 animate-spin text-gray-500" />}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Length of appointments booked by your voice agent
          </p>
        </div>

        {/* Sheet Link */}
        {googleSheetId && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <a
              href={`https://docs.google.com/spreadsheets/d/${googleSheetId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View Call Log
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <GoogleLogo className="w-8 h-8" />
        <div>
          <h3 className="font-medium text-gray-900">Connect Google Account</h3>
          <p className="text-sm text-gray-500">
            Enable Calendar booking and Sheets logging
          </p>
        </div>
      </div>
      <a
        href="/api/auth/google"
        className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <GoogleLogo className="w-5 h-5" />
        Connect Google
      </a>
      <p className="text-xs text-gray-400 mt-3">
        We'll request access to your Calendar and Sheets to enable agent features.
      </p>
    </div>
  );
}
