import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import batSymbol from "@/assets/BatSymbol.png";
import alfredSilhouette from "@/assets/SilhouetteAlfred.png";

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      onClick={toggleTheme}
      variant="ghost"
      size="icon"
      className={cn(
        "rounded-full w-12 h-12 transition-all duration-500 overflow-hidden",
        theme === "batman"
          ? "bg-primary/20 hover:bg-primary/30 text-primary border-2 border-primary/50 hover:glow-gold"
          : "bg-primary/20 hover:bg-primary/30 text-primary border-2 border-primary/50 hover-silver-glow"
      )}
      title={theme === "batman" ? "Switch to Alfred Mode" : "Switch to Batman Mode"}
    >
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Batman Icon */}
        <img
          src={batSymbol}
          alt="Batman"
          className={cn(
            "absolute transition-all duration-500 w-7 h-7 object-contain",
            theme === "batman"
              ? "opacity-100 rotate-0 scale-100"
              : "opacity-0 rotate-180 scale-50"
          )}
        />
        {/* Alfred Icon */}
        <img
          src={alfredSilhouette}
          alt="Alfred"
          className={cn(
            "absolute transition-all duration-500 w-7 h-7 object-contain",
            theme === "alfred"
              ? "opacity-100 rotate-0 scale-100"
              : "opacity-0 -rotate-180 scale-50"
          )}
        />
      </div>
    </Button>
  );
};
