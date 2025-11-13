// Sound Effects and Ambient Audio Manager
type SoundType = 'message' | 'send' | 'typing' | 'easter-egg' | 'ambient';
type ThemeMode = 'batman' | 'alfred' | 'joker';

// Import sound files
let evilLaughSound: string | null = null;
let silentProtectorSound: string | null = null;

// Dynamically import the sound files
try {
  evilLaughSound = new URL('../assets/evil-laugh-89423.mp3', import.meta.url).href;
} catch (e) {
  console.warn('Evil laugh sound file not found');
}

try {
  silentProtectorSound = new URL('../assets/SilentProtector.mp3', import.meta.url).href;
} catch (e) {
  console.warn('Silent Protector sound file not found');
}

class SoundManager {
  private audioContext: AudioContext | null = null;
  private ambientAudio: HTMLAudioElement | null = null;
  private isMuted: boolean = false;
  private ambientVolume: number = 0.3;
  private effectsVolume: number = 0.5;
  private soundCache: Map<string, HTMLAudioElement> = new Map();

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  // Initialize audio context (needed for browsers that require user interaction)
  init() {
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  // Play MP3 sound file
  private playSound(soundUrl: string, volume: number = 1.0) {
    if (this.isMuted || !soundUrl) return;

    // Check cache first
    let audio = this.soundCache.get(soundUrl);

    if (!audio) {
      audio = new Audio(soundUrl);
      this.soundCache.set(soundUrl, audio);
    } else {
      // Reset to beginning if already exists
      audio.currentTime = 0;
    }

    audio.volume = volume * this.effectsVolume;
    audio.play().catch(err => console.warn('Audio play failed:', err));
  }

  // Toggle mute
  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.ambientAudio) {
      this.ambientAudio.muted = this.isMuted;
    }
    return this.isMuted;
  }

  setVolume(ambient: number, effects: number) {
    this.ambientVolume = ambient;
    this.effectsVolume = effects;
    if (this.ambientAudio) {
      this.ambientAudio.volume = this.ambientVolume;
    }
  }

  // Play ambient background audio for theme
  playAmbient(theme: ThemeMode) {
    this.stopAmbient();

    if (this.isMuted) return;

    // Create oscillator for ambient drone
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // Theme-specific ambient sounds
    if (theme === 'batman') {
      // Deep, ominous drone
      oscillator.frequency.value = 55; // Low A
      filter.type = 'lowpass';
      filter.frequency.value = 200;
      gainNode.gain.value = this.ambientVolume * 0.1;
    } else if (theme === 'alfred') {
      // Soft, refined tone
      oscillator.frequency.value = 220; // A3
      filter.type = 'lowpass';
      filter.frequency.value = 800;
      gainNode.gain.value = this.ambientVolume * 0.05;
    } else {
      // Chaotic, dissonant
      oscillator.frequency.value = 666; // Appropriately chaotic
      filter.type = 'bandpass';
      filter.frequency.value = 1000;
      gainNode.gain.value = this.ambientVolume * 0.08;
    }

    oscillator.type = 'sine';
    oscillator.start();

    // Store reference (simplified)
    setTimeout(() => oscillator.stop(), 100); // Just a subtle tone
  }

  stopAmbient() {
    if (this.ambientAudio) {
      this.ambientAudio.pause();
      this.ambientAudio.currentTime = 0;
    }
  }

  // Play Batman bat-signal sound
  playBatSignal() {
    if (this.isMuted || !this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // Swooshing sound effect
    oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.3);

    gainNode.gain.setValueAtTime(this.effectsVolume * 0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.3);
  }

  // Play Joker laugh sound
  playJokerLaugh() {
    if (this.isMuted || !this.audioContext) return;

    const notes = [330, 370, 415, 466, 523]; // Ascending chaotic notes
    let time = this.audioContext.currentTime;

    notes.forEach((freq, i) => {
      const oscillator = this.audioContext!.createOscillator();
      const gainNode = this.audioContext!.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext!.destination);

      oscillator.frequency.value = freq;
      oscillator.type = 'square';

      gainNode.gain.setValueAtTime(this.effectsVolume * 0.2, time);
      gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.1);

      oscillator.start(time);
      oscillator.stop(time + 0.1);

      time += 0.08;
    });
  }

  // Play Alfred's refined notification
  playAlfredChime() {
    if (this.isMuted || !this.audioContext) return;

    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 - elegant chord

    notes.forEach((freq) => {
      const oscillator = this.audioContext!.createOscillator();
      const gainNode = this.audioContext!.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext!.destination);

      oscillator.frequency.value = freq;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(this.effectsVolume * 0.15, this.audioContext!.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext!.currentTime + 0.5);

      oscillator.start();
      oscillator.stop(this.audioContext!.currentTime + 0.5);
    });
  }

  // Play message received sound
  playMessageReceived(theme: ThemeMode) {
    if (this.isMuted || !this.audioContext) return;

    if (theme === 'batman') {
      this.playBatSignal();
    } else if (theme === 'alfred') {
      this.playAlfredChime();
    } else {
      this.playJokerLaugh();
    }
  }

  // Play message sent sound
  playMessageSent(theme: ThemeMode) {
    if (this.isMuted || !this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    if (theme === 'batman') {
      oscillator.frequency.value = 440;
      oscillator.type = 'triangle';
    } else if (theme === 'alfred') {
      oscillator.frequency.value = 523;
      oscillator.type = 'sine';
    } else {
      oscillator.frequency.value = 666;
      oscillator.type = 'sawtooth';
    }

    gainNode.gain.setValueAtTime(this.effectsVolume * 0.2, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);

    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.15);
  }

  // Play typing indicator sound
  playTyping(theme: ThemeMode) {
    if (this.isMuted || !this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = theme === 'batman' ? 100 : theme === 'alfred' ? 200 : 150;
    oscillator.type = 'square';

    gainNode.gain.setValueAtTime(this.effectsVolume * 0.05, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);

    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.05);
  }

  // Easter egg sound
  playEasterEgg(type: 'bat-signal' | 'chaos' | 'teatime') {
    if (this.isMuted) return;

    if (type === 'bat-signal') {
      // Play Silent Protector MP3 if available, otherwise fall back to procedural
      if (silentProtectorSound) {
        this.playSound(silentProtectorSound, 0.9);
      } else {
        // Fallback: Epic bat signal sound
        this.playBatSignal();
        setTimeout(() => this.playBatSignal(), 200);
        setTimeout(() => this.playBatSignal(), 400);
      }
    } else if (type === 'chaos') {
      // Play evil laugh MP3 if available, otherwise fall back to procedural
      if (evilLaughSound) {
        this.playSound(evilLaughSound, 0.8);
      } else if (this.audioContext) {
        // Fallback: Chaotic glitch sound
        for (let i = 0; i < 5; i++) {
          setTimeout(() => {
            const oscillator = this.audioContext!.createOscillator();
            const gainNode = this.audioContext!.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext!.destination);

            oscillator.frequency.value = Math.random() * 1000 + 200;
            oscillator.type = 'sawtooth';

            gainNode.gain.setValueAtTime(this.effectsVolume * 0.3, this.audioContext!.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext!.currentTime + 0.1);

            oscillator.start();
            oscillator.stop(this.audioContext!.currentTime + 0.1);
          }, i * 50);
        }
      }
    } else if (type === 'teatime') {
      // Gentle tea cup clink
      this.playAlfredChime();
      setTimeout(() => this.playAlfredChime(), 300);
    }
  }
}

// Export singleton instance
export const soundManager = new SoundManager();

// Helper functions
export const initSound = () => soundManager.init();
export const toggleMute = () => soundManager.toggleMute();
export const playMessageSound = (theme: ThemeMode) => soundManager.playMessageReceived(theme);
export const playSendSound = (theme: ThemeMode) => soundManager.playMessageSent(theme);
export const playTypingSound = (theme: ThemeMode) => soundManager.playTyping(theme);
export const playEasterEggSound = (type: 'bat-signal' | 'chaos' | 'teatime') => soundManager.playEasterEgg(type);
export const setVolume = (ambient: number, effects: number) => soundManager.setVolume(ambient, effects);
