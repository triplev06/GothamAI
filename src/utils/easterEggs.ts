import { type CharacterVoice } from './textToSpeech';

export interface EasterEgg {
  trigger: string | RegExp;
  mode?: 'batman' | 'alfred' | 'joker' | 'any';
  effect: 'bat-signal' | 'chaos' | 'teatime' | 'hidden-message';
  response?: string;
  action?: () => void;
}

// Easter egg definitions
export const easterEggs: EasterEgg[] = [
  // Batman Easter Eggs
  {
    trigger: /i'?m\s+batman/i,
    mode: 'batman',
    effect: 'bat-signal',
    response: "No... I'M BATMAN."
  },
  {
    trigger: /where are they|where is she|where is he/i,
    mode: 'batman',
    effect: 'bat-signal',
    response: "TELL ME WHERE THEY ARE!"
  },
  {
    trigger: /swear to me/i,
    mode: 'batman',
    effect: 'bat-signal',
    response: "SWEAR TO ME!"
  },
  {
    trigger: /justice/i,
    mode: 'batman',
    effect: 'bat-signal'
  },
  {
    trigger: /bat.?signal/i,
    mode: 'batman',
    effect: 'bat-signal',
    response: "The signal has been lit. Gotham needs me."
  },

  // Joker Easter Eggs
  {
    trigger: /why so serious/i,
    mode: 'joker',
    effect: 'chaos',
    response: "Let's put a smile on that face! HAHAHA!"
  },
  {
    trigger: /want to see a (trick|magic trick)/i,
    mode: 'joker',
    effect: 'chaos',
    response: "I'm gonna make this pencil... disappear. TADA! It's... gone! HAHAHA!"
  },
  {
    trigger: /do i (really )?look like a (guy|man) with a plan/i,
    mode: 'joker',
    effect: 'chaos',
    response: "Do I really look like a guy with a plan? I'm like a dog chasing cars! HAHAHA!"
  },
  {
    trigger: /chaos/i,
    mode: 'joker',
    effect: 'chaos',
    response: "Introduce a little anarchy... upset the established order! HAHAHA!"
  },
  {
    trigger: /haha|lol|lmao/i,
    mode: 'joker',
    effect: 'chaos'
  },
  {
    trigger: /agent of chaos/i,
    mode: 'joker',
    effect: 'chaos',
    response: "I'm an agent of chaos. Oh, and you know the thing about chaos? It's FAIR! HAHAHA!"
  },

  // Alfred Easter Eggs
  {
    trigger: /tea time|tea break/i,
    mode: 'alfred',
    effect: 'teatime',
    response: "Ah, splendid suggestion. A proper cup of tea does wonders for clarity of mind. Shall I prepare Earl Grey?"
  },
  {
    trigger: /master (wayne|bruce)/i,
    mode: 'alfred',
    effect: 'teatime',
    response: "Master Wayne is... currently indisposed. May I take a message?"
  },
  {
    trigger: /thank you alfred|thanks alfred/i,
    mode: 'alfred',
    effect: 'teatime',
    response: "Always a pleasure to be of service, sir."
  },
  {
    trigger: /butler/i,
    mode: 'alfred',
    effect: 'teatime',
    response: "I prefer 'Distinguished Gentleman's Gentleman,' but butler will suffice."
  },

  // Universal Easter Eggs (work in any mode)
  {
    trigger: /konami|up up down down/i,
    mode: 'any',
    effect: 'hidden-message',
    response: "Achievement Unlocked: You've discovered a secret! 🎮"
  },
  {
    trigger: /gotham/i,
    mode: 'any',
    effect: 'bat-signal'
  }
];

// Check if message contains easter eggs
export function detectEasterEgg(message: string, currentMode: CharacterVoice): EasterEgg | null {
  const messageLower = message.toLowerCase().trim();

  for (const egg of easterEggs) {
    // Check mode compatibility
    if (egg.mode && egg.mode !== 'any' && egg.mode !== currentMode) {
      continue;
    }

    // Check trigger match
    let isMatch = false;
    if (typeof egg.trigger === 'string') {
      isMatch = messageLower.includes(egg.trigger.toLowerCase());
    } else {
      isMatch = egg.trigger.test(message);
    }

    if (isMatch) {
      return egg;
    }
  }

  return null;
}

