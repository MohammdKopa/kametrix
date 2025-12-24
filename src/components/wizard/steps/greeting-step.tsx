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
      setError('Please complete Business Info step first (name and description required)');
      return;
    }

    if (!data.agentName) {
      setError('Please enter an agent name first');
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
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Greeting & Messages</h2>
          <p className="text-sm text-gray-600">
            Customize how your agent introduces itself and ends conversations.
          </p>
        </div>
        <button
          type="button"
          onClick={generateWithAI}
          disabled={isGenerating || !data.agentName}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          title={!data.agentName ? 'Enter agent name first' : 'Generate greeting with AI'}
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {isGenerating ? 'Generating...' : 'Generate with AI'}
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
          Agent Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="agentName"
          value={data.agentName}
          onChange={(e) => onChange({ agentName: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g., Sarah, Alex, Jamie"
        />
        <p className="mt-1 text-xs text-gray-500">
          What should the agent call itself when speaking to customers?
        </p>
      </div>

      {/* Greeting Message */}
      <div>
        <label htmlFor="greeting" className="block text-sm font-medium text-gray-700 mb-1">
          Greeting Message <span className="text-red-500">*</span>
        </label>
        <textarea
          id="greeting"
          value={data.greeting}
          onChange={(e) => onChange({ greeting: e.target.value })}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g., Hello! Thank you for calling {businessName}. How can I help you today?"
        />
        <p className="mt-1 text-xs text-gray-500">
          This is the first thing callers will hear. Use <code>{'{businessName}'}</code> as a placeholder.
        </p>
      </div>

      {/* Greeting Preview */}
      {data.greeting && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-xs font-medium text-blue-700 mb-2">Preview:</p>
          <p className="text-sm text-gray-700 italic">&ldquo;{previewGreeting}&rdquo;</p>
        </div>
      )}

      {/* End Call Message */}
      <div>
        <label htmlFor="endCallMessage" className="block text-sm font-medium text-gray-700 mb-1">
          End Call Message <span className="text-red-500">*</span>
        </label>
        <textarea
          id="endCallMessage"
          value={data.endCallMessage}
          onChange={(e) => onChange({ endCallMessage: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g., Thank you for calling. Have a great day!"
        />
        <p className="mt-1 text-xs text-gray-500">
          What should the agent say when ending a call?
        </p>
      </div>
    </div>
  );
}
