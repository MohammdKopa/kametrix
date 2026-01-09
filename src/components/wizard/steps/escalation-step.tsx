'use client';

import { PhoneForwarded, Clock, Voicemail, AlertTriangle, Info } from 'lucide-react';
import type { WizardState } from '@/types/wizard';

interface EscalationStepProps {
  data: WizardState['escalation'];
  onChange: (data: Partial<WizardState['escalation']>) => void;
}

const BUSINESS_DAYS = [
  { value: 'Mon', label: 'Mo' },
  { value: 'Tue', label: 'Di' },
  { value: 'Wed', label: 'Mi' },
  { value: 'Thu', label: 'Do' },
  { value: 'Fri', label: 'Fr' },
  { value: 'Sat', label: 'Sa' },
  { value: 'Sun', label: 'So' },
];

export function EscalationStep({ data, onChange }: EscalationStepProps) {
  const handleDayToggle = (day: string) => {
    const currentDays = data.businessDays || [];
    if (currentDays.includes(day)) {
      onChange({ businessDays: currentDays.filter((d) => d !== day) });
    } else {
      onChange({ businessDays: [...currentDays, day] });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Weiterleitung an Mitarbeiter
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Konfigurieren Sie, wann und wie Anrufe an echte Mitarbeiter weitergeleitet werden sollen.
        </p>
      </div>

      {/* Info Banner */}
      <div className="flex gap-3 p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-xl">
        <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800 dark:text-blue-300">
          <p className="font-medium mb-1">Was passiert bei einer Weiterleitung?</p>
          <p>
            Wenn ein Anrufer explizit nach einem Menschen fragt, der KI-Assistent verwirrt ist,
            oder der Anrufer frustriert klingt, kann der Anruf an einen echten Mitarbeiter
            weitergeleitet werden.
          </p>
        </div>
      </div>

      {/* Enable/Disable Toggle */}
      <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-500/20">
            <PhoneForwarded className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              Weiterleitung aktivieren
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {data.enabled
                ? 'Anrufe können an Mitarbeiter weitergeleitet werden'
                : 'Der KI-Assistent bietet Rückruf an, wenn er nicht weiterhelfen kann'}
            </p>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={data.enabled}
            onChange={(e) => onChange({ enabled: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 dark:peer-focus:ring-orange-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-orange-500"></div>
        </label>
      </div>

      {data.enabled && (
        <>
          {/* Forwarding Number */}
          <div>
            <label
              htmlFor="forwardingNumber"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Weiterleitungsnummer <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="tel"
                id="forwardingNumber"
                value={data.forwardingNumber}
                onChange={(e) => onChange({ forwardingNumber: e.target.value })}
                className="w-full px-3 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="+49 30 12345678"
              />
              <PhoneForwarded className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Die Telefonnummer, an die Anrufe weitergeleitet werden sollen.
            </p>
          </div>

          {/* Business Hours */}
          <div className="space-y-4 p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <Clock className="w-4 h-4" />
              Geschäftszeiten für Weiterleitung
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="businessHoursStart"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Öffnungszeit
                </label>
                <input
                  type="time"
                  id="businessHoursStart"
                  value={data.businessHoursStart}
                  onChange={(e) => onChange({ businessHoursStart: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="businessHoursEnd"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Schlusszeit
                </label>
                <input
                  type="time"
                  id="businessHoursEnd"
                  value={data.businessHoursEnd}
                  onChange={(e) => onChange({ businessHoursEnd: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Geschäftstage
              </label>
              <div className="flex flex-wrap gap-2">
                {BUSINESS_DAYS.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => handleDayToggle(day.value)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
                      data.businessDays?.includes(day.value)
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Außerhalb dieser Zeiten werden Anrufer auf die Voicemail hingewiesen.
              </p>
            </div>
          </div>

          {/* Voicemail Setting */}
          <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-500/20">
                <Voicemail className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Voicemail aktivieren</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Anrufer können eine Nachricht hinterlassen, wenn kein Mitarbeiter verfügbar ist.
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={data.voicemailEnabled}
                onChange={(e) => onChange({ voicemailEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-500"></div>
            </label>
          </div>

          {/* Max Clarifications */}
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <label
                htmlFor="maxClarifications"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Maximale Nachfragen
              </label>
            </div>
            <input
              type="number"
              id="maxClarifications"
              min={1}
              max={10}
              value={data.maxClarifications}
              onChange={(e) => onChange({ maxClarifications: parseInt(e.target.value, 10) || 3 })}
              className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Nach dieser Anzahl von Nachfragen wird der Anruf automatisch an einen Mitarbeiter
              weitergeleitet. (Empfohlen: 3)
            </p>
          </div>
        </>
      )}

      {/* Disabled State Info */}
      {!data.enabled && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <strong>Ohne aktivierte Weiterleitung:</strong> Der KI-Assistent kann keine Anrufe
            direkt an Mitarbeiter weiterleiten. Stattdessen wird er Anrufer bitten, ihre
            Kontaktdaten zu hinterlassen, damit Sie sie zurückrufen können.
          </p>
        </div>
      )}
    </div>
  );
}
