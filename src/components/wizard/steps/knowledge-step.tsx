'use client';

import { useState } from 'react';
import { Plus, X, Sparkles, Loader2 } from 'lucide-react';
import type { WizardState } from '@/types/wizard';

interface KnowledgeStepProps {
  data: WizardState['knowledge'];
  businessInfo: WizardState['businessInfo'];
  onChange: (data: Partial<WizardState['knowledge']>) => void;
  onUpdateGreeting?: (data: Partial<WizardState['greeting']>) => void;
}

export function KnowledgeStep({ data, businessInfo, onChange, onUpdateGreeting }: KnowledgeStepProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addFaq = () => {
    onChange({ faqs: [...data.faqs, { question: '', answer: '' }] });
  };

  const removeFaq = (index: number) => {
    onChange({ faqs: data.faqs.filter((_, i) => i !== index) });
  };

  const updateFaq = (index: number, field: 'question' | 'answer', value: string) => {
    const newFaqs = [...data.faqs];
    newFaqs[index] = { ...newFaqs[index], [field]: value };
    onChange({ faqs: newFaqs });
  };

  const generateWithAI = async () => {
    if (!businessInfo.businessName || !businessInfo.businessDescription) {
      setError('Bitte fuellen Sie zuerst den Schritt "Ihr Unternehmen" aus (Name und Beschreibung erforderlich).');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'all',
          businessInfo,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate content');
      }

      const result = await response.json();

      // Update knowledge section
      onChange({
        faqs: result.faqs,
        policies: result.policies,
      });

      // Also update greeting if callback provided
      if (onUpdateGreeting && result.greeting && result.endCallMessage) {
        onUpdateGreeting({
          greeting: result.greeting,
          endCallMessage: result.endCallMessage,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate content');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Wissen fuer Ihren Assistenten</h2>
          <p className="text-sm text-gray-600">
            Geben Sie Ihrem Assistenten das Wissen, um Kundenanfragen kompetent zu beantworten.
          </p>
        </div>
        <button
          type="button"
          onClick={generateWithAI}
          disabled={isGenerating}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* FAQs */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Haeufige Fragen (FAQs)
        </label>
        <p className="text-xs text-gray-500 mb-3">
          Fuegen Sie typische Kundenfragen und Antworten hinzu. Ihr Assistent nutzt diese, um Anrufer zu informieren.
        </p>

        <div className="space-y-4">
          {data.faqs.map((faq, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <span className="text-sm font-medium text-gray-700">Frage {index + 1}</span>
                <button
                  type="button"
                  onClick={() => removeFaq(index)}
                  className="text-red-600 hover:bg-red-50 p-1 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Frage
                  </label>
                  <input
                    type="text"
                    value={faq.question}
                    onChange={(e) => updateFaq(index, 'question', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="z.B. Wie sind Ihre Oeffnungszeiten?"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Antwort
                  </label>
                  <textarea
                    value={faq.answer}
                    onChange={(e) => updateFaq(index, 'answer', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="z.B. Wir haben Montag bis Freitag von 9 bis 18 Uhr geoeffnet..."
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addFaq}
          className="mt-3 flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 border border-blue-300 rounded-md"
        >
          <Plus className="w-4 h-4" />
          Frage hinzufuegen
        </button>
      </div>

      {/* Policies */}
      <div>
        <label htmlFor="policies" className="block text-sm font-medium text-gray-700 mb-1">
          Richtlinien
        </label>
        <p className="text-xs text-gray-500 mb-2">
          Fuegen Sie wichtige Geschaeftsrichtlinien hinzu, z.B. Stornierung, Rueckerstattung.
        </p>
        <textarea
          id="policies"
          value={data.policies}
          onChange={(e) => onChange({ policies: e.target.value })}
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="z.B. Stornierung: Wir bitten um Absage mindestens 24 Stunden vorher...&#10;&#10;Bezahlung: Wir akzeptieren Karte und Bargeld..."
        />
      </div>
    </div>
  );
}
