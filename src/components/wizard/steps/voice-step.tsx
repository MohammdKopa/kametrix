'use client';

import type { WizardState } from '@/types/wizard';

interface VoiceStepProps {
  data: WizardState['voice'];
  onChange: (data: Partial<WizardState['voice']>) => void;
}

const VOICE_PROVIDERS = [
  {
    id: 'elevenlabs' as const,
    name: 'ElevenLabs',
    description: 'High-quality, natural-sounding voices (Recommended)',
    voices: [
      { id: 'marissa', name: 'Marissa', description: 'Warm, professional female voice' },
      { id: 'josh', name: 'Josh', description: 'Friendly, clear male voice' },
      { id: 'bella', name: 'Bella', description: 'Energetic, upbeat female voice' },
      { id: 'rachel', name: 'Rachel', description: 'Calm, soothing female voice' },
    ],
  },
  {
    id: 'vapi' as const,
    name: 'Vapi',
    description: 'Fast, reliable default voices',
    voices: [
      { id: 'vapi-default', name: 'Vapi Default', description: 'Standard voice optimized for speed' },
    ],
  },
  {
    id: 'cartesia' as const,
    name: 'Cartesia',
    description: 'Low-latency, expressive voices',
    voices: [
      { id: 'sonic-english', name: 'Sonic English', description: 'Natural-sounding English voice' },
    ],
  },
];

export function VoiceStep({ data, onChange }: VoiceStepProps) {
  const selectedProvider = VOICE_PROVIDERS.find((p) => p.id === data.voiceProvider);
  const availableVoices = selectedProvider?.voices || [];

  const handleProviderChange = (providerId: typeof data.voiceProvider) => {
    const provider = VOICE_PROVIDERS.find((p) => p.id === providerId);
    const defaultVoice = provider?.voices[0]?.id || '';
    onChange({ voiceProvider: providerId, voiceId: defaultVoice });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Voice Selection</h2>
        <p className="text-sm text-gray-600">
          Choose the voice that will represent your business on calls.
        </p>
      </div>

      {/* Voice Provider */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Voice Provider <span className="text-red-500">*</span>
        </label>
        <div className="space-y-3">
          {VOICE_PROVIDERS.map((provider) => (
            <div key={provider.id}>
              <label
                className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  data.voiceProvider === provider.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="voiceProvider"
                  value={provider.id}
                  checked={data.voiceProvider === provider.id}
                  onChange={(e) => handleProviderChange(e.target.value as typeof data.voiceProvider)}
                  className="mt-1 mr-3"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{provider.name}</span>
                    {provider.id === 'elevenlabs' && (
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{provider.description}</p>
                </div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Voice Selection */}
      <div>
        <label htmlFor="voiceId" className="block text-sm font-medium text-gray-700 mb-2">
          Select Voice <span className="text-red-500">*</span>
        </label>
        <div className="space-y-2">
          {availableVoices.map((voice) => (
            <label
              key={voice.id}
              className={`flex items-start p-3 border rounded-lg cursor-pointer transition-colors ${
                data.voiceId === voice.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="voiceId"
                value={voice.id}
                checked={data.voiceId === voice.id}
                onChange={(e) => onChange({ voiceId: e.target.value })}
                className="mt-1 mr-3"
              />
              <div>
                <div className="font-medium text-gray-900">{voice.name}</div>
                <p className="text-sm text-gray-600">{voice.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Preview note */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-sm text-gray-600">
          <strong>Note:</strong> Voice preview will be available in a future update. For now, you can test the
          selected voice after creating your agent.
        </p>
      </div>
    </div>
  );
}
