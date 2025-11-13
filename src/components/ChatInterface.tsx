import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
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

interface Message {
  text: string;
  isUser: boolean;
  speakerName?: string;
}

const ChatInterface = () => {
  const { theme } = useTheme();

  const getInitialMessage = () => {
    if (theme === 'batman') {
      return "I'm Batman. What do you need?";
    } else {
      return "Good day. I am Alfred, at your service. How may I assist you today?";
    }
  };

  const [messages, setMessages] = useState<Message[]>([
    { text: getInitialMessage(), isUser: false }
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Update initial message when theme changes
  useEffect(() => {
    setMessages([{ text: getInitialMessage(), isUser: false }]);
  }, [theme]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage = { text: text.trim(), isUser: true };
    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);
    setIsTyping(true);

    try {
      const { data, error } = await supabase.functions.invoke("chat", {
        body: {
          message: text.trim(),
          characterMode: theme // Pass the theme to determine personality
        },
      });

      if (error) {
        throw error;
      }

      setIsTyping(false);

      if (data?.response) {
        setMessages((prev) => [...prev, { text: data.response, isUser: false }]);
      } else {
        throw new Error("No response from assistant");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setIsTyping(false);

      let errorMessage = theme === 'batman'
        ? "System malfunction. Try again."
        : "My apologies, I encountered an error. Please try again.";

      if (error.message?.includes("429")) {
        errorMessage = theme === 'batman'
          ? "Too many requests. Wait."
          : "I'm receiving too many requests. Please wait a moment and try again.";
      } else if (error.message?.includes("402")) {
        errorMessage = theme === 'batman'
          ? "Service requires additional resources."
          : "The service requires additional credits. Please contact support.";
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

  const handleVoiceTranscript = (text: string, speakerName?: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage = { text: text.trim(), isUser: true, speakerName };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setIsTyping(true);

    // Send message to AI (same as sendMessage but without adding message again)
    supabase.functions.invoke("chat", {
      body: {
        message: text.trim(),
        characterMode: theme // Pass the theme to determine personality
      },
    })
      .then(({ data, error }) => {
        if (error) throw error;

        setIsTyping(false);

        if (data?.response) {
          setMessages((prev) => [...prev, { text: data.response, isUser: false }]);
        } else {
          throw new Error("No response from assistant");
        }
      })
      .catch((error) => {
        console.error("Error sending message:", error);
        setIsTyping(false);

        let errorMessage = theme === 'batman'
          ? "System malfunction. Try again."
          : "My apologies, I encountered an error. Please try again.";

        if (error.message?.includes("429")) {
          errorMessage = theme === 'batman'
            ? "Too many requests. Wait."
            : "I'm receiving too many requests. Please wait a moment and try again.";
        } else if (error.message?.includes("402")) {
          errorMessage = theme === 'batman'
            ? "Service requires additional resources."
            : "The service requires additional credits. Please contact support.";
        }

        setMessages((prev) => [...prev, { text: errorMessage, isUser: false }]);

        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const heroImage = theme === 'batman' ? batmanHeroImage : alfredPortrait;
  const backgroundImage = theme === 'batman' ? gothamBackground : alfredBackground;
  const characterTitle = theme === 'batman' ? 'THE DARK KNIGHT' : 'ALFRED PENNYWORTH';
  const characterSubtitle = theme === 'batman' ? "Gotham's Protector" : 'Distinguished Butler & Trusted Advisor';
  const headerTitle = theme === 'batman' ? 'The Dark Knight' : 'Alfred Pennyworth';
  const headerSubtitle = theme === 'batman' ? 'I work in the shadows' : 'Your trusted assistant, at your service';

  return (
    <div className="flex h-screen bg-background">
      {/* Left Side - Character Portrait */}
      <div className={`hidden lg:flex lg:w-2/5 xl:w-1/3 border-r border-border flex-col items-center justify-center p-8 relative overflow-hidden ${
        theme === 'batman' ? 'gradient-gotham' : 'gradient-secondary'
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
            : 'bg-[radial-gradient(circle_at_center,_hsl(0_0%_75%_/_0.1)_0%,_transparent_70%)]'
        }`}></div>
        <div className={`relative z-10 flex flex-col items-center theme-entrance`}>
          <div className="w-full max-w-md flex items-center justify-center">
            <img
              src={heroImage}
              alt={characterTitle}
              className={`w-full h-auto object-contain drop-shadow-2xl ${
                theme === 'batman' ? 'bat-signal-pulse' : 'elegant-pulse'
              }`}
              style={{
                filter: theme === 'batman'
                  ? 'drop-shadow(0 0 30px rgba(212, 168, 56, 0.4))'
                  : 'drop-shadow(0 0 20px rgba(191, 191, 191, 0.3))'
              }}
            />
          </div>
          <div className="mt-6 text-center">
            <h2 className={`text-3xl font-bold text-primary mb-2 ${
              theme === 'batman' ? 'text-glow-gold' : 'text-glow-silver'
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
          theme === 'batman' ? 'shadow-gotham' : 'shadow-elegant'
        }`}>
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <div>
                <h1 className={`text-2xl font-bold text-primary ${
                  theme === 'batman' ? 'text-glow-gold' : 'text-glow-silver'
                }`}>
                  {headerTitle}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {headerSubtitle}
                </p>
              </div>
            </div>
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
          theme === 'batman' ? 'shadow-gotham-lg' : 'shadow-elegant-lg'
        }`}>
          <div className="max-w-4xl mx-auto space-y-4">
            <form onSubmit={handleSubmit} className="flex gap-3">
              <Input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={theme === 'batman' ? 'Enter your command...' : 'Type your message...'}
                disabled={isLoading}
                className={`flex-1 bg-background border-border focus:border-primary transition-all ${
                  theme === 'batman' ? 'hover-gold-glow focus:glow-gold' : 'hover-silver-glow'
                }`}
              />
              <Button
                type="submit"
                disabled={isLoading || !inputText.trim()}
                size="icon"
                className={`gradient-primary ${
                  theme === 'batman'
                    ? 'hover:glow-gold-intense shadow-gotham text-background'
                    : 'hover:glow-silver-intense shadow-elegant text-primary-foreground'
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
