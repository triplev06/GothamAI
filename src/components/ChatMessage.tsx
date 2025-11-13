import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

interface ChatMessageProps {
  message: string;
  isUser: boolean;
  isTyping?: boolean;
  speakerName?: string;
  imageUrl?: string;
}

const ChatMessage = ({ message, isUser, isTyping = false, speakerName, imageUrl }: ChatMessageProps) => {
  const { theme } = useTheme();

  return (
    <div
      className={cn(
        "flex gap-3 mb-4 theme-entrance",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center border border-primary/50 ${
          theme === 'batman' ? 'glow-gold shadow-gotham' : 'glow-silver shadow-elegant'
        }`}>
          <Bot className="w-5 h-5 text-primary-foreground" />
        </div>
      )}

      <div
        className={cn(
          "max-w-[70%] rounded-2xl px-4 py-3",
          isUser
            ? theme === 'batman'
              ? "bg-accent glow-orange text-accent-foreground shadow-gotham"
              : "bg-accent text-accent-foreground shadow-elegant"
            : "theme-panel text-card-foreground"
        )}
      >
        {speakerName && isUser && (
          <div className="text-xs font-semibold mb-1 opacity-70 tracking-wider">
            {speakerName}
          </div>
        )}
        {imageUrl && (
          <img
            src={imageUrl}
            alt="Uploaded"
            className="max-w-full max-h-64 rounded-lg mb-2 border border-primary/20"
          />
        )}
        {isTyping ? (
          <div className="flex gap-1">
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]"></span>
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]"></span>
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce"></span>
          </div>
        ) : (
          <p className="text-sm leading-relaxed">{message}</p>
        )}
      </div>

      {isUser && (
        <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-accent flex items-center justify-center ${
          theme === 'batman' ? 'glow-orange shadow-gotham' : 'shadow-elegant'
        }`}>
          <User className="w-5 h-5 text-accent-foreground" />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
