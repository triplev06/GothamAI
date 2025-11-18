import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Gamepad2 } from "lucide-react";
import BatmanMinesweeper from "@/components/games/BatmanMinesweeper";
import BatmanTicTacToe from "@/components/games/BatmanTicTacToe";
import BatmanRockPaperScissors from "@/components/games/BatmanRockPaperScissors";
import BatmanMemoryGame from "@/components/games/BatmanMemoryGame";
import BatmanCookieClicker from "@/components/games/BatmanCookieClicker";

type GameType = 'menu' | 'minesweeper' | 'tictactoe' | 'rps' | 'memory' | 'clicker';

const Games = () => {
  const navigate = useNavigate();
  const [currentGame, setCurrentGame] = useState<GameType>('menu');

  const games = [
    {
      id: 'minesweeper' as GameType,
      name: 'Bat-Sweeper',
      description: 'Navigate Gotham\'s underground - avoid the Joker\'s traps!',
      icon: '💣',
      color: 'from-yellow-500/20 to-amber-600/20'
    },
    {
      id: 'tictactoe' as GameType,
      name: 'Bat vs Joker',
      description: 'Classic strategy - Batman vs The Joker showdown',
      icon: '⚔️',
      color: 'from-purple-500/20 to-green-500/20'
    },
    {
      id: 'rps' as GameType,
      name: 'Gotham Showdown',
      description: 'Rock, Paper, Scissors - Batman style!',
      icon: '✊',
      color: 'from-blue-500/20 to-cyan-500/20'
    },
    {
      id: 'memory' as GameType,
      name: 'Detective\'s Memory',
      description: 'Test your detective skills - match the Bat symbols',
      icon: '🦇',
      color: 'from-gray-500/20 to-slate-600/20'
    },
    {
      id: 'clicker' as GameType,
      name: 'Gotham Protector',
      description: 'Click to save Gotham - unlock powerful upgrades!',
      icon: '🏙️',
      color: 'from-yellow-600/20 to-orange-600/20'
    }
  ];

  const renderGame = () => {
    switch (currentGame) {
      case 'minesweeper':
        return <BatmanMinesweeper onBack={() => setCurrentGame('menu')} />;
      case 'tictactoe':
        return <BatmanTicTacToe onBack={() => setCurrentGame('menu')} />;
      case 'rps':
        return <BatmanRockPaperScissors onBack={() => setCurrentGame('menu')} />;
      case 'memory':
        return <BatmanMemoryGame onBack={() => setCurrentGame('menu')} />;
      case 'clicker':
        return <BatmanCookieClicker onBack={() => setCurrentGame('menu')} />;
      default:
        return (
          <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white">
            {/* Header */}
            <div className="bg-black/50 backdrop-blur-sm border-b border-yellow-500/30 sticky top-0 z-10">
              <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Gamepad2 className="w-8 h-8 text-yellow-500" />
                  <h1 className="text-2xl font-bold text-yellow-500">Gotham Games</h1>
                </div>
                <Button
                  variant="outline"
                  onClick={() => navigate('/')}
                  className="border-yellow-500/30 hover:bg-yellow-500/10"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Main
                </Button>
              </div>
            </div>

            {/* Game Selection Grid */}
            <div className="container mx-auto px-4 py-12">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-yellow-500 to-amber-600 bg-clip-text text-transparent">
                  Choose Your Challenge
                </h2>
                <p className="text-gray-400 text-lg">
                  Test your skills with Batman-themed mini-games
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {games.map((game) => (
                  <button
                    key={game.id}
                    onClick={() => setCurrentGame(game.id)}
                    className={`
                      group relative overflow-hidden
                      bg-gradient-to-br ${game.color}
                      border-2 border-yellow-500/30
                      rounded-xl p-6
                      transition-all duration-300
                      hover:border-yellow-500
                      hover:shadow-[0_0_30px_rgba(234,179,8,0.3)]
                      hover:scale-105
                      transform
                    `}
                  >
                    {/* Background pattern */}
                    <div className="absolute inset-0 opacity-5 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9nPjwvc3ZnPg==')]" />

                    {/* Icon */}
                    <div className="text-6xl mb-4 transform group-hover:scale-110 transition-transform">
                      {game.icon}
                    </div>

                    {/* Title */}
                    <h3 className="text-2xl font-bold mb-2 text-yellow-500 group-hover:text-yellow-400">
                      {game.name}
                    </h3>

                    {/* Description */}
                    <p className="text-gray-300 text-sm">
                      {game.description}
                    </p>

                    {/* Play indicator */}
                    <div className="mt-4 flex items-center justify-center gap-2 text-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Gamepad2 className="w-4 h-4" />
                      <span className="text-sm font-semibold">PLAY NOW</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
    }
  };

  return renderGame();
};

export default Games;
