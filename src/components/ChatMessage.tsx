import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface ChatMessageProps {
  message: string;
  isUser: boolean;
  isTyping?: boolean;
}

const ChatMessage = ({ message, isUser, isTyping = false }: ChatMessageProps) => {
  const [displayedWords, setDisplayedWords] = useState<string[]>([]);

  useEffect(() => {
    const words = message.split(" ");
    
    if (isUser || isTyping || !message) {
      setDisplayedWords(words);
      return;
    }

    // Start with first word immediately
    setDisplayedWords([words[0]]);
    let currentIndex = 1;

    const displayNextWord = () => {
      if (currentIndex < words.length) {
        const prevWord = words[currentIndex - 1];
        
        // Calculate delay based on previous word's punctuation
        let delay = 175; // Base delay between words
        if (prevWord.endsWith('.') || prevWord.endsWith('!') || prevWord.endsWith('?')) {
          delay = 225; // Pause after sentences
        } else if (prevWord.endsWith(',')) {
          delay = 200; // Pause after commas
        }
        
        setTimeout(() => {
          setDisplayedWords((prev) => [...prev, words[currentIndex]]);
          currentIndex++;
          if (currentIndex < words.length) {
            displayNextWord();
          }
        }, delay);
      }
    };

    if (words.length > 1) {
      displayNextWord();
    }

    return () => {};
  }, [message, isUser, isTyping]);

  return (
    <div
      className={cn(
        "flex gap-3 mb-4 animate-fade-in",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-md border border-accent">
          <Bot className="w-5 h-5 text-primary-foreground" />
        </div>
      )}
      
      <div
        className={cn(
          "max-w-[70%] rounded-2xl px-4 py-3 shadow-md",
          isUser
            ? "bg-accent text-accent-foreground"
            : "bg-card text-card-foreground border border-border"
        )}
      >
        {isTyping ? (
          <div className="flex gap-1">
            <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.3s]"></span>
            <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.15s]"></span>
            <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"></span>
          </div>
        ) : (
          <p className="text-sm leading-relaxed">{displayedWords.join(" ")}</p>
        )}
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent flex items-center justify-center shadow-md">
          <User className="w-5 h-5 text-accent-foreground" />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
