# 🦇 Gotham AI 🦇

> *"It's not who I am underneath, but what I do that defines me."* - Batman

## THE SIGNAL IN THE NIGHT

When Gotham needs a hero, the Bat-Signal lights up the sky. When YOU need an AI assistant that truly understands you, **Gotham AI** answers the call.

This isn't just another AI chatbot. This is a **multi-modal AI experience** featuring three distinct personalities - Batman, Alfred, and The Joker - each with unique voice profiles, analysis styles, and character-authentic responses.

## 🎭 THREE PERSONALITIES, ONE POWERFUL SYSTEM

### 🦇 Batman - The Dark Knight
- **Voice**: Deep (pitch 0.5), slow, commanding
- **Personality**: Direct, tactical, no-nonsense
- **Image Analysis**: Security-focused threat assessment
- **Use Case**: When you need strategic, mission-critical responses

### 🎩 Alfred - Distinguished Butler
- **Voice**: British accent, refined, measured
- **Personality**: Sophisticated, eloquent, wise
- **Image Analysis**: Artistic appreciation and cultural insight
- **Use Case**: When you need elegant advice and refined analysis

### 🃏 The Joker - Agent of Chaos
- **Voice**: High-pitched (pitch 1.5), fast, manic
- **Personality**: Chaotic, sarcastic, darkly humorous
- **Image Analysis**: Finds absurdity and irony in everything
- **Use Case**: When you need unconventional perspectives

## 🚀 GROUNDBREAKING FEATURES

### 🎙️ **Multi-Modal AI Integration**
- **Voice Input**: Biometric voice recognition with speaker identification
- **Voice Output**: Character-specific Text-to-Speech (Batman sounds deep and menacing, Joker sounds manic)
- **Vision AI**: Image analysis using Llama 4 Scout vision model
- **Text Chat**: Natural language conversations with persistent context

### 🎵 **Immersive Sound Effects**
- **Character-Specific Audio**: Each personality has unique sound effects
  - **Batman**: Deep bat-signal swoosh
  - **Alfred**: Elegant refined chime
  - **Joker**: Chaotic ascending laugh
- **Message Sounds**: Audio feedback when sending and receiving messages
- **Mute Control**: Toggle button in header to enable/disable sounds
- **Web Audio API**: Procedurally generated sounds (no file downloads required)

### 👥 **Multi-Character Council Mode**
- **Ask All Three Characters**: Get perspectives from Batman, Alfred, AND The Joker simultaneously
- **Parallel Processing**: All characters respond to the same question at once
- **Beautiful Grid Layout**: Responses displayed side-by-side with character portraits
- **Individual Voice Playback**: Each response can be spoken in their unique voice
- **Perfect for Decision Making**: Compare tactical, wise, and chaotic viewpoints

### 🎁 **Hidden Easter Eggs & Interactive Surprises**
Discover secret interactions with special visual effects and responses!

#### Batman Easter Eggs:
- **"I'm Batman"** - Triggers golden bat-signal flash across screen
- **"Where are they?"** / **"TELL ME!"** - Interrogation mode activation
- **"Swear to me"** - Iconic line callback with bat-signal effect
- **"Justice"** - Subtle bat-signal pulse
- **"Bat signal"** - Full bat-signal activation with sound

#### Alfred Easter Eggs:
- **"Tea time"** / **"Tea break"** - Elegant silver glow effect with refined response
- **"Master Wayne"** / **"Master Bruce"** - Formal butler acknowledgment
- **"Thank you Alfred"** - Gracious response with tea time effect
- **"Butler"** - Witty response about his proper title

#### Joker Easter Eggs:
- **"Why so serious"** - CHAOS MODE! Screen shakes with purple/green glitch
- **"Want to see a trick"** / **"Magic trick"** - Disappearing pencil reference
- **"Do I look like a guy with a plan"** - Philosophy of chaos with effects
- **"Chaos"** - Visual chaos effect activation
- **"Haha"** / **"Lol"** / **"Lmao"** - Triggers chaotic laughter and effects
- **"Agent of chaos"** - Full chaos mode with manic response

