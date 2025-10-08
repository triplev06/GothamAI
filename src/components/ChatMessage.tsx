import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: string;
  isUser: boolean;
  isTyping?: boolean;
}

const ChatMessage = ({ message, isUser, isTyping = false }: ChatMessageProps) => {
  return (
    <div
      className={cn(
        "flex gap-3 mb-4 animate-fade-in",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/30">
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
          <p className="text-sm leading-relaxed">{message}</p>
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
