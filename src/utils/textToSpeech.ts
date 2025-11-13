// Text-to-Speech utility for character voices using Web Speech API (100% FREE & FAST)

export type CharacterVoice = 'batman' | 'alfred' | 'joker';

interface VoiceConfig {
  rate: number;
  pitch: number;
  volume: number;
  voiceName?: string;
}

// Optimized voice configurations for each character
const voiceConfigs: Record<CharacterVoice, VoiceConfig> = {
  batman: {
    rate: 0.75,      // Slow, deliberate, menacing
    pitch: 0.5,      // VERY deep voice (as low as possible)
    volume: 1.0,
  },
  alfred: {
    rate: 0.88,      // Refined, measured pace
    pitch: 0.9,      // Slightly lower, distinguished gentleman
    volume: 0.95,
  },
  joker: {
    rate: 1.3,       // Fast, manic, chaotic
    pitch: 1.5,      // High, unhinged (as high as possible)
    volume: 1.0,
  },
};

let currentUtterance: SpeechSynthesisUtterance | null = null;

/**
 * Speaks the given text using the specified character voice
 */
export const speak = (text: string, character: CharacterVoice): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Stop any ongoing speech
    stopSpeaking();

    // Check if browser supports speech synthesis
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported');
      resolve();
      return;
    }

    const config = voiceConfigs[character];
    const utterance = new SpeechSynthesisUtterance(text);

    // Apply voice configuration
    utterance.rate = config.rate;
    utterance.pitch = config.pitch;
    utterance.volume = config.volume;

    // Try to select a voice that matches the character
    const voices = window.speechSynthesis.getVoices();
    let selectedVoice: SpeechSynthesisVoice | undefined;

    if (character === 'alfred') {
      // Prefer British English voices for Alfred (sophisticated, refined)
      selectedVoice = voices.find(v => v.lang === 'en-GB' && v.name.includes('Male')) ||
                      voices.find(v => v.name.includes('Daniel')) ||
                      voices.find(v => v.name.includes('Google UK English Male')) ||
                      voices.find(v => v.name.includes('British')) ||
                      voices.find(v => v.name.includes('Oliver')) ||
                      voices.find(v => v.name.includes('Arthur')) ||
                      voices.find(v => v.lang === 'en-GB') ||
                      voices.find(v => v.lang.includes('en-GB'));
    } else if (character === 'batman') {
      // Prefer deeper, more serious male voices for Batman (dark, commanding)
      selectedVoice = voices.find(v => v.name.includes('Google US English Male')) ||
                      voices.find(v => v.name.includes('Microsoft David')) ||
                      voices.find(v => v.name.includes('Aaron')) ||
                      voices.find(v => v.name.includes('Fred')) ||
                      voices.find(v => v.name.toLowerCase().includes('male') && !v.name.toLowerCase().includes('female') && v.lang.includes('en-US')) ||
                      voices.find(v => v.name.includes('Alex'));
    } else if (character === 'joker') {
      // Joker - any male voice works (pitch/rate will make it chaotic)
      selectedVoice = voices.find(v => v.name.includes('Google US English Male')) ||
                      voices.find(v => v.name.includes('Google UK English Male')) ||
                      voices.find(v => v.lang.includes('en-US')) ||
                      voices.find(v => v.lang.includes('en'));
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    // Event handlers
    utterance.onend = () => {
      currentUtterance = null;
      resolve();
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      currentUtterance = null;
      reject(event);
    };

    // Store current utterance
    currentUtterance = utterance;

    // Speak
    window.speechSynthesis.speak(utterance);
  });
};

/**
 * Stops any ongoing speech
 */
export const stopSpeaking = (): void => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    currentUtterance = null;
  }
};

/**
 * Check if currently speaking
 */
export const isSpeaking = (): boolean => {
  if ('speechSynthesis' in window) {
    return window.speechSynthesis.speaking;
  }
  return false;
};

/**
 * Initialize voices (call this on page load to ensure voices are loaded)
 */
export const initVoices = (): Promise<void> => {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      resolve();
      return;
    }

    // Voices may not be loaded immediately
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve();
      return;
    }

    // Wait for voices to load
    window.speechSynthesis.onvoiceschanged = () => {
      resolve();
    };

    // Timeout fallback
    setTimeout(() => resolve(), 1000);
  });
};
