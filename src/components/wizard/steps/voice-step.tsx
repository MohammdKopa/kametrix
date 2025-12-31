'use client';

import type { WizardState } from '@/types/wizard';
import { ELEVENLABS_VOICES } from '@/lib/constants/voices';
import { useVoicePreview } from '@/hooks/useVoicePreview';
import { Play, Square, Loader2 } from 'lucide-react';

interface VoiceStepProps {
  data: WizardState['voice'];
  onChange: (data: Partial<WizardState['voice']>) => void;
}

export function VoiceStep({ data, onChange }: VoiceStepProps) {
  const { playPreview, stopPreview, isPlaying, isLoading } = useVoicePreview();

  const handleVoiceSelect = (voiceId: string) => {
    onChange({ voiceId, voiceProvider: '11labs' });
  };

  const handlePreviewClick = (e: React.MouseEvent, voiceId: string) => {
    e.stopPropagation();
    if (isPlaying === voiceId) {
      stopPreview();
    } else {
      playPreview(voiceId);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-2">Stimme auswaehlen</h2>
        <p className="text-sm text-muted-foreground">
          Waehlen Sie die Stimme, die Ihr Unternehmen bei Anrufen repraesentiert.
        </p>
      </div>

      {/* Voice Selection Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {ELEVENLABS_VOICES.map((voice) => {
          const isSelected = data.voiceId === voice.id;
          const isVoicePlaying = isPlaying === voice.id;
          const isVoiceLoading = isLoading === voice.id;

          return (
            <div
              key={voice.id}
              onClick={() => handleVoiceSelect(voice.id)}
              className={`
                relative flex items-start p-4 rounded-xl cursor-pointer transition-all duration-200
                border-2 backdrop-blur-sm
                ${isSelected
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50 bg-background/50'
                }
              `}
            >
              {/* Selection indicator */}
              <div className={`
                w-5 h-5 rounded-full border-2 mr-3 mt-0.5 flex items-center justify-center flex-shrink-0
                ${isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'}
              `}>
                {isSelected && (
                  <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                )}
              </div>

              {/* Voice info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-foreground">{voice.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {voice.gender === 'female' ? 'Weiblich' : 'Maennlich'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{voice.description}</p>
              </div>

              {/* Preview button */}
              <button
                type="button"
                onClick={(e) => handlePreviewClick(e, voice.id)}
                disabled={isVoiceLoading}
                className={`
                  ml-2 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                  transition-all duration-200
                  ${isVoicePlaying
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
                aria-label={isVoicePlaying ? 'Stop preview' : 'Play preview'}
              >
                {isVoiceLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isVoicePlaying ? (
                  <Square className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4 ml-0.5" />
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Helper text */}
      <p className="text-sm text-muted-foreground text-center">
        Klicken Sie auf &#9654; um eine Vorschau zu hoeren
      </p>
    </div>
  );
}
