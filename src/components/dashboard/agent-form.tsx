'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Agent } from '@/generated/prisma/client';

interface AgentFormProps {
  agent?: Agent;
  mode: 'create' | 'edit';
}

const VOICE_OPTIONS = [
  { id: 'alloy', name: 'Alloy' },
  { id: 'echo', name: 'Echo' },
  { id: 'fable', name: 'Fable' },
  { id: 'onyx', name: 'Onyx' },
  { id: 'nova', name: 'Nova' },
  { id: 'shimmer', name: 'Shimmer' },
];

export function AgentForm({ agent, mode }: AgentFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: agent?.name || '',
    businessName: agent?.businessName || '',
    businessDescription: agent?.businessDescription || '',
    greeting: agent?.greeting || '',
    systemPrompt: agent?.systemPrompt || '',
    voiceId: agent?.voiceId || 'alloy',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Name must be 100 characters or less';
    }

    if (!formData.businessName.trim()) {
      newErrors.businessName = 'Business name is required';
    }

    if (!formData.greeting.trim()) {
      newErrors.greeting = 'Greeting is required';
    } else if (formData.greeting.length > 500) {
      newErrors.greeting = 'Greeting must be 500 characters or less';
    }

    if (!formData.systemPrompt.trim()) {
      newErrors.systemPrompt = 'System prompt is required';
    }

    if (!formData.voiceId) {
      newErrors.voiceId = 'Voice is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const url = mode === 'create' ? '/api/agents' : `/api/agents/${agent?.id}`;
      const method = mode === 'create' ? 'POST' : 'PATCH';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save agent');
      }

      router.push('/dashboard/agents');
      router.refresh();
    } catch (error) {
      console.error('Error saving agent:', error);
      alert(error instanceof Error ? error.message : 'Failed to save agent');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Agent Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
            errors.name
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          }`}
          placeholder="e.g., Customer Support Agent"
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
      </div>

      {/* Business Name */}
      <div>
        <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">
          Business Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="businessName"
          name="businessName"
          value={formData.businessName}
          onChange={handleChange}
          className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
            errors.businessName
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          }`}
          placeholder="e.g., Acme Inc"
        />
        {errors.businessName && (
          <p className="mt-1 text-sm text-red-600">{errors.businessName}</p>
        )}
      </div>

      {/* Business Description */}
      <div>
        <label htmlFor="businessDescription" className="block text-sm font-medium text-gray-700">
          Business Description
        </label>
        <textarea
          id="businessDescription"
          name="businessDescription"
          value={formData.businessDescription}
          onChange={handleChange}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          placeholder="Brief description of your business (optional)"
        />
      </div>

      {/* Voice */}
      <div>
        <label htmlFor="voiceId" className="block text-sm font-medium text-gray-700">
          Voice <span className="text-red-500">*</span>
        </label>
        <select
          id="voiceId"
          name="voiceId"
          value={formData.voiceId}
          onChange={handleChange}
          className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
            errors.voiceId
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          }`}
        >
          {VOICE_OPTIONS.map((voice) => (
            <option key={voice.id} value={voice.id}>
              {voice.name}
            </option>
          ))}
        </select>
        {errors.voiceId && <p className="mt-1 text-sm text-red-600">{errors.voiceId}</p>}
      </div>

      {/* Greeting */}
      <div>
        <label htmlFor="greeting" className="block text-sm font-medium text-gray-700">
          Greeting <span className="text-red-500">*</span>
        </label>
        <textarea
          id="greeting"
          name="greeting"
          value={formData.greeting}
          onChange={handleChange}
          rows={3}
          className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
            errors.greeting
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          }`}
          placeholder="e.g., Hello! Thank you for calling Acme Inc. How can I help you today?"
          maxLength={500}
        />
        <p className="mt-1 text-sm text-gray-500">
          {formData.greeting.length}/500 characters
        </p>
        {errors.greeting && <p className="mt-1 text-sm text-red-600">{errors.greeting}</p>}
      </div>

      {/* System Prompt */}
      <div>
        <label htmlFor="systemPrompt" className="block text-sm font-medium text-gray-700">
          System Prompt <span className="text-red-500">*</span>
        </label>
        <textarea
          id="systemPrompt"
          name="systemPrompt"
          value={formData.systemPrompt}
          onChange={handleChange}
          rows={6}
          className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm font-mono text-xs ${
            errors.systemPrompt
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          }`}
          placeholder="You are a helpful customer service agent for Acme Inc. Your role is to..."
        />
        {errors.systemPrompt && (
          <p className="mt-1 text-sm text-red-600">{errors.systemPrompt}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Agent' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
