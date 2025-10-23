import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ChatMessage from "./ChatMessage";
import VoiceInput from "./VoiceInput";
import alfredPortrait from "@/assets/alfred-portrait.png";

interface Message {
  text: string;
  isUser: boolean;
}

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([
    { text: "Good day, I am Alfred, at your service. How may I assist you today?", isUser: false }
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

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
        body: { message: text.trim() },
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
    } catch (error: any) {
      console.error("Error sending message:", error);
      setIsTyping(false);
      
      let errorMessage = "Sorry, I encountered an error. Please try again.";
      
      if (error.message?.includes("429")) {
        errorMessage = "I'm receiving too many requests. Please wait a moment and try again.";
      } else if (error.message?.includes("402")) {
        errorMessage = "The service requires additional credits. Please contact support.";
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

  const handleVoiceTranscript = (text: string) => {
    sendMessage(text);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Left Side - Alfred Portrait */}
      <div className="hidden lg:flex lg:w-2/5 xl:w-1/3 bg-card border-r border-border flex-col items-center justify-center p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 to-transparent pointer-events-none"></div>
        <div className="relative z-10 flex flex-col items-center">
          <img
            src={alfredPortrait}
            alt="Alfred Pennyworth"
            className="w-full max-w-md h-auto object-contain drop-shadow-2xl"
          />
          <div className="mt-6 text-center">
            <h2 className="text-3xl font-bold text-primary mb-2">Alfred Pennyworth</h2>
            <p className="text-muted-foreground italic">Distinguished Butler & Trusted Advisor</p>
          </div>
        </div>
      </div>

      {/* Right Side - Chat Interface */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-card border-b border-border px-6 py-4 shadow-md">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-primary">
              Alfred Pennyworth
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Your trusted assistant, at your service
            </p>
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
              />
            ))}
            {isTyping && (
              <ChatMessage message="" isUser={false} isTyping={true} />
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="bg-card border-t border-border px-6 py-6 shadow-lg">
          <div className="max-w-4xl mx-auto space-y-4">
            <form onSubmit={handleSubmit} className="flex gap-3">
              <Input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1 bg-background border-border focus:border-primary transition-colors"
              />
              <Button
                type="submit"
                disabled={isLoading || !inputText.trim()}
                size="icon"
                className="bg-primary hover:bg-primary/90 shadow-md"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
            
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border"></div>
              <span className="text-xs text-muted-foreground">or use voice</span>
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
