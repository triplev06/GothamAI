import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX } from 'lucide-react';
import batmanHeroImage from '@/assets/BatmanHeroImage.png';
import alfredPortrait from '@/assets/alfred-portrait.png';
import jokerPortrait from '@/assets/joker-portrait.png';
import { speak, stopSpeaking, type CharacterVoice } from '@/utils/textToSpeech';

interface CouncilResponse {
  batman: string;
  alfred: string;
  joker: string;
}

interface CouncilModeProps {
  response: CouncilResponse | null;
  isLoading: boolean;
}

export default function CouncilMode({ response, isLoading }: CouncilModeProps) {
  const [speakingCharacter, setSpeakingCharacter] = useState<CharacterVoice | null>(null);

  const handleSpeak = async (character: CharacterVoice, text: string) => {
    stopSpeaking();
    setSpeakingCharacter(character);

    try {
      await speak(text, character);
    } catch (error) {
      console.error('TTS error:', error);
    } finally {
      setSpeakingCharacter(null);
    }
  };

  const handleStopSpeaking = () => {
    stopSpeaking();
    setSpeakingCharacter(null);
  };

  const characters = [
    {
      name: 'batman',
      title: 'THE DARK KNIGHT',
      image: batmanHeroImage,
      response: response?.batman || '',
      borderColor: 'border-[hsl(43,74%,49%)]',
      glowClass: 'shadow-[0_0_20px_rgba(212,168,56,0.4)]',
      bgGradient: 'from-[hsl(43,74%,49%,0.1)] to-transparent',
      textGlow: 'text-glow-gold'
    },
    {
      name: 'alfred',
      title: 'ALFRED PENNYWORTH',
      image: alfredPortrait,
      response: response?.alfred || '',
      borderColor: 'border-[hsl(0,0%,75%)]',
      glowClass: 'shadow-[0_0_20px_rgba(191,191,191,0.3)]',
      bgGradient: 'from-[hsl(0,0%,75%,0.1)] to-transparent',
      textGlow: 'text-glow-silver'
    },
    {
      name: 'joker',
      title: 'THE JOKER',
      image: jokerPortrait,
      response: response?.joker || '',
      borderColor: 'border-[hsl(280,60%,60%)]',
      glowClass: 'shadow-[0_0_20px_rgba(179,102,204,0.5)]',
      bgGradient: 'from-[hsl(280,60%,60%,0.1)] to-transparent',
      textGlow: 'text-glow-purple'
    }
  ] as const;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {characters.map((character) => (
        <div
          key={character.name}
          className={`relative rounded-lg border-2 ${character.borderColor} ${character.glowClass} bg-background overflow-hidden`}
        >
          {/* Background Gradient */}
          <div className={`absolute inset-0 bg-gradient-to-b ${character.bgGradient} pointer-events-none`}></div>

          {/* Content */}
          <div className="relative z-10 p-4">
            {/* Character Header */}
            <div className="flex items-center gap-3 mb-4">
              <img
                src={character.image}
                alt={character.title}
                className="w-16 h-16 rounded-full object-cover border-2 border-current"
                style={{
                  filter: character.name === 'batman'
                    ? 'drop-shadow(0 0 10px rgba(212, 168, 56, 0.6))'
                    : character.name === 'alfred'
                    ? 'drop-shadow(0 0 10px rgba(191, 191, 191, 0.6))'
                    : 'drop-shadow(0 0 10px rgba(179, 102, 204, 0.6))'
                }}
              />
              <div className="flex-1">
                <h3 className={`text-sm font-bold ${character.textGlow}`}>
                  {character.title}
                </h3>
              </div>

              {/* Speak Button */}
              {character.response && !isLoading && (
                <Button
                  onClick={() =>
                    speakingCharacter === character.name
                      ? handleStopSpeaking()
                      : handleSpeak(character.name as CharacterVoice, character.response)
                  }
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  {speakingCharacter === character.name ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </Button>
              )}
            </div>

            {/* Response */}
            <div className="min-h-[200px]">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              ) : character.response ? (
                <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                  {character.response}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Awaiting response...
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
