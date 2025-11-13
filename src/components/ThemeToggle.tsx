import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import batSymbol from "@/assets/BatSymbol.png";
import alfredSilhouette from "@/assets/SilhouetteAlfred.png";
import jokerSmile from "@/assets/jokerSmileIcon.png";
import { Smile } from "lucide-react";

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex gap-2 p-1 rounded-lg bg-card/50 border border-border">
      {/* Batman Button */}
      <Button
        onClick={() => setTheme('batman')}
        variant="ghost"
        size="icon"
        className={cn(
          "rounded-lg w-10 h-10 transition-all duration-300",
          theme === "batman"
            ? "bg-primary/30 text-primary border-2 border-primary glow-gold"
            : "bg-transparent hover:bg-primary/10 text-muted-foreground border-2 border-transparent"
        )}
        title="Batman Mode"
      >
        <img
          src={batSymbol}
          alt="Batman"
          className="w-6 h-6 object-contain"
        />
      </Button>

      {/* Alfred Button */}
      <Button
        onClick={() => setTheme('alfred')}
        variant="ghost"
        size="icon"
        className={cn(
          "rounded-lg w-10 h-10 transition-all duration-300",
          theme === "alfred"
            ? "bg-primary/30 text-primary border-2 border-primary glow-silver"
            : "bg-transparent hover:bg-primary/10 text-muted-foreground border-2 border-transparent"
        )}
        title="Alfred Mode"
      >
        <img
          src={alfredSilhouette}
          alt="Alfred"
          className="w-6 h-6 object-contain"
        />
      </Button>

      {/* Joker Button */}
      <Button
        onClick={() => setTheme('joker')}
        variant="ghost"
        size="icon"
        className={cn(
          "rounded-lg w-10 h-10 transition-all duration-300",
          theme === "joker"
            ? "bg-primary/30 text-primary border-2 border-primary glow-purple"
            : "bg-transparent hover:bg-primary/10 text-muted-foreground border-2 border-transparent"
        )}
        title="Joker Mode"
      >
        <img
          src={jokerSmile}
          alt="Joker"
          className="w-6 h-6 object-contain"
        />
      </Button>
    </div>
  );
};
