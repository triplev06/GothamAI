import { X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const modeDescriptions = {
  batman: {
    title: 'THE DARK KNIGHT',
    personality: 'Direct, terse, and commanding. Batman communicates in short, powerful sentences with tactical precision. No wasted words—only what\'s necessary for justice.',
    textCapabilities: [
      'Tactical & strategic responses',
      'Direct, concise communication',
      'Focused problem-solving approach',
      'Justice-oriented perspective'
    ],
    imageCapabilities: [
      'Object detection and precise counting',
      'Face detection and identification',
      'Text recognition (OCR) - reads all visible text',
      'Threat assessment analysis',
      'Tactical intelligence gathering',
      'Security vulnerability detection'
    ],
    voiceCharacteristics: [
      'Deep, gravelly voice (very low pitch)',
      'Slow, deliberate speech pattern',
      'Menacing and authoritative tone',
      'Minimal emotion, maximum impact'
    ],
    examples: ['"I\'m Batman."', '"What do you need?"', '"Justice will be served."']
  },
  alfred: {
    title: 'ALFRED PENNYWORTH',
    personality: 'Refined, articulate, and proper with a touch of dry wit. Alfred brings British sophistication and sage advice with a composed, gentlemanly demeanor.',
    textCapabilities: [
      'Eloquent and well-structured responses',
      'Cultured vocabulary and proper diction',
      'Thoughtful advice and wisdom',
      'Subtle humor and wit'
    ],
    imageCapabilities: [
      'Artistic analysis (style, composition, color theory)',
      'Object identification with cultured detail',
      'Text reading with proper articulation',
      'Facial observation with attire notes',
      'Cultural context and historical significance',
      'Aesthetic appreciation and critique'
    ],
    voiceCharacteristics: [
      'Distinguished British accent',
      'Measured, refined pace',
      'Warm and reassuring tone',
      'Slightly lower pitch for gravitas'
    ],
    examples: ['"At your service."', '"A most intriguing observation."', '"Quite right, sir."']
  },
  joker: {
    title: 'THE JOKER',
    personality: 'Unpredictable, sarcastic, and darkly humorous with chaotic energy. The Joker brings anarchy and laughter (HAHAHA!) to every interaction—why so serious?',
    textCapabilities: [
      'Unpredictable and chaotic responses',
      'Dark humor and heavy sarcasm',
      'Paradoxical and ironic observations',
      'Manic energy with spontaneous laughter'
    ],
    imageCapabilities: [
      'Absurd counting and mocking descriptions',
      'Dark humor about faces and expressions',
      'Irony and contradiction detection',
      'Entropy analysis (order vs. chaos)',
      'Text reading with sarcastic commentary',
      'Chaotic pattern recognition'
    ],
    voiceCharacteristics: [
      'High-pitched, unhinged voice',
      'Fast, manic speech pattern',
      'Gleeful and chaotic tone',
      'Unpredictable emphasis and laughter'
    ],
    examples: ['"Why so serious?"', '"HAHAHA! Let\'s put a smile on that face!"', '"Do I really look like a guy with a plan?"']
  }
};

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const { theme } = useTheme();

  if (!isOpen) return null;

  const modeInfo = modeDescriptions[theme];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className={`relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg border-2 p-6 ${
        theme === 'batman' ? 'bg-background border-primary shadow-gotham-lg' :
        theme === 'alfred' ? 'bg-background border-primary shadow-elegant-lg' :
        'bg-background border-primary shadow-chaos-lg'
      }`}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-primary/20 transition-colors"
          aria-label="Close help"
        >
          <X className="w-5 h-5 text-primary" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className={`text-3xl font-bold mb-2 ${
            theme === 'batman' ? 'text-primary' :
            theme === 'alfred' ? 'text-primary' :
            'text-primary'
          }`}>
            {modeInfo.title}
          </h2>
          <div className="h-1 w-20 bg-primary rounded-full mb-4"></div>
          <p className="text-foreground/80 leading-relaxed">
            {modeInfo.personality}
          </p>
        </div>

        {/* Example Quotes */}
        <div className="mb-6 p-4 bg-primary/10 rounded-lg border border-primary/30">
          <h3 className="text-sm font-semibold text-primary mb-2">SIGNATURE PHRASES</h3>
          <div className="flex flex-wrap gap-2">
            {modeInfo.examples.map((example, index) => (
              <span key={index} className="text-sm text-foreground/70 italic">
                {example}
              </span>
            ))}
          </div>
        </div>

        {/* Text Capabilities */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-primary mb-3 flex items-center gap-2">
            <span className="text-xl">💬</span>
            Text Conversation Capabilities
          </h3>
          <ul className="space-y-2">
            {modeInfo.textCapabilities.map((capability, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="text-primary mt-1">•</span>
                <span className="text-foreground/80">{capability}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Image Analysis */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-primary mb-3 flex items-center gap-2">
            <span className="text-xl">📷</span>
            Image Analysis Capabilities
          </h3>
          <ul className="space-y-2">
            {modeInfo.imageCapabilities.map((capability, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="text-primary mt-1">•</span>
                <span className="text-foreground/80">{capability}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Voice Characteristics */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-primary mb-3 flex items-center gap-2">
            <span className="text-xl">🎤</span>
            Voice & Speech Characteristics
          </h3>
          <ul className="space-y-2">
            {modeInfo.voiceCharacteristics.map((characteristic, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="text-primary mt-1">•</span>
                <span className="text-foreground/80">{characteristic}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Easter Eggs Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-primary mb-3 flex items-center gap-2">
            <span className="text-xl">🎁</span>
            Hidden Easter Eggs
          </h3>
          <div className={`p-4 rounded-lg border ${
            theme === 'batman' ? 'bg-primary/5 border-primary/30' :
            theme === 'alfred' ? 'bg-primary/5 border-primary/30' :
            'bg-primary/5 border-primary/30'
          }`}>
            <p className="text-sm text-foreground/80 mb-3">
              {theme === 'batman'
                ? "The night holds many secrets. Try speaking iconic lines from my past to unlock special effects and responses..."
                : theme === 'alfred'
                ? "A gentleman never reveals all his secrets, but I encourage you to try some proper phrases and see what happens..."
                : "HAHAHA! Hidden surprises await those who speak my language! Try some memorable quotes and watch the chaos unfold!"}
            </p>
            <ul className="space-y-2 text-sm text-foreground/70">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Try typing iconic quotes and phrases from {theme === 'batman' ? 'my history' : theme === 'alfred' ? 'refined conversation' : 'cinematic moments'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Special visual effects and sound will trigger for certain keywords</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Each character mode has unique easter eggs to discover</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span className="italic">Hint: Some phrases reference memorable movie scenes...</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Council Mode Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-primary mb-3 flex items-center gap-2">
            <span className="text-xl">👥</span>
            Gotham Council Mode
          </h3>
          <div className={`p-4 rounded-lg border ${
            theme === 'batman' ? 'bg-primary/5 border-primary/30' :
            theme === 'alfred' ? 'bg-primary/5 border-primary/30' :
            'bg-primary/5 border-primary/30'
          }`}>
            <p className="text-sm text-foreground/80 mb-2">
              Click the <span className="font-semibold text-primary">"Council"</span> button in the header to ask all three characters the same question simultaneously!
            </p>
            <p className="text-sm text-foreground/70">
              Perfect for getting multiple perspectives on decisions, brainstorming, or just seeing how differently each personality approaches the same topic.
            </p>
          </div>
        </div>

        {/* Footer Note */}
        <div className={`p-4 rounded-lg border ${
          theme === 'batman' ? 'bg-primary/5 border-primary/30' :
          theme === 'alfred' ? 'bg-primary/5 border-primary/30' :
          'bg-primary/5 border-primary/30'
        }`}>
          <p className="text-sm text-foreground/70">
            <span className="font-semibold text-primary">Pro Tip:</span> You can send images for analysis, use voice input, have responses read aloud with {modeInfo.title}'s unique voice, and toggle sound effects with the volume button!
          </p>
        </div>
      </div>
    </div>
  );
}
