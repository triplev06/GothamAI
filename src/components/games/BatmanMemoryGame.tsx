import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RotateCcw, Trophy, Clock } from 'lucide-react';

interface Card {
  id: number;
  symbol: string;
  isFlipped: boolean;
  isMatched: boolean;
}

interface BatmanMemoryGameProps {
  onBack: () => void;
}

// Sound effects
let flipSound: HTMLAudioElement | null = null;
let winSound: HTMLAudioElement | null = null;

try {
  flipSound = new Audio(new URL('../../assets/memory/flip.mp3', import.meta.url).href);
  winSound = new Audio(new URL('../../assets/memory/win.mp3', import.meta.url).href);
} catch (e) {
  console.warn('Memory game sound files not found');
}

const playSound = (sound: HTMLAudioElement | null) => {
  if (sound) {
    sound.currentTime = 0;
    sound.play().catch(e => console.warn('Sound play failed:', e));
  }
};

const BatmanMemoryGame = ({ onBack }: BatmanMemoryGameProps) => {
  const symbols = ['🦇', '🃏', '⚡', '🏙️', '🎭', '💎', '⭐', '🔫'];
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [bestMoves, setBestMoves] = useState<number | null>(null);

  const initializeGame = () => {
    const gameCards: Card[] = [];
    const doubledSymbols = [...symbols, ...symbols];

    // Shuffle using Fisher-Yates algorithm
    for (let i = doubledSymbols.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [doubledSymbols[i], doubledSymbols[j]] = [doubledSymbols[j], doubledSymbols[i]];
    }

    doubledSymbols.forEach((symbol, index) => {
      gameCards.push({
        id: index,
        symbol,
        isFlipped: false,
        isMatched: false
      });
    });

    setCards(gameCards);
    setFlippedCards([]);
    setMoves(0);
    setMatches(0);
    setTimer(0);
    setIsTimerActive(false);
    setGameWon(false);
  };

  useEffect(() => {
    initializeGame();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerActive && !gameWon) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, gameWon]);

  useEffect(() => {
    if (matches === symbols.length && matches > 0) {
      playSound(winSound); // Play win sound
      setGameWon(true);
      setIsTimerActive(false);

      // Update best scores
      if (bestTime === null || timer < bestTime) {
        setBestTime(timer);
      }
      if (bestMoves === null || moves < bestMoves) {
        setBestMoves(moves);
      }
    }
  }, [matches]);

  const handleCardClick = (clickedCard: Card) => {
    if (
      flippedCards.length === 2 ||
      clickedCard.isFlipped ||
      clickedCard.isMatched ||
      gameWon
    ) {
      return;
    }

    playSound(flipSound); // Play flip sound

    if (!isTimerActive) {
      setIsTimerActive(true);
    }

    const newCards = [...cards];
    const cardIndex = newCards.findIndex(c => c.id === clickedCard.id);
    newCards[cardIndex].isFlipped = true;
    setCards(newCards);

    const newFlippedCards = [...flippedCards, clickedCard.id];
    setFlippedCards(newFlippedCards);

    if (newFlippedCards.length === 2) {
      setMoves(prev => prev + 1);

      const [firstId, secondId] = newFlippedCards;
      const firstCard = newCards.find(c => c.id === firstId)!;
      const secondCard = newCards.find(c => c.id === secondId)!;

      if (firstCard.symbol === secondCard.symbol) {
        // Match found
        setTimeout(() => {
          const matchedCards = [...newCards];
          matchedCards.find(c => c.id === firstId)!.isMatched = true;
          matchedCards.find(c => c.id === secondId)!.isMatched = true;
          setCards(matchedCards);
          setFlippedCards([]);
          setMatches(prev => prev + 1);
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          const resetCards = [...newCards];
          resetCards.find(c => c.id === firstId)!.isFlipped = false;
          resetCards.find(c => c.id === secondId)!.isFlipped = false;
          setCards(resetCards);
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            onClick={onBack}
            className="border-yellow-500/30 hover:bg-yellow-500/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-500 to-amber-600 bg-clip-text text-transparent">
            Detective's Memory
          </h1>
          <Button
            variant="outline"
            onClick={initializeGame}
            className="border-yellow-500/30 hover:bg-yellow-500/10"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            New Game
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-black/50 border border-yellow-500/30 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-yellow-500" />
              <span className="text-xs text-gray-400">Time</span>
            </div>
            <div className="text-2xl font-bold text-yellow-500">{formatTime(timer)}</div>
            {bestTime !== null && (
              <div className="text-xs text-gray-500 mt-1">Best: {formatTime(bestTime)}</div>
            )}
          </div>

          <div className="bg-black/50 border border-yellow-500/30 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-400 mb-1">Moves</div>
            <div className="text-2xl font-bold text-yellow-500">{moves}</div>
            {bestMoves !== null && (
              <div className="text-xs text-gray-500 mt-1">Best: {bestMoves}</div>
            )}
          </div>

          <div className="bg-black/50 border border-yellow-500/30 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-400 mb-1">Matches</div>
            <div className="text-2xl font-bold text-yellow-500">{matches}/{symbols.length}</div>
          </div>

          <div className="bg-black/50 border border-yellow-500/30 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-400 mb-1">Accuracy</div>
            <div className="text-2xl font-bold text-yellow-500">
              {moves > 0 ? Math.round((matches / moves) * 100) : 0}%
            </div>
          </div>
        </div>

        {/* Win Message */}
        {gameWon && (
          <div className="mb-6 p-4 rounded-lg text-center bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-500">
            <div className="flex items-center justify-center gap-2 text-xl font-bold text-green-400 mb-2">
              <Trophy className="w-6 h-6" />
              <span>Case Solved! 🦇</span>
            </div>
            <div className="text-sm text-gray-300">
              Completed in {formatTime(timer)} with {moves} moves
            </div>
          </div>
        )}

        {/* Game Board */}
        <div className="bg-black/50 border-2 border-yellow-500/30 rounded-xl p-6">
          <div className="grid grid-cols-4 gap-3 max-w-2xl mx-auto">
            {cards.map((card) => (
              <button
                key={card.id}
                onClick={() => handleCardClick(card)}
                disabled={gameWon || card.isMatched}
                className={`
                  aspect-square
                  rounded-lg
                  text-5xl
                  font-bold
                  transition-all duration-300
                  transform
                  ${card.isFlipped || card.isMatched
                    ? 'bg-gradient-to-br from-yellow-500/30 to-amber-600/30 border-2 border-yellow-500'
                    : 'bg-gradient-to-br from-gray-700 to-gray-800 border-2 border-gray-600 hover:border-yellow-500/50'
                  }
                  ${card.isMatched ? 'opacity-50 scale-95' : ''}
                  ${!card.isFlipped && !card.isMatched ? 'hover:scale-105 cursor-pointer' : ''}
                  disabled:cursor-not-allowed
                  relative
                  overflow-hidden
                `}
                style={{
                  transformStyle: 'preserve-3d',
                  transform: card.isFlipped || card.isMatched ? 'rotateY(0deg)' : 'rotateY(0deg)'
                }}
              >
                {/* Card Back */}
                {!card.isFlipped && !card.isMatched && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900">
                    <div className="text-4xl opacity-30">❓</div>
                  </div>
                )}

                {/* Card Front */}
                {(card.isFlipped || card.isMatched) && (
                  <div className="flex items-center justify-center h-full">
                    {card.symbol}
                  </div>
                )}

                {/* Matched indicator */}
                {card.isMatched && (
                  <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                    <div className="text-2xl">✓</div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 text-center text-sm text-gray-400">
          <p>Click cards to flip them. Match all pairs to solve the case! 🕵️</p>
        </div>
      </div>
    </div>
  );
};

export default BatmanMemoryGame;
