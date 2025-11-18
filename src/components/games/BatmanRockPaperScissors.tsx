import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RotateCcw } from 'lucide-react';

interface BatmanRockPaperScissorsProps {
  onBack: () => void;
}

type Choice = 'batarang' | 'grapple' | 'cape' | null;
type Result = 'win' | 'lose' | 'tie' | null;

const BatmanRockPaperScissors = ({ onBack }: BatmanRockPaperScissorsProps) => {
  const [playerChoice, setPlayerChoice] = useState<Choice>(null);
  const [aiChoice, setAiChoice] = useState<Choice>(null);
  const [result, setResult] = useState<Result>(null);
  const [scores, setScores] = useState({ player: 0, ai: 0, ties: 0 });
  const [isAnimating, setIsAnimating] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  const choices: { id: Choice & string; name: string; icon: string; beats: string }[] = [
    { id: 'batarang', name: 'Batarang', icon: '⭐', beats: 'Cuts' },
    { id: 'grapple', name: 'Grapple Gun', icon: '🔫', beats: 'Hooks' },
    { id: 'cape', name: 'Cape', icon: '🦇', beats: 'Covers' }
  ];

  const getWinner = (player: Choice, ai: Choice): Result => {
    if (player === ai) return 'tie';

    const winConditions: Record<string, string> = {
      'batarang': 'cape',      // Batarang cuts Cape
      'cape': 'grapple',        // Cape covers Grapple
      'grapple': 'batarang'     // Grapple hooks Batarang
    };

    return winConditions[player!] === ai ? 'win' : 'lose';
  };

  const handleChoice = (choice: Choice & string) => {
    if (isAnimating) return;

    setIsAnimating(true);
    setPlayerChoice(choice);

    // Simulate thinking delay
    setTimeout(() => {
      const aiChoices: (Choice & string)[] = ['batarang', 'grapple', 'cape'];
      const randomAiChoice = aiChoices[Math.floor(Math.random() * aiChoices.length)];
      setAiChoice(randomAiChoice);

      const gameResult = getWinner(choice, randomAiChoice);
      setResult(gameResult);

      // Update scores
      setScores(prev => ({
        player: prev.player + (gameResult === 'win' ? 1 : 0),
        ai: prev.ai + (gameResult === 'lose' ? 1 : 0),
        ties: prev.ties + (gameResult === 'tie' ? 1 : 0)
      }));

      // Update streak
      if (gameResult === 'win') {
        const newStreak = streak + 1;
        setStreak(newStreak);
        if (newStreak > bestStreak) {
          setBestStreak(newStreak);
        }
      } else if (gameResult === 'lose') {
        setStreak(0);
      }

      setIsAnimating(false);
    }, 1000);
  };

  const resetGame = () => {
    setPlayerChoice(null);
    setAiChoice(null);
    setResult(null);
  };

  const resetAll = () => {
    resetGame();
    setScores({ player: 0, ai: 0, ties: 0 });
    setStreak(0);
  };

  const getResultMessage = () => {
    if (!result) return '';

    const playerItem = choices.find(c => c.id === playerChoice);
    const aiItem = choices.find(c => c.id === aiChoice);

    if (result === 'tie') {
      return "It's a tie! Both used the same gadget!";
    } else if (result === 'win') {
      return `${playerItem?.name} ${playerItem?.beats.toLowerCase()} ${aiItem?.name}! You win! 🦇`;
    } else {
      return `${aiItem?.name} ${aiItem?.beats.toLowerCase()} ${playerItem?.name}! Joker wins! 🃏`;
    }
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
            Gotham Showdown
          </h1>
          <Button
            variant="outline"
            onClick={resetAll}
            className="border-yellow-500/30 hover:bg-yellow-500/10"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset All
          </Button>
        </div>

        {/* Scores */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-yellow-500/20 to-amber-600/20 border border-yellow-500/50 rounded-lg p-4 text-center">
            <div className="text-3xl mb-2">🦇</div>
            <div className="text-2xl font-bold text-yellow-500">{scores.player}</div>
            <div className="text-xs text-gray-400">Batman</div>
          </div>
          <div className="bg-black/50 border border-gray-500/30 rounded-lg p-4 text-center">
            <div className="text-3xl mb-2">🤝</div>
            <div className="text-2xl font-bold text-gray-400">{scores.ties}</div>
            <div className="text-xs text-gray-400">Ties</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500/20 to-green-500/20 border border-purple-500/50 rounded-lg p-4 text-center">
            <div className="text-3xl mb-2">🃏</div>
            <div className="text-2xl font-bold text-purple-400">{scores.ai}</div>
            <div className="text-xs text-gray-400">Joker</div>
          </div>
          <div className="bg-gradient-to-br from-orange-500/20 to-red-600/20 border border-orange-500/50 rounded-lg p-4 text-center">
            <div className="text-3xl mb-2">🔥</div>
            <div className="text-2xl font-bold text-orange-400">{streak}</div>
            <div className="text-xs text-gray-400">Streak</div>
            <div className="text-[10px] text-gray-500 mt-1">Best: {bestStreak}</div>
          </div>
        </div>

        {/* Battle Arena */}
        <div className="bg-black/50 border-2 border-yellow-500/30 rounded-xl p-8 mb-6">
          <div className="grid grid-cols-3 gap-8 mb-8">
            {/* Player Side */}
            <div className="text-center">
              <div className="text-sm text-gray-400 mb-4">BATMAN</div>
              <div className="w-32 h-32 mx-auto bg-yellow-500/20 border-2 border-yellow-500 rounded-full flex items-center justify-center text-6xl">
                {playerChoice ? choices.find(c => c.id === playerChoice)?.icon : '🦇'}
              </div>
              {playerChoice && (
                <div className="mt-4 text-lg font-bold text-yellow-400">
                  {choices.find(c => c.id === playerChoice)?.name}
                </div>
              )}
            </div>

            {/* VS */}
            <div className="flex items-center justify-center">
              <div className="text-4xl font-bold text-gray-600">VS</div>
            </div>

            {/* AI Side */}
            <div className="text-center">
              <div className="text-sm text-gray-400 mb-4">JOKER</div>
              <div className={`
                w-32 h-32 mx-auto bg-purple-500/20 border-2 border-purple-500 rounded-full
                flex items-center justify-center text-6xl
                ${isAnimating ? 'animate-pulse' : ''}
              `}>
                {aiChoice ? choices.find(c => c.id === aiChoice)?.icon : '🃏'}
              </div>
              {aiChoice && (
                <div className="mt-4 text-lg font-bold text-purple-400">
                  {choices.find(c => c.id === aiChoice)?.name}
                </div>
              )}
            </div>
          </div>

          {/* Result Message */}
          {result && (
            <div className={`
              p-4 rounded-lg text-center text-lg font-bold border-2
              ${result === 'win' ? 'bg-green-500/20 border-green-500 text-green-400' : ''}
              ${result === 'lose' ? 'bg-red-500/20 border-red-500 text-red-400' : ''}
              ${result === 'tie' ? 'bg-gray-500/20 border-gray-500 text-gray-400' : ''}
            `}>
              {getResultMessage()}
            </div>
          )}
        </div>

        {/* Choices */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-yellow-500 mb-4">Choose Your Gadget</h3>
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
            {choices.map((choice) => (
              <button
                key={choice.id}
                onClick={() => handleChoice(choice.id)}
                disabled={isAnimating}
                className={`
                  group relative
                  bg-gradient-to-br from-gray-800 to-gray-900
                  border-2 border-yellow-500/30
                  rounded-xl p-6
                  transition-all duration-300
                  hover:border-yellow-500
                  hover:shadow-[0_0_20px_rgba(234,179,8,0.3)]
                  hover:scale-105
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${playerChoice === choice.id ? 'ring-4 ring-yellow-500' : ''}
                `}
              >
                <div className="text-6xl mb-3">{choice.icon}</div>
                <div className="text-lg font-bold text-yellow-500 mb-1">{choice.name}</div>
                <div className="text-xs text-gray-400">{choice.beats}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Instructions & Next Round */}
        <div className="text-center">
          {result && (
            <Button
              onClick={resetGame}
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
            >
              Next Round
            </Button>
          )}
          {!result && (
            <p className="text-sm text-gray-400">
              Batarang cuts Cape • Cape covers Grapple • Grapple hooks Batarang
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BatmanRockPaperScissors;
