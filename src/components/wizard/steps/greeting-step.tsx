'use client';

import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import type { WizardState } from '@/types/wizard';

interface GreetingStepProps {
  data: WizardState['greeting'];
  businessInfo: WizardState['businessInfo'];
  onChange: (data: Partial<WizardState['greeting']>) => void;
}

export function GreetingStep({ data, businessInfo, onChange }: GreetingStepProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const businessName = businessInfo.businessName;
  const previewGreeting = data.greeting.replace(/{businessName}/g, businessName || '[Business Name]');

  const generateWithAI = async () => {
    if (!businessName || !businessInfo.businessDescription) {
      setError('Bitte füllen Sie zuerst den Schritt "Ihr Unternehmen" aus (Name und Beschreibung erforderlich).');
      return;
    }

    if (!data.agentName) {
      setError('Bitte geben Sie zuerst einen Namen für den Assistenten ein.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'greeting',
          businessInfo,
          agentName: data.agentName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate greeting');
      }

      const result = await response.json();

      onChange({
        greeting: result.greeting,
        endCallMessage: result.endCallMessage,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate greeting');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Begrüßung & Verabschiedung</h2>
          <p className="text-sm text-gray-600">
            Legen Sie fest, wie sich Ihr Assistent vorstellt und Gespräche beendet.
          </p>
        </div>
        <button
          type="button"
          onClick={generateWithAI}
          disabled={isGenerating || !data.agentName}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          title={!data.agentName ? 'Bitte zuerst Namen eingeben' : 'Begrüßung mit KI generieren'}
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {isGenerating ? 'Wird generiert...' : 'Mit KI generieren'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Agent Name */}
      <div>
        <label htmlFor="agentName" className="block text-sm font-medium text-gray-700 mb-1">
          Name des Assistenten <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="agentName"
          value={data.agentName}
          onChange={(e) => onChange({ agentName: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="z.B. Anna, Max, Sophie"
        />
        <p className="mt-1 text-xs text-gray-500">
          Wie soll sich Ihr Assistent am Telefon vorstellen?
        </p>
      </div>

      {/* Greeting Message */}
      <div>
        <label htmlFor="greeting" className="block text-sm font-medium text-gray-700 mb-1">
          Begrüßung <span className="text-red-500">*</span>
        </label>
        <textarea
          id="greeting"
          value={data.greeting}
          onChange={(e) => onChange({ greeting: e.target.value })}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="z.B. Guten Tag! Sie haben {businessName} erreicht. Wie kann ich Ihnen helfen?"
        />
        <p className="mt-1 text-xs text-gray-500">
          Das hören Anrufer als Erstes. Verwenden Sie <code>{'{businessName}'}</code> als Platzhalter.
        </p>
      </div>

      {/* Greeting Preview */}
      {data.greeting && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-xs font-medium text-blue-700 mb-2">Vorschau:</p>
          <p className="text-sm text-gray-700 italic">&ldquo;{previewGreeting}&rdquo;</p>
        </div>
      )}

      {/* End Call Message */}
      <div>
        <label htmlFor="endCallMessage" className="block text-sm font-medium text-gray-700 mb-1">
          Verabschiedung <span className="text-red-500">*</span>
        </label>
        <textarea
          id="endCallMessage"
          value={data.endCallMessage}
          onChange={(e) => onChange({ endCallMessage: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="z.B. Vielen Dank für Ihren Anruf. Auf Wiedersehen!"
        />
        <p className="mt-1 text-xs text-gray-500">
          Was sagt der Assistent zum Abschluss des Gesprächs?
        </p>
      </div>
    </div>
  );
}
