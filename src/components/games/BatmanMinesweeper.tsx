import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RotateCcw, Trophy } from 'lucide-react';

interface Cell {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  neighborMines: number;
}

interface BatmanMinesweeperProps {
  onBack: () => void;
}

// Sound effects
let clickSound: HTMLAudioElement | null = null;
let loseSound: HTMLAudioElement | null = null;
let startSound: HTMLAudioElement | null = null;
let winSound: HTMLAudioElement | null = null;

try {
  clickSound = new Audio(new URL('../../assets/minesweeper/click.mp3', import.meta.url).href);
  loseSound = new Audio(new URL('../../assets/minesweeper/lose.wav', import.meta.url).href);
  startSound = new Audio(new URL('../../assets/minesweeper/start.wav', import.meta.url).href);
  winSound = new Audio(new URL('../../assets/minesweeper/win.mp3', import.meta.url).href);
} catch (e) {
  console.warn('Minesweeper sound files not found');
}

const playSound = (sound: HTMLAudioElement | null) => {
  if (sound) {
    sound.currentTime = 0;
    sound.play().catch(e => console.warn('Sound play failed:', e));
  }
};

const BatmanMinesweeper = ({ onBack }: BatmanMinesweeperProps) => {
  const ROWS = 10;
  const COLS = 10;
  const MINES = 15;

  const [board, setBoard] = useState<Cell[][]>([]);
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [revealedCount, setRevealedCount] = useState(0);
  const [flagCount, setFlagCount] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);

  // Initialize board
  const initBoard = () => {
    playSound(startSound); // Play start sound

    const newBoard: Cell[][] = Array(ROWS).fill(null).map(() =>
      Array(COLS).fill(null).map(() => ({
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        neighborMines: 0
      }))
    );

    // Place mines randomly
    let minesPlaced = 0;
    while (minesPlaced < MINES) {
      const row = Math.floor(Math.random() * ROWS);
      const col = Math.floor(Math.random() * COLS);
      if (!newBoard[row][col].isMine) {
        newBoard[row][col].isMine = true;
        minesPlaced++;
      }
    }

    // Calculate neighbor mines
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        if (!newBoard[row][col].isMine) {
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const newRow = row + dr;
              const newCol = col + dc;
              if (
                newRow >= 0 && newRow < ROWS &&
                newCol >= 0 && newCol < COLS &&
                newBoard[newRow][newCol].isMine
              ) {
                count++;
              }
            }
          }
          newBoard[row][col].neighborMines = count;
        }
      }
    }

    setBoard(newBoard);
    setGameStatus('playing');
    setRevealedCount(0);
    setFlagCount(0);
    setTimer(0);
    setIsTimerActive(false);
  };

  useEffect(() => {
    initBoard();
  }, []);

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerActive && gameStatus === 'playing') {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, gameStatus]);

  // Reveal cell
  const revealCell = (row: number, col: number) => {
    if (gameStatus !== 'playing' || board[row][col].isRevealed || board[row][col].isFlagged) {
      return;
    }

    if (!isTimerActive) setIsTimerActive(true);

    const newBoard = [...board];

    if (newBoard[row][col].isMine) {
      playSound(loseSound); // Play lose sound
      // Game over - reveal all mines
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (newBoard[r][c].isMine) {
            newBoard[r][c].isRevealed = true;
          }
        }
      }
      setBoard(newBoard);
      setGameStatus('lost');
      setIsTimerActive(false);
      return;
    }

    playSound(clickSound); // Play click sound for safe cell

    // Flood fill if no neighbor mines
    const toReveal: [number, number][] = [[row, col]];
    let revealed = 0;

    while (toReveal.length > 0) {
      const [r, c] = toReveal.pop()!;

      if (r < 0 || r >= ROWS || c < 0 || c >= COLS) continue;
      if (newBoard[r][c].isRevealed || newBoard[r][c].isFlagged) continue;

      newBoard[r][c].isRevealed = true;
      revealed++;

      if (newBoard[r][c].neighborMines === 0) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            toReveal.push([r + dr, c + dc]);
          }
        }
      }
    }

    setBoard(newBoard);
    setRevealedCount(prev => prev + revealed);

    // Check win condition
    if (revealedCount + revealed === ROWS * COLS - MINES) {
      playSound(winSound); // Play win sound
      setGameStatus('won');
      setIsTimerActive(false);
    }
  };

  // Toggle flag
  const toggleFlag = (row: number, col: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (gameStatus !== 'playing' || board[row][col].isRevealed) return;

    if (!isTimerActive) setIsTimerActive(true);

    const newBoard = [...board];
    newBoard[row][col].isFlagged = !newBoard[row][col].isFlagged;
    setBoard(newBoard);
    setFlagCount(prev => newBoard[row][col].isFlagged ? prev + 1 : prev - 1);
  };

  const getCellContent = (cell: Cell) => {
    if (cell.isFlagged) return '🚩';
    if (!cell.isRevealed) return '';
    if (cell.isMine) return '🃏'; // Joker face for mines
    if (cell.neighborMines === 0) return '';
    return cell.neighborMines;
  };

  const getCellColor = (cell: Cell) => {
    if (!cell.isRevealed) return 'bg-gray-700 hover:bg-gray-600';
    if (cell.isMine) return 'bg-red-600';
    if (cell.neighborMines === 0) return 'bg-gray-800';

    const colors = [
      'text-blue-400',
      'text-green-400',
      'text-red-400',
      'text-purple-400',
      'text-yellow-400',
      'text-pink-400',
      'text-orange-400',
      'text-cyan-400'
    ];
    return `bg-gray-800 ${colors[cell.neighborMines - 1]}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white p-6">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="outline"
            onClick={onBack}
            className="border-yellow-500/30 hover:bg-yellow-500/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-500 to-amber-600 bg-clip-text text-transparent">
            Bat-Sweeper
          </h1>
          <Button
            variant="outline"
            onClick={initBoard}
            className="border-yellow-500/30 hover:bg-yellow-500/10"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            New Game
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-black/50 border border-yellow-500/30 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-yellow-500">{MINES - flagCount}</div>
            <div className="text-xs text-gray-400">Mines Left</div>
          </div>
          <div className="bg-black/50 border border-yellow-500/30 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-yellow-500">{Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}</div>
            <div className="text-xs text-gray-400">Time</div>
          </div>
          <div className="bg-black/50 border border-yellow-500/30 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-yellow-500">
              {gameStatus === 'playing' ? '🦇' : gameStatus === 'won' ? '🏆' : '💀'}
            </div>
            <div className="text-xs text-gray-400">Status</div>
          </div>
        </div>

        {/* Game Status Message */}
        {gameStatus !== 'playing' && (
          <div className={`mb-4 p-4 rounded-lg text-center ${
            gameStatus === 'won'
              ? 'bg-green-500/20 border border-green-500/50'
              : 'bg-red-500/20 border border-red-500/50'
          }`}>
            <div className="flex items-center justify-center gap-2 text-xl font-bold">
              {gameStatus === 'won' ? (
                <>
                  <Trophy className="w-6 h-6 text-yellow-500" />
                  <span className="text-green-400">Gotham Saved! You Win!</span>
                </>
              ) : (
                <span className="text-red-400">Joker's Trap! Game Over!</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Game Board */}
      <div className="max-w-4xl mx-auto flex justify-center">
        <div className="inline-block bg-black/50 p-4 rounded-xl border-2 border-yellow-500/30">
          <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}>
            {board.map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <button
                  key={`${rowIndex}-${colIndex}`}
                  onClick={() => revealCell(rowIndex, colIndex)}
                  onContextMenu={(e) => toggleFlag(rowIndex, colIndex, e)}
                  disabled={gameStatus !== 'playing'}
                  className={`
                    w-10 h-10 sm:w-12 sm:h-12
                    border border-gray-600
                    font-bold text-sm sm:text-base
                    transition-all duration-150
                    ${getCellColor(cell)}
                    ${!cell.isRevealed ? 'shadow-md active:shadow-none' : ''}
                    disabled:cursor-not-allowed
                  `}
                >
                  {getCellContent(cell)}
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="max-w-4xl mx-auto mt-6 text-center text-sm text-gray-400">
        <p>Left click to reveal • Right click to flag • Avoid the Joker's traps! 🃏</p>
      </div>
    </div>
  );
};

export default BatmanMinesweeper;
