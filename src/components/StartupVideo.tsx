import { useEffect, useRef } from 'react';

type ThemeMode = 'batman' | 'alfred' | 'joker' | 'council';

interface StartupVideoProps {
  onComplete: () => void;
  theme: ThemeMode;
}

// Import video files
let batmanVideo: string | null = null;
let alfredVideo: string | null = null;
let jokerVideo: string | null = null;

try {
  batmanVideo = new URL('../assets/batmanIntro.mp4', import.meta.url).href;
} catch (e) {
  console.warn('Batmobile intro video not found');
}

try {
  alfredVideo = new URL('../assets/AlfredIntro.mp4', import.meta.url).href;
} catch (e) {
  console.warn('Alfred intro video not found');
}

try {
  jokerVideo = new URL('../assets/JokerIntro.mp4', import.meta.url).href;
} catch (e) {
  console.warn('Joker intro video not found');
}

const StartupVideo = ({ onComplete, theme }: StartupVideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Select video based on theme
  const videoSource = theme === 'batman' ? batmanVideo
    : theme === 'alfred' ? alfredVideo
    : theme === 'joker' ? jokerVideo
    : null;

  useEffect(() => {
    const video = videoRef.current;

    // If no video file found, skip immediately
    if (!videoSource || !video) {
      console.warn('No video available, skipping startup animation');
      onComplete();
      return;
    }

    // Auto-play the video
    video.play().catch(err => {
      console.warn('Video autoplay failed:', err);
      // If autoplay fails (browser restrictions), skip to main app
      onComplete();
    });

    // Handle video end
    const handleEnded = () => {
      onComplete();
    };

    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('ended', handleEnded);
    };
  }, [onComplete, videoSource]);

  // Skip video on click
  const handleSkip = () => {
    onComplete();
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black flex items-center justify-center cursor-pointer"
      onClick={handleSkip}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        preload="auto"
        playsInline
        muted={false}
        src={videoSource || ''}
      >
        Your browser does not support the video tag.
      </video>

      {/* Skip button - subtle but accessible */}
      <div className="absolute bottom-8 right-8 text-white/70 text-sm animate-pulse">
        Click anywhere to skip
      </div>
    </div>
  );
};

export default StartupVideo;
