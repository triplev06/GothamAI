import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RotateCcw, Trophy } from 'lucide-react';

interface BatmanTicTacToeProps {
  onBack: () => void;
}

type Player = 'batman' | 'joker' | null;

// Sound effects
let clickSound: HTMLAudioElement | null = null;
let tieSound: HTMLAudioElement | null = null;
let winSound: HTMLAudioElement | null = null;

try {
  clickSound = new Audio(new URL('../../assets/tic-tac-toe/click.mp3', import.meta.url).href);
  tieSound = new Audio(new URL('../../assets/tic-tac-toe/tie.mp3', import.meta.url).href);
  winSound = new Audio(new URL('../../assets/tic-tac-toe/win.mp3', import.meta.url).href);
} catch (e) {
  console.warn('Tic-Tac-Toe sound files not found');
}

const playSound = (sound: HTMLAudioElement | null) => {
  if (sound) {
    sound.currentTime = 0;
    sound.play().catch(e => console.warn('Sound play failed:', e));
  }
};

const BatmanTicTacToe = ({ onBack }: BatmanTicTacToeProps) => {
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState(true); // Player is Batman
  const [winner, setWinner] = useState<Player | 'tie' | null>(null);
  const [winningLine, setWinningLine] = useState<number[]>([]);
  const [scores, setScores] = useState({ batman: 0, joker: 0, ties: 0 });

  const winningCombinations = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6] // Diagonals
  ];

  const checkWinner = (currentBoard: Player[]): { winner: Player | 'tie' | null; line: number[] } => {
    for (const combo of winningCombinations) {
      const [a, b, c] = combo;
      if (currentBoard[a] && currentBoard[a] === currentBoard[b] && currentBoard[a] === currentBoard[c]) {
        return { winner: currentBoard[a], line: combo };
      }
    }

    if (currentBoard.every(cell => cell !== null)) {
      return { winner: 'tie', line: [] };
    }

    return { winner: null, line: [] };
  };

  const minimax = (currentBoard: Player[], depth: number, isMaximizing: boolean): number => {
    const result = checkWinner(currentBoard);

    if (result.winner === 'joker') return 10 - depth;
    if (result.winner === 'batman') return depth - 10;
    if (result.winner === 'tie') return 0;

    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (currentBoard[i] === null) {
          currentBoard[i] = 'joker';
          const score = minimax(currentBoard, depth + 1, false);
          currentBoard[i] = null;
          bestScore = Math.max(score, bestScore);
        }
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (let i = 0; i < 9; i++) {
        if (currentBoard[i] === null) {
          currentBoard[i] = 'batman';
          const score = minimax(currentBoard, depth + 1, true);
          currentBoard[i] = null;
          bestScore = Math.min(score, bestScore);
        }
      }
      return bestScore;
    }
  };

  const getBestMove = (currentBoard: Player[]): number => {
    let bestScore = -Infinity;
    let bestMove = -1;

    for (let i = 0; i < 9; i++) {
      if (currentBoard[i] === null) {
        currentBoard[i] = 'joker';
        const score = minimax(currentBoard, 0, false);
        currentBoard[i] = null;

        if (score > bestScore) {
          bestScore = score;
          bestMove = i;
        }
      }
    }

    return bestMove;
  };

  const handleClick = (index: number) => {
    if (board[index] || winner || !isPlayerTurn) return;

    playSound(clickSound); // Play click sound

    const newBoard = [...board];
    newBoard[index] = 'batman';
    setBoard(newBoard);

    const result = checkWinner(newBoard);
    if (result.winner) {
      setWinner(result.winner);
      setWinningLine(result.line);
      updateScores(result.winner);
      // Play win/tie sound
      if (result.winner === 'batman') {
        playSound(winSound);
      } else if (result.winner === 'tie') {
        playSound(tieSound);
      }
      return;
    }

    setIsPlayerTurn(false);

    // AI move with slight delay for better UX
    setTimeout(() => {
      const aiMove = getBestMove(newBoard);
      if (aiMove !== -1) {
        playSound(clickSound); // AI click sound
        newBoard[aiMove] = 'joker';
        setBoard(newBoard);

        const aiResult = checkWinner(newBoard);
        if (aiResult.winner) {
          setWinner(aiResult.winner);
          setWinningLine(aiResult.line);
          updateScores(aiResult.winner);
          // Play appropriate sound
          if (aiResult.winner === 'tie') {
            playSound(tieSound);
          }
          // No win sound for Joker winning - player lost
        } else {
          setIsPlayerTurn(true);
        }
      }
    }, 500);
  };

  const updateScores = (gameWinner: Player | 'tie') => {
    setScores(prev => ({
      batman: prev.batman + (gameWinner === 'batman' ? 1 : 0),
      joker: prev.joker + (gameWinner === 'joker' ? 1 : 0),
      ties: prev.ties + (gameWinner === 'tie' ? 1 : 0)
    }));
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsPlayerTurn(true);
    setWinner(null);
    setWinningLine([]);
  };

  const resetScores = () => {
    setScores({ batman: 0, joker: 0, ties: 0 });
    resetGame();
  };

  const getCellContent = (player: Player) => {
    if (player === 'batman') return '🦇';
    if (player === 'joker') return '🃏';
    return '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white p-6">
      <div className="max-w-2xl mx-auto">
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
            Bat vs Joker
          </h1>
          <Button
            variant="outline"
            onClick={resetGame}
            className="border-yellow-500/30 hover:bg-yellow-500/10"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>

        {/* Scores */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-yellow-500/20 to-amber-600/20 border border-yellow-500/50 rounded-lg p-4 text-center">
            <div className="text-3xl mb-2">🦇</div>
            <div className="text-2xl font-bold text-yellow-500">{scores.batman}</div>
            <div className="text-xs text-gray-400">Batman (You)</div>
          </div>
          <div className="bg-black/50 border border-gray-500/30 rounded-lg p-4 text-center">
            <div className="text-3xl mb-2">🤝</div>
            <div className="text-2xl font-bold text-gray-400">{scores.ties}</div>
            <div className="text-xs text-gray-400">Ties</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500/20 to-green-500/20 border border-purple-500/50 rounded-lg p-4 text-center">
            <div className="text-3xl mb-2">🃏</div>
            <div className="text-2xl font-bold text-purple-400">{scores.joker}</div>
            <div className="text-xs text-gray-400">Joker (AI)</div>
          </div>
        </div>

        {/* Status */}
        {winner ? (
          <div className={`mb-6 p-4 rounded-lg text-center border-2 ${
            winner === 'batman'
              ? 'bg-yellow-500/20 border-yellow-500'
              : winner === 'joker'
              ? 'bg-purple-500/20 border-purple-500'
              : 'bg-gray-500/20 border-gray-500'
          }`}>
            <div className="flex items-center justify-center gap-2 text-xl font-bold">
              {winner === 'batman' && (
                <>
                  <Trophy className="w-6 h-6 text-yellow-500" />
                  <span className="text-yellow-400">Batman Wins! 🦇</span>
                </>
              )}
              {winner === 'joker' && (
                <span className="text-purple-400">Joker Wins! 🃏</span>
              )}
              {winner === 'tie' && (
                <span className="text-gray-400">It's a Tie!</span>
              )}
            </div>
          </div>
        ) : (
          <div className="mb-6 p-4 rounded-lg text-center bg-black/50 border border-yellow-500/30">
            <div className="text-lg font-semibold">
              {isPlayerTurn ? (
                <span className="text-yellow-400">Your Turn 🦇</span>
              ) : (
                <span className="text-purple-400">Joker's Turn... 🃏</span>
              )}
            </div>
          </div>
        )}

        {/* Game Board */}
        <div className="bg-black/50 p-6 rounded-xl border-2 border-yellow-500/30 mb-6">
          <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
            {board.map((cell, index) => {
              const isWinningCell = winningLine.includes(index);
              return (
                <button
                  key={index}
                  onClick={() => handleClick(index)}
                  disabled={!!winner || !!cell || !isPlayerTurn}
                  className={`
                    aspect-square
                    text-6xl
                    rounded-lg
                    border-2
                    transition-all duration-200
                    ${cell === 'batman' ? 'bg-yellow-500/20 border-yellow-500' : ''}
                    ${cell === 'joker' ? 'bg-purple-500/20 border-purple-500' : ''}
                    ${!cell ? 'bg-gray-800 border-gray-600 hover:bg-gray-700 hover:border-yellow-500/50' : ''}
                    ${isWinningCell ? 'ring-4 ring-green-500 animate-pulse' : ''}
                    disabled:cursor-not-allowed
                    ${!cell && isPlayerTurn && !winner ? 'cursor-pointer' : ''}
                  `}
                >
                  {getCellContent(cell)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-4">
          <Button
            onClick={resetGame}
            variant="outline"
            className="border-yellow-500/30 hover:bg-yellow-500/10"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            New Round
          </Button>
          <Button
            onClick={resetScores}
            variant="outline"
            className="border-red-500/30 hover:bg-red-500/10 text-red-400"
          >
            Reset Scores
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BatmanTicTacToe;
