import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Image as ImageIcon, X, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/contexts/ThemeContext";
import { ThemeToggle } from "./ThemeToggle";
import ChatMessage from "./ChatMessage";
import VoiceInput from "./VoiceInput";
import batmanHeroImage from "@/assets/BatmanHeroImage.png";
import gothamBackground from "@/assets/GothamCityBackground.png";
import alfredPortrait from "@/assets/alfred-portrait.png";
import alfredBackground from "@/assets/alfredBg.png";
import jokerPortrait from "@/assets/joker-portrait.png";
import jokerBackground from "@/assets/joker-background.png";
import { speak, stopSpeaking, initVoices, type CharacterVoice } from "@/utils/textToSpeech";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface Message {
  text: string;
  isUser: boolean;
  speakerName?: string;
  imageUrl?: string;
}

const ChatInterface = () => {
  const { theme } = useTheme();

  const getInitialMessage = () => {
    if (theme === 'batman') {
      return "I'm Batman. What do you need?";
    } else if (theme === 'alfred') {
      return "Good day. I am Alfred, at your service. How may I assist you today?";
    } else {
      return "Well, well, well... Look who decided to drop by. HAHAHA! What brings you to my little corner of chaos?";
    }
  };

  const [messages, setMessages] = useState<Message[]>([
    { text: getInitialMessage(), isUser: false }
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [speakingMessageIndex, setSpeakingMessageIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Initialize TTS voices on mount
  useEffect(() => {
    initVoices();
  }, []);

  // Update initial message when theme changes
  useEffect(() => {
    setMessages([{ text: getInitialMessage(), isUser: false }]);
    stopSpeaking(); // Stop any ongoing speech when switching themes
    setSpeakingMessageIndex(null);
  }, [theme]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSpeak = async (messageIndex: number, text: string) => {
    // Stop any ongoing speech
    stopSpeaking();

    // Set the speaking message index
    setSpeakingMessageIndex(messageIndex);

    try {
      await speak(text, theme as CharacterVoice);
    } catch (error) {
      console.error('TTS error:', error);
    } finally {
      setSpeakingMessageIndex(null);
    }
  };

  const handleStopSpeaking = () => {
    stopSpeaking();
    setSpeakingMessageIndex(null);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: theme === 'batman' ? "Image exceeds 5MB limit." : "Please select an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: theme === 'batman' ? "Only images accepted." : "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const sendMessage = async (text: string) => {
    if ((!text.trim() && !selectedImage) || isLoading) return;

    const userMessage = {
      text: text.trim() || (selectedImage ? "Analyze this image" : ""),
      isUser: true,
      imageUrl: selectedImage || undefined
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputText("");

    const imageToSend = selectedImage;
    removeSelectedImage(); // Clear image after adding to messages

    setIsLoading(true);
    setIsTyping(true);

    // Add empty message that will be populated by streaming
    const streamingMessageIndex = messages.length + 1;
    setMessages((prev) => [...prev, { text: "", isUser: false }]);

    try {
      // Use Supabase Edge Function with streaming
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_KEY}`,
          },
          body: JSON.stringify({
            message: text.trim() || "Analyze this image",
            characterMode: theme,
            image: imageToSend,
            stream: true,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Check if response is JSON or SSE
      const contentType = response.headers.get('content-type');

      if (contentType?.includes('application/json')) {
        // Handle JSON response (function calls or collected stream)
        const data = await response.json();
        setIsTyping(false);

        if (data?.response) {
          setMessages((prev) => {
            const newMessages = [...prev];
            newMessages[streamingMessageIndex] = { text: data.response, isUser: false };
            return newMessages;
          });
        } else {
          throw new Error("No response from assistant");
        }
      } else {
        // Handle SSE streaming response
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let streamedText = "";

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  setIsTyping(false);
                  break;
                }

                try {
                  const parsed = JSON.parse(data);
                  if (parsed.content) {
                    streamedText += parsed.content;
                    // Update the streaming message in real-time
                    setMessages((prev) => {
                      const newMessages = [...prev];
                      newMessages[streamingMessageIndex] = { text: streamedText, isUser: false };
                      return newMessages;
                    });
                  }
                } catch (e) {
                  // Ignore parse errors
                }
              }
            }
          }
        }

        setIsTyping(false);

        if (!streamedText) {
          throw new Error("No response from assistant");
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setIsTyping(false);

      // Remove the empty streaming message on error
      setMessages((prev) => prev.slice(0, -1));

      let errorMessage = theme === 'batman'
        ? "System malfunction. Try again."
        : theme === 'alfred'
        ? "My apologies, I encountered an error. Please try again."
        : "HAHAHA! Well, that didn't go as planned... Try again!";

      if (error.message?.includes("429")) {
        errorMessage = theme === 'batman'
          ? "Too many requests. Wait."
          : theme === 'alfred'
          ? "I'm receiving too many requests. Please wait a moment and try again."
          : "Whoa, slow down there! Even chaos needs a breather...";
      } else if (error.message?.includes("402")) {
        errorMessage = theme === 'batman'
          ? "Service requires additional resources."
          : theme === 'alfred'
          ? "The service requires additional credits. Please contact support."
          : "Looks like we're all out of credits. How... predictable.";
      }

      setMessages((prev) => [...prev, { text: errorMessage, isUser: false }]);

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputText);
  };

  const handleVoiceTranscript = async (text: string, speakerName?: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage = { text: text.trim(), isUser: true, speakerName };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setIsTyping(true);

    // Add empty message that will be populated by streaming
    const streamingMessageIndex = messages.length + 1;
    setMessages((prev) => [...prev, { text: "", isUser: false }]);

    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_KEY}`,
          },
          body: JSON.stringify({
            message: text.trim(),
            characterMode: theme,
            stream: true,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Check if response is JSON or SSE
      const contentType = response.headers.get('content-type');

      if (contentType?.includes('application/json')) {
        // Handle JSON response (function calls or collected stream)
        const data = await response.json();
        setIsTyping(false);

        if (data?.response) {
          setMessages((prev) => {
            const newMessages = [...prev];
            newMessages[streamingMessageIndex] = { text: data.response, isUser: false };
            return newMessages;
          });
        } else {
          throw new Error("No response from assistant");
        }
      } else {
        // Handle SSE streaming response
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let streamedText = "";

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  setIsTyping(false);
                  break;
                }

                try {
                  const parsed = JSON.parse(data);
                  if (parsed.content) {
                    streamedText += parsed.content;
                    setMessages((prev) => {
                      const newMessages = [...prev];
                      newMessages[streamingMessageIndex] = { text: streamedText, isUser: false };
                      return newMessages;
                    });
                  }
                } catch (e) {
                  // Ignore parse errors
                }
              }
            }
          }
        }

        setIsTyping(false);

        if (!streamedText) {
          throw new Error("No response from assistant");
        }
      }
    }
    catch (error) {
      console.error("Error sending message:", error);
      setIsTyping(false);

      // Remove the empty streaming message on error
      setMessages((prev) => prev.slice(0, -1));

        let errorMessage = theme === 'batman'
          ? "System malfunction. Try again."
          : theme === 'alfred'
          ? "My apologies, I encountered an error. Please try again."
          : "HAHAHA! Well, that didn't go as planned... Try again!";

        if (error.message?.includes("429")) {
          errorMessage = theme === 'batman'
            ? "Too many requests. Wait."
            : theme === 'alfred'
            ? "I'm receiving too many requests. Please wait a moment and try again."
            : "Whoa, slow down there! Even chaos needs a breather...";
        } else if (error.message?.includes("402")) {
          errorMessage = theme === 'batman'
            ? "Service requires additional resources."
            : theme === 'alfred'
            ? "The service requires additional credits. Please contact support."
            : "Looks like we're all out of credits. How... predictable.";
        }

        setMessages((prev) => [...prev, { text: errorMessage, isUser: false }]);

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportConversation = () => {
    const characterName = theme === 'batman' ? 'Batman' : theme === 'alfred' ? 'Alfred Pennyworth' : 'The Joker';
    const timestamp = new Date().toLocaleString();

    let exportText = `=================================================\n`;
    exportText += `  Gotham AI - CONVERSATION EXPORT\n`;
    exportText += `  Character: ${characterName}\n`;
    exportText += `  Date: ${timestamp}\n`;
    exportText += `=================================================\n\n`;

    messages.forEach((msg, index) => {
      if (msg.isUser) {
        exportText += `👤 USER${msg.speakerName ? ` (${msg.speakerName})` : ''}:\n`;
      } else {
        const characterIcon = theme === 'batman' ? '🦇' : theme === 'alfred' ? '🎩' : '🃏';
        exportText += `${characterIcon} ${characterName.toUpperCase()}:\n`;
      }
      exportText += `${msg.text}\n`;
      if (msg.imageUrl) {
        exportText += `[Image attached]\n`;
      }
      exportText += `\n`;
    });

    exportText += `=================================================\n`;
    exportText += `End of conversation\n`;
    exportText += `Generated by Gotham AI\n`;
    exportText += `=================================================`;

    // Create download
    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation-${theme}-${new Date().getTime()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Conversation Exported",
      description: theme === 'batman'
        ? "Archive secured."
        : theme === 'alfred'
        ? "Your conversation has been successfully exported, sir."
        : "Downloaded! Now spread the chaos!",
    });
  };

  const heroImage = theme === 'batman' ? batmanHeroImage : theme === 'alfred' ? alfredPortrait : jokerPortrait;
  const backgroundImage = theme === 'batman' ? gothamBackground : theme === 'alfred' ? alfredBackground :
  jokerBackground;
  const characterTitle = theme === 'batman' ? 'THE DARK KNIGHT' : theme === 'alfred' ? 'ALFRED PENNYWORTH' : 'THE JOKER';
  const characterSubtitle = theme === 'batman' ? "Gotham's Protector" : theme === 'alfred' ? 'Distinguished Butler & Trusted Advisor' : 'Agent of Chaos & Anarchy';
  const headerTitle = theme === 'batman' ? 'The Dark Knight' : theme === 'alfred' ? 'Alfred Pennyworth' : 'The Joker';
  const headerSubtitle = theme === 'batman' ? 'I work in the shadows' : theme === 'alfred' ? 'Your trusted assistant, at your service' : "Why so serious? Let's put a smile on that face!";

  return (
    <div className="flex h-screen bg-background">
      {/* Left Side - Character Portrait */}
      <div className={`hidden lg:flex lg:w-2/5 xl:w-1/3 border-r border-border flex-col items-center justify-center p-8 relative overflow-hidden ${
        theme === 'batman' ? 'gradient-gotham' : theme === 'alfred' ? 'gradient-secondary' : 'gradient-chaos'
      }`}>
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 to-transparent pointer-events-none"></div>
        <div className={`absolute inset-0 opacity-10 ${
          theme === 'batman'
            ? 'bg-[radial-gradient(circle_at_center,_hsl(43_74%_49%_/_0.1)_0%,_transparent_70%)]'
            : theme === 'alfred'
            ? 'bg-[radial-gradient(circle_at_center,_hsl(0_0%_75%_/_0.1)_0%,_transparent_70%)]'
            : 'bg-[radial-gradient(circle_at_center,_hsl(280_60%_60%_/_0.15)_0%,_transparent_70%)]'
        }`}></div>
        <div className={`relative z-10 flex flex-col items-center theme-entrance`}>
          <div className="w-full max-w-md flex items-center justify-center">
            <img
              src={heroImage}
              alt={characterTitle}
              className={`w-full h-auto object-contain drop-shadow-2xl ${
                theme === 'batman' ? 'bat-signal-pulse' : theme === 'alfred' ? 'elegant-pulse' : 'chaos-pulse'
              }`}
              style={{
                filter: theme === 'batman'
                  ? 'drop-shadow(0 0 30px rgba(212, 168, 56, 0.4))'
                  : theme === 'alfred'
                  ? 'drop-shadow(0 0 20px rgba(191, 191, 191, 0.3))'
                  : 'drop-shadow(0 0 30px rgba(179, 102, 204, 0.5))'
              }}
            />
          </div>
          <div className="mt-6 text-center">
            <h2 className={`text-3xl font-bold text-primary mb-2 ${
              theme === 'batman' ? 'text-glow-gold' : theme === 'alfred' ? 'text-glow-silver' : 'text-glow-purple'
            }`}>
              {characterTitle}
            </h2>
            <p className="text-muted-foreground italic tracking-wider">{characterSubtitle}</p>
          </div>
        </div>
      </div>

      {/* Right Side - Chat Interface */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className={`theme-panel px-6 py-4 ${
          theme === 'batman' ? 'shadow-gotham' : theme === 'alfred' ? 'shadow-elegant' : 'shadow-chaos'
        }`}>
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <div>
                <h1 className={`text-2xl font-bold text-primary ${
                  theme === 'batman' ? 'text-glow-gold' : theme === 'alfred' ? 'text-glow-silver' : 'text-glow-purple'
                }`}>
                  {headerTitle}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {headerSubtitle}
                </p>
              </div>
            </div>
            <Button
              onClick={exportConversation}
              variant="outline"
              size="sm"
              disabled={messages.length <= 1}
              className={`${
                theme === 'batman'
                  ? 'hover:border-primary hover:glow-gold'
                  : theme === 'alfred'
                  ? 'hover:border-primary hover-silver-glow'
                  : 'hover:border-primary hover-chaos-glow'
              } transition-all`}
              title="Export conversation"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-4xl mx-auto">
            {messages.map((message, index) => (
              <ChatMessage
                key={index}
                message={message.text}
                isUser={message.isUser}
                speakerName={message.speakerName}
                imageUrl={message.imageUrl}
                onSpeak={() => handleSpeak(index, message.text)}
                onStopSpeaking={handleStopSpeaking}
                isSpeaking={speakingMessageIndex === index}
              />
            ))}
            {isTyping && (
              <ChatMessage message="" isUser={false} isTyping={true} />
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className={`theme-panel px-6 py-6 ${
          theme === 'batman' ? 'shadow-gotham-lg' : theme === 'alfred' ? 'shadow-elegant-lg' : 'shadow-chaos-lg'
        }`}>
          <div className="max-w-4xl mx-auto space-y-4">
            {/* Image Preview */}
            {selectedImage && (
              <div className="relative inline-block">
                <img
                  src={selectedImage}
                  alt="Selected"
                  className="max-h-32 rounded-lg border-2 border-primary/30"
                />
                <Button
                  onClick={removeSelectedImage}
                  size="icon"
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                size="icon"
                variant="outline"
                className={`border-border ${
                  theme === 'batman'
                    ? 'hover:border-primary hover:glow-gold'
                    : theme === 'alfred'
                    ? 'hover:border-primary hover-silver-glow'
                    : 'hover:border-primary hover-chaos-glow'
                } transition-all`}
                title={theme === 'batman' ? 'Upload image for analysis' : theme === 'alfred' ? 'Upload an image' : 'Upload something... interesting'}
              >
                <ImageIcon className="w-4 h-4" />
              </Button>
              <Input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={theme === 'batman' ? 'Enter your command...' : theme === 'alfred' ? 'Type your message...' : 'Tell me a joke...'}
                disabled={isLoading}
                className={`flex-1 bg-background border-border focus:border-primary transition-all ${
                  theme === 'batman' ? 'hover-gold-glow focus:glow-gold' : theme === 'alfred' ? 'hover-silver-glow' : 'hover-chaos-glow'
                }`}
              />
              <Button
                type="submit"
                disabled={isLoading || (!inputText.trim() && !selectedImage)}
                size="icon"
                className={`gradient-primary ${
                  theme === 'batman'
                    ? 'hover:glow-gold-intense shadow-gotham text-background'
                    : theme === 'alfred'
                    ? 'hover:glow-silver-intense shadow-elegant text-primary-foreground'
                    : 'hover:glow-purple-intense shadow-chaos text-primary-foreground'
                } transition-all duration-300 font-bold`}
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border"></div>
              <span className="text-xs text-muted-foreground tracking-wider">OR USE VOICE</span>
              <div className="flex-1 h-px bg-border"></div>
            </div>

            <VoiceInput
              onTranscript={handleVoiceTranscript}
              isAssistantSpeaking={isTyping}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