#### Universal Easter Eggs (Work in Any Mode):
- **"Gotham"** - Bat-signal effect in any character mode
- **"Konami"** / **"Up up down down"** - Secret achievement unlocked

**Visual Effects Include:**
- 🦇 **Bat-Signal Flash**: 1.5s golden radial glow pulse
- 🃏 **Chaos Mode**: Purple/green glitch with screen shake and rotation
- ☕ **Tea Time**: 2s elegant silver brightness glow

### 🧠 **Advanced AI Capabilities**

#### 🛠️ Function Calling / Tool Use
The AI can actually USE TOOLS to get real information:
- **Calculator**: "What's 15% of 47?" → AI performs calculation
- **Weather**: "What's the weather in Gotham?" → AI checks weather
- **Time/Date**: "What time is it?" → AI gets current time

#### 🖼️ **Vision Analysis**
Upload images and each character analyzes them differently:
- **Batman**: Identifies security threats, entry points, vulnerabilities
- **Alfred**: Provides artistic critique, historical context, aesthetic analysis
- **Joker**: Finds chaos, humor, and absurdity in the scene

### 🔐 **Biometric Security**
- **Face Recognition**: Camera-based facial authentication
- **Voice Authentication**: Unique voiceprint enrollment and verification
- **Dual-Factor**: Requires BOTH voice AND face to access the system
- **Password Fallback**: Traditional authentication option

### 🎨 **Dynamic Theme System**
Three distinct visual themes that adapt to each character:
- **Batman**: Gold accents, dark Gotham aesthetics
- **Alfred**: Silver accents, elegant refinement
- **Joker**: Purple/green chaos with animated effects

## 💪 THE TECH STACK

Built with cutting-edge, production-grade technology:

### Frontend
- **React 18** + **TypeScript** - Type-safe, modern UI framework
- **Vite** - Lightning-fast build tool and dev server
- **Tailwind CSS** - Utility-first styling with custom theme system
- **shadcn/ui** - High-quality, accessible component library

### Backend & AI
- **Supabase** - PostgreSQL database + Edge Functions
- **Groq API** - Ultra-fast AI inference (400+ tokens/second)
- **Llama 4 Scout** - State-of-the-art vision model for image analysis
- **Llama 3.3 70B** - Advanced language model for conversations
- **Web Speech API** - Browser-native TTS and voice recognition

### Security & Auth
- **Face-api.js** - Browser-based facial recognition
- **Custom Voice Biometrics** - MFCC-based voice authentication
- **Supabase Auth** - Password-based fallback authentication

## 🚀 SETUP & DEPLOYMENT

### Prerequisites

