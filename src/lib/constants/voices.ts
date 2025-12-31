/**
 * ElevenLabs voice constants for German voice agents
 */

export interface ElevenLabsVoice {
  id: string;
  name: string;
  description: string;
  gender: 'female' | 'male';
}

export const ELEVENLABS_VOICES: ElevenLabsVoice[] = [
  {
    id: 'EXAVITQu4vr4xnSDxMaL',
    name: 'Sarah',
    description: 'Sanft und professionell',
    gender: 'female',
  },
  {
    id: 'XrExE9yKIg1WjnnlVkGX',
    name: 'Matilda',
    description: 'Warm und freundlich',
    gender: 'female',
  },
  {
    id: 'pNInz6obpgDQGcFmaJgB',
    name: 'Adam',
    description: 'Professionell und vertrauenswuerdig',
    gender: 'male',
  },
  {
    id: 'ErXwobaYiN019PkySvjV',
    name: 'Antoni',
    description: 'Freundlich und nahbar',
    gender: 'male',
  },
];

export const DEFAULT_ELEVENLABS_VOICE = ELEVENLABS_VOICES[0].id;
