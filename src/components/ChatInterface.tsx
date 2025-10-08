import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ChatMessage from "./ChatMessage";
import VoiceInput from "./VoiceInput";

interface Message {
  text: string;
  isUser: boolean;
}

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([
    { text: "Hello! I'm your virtual assistant. How can I help you today?", isUser: false }
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
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4 shadow-md">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Virtual Assistant
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ask me anything - I'm here to help!
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
  );
};

export default ChatInterface;