- **Node.js 18+** & npm ([install via nvm](https://github.com/nvm-sh/nvm))
- **Supabase Account** ([create free account](https://supabase.com))
- **Groq API Key** ([get free key](https://console.groq.com))

### Quick Start

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd digital-whisperer-ai

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your credentials:
# - VITE_SUPABASE_URL=your_supabase_url
# - VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
# - GROQ_API_KEY=your_groq_key (in Supabase Edge Function secrets)

# Run locally
npm run dev
```

### Deploy Edge Function

```bash
# Install Supabase CLI
npm install -g supabase

# Deploy chat function
supabase functions deploy chat --project-ref your-project-ref

# Set Groq API key secret
supabase secrets set GROQ_API_KEY=your_groq_api_key
```

### Database Setup

The app uses Supabase PostgreSQL for:
- User profiles (`user_profiles`)
- Voice biometrics (`voice_profiles`)
- Face recognition data (`face_profiles`)

Schema is auto-created on first authentication attempt.

---

## 📊 API USAGE & COSTS

**All features use FREE tiers:**

| Service | Free Tier | Usage |
|---------|-----------|-------|
| Groq API | 500k tokens/day | Text & image AI |
| Supabase | 500MB database, 2GB storage | User data & auth |
| Web Speech API | Unlimited | Voice recognition & TTS |
| Llama 4 Scout | Free via Groq | Image analysis |
| Llama 3.3 70B | Free via Groq | Conversations |

**Estimated costs for 1000 users/month: $0** 🎉

## 🎯 HOW TO DEMO FOR JUDGES

### **1. Biometric Authentication (30 seconds)**
*"First, I'll demonstrate our dual-factor biometric authentication..."*
- Show face + voice authentication
- Explain it requires BOTH to access
- Mention data is encrypted in Supabase

### **2. Character Switching (15 seconds)**
*"The app features three distinct AI personalities..."*
- Toggle between Batman, Alfred, and Joker
- Point out visual theme changes (colors, animations)
- Highlight the 3-button selector

### **3. Text-to-Speech & Sound Effects (45 seconds)**
*"Each character has a unique voice profile and sound effects..."*
- Send a message to Batman → Click speaker button
  - *"Notice the deep (0.5 pitch), slow voice and bat-signal swoosh"*
- Switch to Joker → Send same message → Click speaker
  - *"Now it's high-pitched (1.5) and fast with chaotic laughter!"*
- Switch to Alfred → Click speaker
  - *"British accent, refined with elegant chime"*
- Show the mute button to toggle sounds

### **4. Easter Eggs Demo (45 seconds)** ⭐ NEW!
*"The app has hidden interactive surprises..."*
- In Batman mode, type: *"I'm Batman"*
  - Show the golden bat-signal flash effect
- Switch to Joker, type: *"Why so serious"*
  - Show chaos mode with screen shake and glitch
- Switch to Alfred, type: *"Tea time"*
  - Show elegant silver glow effect
- *"There are 15+ easter eggs total - users love discovering them!"*

### **5. Council Mode (60 seconds)** ⭐ NEW!
*"You can ask all three characters the same question..."*
- Click the "Council" button in header
- Ask: *"What is the best approach to solving a difficult problem?"*
- Show all three responses appearing simultaneously
  - Batman: Tactical/strategic approach
  - Alfred: Wise/refined advice
  - Joker: Chaotic/creative perspective
- Click speaker icons to hear each character speak
- *"Perfect for decision-making and brainstorming!"*

### **6. Function Calling / Tool Use (60 seconds)**
*"The AI can use tools to get real information..."*
- Ask Batman: *"What's 15% of 47?"*
  - Show it uses the calculator tool
- Ask Alfred: *"What time is it?"*
  - Show it uses the time tool
- Ask Joker: *"What's the weather in Gotham?"*
  - Show it uses the weather tool (simulated)

### **7. Image Analysis (60 seconds)**
*"The AI can analyze images with character-specific perspectives..."*
- Upload an image to Batman
  - *"See how he identifies security vulnerabilities, entry points"*
- Upload same image to Alfred
  - *"Alfred provides artistic analysis and cultural context"*
- Upload to Joker
  - *"Joker finds chaos and humor in everything"*

### **8. Voice Input (30 seconds)**
*"You can also interact via voice..."*
- Click microphone button
- Speak a question
- Show voice recognition + AI response + TTS

---

## 🏆 WHAT MAKES THIS IMPRESSIVE

### **Technical Sophistication**
✅ Multi-modal AI (Text + Voice + Vision)
✅ Real-time streaming responses (Groq's 400+ tokens/sec)
✅ Function calling / tool augmentation
✅ Biometric authentication (face + voice)
✅ Character-specific TTS with pitch/rate tuning
✅ **NEW**: Procedural sound generation with Web Audio API
✅ **NEW**: Multi-character parallel AI queries (Council Mode)
✅ **NEW**: Dynamic visual effects system with CSS animations

### **AI Engineering Excellence**
✅ Vision model integration (Llama 4 Scout - latest 2025 model)
✅ Context-aware prompts (different for text vs images)
✅ Tool/function calling with multi-step reasoning
✅ Character personality consistency across modalities
✅ **NEW**: Pattern-based easter egg detection system
✅ **NEW**: Parallel API orchestration for council responses

### **User Experience**
✅ 3 distinct visual themes with smooth transitions
✅ Mobile-responsive design
✅ Real-time voice recognition with speaker ID
✅ Accessible UI with keyboard navigation
✅ **NEW**: Immersive sound effects for every interaction
✅ **NEW**: 15+ hidden easter eggs with visual effects
✅ **NEW**: Council mode for multi-perspective analysis

### **100% Free Resources**
✅ Groq API - Free tier (500k tokens/day)
✅ Web Speech API - Built into browsers
✅ Supabase - Free tier PostgreSQL + Edge Functions
✅ All models and APIs are free for development
✅ **NEW**: No external audio files (procedurally generated)

---

## 🎬 DEMO SCRIPT (6 MINUTES)

**[0:00 - 0:30] Introduction**
*"Gotham AI is a multi-modal AI assistant featuring three distinct personalities from the Batman universe, each with unique voices, visual themes, analysis styles, and interactive surprises."*

**[0:30 - 1:00] Biometric Auth**
- Demonstrate face + voice authentication
- Explain dual-factor security

**[1:00 - 1:45] Character Modes, TTS & Sound Effects**
- Show all 3 characters
- Demonstrate voice differences with speaker button
- Highlight visual theme transitions
- **NEW**: Show character-specific sound effects when sending/receiving messages

**[1:45 - 2:15] Easter Eggs** ⭐
- **Batman**: Type "I'm Batman" → Show bat-signal flash
- **Joker**: Type "Why so serious" → Show chaos mode
- **Alfred**: Type "Tea time" → Show elegant glow
- *"15+ hidden easter eggs with visual effects!"*

**[2:15 - 3:00] Council Mode** ⭐
- Click "Council" button
- Ask: "What's the best way to solve a complex problem?"
- Show all three characters responding simultaneously
- Click speaker icons to hear different voices
- *"Multi-perspective decision making!"*

**[3:00 - 3:45] Function Calling**
- Demo calculator tool
- Demo time/date tool
- Demo weather tool
- Explain how AI decides when to use tools

**[3:45 - 4:45] Vision Analysis**
- Upload image to Batman (security analysis)
- Upload same image to Alfred (artistic critique)
- Show how prompts adapt to images

**[4:45 - 5:30] Voice Interaction**
- Use voice input
- Show complete loop: Voice → AI → TTS response

**[5:30 - 6:00] Closing**
*"All of this runs on 100% free APIs and demonstrates advanced AI engineering - function calling, vision models, biometrics, character-specific personalities, procedural audio, and interactive effects. Plus, users love discovering the hidden easter eggs!"*

## 💡 KEY INNOVATIONS

### **1. Character-Aware Multi-Modal AI**
First AI assistant where personality extends across ALL modalities:
- Text responses match character voice
- TTS pitch/rate reflects personality
- Image analysis style differs by character
- Visual themes adapt to persona
- **NEW**: Character-specific sound effects and audio feedback

### **2. Tool-Augmented Character Responses**
AI maintains character even when using tools:
- Batman: *"Calculation complete. Result: 7.05"*
- Alfred: *"The calculation yields 7.05, sir."*
- Joker: *"HAHAHA! Math time! The answer is 7.05!"*

### **3. Biometric Multi-Factor Authentication**
Combining face + voice recognition in browser:
- No server-side image processing (privacy-first)
- MFCC-based voice feature extraction
- Face embeddings stored encrypted

### **4. Vision Model Prompting**
Custom prompts for each character's image analysis style:
- Batman: Security-focused, tactical assessment
- Alfred: Artistic appreciation, cultural context
- Joker: Finds absurdity and chaos

### **5. Interactive Easter Egg System** ⭐ NEW
Pattern-based detection with dynamic visual effects:
- 15+ hidden easter eggs across all three modes
- Real-time regex matching for iconic quotes
- Procedurally generated visual effects (bat-signal, chaos, tea time)
- Character-specific easter egg responses
- Gamification element that encourages exploration

### **6. Multi-Character Council Mode** ⭐ NEW
Parallel AI orchestration for multi-perspective analysis:
- Simultaneous queries to all three character personalities
- Promise.all() for parallel API execution
- Beautiful grid layout with individual voice playback
- Perfect for decision-making and brainstorming
- Demonstrates advanced state management and API orchestration

### **7. Procedural Audio System** ⭐ NEW
Web Audio API for dynamic sound generation:
- No external audio files (lightweight, fast)
- Character-specific synthesized sound effects
- Real-time audio generation with oscillators
- Mute/unmute control for accessibility
- Professional sound design with minimal overhead

---

## 🌃 THE MISSION

This project demonstrates that **AI should adapt to humans, not the other way around.**

By combining biometric authentication, multi-modal interaction, and distinct AI personalities, we create an experience that feels natural, engaging, and genuinely helpful - whether you need Batman's tactical advice, Alfred's refined wisdom, or Joker's chaotic perspective.

## 🦇 CONTRIBUTING

Gotham wasn't protected by one hero alone. If you want to join the mission:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## ⚡ THE CODE OF HONOR

This project is open source because true heroes share their knowledge to make the world a better place.

## 🏗️ ARCHITECTURE

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (React)                   │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐ │
│  │ Face Rec │  │  Voice   │  │  Chat Interface   │ │
│  │ (Camera) │  │  Input   │  │  (Text/Images)    │ │
│  └──────────┘  └──────────┘  └───────────────────┘ │
│         │            │                │              │
│         └────────────┴────────────────┘              │
│                      │                                │
└──────────────────────┼────────────────────────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │   Supabase Edge Function     │
        │  (Function Calling Logic)    │
        └──────────────────────────────┘
                       │
         ┌─────────────┴─────────────┐
         ▼                           ▼
┌─────────────────┐         ┌──────────────────┐
│  Groq API       │         │  Tool Execution  │
│  - Llama 4      │         │  - Calculator    │
│  - Llama 3.3    │         │  - Weather       │
│  - Vision Model │         │  - Time/Date     │
└─────────────────┘         └──────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│     AI Response Generated       │
│   (Character-Specific Format)   │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Frontend Renders Response      │
│  + TTS Speaks (Character Voice) │
└─────────────────────────────────┘
```

---

## 📝 CODE HIGHLIGHTS

### Character-Specific Prompts
```typescript
const systemPrompts = {
  batman: "You are Batman, the Dark Knight. Direct, terse, commanding...",
  alfred: "You are Alfred Pennyworth. Refined, articulate, proper...",
  joker: "You are The Joker. Unpredictable, sarcastic, chaotic..."
};
```

### TTS Voice Configurations
```typescript
const voiceConfigs = {
  batman: { rate: 0.75, pitch: 0.5 },  // Deep, slow
  alfred: { rate: 0.88, pitch: 0.9 },  // Refined
  joker: { rate: 1.3, pitch: 1.5 }     // Fast, high
};
```

### Function Calling Tools
```typescript
const tools = [
  { name: "calculate", description: "Perform math" },
  { name: "get_weather", description: "Get weather" },
  { name: "get_current_time", description: "Get time/date" }
];
```

---

## 🎓 LEARNING RESOURCES

Built this as a learning project? Check out these resources:

- [Groq API Documentation](https://console.groq.com/docs)
- [Llama 4 Vision Models](https://groq.com/blog/llama-4)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Function Calling Guide](https://console.groq.com/docs/tool-use)

---

## 🌟 ACKNOWLEDGMENTS

**Technologies:**
- Meta AI for Llama models
- Groq for blazing-fast inference
- Supabase for backend infrastructure
- The open-source community

**Inspiration:**
*"A hero can be anyone. Even someone building AI to make the world more accessible."*

---

**Remember**: The night is darkest just before the dawn. And the dawn of truly interactive, multi-modal AI is here.

**Now go forth and whisper to the digital darkness.** 🦇🎩🃏
