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
      setError('Please complete Business Info step first (name and description required)');
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
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Knowledge Base</h2>
          <p className="text-sm text-gray-600">
            Equip your agent with the knowledge to answer customer questions effectively.
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
          {isGenerating ? 'Generating...' : 'Generate with AI'}
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
          Frequently Asked Questions
        </label>
        <p className="text-xs text-gray-500 mb-3">
          Add common questions and their answers. Your agent will use these to respond to callers.
        </p>

        <div className="space-y-4">
          {data.faqs.map((faq, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <span className="text-sm font-medium text-gray-700">FAQ {index + 1}</span>
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
                    Question
                  </label>
                  <input
                    type="text"
                    value={faq.question}
                    onChange={(e) => updateFaq(index, 'question', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="e.g., What are your business hours?"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Answer
                  </label>
                  <textarea
                    value={faq.answer}
                    onChange={(e) => updateFaq(index, 'answer', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="e.g., We're open Monday through Friday, 9am to 5pm..."
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
          Add FAQ
        </button>
      </div>

      {/* Policies */}
      <div>
        <label htmlFor="policies" className="block text-sm font-medium text-gray-700 mb-1">
          Policies
        </label>
        <p className="text-xs text-gray-500 mb-2">
          Include important policies like refund policy, cancellation policy, etc.
        </p>
        <textarea
          id="policies"
          value={data.policies}
          onChange={(e) => onChange({ policies: e.target.value })}
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g., Cancellation Policy: We require 24 hours notice for cancellations...&#10;&#10;Refund Policy: Full refunds available within 30 days..."
        />
      </div>
    </div>
  );
}