// Get special response for easter egg if it has one
export function getEasterEggResponse(egg: EasterEgg): string | null {
  return egg.response || null;
}

// Trigger visual effects for easter eggs
export function triggerEasterEggEffect(effect: EasterEgg['effect']): void {
  switch (effect) {
    case 'bat-signal':
      triggerBatSignalFlash();
      break;
    case 'chaos':
      triggerChaosMode();
      break;
    case 'teatime':
      triggerTeaTime();
      break;
    case 'hidden-message':
      // Just show in chat, no visual effect
      break;
  }
}

// Bat-Signal Flash Effect
function triggerBatSignalFlash() {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    background: radial-gradient(circle at center, rgba(212, 168, 56, 0.4) 0%, transparent 70%);
    pointer-events: none;
    z-index: 9999;
    animation: bat-signal-flash 1.5s ease-out;
  `;

  // Add keyframes if not already present
  if (!document.getElementById('bat-signal-keyframes')) {
    const style = document.createElement('style');
    style.id = 'bat-signal-keyframes';
    style.textContent = `
      @keyframes bat-signal-flash {
        0%, 100% { opacity: 0; }
        50% { opacity: 1; }
      }
      @keyframes chaos-shake {
        0%, 100% { transform: translate(0, 0) rotate(0deg); }
        10% { transform: translate(-5px, -5px) rotate(-2deg); }
        20% { transform: translate(5px, 5px) rotate(2deg); }
        30% { transform: translate(-5px, 5px) rotate(-1deg); }
        40% { transform: translate(5px, -5px) rotate(1deg); }
        50% { transform: translate(-3px, 3px) rotate(-2deg); }
        60% { transform: translate(3px, -3px) rotate(2deg); }
        70% { transform: translate(-3px, -3px) rotate(-1deg); }
        80% { transform: translate(3px, 3px) rotate(1deg); }
        90% { transform: translate(-2px, 2px) rotate(-1deg); }
      }
      @keyframes chaos-glitch {
        0%, 100% { transform: translate(0); filter: hue-rotate(0deg); }
        20% { transform: translate(-2px, 2px); filter: hue-rotate(90deg); }
        40% { transform: translate(2px, -2px); filter: hue-rotate(180deg); }
        60% { transform: translate(-2px, -2px); filter: hue-rotate(270deg); }
        80% { transform: translate(2px, 2px); filter: hue-rotate(360deg); }
      }
      @keyframes teatime-glow {
        0%, 100% { filter: brightness(1); }
        50% { filter: brightness(1.2) drop-shadow(0 0 20px rgba(191, 191, 191, 0.5)); }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(overlay);

  setTimeout(() => {
    overlay.remove();
  }, 1500);
}

// Joker Chaos Mode - Scramble UI temporarily
function triggerChaosMode() {
  const mainContent = document.querySelector('.flex.h-screen') as HTMLElement;
  if (!mainContent) return;

  // Apply chaos animation
  mainContent.style.animation = 'chaos-shake 0.5s ease-in-out, chaos-glitch 0.8s ease-in-out';

  // Create purple chaos overlay
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    background: radial-gradient(circle at center, rgba(179, 102, 204, 0.3) 0%, rgba(0, 255, 65, 0.2) 100%);
    pointer-events: none;
    z-index: 9999;
    animation: chaos-glitch 0.8s ease-in-out;
    mix-blend-mode: screen;
  `;

  document.body.appendChild(overlay);

  setTimeout(() => {
    mainContent.style.animation = '';
    overlay.remove();
  }, 800);
}

// Alfred's Tea Time - Elegant glow effect
function triggerTeaTime() {
  const mainContent = document.querySelector('.flex.h-screen') as HTMLElement;
  if (!mainContent) return;

  mainContent.style.animation = 'teatime-glow 2s ease-in-out';

  // Create elegant silver overlay
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    background: radial-gradient(circle at center, rgba(191, 191, 191, 0.15) 0%, transparent 70%);
    pointer-events: none;
    z-index: 9999;
    animation: teatime-glow 2s ease-in-out;
  `;

  document.body.appendChild(overlay);

  setTimeout(() => {
    mainContent.style.animation = '';
    overlay.remove();
  }, 2000);
}
