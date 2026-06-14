import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, PlayCircle, Star, Shuffle, RotateCcw, Box, Sparkles, Trophy } from 'lucide-react';
import { User, AppNotification } from '../types';

interface OtherGamesProps {
  gameId: string;
  user: User;
  onAddCoins: (amt: number, reason: string) => void;
  onAddNotification: (notif: Omit<AppNotification, 'id' | 'timestamp'>) => void;
  onBack: () => void;
}

export default function OtherGames({
  gameId,
  user,
  onAddCoins,
  onAddNotification,
  onBack,
}: OtherGamesProps) {
  // Common states
  const [adOverlayOpen, setAdOverlayOpen] = useState(false);
  const [adCountdown, setAdCountdown] = useState(4);
  const adCallbackRef = useRef<(() => void) | null>(null);

  const watchAdSequence = (onDone: () => void) => {
    setAdOverlayOpen(true);
    setAdCountdown(4);
    adCallbackRef.current = onDone;

    const interval = setInterval(() => {
      setAdCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setAdOverlayOpen(false);
          if (adCallbackRef.current) {
            adCallbackRef.current();
            adCallbackRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // ==========================================
  // 1. COLOR MATCH GAME STATE
  // ==========================================
  const colorsList = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
  const [colorTarget, setColorTarget] = useState('');
  const [colorOptions, setColorOptions] = useState<string[]>([]);
  const [colorScore, setColorScore] = useState(0);

  const resetColorGame = () => {
    const target = colorsList[Math.floor(Math.random() * colorsList.length)];
    setColorTarget(target);
    // Shuffle options
    const options = [...colorsList].sort(() => Math.random() - 0.5);
    setColorOptions(options);
  };

  useEffect(() => {
    if (gameId === 'color') {
      resetColorGame();
      setColorScore(0);
    }
  }, [gameId]);

  const handleColorGuess = (selected: string) => {
    if (selected === colorTarget) {
      const next = colorScore + 1;
      if (next >= 10) {
        // Completed 10 matches, trigger ad then payout
        let colorMatchReward = 15;
        try {
          const saved = localStorage.getItem('taskx_v1_coin_config');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.colorMatch !== undefined) colorMatchReward = Number(parsed.colorMatch);
          }
        } catch (e) {}

        watchAdSequence(() => {
          onAddCoins(colorMatchReward, 'Color Match Victory');
          onAddNotification({
            type: 'game',
            title: 'Color Match Wizard',
            description: `Successfully matched target colors 10 times and earned ${colorMatchReward} 🪙!`,
            coinsChange: colorMatchReward,
          });
          setColorScore(0);
          resetColorGame();
        });
      } else {
        setColorScore(next);
        resetColorGame();
      }
    } else {
      // Loose score on mismatch
      setColorScore((prev) => Math.max(0, prev - 1));
      resetColorGame();
    }
  };

  // ==========================================
  // 2. MEMORY CHALLENGE ENGINE
  // ==========================================
  const memoryIcons = ['🍎', '🍌', '🍇', '🍒', '🍋', '⭐', '💎', '🎨'];
  const [cards, setCards] = useState<{ id: number; symbol: string; matched: boolean; flipped: boolean }[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [matchesCount, setMatchesCount] = useState(0);

  const resetMemoryGame = () => {
    const dualArray = [...memoryIcons, ...memoryIcons]
      .sort(() => Math.random() - 0.5)
      .map((sym, idx) => ({
        id: idx,
        symbol: sym,
        matched: false,
        flipped: false,
      }));
    setCards(dualArray);
    setFlippedIndices([]);
    setMatchesCount(0);
  };

  useEffect(() => {
    if (gameId === 'memory') {
      resetMemoryGame();
    }
  }, [gameId]);

  const handleCardClick = (index: number) => {
    if (cards[index].flipped || cards[index].matched || flippedIndices.length >= 2) return;

    // Flip card
    const updated = [...cards];
    updated[index].flipped = true;
    setCards(updated);

    const nextFlipped = [...flippedIndices, index];
    setFlippedIndices(nextFlipped);

    if (nextFlipped.length === 2) {
      const [first, second] = nextFlipped;
      if (cards[first].symbol === cards[second].symbol) {
        // MATCH FOUND
        setTimeout(() => {
          const matchedCards = [...cards];
          matchedCards[first].matched = true;
          matchedCards[second].matched = true;
          setCards(matchedCards);
          setFlippedIndices([]);
          
          const next = matchesCount + 1;
          setMatchesCount(next);

          if (next === memoryIcons.length) {
            // Win! Trigger ad and earn coins
            let memoryChalReward = 20;
            try {
              const saved = localStorage.getItem('taskx_v1_coin_config');
              if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.memoryChal !== undefined) memoryChalReward = Number(parsed.memoryChal);
              }
            } catch (e) {}

            watchAdSequence(() => {
              onAddCoins(memoryChalReward, 'Memory Game Complete');
              onAddNotification({
                type: 'game',
                title: 'Memory Master',
                description: `Cleared the standard 4x4 card puzzle and earned ${memoryChalReward} 🪙!`,
                coinsChange: memoryChalReward,
              });
              resetMemoryGame();
            });
          }
        }, 500);
      } else {
        // MISMATCH
        setTimeout(() => {
          const resetFlipped = [...cards];
          resetFlipped[first].flipped = false;
          resetFlipped[second].flipped = false;
          setCards(resetFlipped);
          setFlippedIndices([]);
        }, 1000);
      }
    }
  };

  // ==========================================
  // 3. TIC-TAC-TOE ENGINE
  // ==========================================
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [turn, setTurn] = useState<'X' | 'O'>('X');
  const [tttWinner, setTttWinner] = useState<string | null>(null);

  const checkTTTWinner = (cells: (string | null)[]) => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
    for (const line of lines) {
      if (cells[line[0]] && cells[line[0]] === cells[line[1]] && cells[line[0]] === cells[line[2]]) {
        return cells[line[0]];
      }
    }
    if (cells.every((c) => c !== null)) return 'draw';
    return null;
  };

  const handleTTTClick = (index: number) => {
    if (board[index] || tttWinner || turn !== 'X') return;

    const next = [...board];
    next[index] = 'X';
    setBoard(next);

    const win = checkTTTWinner(next);
    if (win) {
      setTttWinner(win);
      handleTTTEnd(win);
      return;
    }

    setTurn('O');
    // AI Move
    setTimeout(() => {
      const empties = next.map((val, idx) => (val === null ? idx : null)).filter((v) => v !== null) as number[];
      if (empties.length) {
        // Simple defensive or random choice
        const aiPick = empties[Math.floor(Math.random() * empties.length)];
        const aiNext = [...next];
        aiNext[aiPick] = 'O';
        setBoard(aiNext);

        const aiWin = checkTTTWinner(aiNext);
        if (aiWin) {
          setTttWinner(aiWin);
          handleTTTEnd(aiWin);
        } else {
          setTurn('X');
        }
      }
    }, 400);
  };

  const handleTTTEnd = (winner: string) => {
    if (winner === 'X') {
      let tictactoeWinReward = 10;
      try {
        const saved = localStorage.getItem('taskx_v1_coin_config');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.tictactoeWin !== undefined) tictactoeWinReward = Number(parsed.tictactoeWin);
        }
      } catch (e) {}

      watchAdSequence(() => {
        onAddCoins(tictactoeWinReward, 'Tic-Tac-Toe Win');
        onAddNotification({
          type: 'game',
          title: 'Tic-Tac-Toe Champion',
          description: `Defeated the AI in Tic-Tac-Toe and received ${tictactoeWinReward} 🪙.`,
          coinsChange: tictactoeWinReward,
        });
        resetTTTGame();
      });
    } else {
      setTimeout(() => {
        resetTTTGame();
      }, 2500);
    }
  };

  const resetTTTGame = () => {
    setBoard(Array(9).fill(null));
    setTurn('X');
    setTttWinner(null);
  };

  useEffect(() => {
    if (gameId === 'ttt') {
      resetTTTGame();
    }
  }, [gameId]);

  // ==========================================
  // 4. MATCH-3 (HIGH DIFFICULTY!)
  // ==========================================
  const jewels = ['💎', '🍒', '🍇', '🍒', '👑', '⭐']; // reduced choices make matching harder!
  const [m3Board, setM3Board] = useState<string[][]>([]);
  const [selectedM3Cell, setSelectedM3Cell] = useState<{ r: number; c: number } | null>(null);
  const [m3Matches, setM3Matches] = useState(0);

  const initMatch3Board = () => {
    const array: string[][] = [];
    for (let r = 0; r < 6; r++) {
      array[r] = [];
      for (let c = 0; c < 6; c++) {
        let isMatch = true;
        let sym = '';
        while (isMatch) {
          sym = jewels[Math.floor(Math.random() * jewels.length)];
          isMatch = false;
          if (r >= 2 && array[r - 1][c] === sym && array[r - 2][c] === sym) isMatch = true;
          if (c >= 2 && array[r][c - 1] === sym && array[r][c - 2] === sym) isMatch = true;
        }
        array[r][c] = sym;
      }
    }
    setM3Board(array);
    setM3Matches(0);
  };

  useEffect(() => {
    if (gameId === 'match3') {
      initMatch3Board();
    }
  }, [gameId]);

  const selectMatch3Cell = (r: number, c: number) => {
    if (!selectedM3Cell) {
      setSelectedM3Cell({ r, c });
      return;
    }

    const { r: sr, c: sc } = selectedM3Cell;
    const diffR = Math.abs(r - sr);
    const diffC = Math.abs(c - sc);

    if ((diffR === 1 && diffC === 0) || (diffR === 0 && diffC === 1)) {
      // Swap elements
      const swapped = m3Board.map((row) => [...row]);
      const temp = swapped[r][c];
      swapped[r][c] = swapped[sr][sc];
      swapped[sr][sc] = temp;

      setM3Board(swapped);
      setSelectedM3Cell(null);

      // Verify matches
      setTimeout(() => {
        const hasMatches = checkM3MatchesAndClear(swapped);
        if (!hasMatches) {
          // Revert back swap
          const reverted = swapped.map((row) => [...row]);
          reverted[sr][sc] = swapped[r][c];
          reverted[r][c] = temp;
          setM3Board(reverted);
        }
      }, 300);
    } else {
      setSelectedM3Cell({ r, c });
    }
  };

  const checkM3MatchesAndClear = (currentBoard: string[][]) => {
    const toClear = new Set<string>();
    let found = false;

    // Horizontal check
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 4; c++) {
        if (
          currentBoard[r][c] &&
          currentBoard[r][c] === currentBoard[r][c + 1] &&
          currentBoard[r][c] === currentBoard[r][c + 2]
        ) {
          toClear.add(`${r},${c}`);
          toClear.add(`${r},${c + 1}`);
          toClear.add(`${r},${c + 2}`);
          found = true;
        }
      }
    }

    // Vertical check
    for (let c = 0; c < 6; c++) {
      for (let r = 0; r < 4; r++) {
        if (
          currentBoard[r][c] &&
          currentBoard[r][c] === currentBoard[r + 1][c] &&
          currentBoard[r][c] === currentBoard[r + 2][c]
        ) {
          toClear.add(`${r},${c}`);
          toClear.add(`${r + 1},${c}`);
          toClear.add(`${r + 2},${c}`);
          found = true;
        }
      }
    }

    if (found) {
      const matchCount = toClear.size;
      const copy = currentBoard.map((row) => [...row]);

      toClear.forEach((key) => {
        const [rowIdx, colIdx] = key.split(',').map(Number);
        copy[rowIdx][colIdx] = '';
      });

      // Gravity drop falling jewels
      for (let c = 0; c < 6; c++) {
        let emptySpot = 5;
        for (let r = 5; r >= 0; r--) {
          if (copy[r][c] !== '') {
            copy[emptySpot][c] = copy[r][c];
            if (emptySpot !== r) {
              copy[r][c] = '';
            }
            emptySpot--;
          }
        }
        // Refill empty spots at top
        for (let r = emptySpot; r >= 0; r--) {
          copy[r][c] = jewels[Math.floor(Math.random() * jewels.length)];
        }
      }

      setM3Board(copy);

      // Increment score
      let triggerAd = false;
      setM3Matches((prev) => {
        const next = prev + 1;
        if (next % 5 === 0) {
          triggerAd = true;
        }
        return next;
      });

      if (triggerAd) {
        setTimeout(() => {
          watchAdSequence(() => {
            let won = 5;
            try {
              const saved = localStorage.getItem('taskx_v1_coin_config');
              if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.match3Reward !== undefined) won = Number(parsed.match3Reward);
              }
            } catch (e) {}

            onAddCoins(won, 'Match-3 Match Bonus');
            onAddNotification({
              type: 'game',
              title: 'Match-3 Ad Unlock',
              description: `Completed 5 matches and earned ${won} 🪙 via sponsor bonus!`,
              coinsChange: won,
            });
          });
        }, 300);
      }

      // Check cascading matches recursively
      setTimeout(() => {
        checkM3MatchesAndClear(copy);
      }, 500);
    }

    return found;
  };

  // ==========================================
  // 5. OPEN BOX (YIELDS 3H COOLDOWN)
  // ==========================================
  const [boxState, setBoxState] = useState<'idle' | 'shaking' | 'opened'>('idle');
  const [boxWinnings, setBoxWinnings] = useState<number>(0);
  const [cooldownTime, setCooldownTime] = useState<number>(0);

  const keyCooldown = `open_box_cooldown_${user.id}`;

  const calculateRemainingCooldown = () => {
    const saved = localStorage.getItem(keyCooldown);
    if (saved) {
      const targetTime = parseInt(saved);
      const diff = Math.max(0, targetTime - Date.now());
      return Math.floor(diff / 1000); // return in seconds
    }
    return 0;
  };

  useEffect(() => {
    if (gameId === 'luckybox') {
      const rem = calculateRemainingCooldown();
      setCooldownTime(rem);

      if (rem > 0) {
        setBoxState('opened');
      } else {
        setBoxState('idle');
      }
    }
  }, [gameId]);

  // Real-time HH:MM:SS Countdown ticking for the Box Cooldown
  useEffect(() => {
    let interval: number | null = null;
    if (cooldownTime > 0) {
      interval = window.setInterval(() => {
        const rem = calculateRemainingCooldown();
        setCooldownTime(rem);
        if (rem <= 0) {
          clearInterval(interval!);
          setBoxState('idle');
        }
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [cooldownTime]);

  const handleOpenBox = () => {
    if (cooldownTime > 0 || boxState !== 'idle') return;

    setBoxState('shaking');
    
    let boxMin = 10;
    let boxMax = 100;
    try {
      const saved = localStorage.getItem('taskx_v1_coin_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.lootboxMin !== undefined) boxMin = Number(parsed.lootboxMin);
        if (parsed.lootboxMax !== undefined) boxMax = Number(parsed.lootboxMax);
      }
    } catch (e) {}
    
    if (boxMax < boxMin) boxMax = boxMin;
    const prize = Math.floor(boxMin + Math.random() * (boxMax - boxMin + 1));

    setTimeout(() => {
      setBoxWinnings(prize);
      setBoxState('opened');
    }, 1500);
  };

  const handleClaimBoxCoins = () => {
    watchAdSequence(() => {
      onAddCoins(boxWinnings, 'Open Box Chest Reward');
      onAddNotification({
        type: 'game',
        title: 'Open Box Looted',
        description: `Successfully opened a premium treasure box and won ${boxWinnings} 🪙!`,
        coinsChange: boxWinnings,
      });

      // Save 3 Hours Cooldown!
      const targetTime = Date.now() + 3 * 3600 * 1000;
      localStorage.setItem(keyCooldown, String(targetTime));
      setCooldownTime(3 * 3600);
      setBoxWinnings(0);
    });
  };

  const handleSkipBox = () => {
    // Save cooldown even on skip
    const targetTime = Date.now() + 3 * 3600 * 1000;
    localStorage.setItem(keyCooldown, String(targetTime));
    setCooldownTime(3 * 3600);
    setBoxWinnings(0);
  };

  const formatCooldownText = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="w-full flex flex-col pt-1">
      {/* Header wrapper omitting Balance */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <button onClick={onBack} className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back</span>
        </button>
        <span className="font-bold text-base tracking-wide text-blue-500 flex items-center gap-1.5 drop-shadow-[0_0_8px_rgba(59,130,246,0.2)]">
          <Sparkles className="w-4 h-4 text-blue-400" />
          {gameId === 'color' && 'COLOR MATCH'}
          {gameId === 'memory' && 'MEM CHANT'}
          {gameId === 'ttt' && 'TIC-TAC-TOE'}
          {gameId === 'match3' && 'HIGH MATCH-3'}
          {gameId === 'luckybox' && 'PREMIUM CHEST'}
        </span>
        <div className="w-8 h-8" />
      </div>

      {/* ==================================== */}
      {/* 1. COLOR MATCH GRAPHICS */}
      {/* ==================================== */}
      {gameId === 'color' && (
        <div className="flex flex-col items-center">
          <div className="grid grid-cols-2 gap-3.5 w-full mb-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 text-center">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-0.5">Matched Rounds</span>
              <span className="text-base font-black text-emerald-400 font-mono">{colorScore} / 10</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 text-center">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-0.5">Completion Goal</span>
              <span className="text-base font-black text-yellow-400">15 🪙 Goal</span>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 w-full shadow-lg flex flex-col items-center">
            <span className="text-[10px] text-slate-500 font-extrabold tracking-widest uppercase mb-4">MATCH THIS COLOR</span>
            <div
              className="w-28 h-28 rounded-2xl border-2 border-slate-800/80 shadow-[0_10px_25px_rgba(255,255,255,0.05)] mb-6 transition-all duration-300"
              style={{ backgroundColor: colorTarget }}
            />

            <span className="text-[10px] text-slate-500 font-extrabold tracking-widest uppercase mb-4">SELECT OPPOSITE OPTION</span>
            <div className="grid grid-cols-3 gap-3.5 w-full max-w-[240px]">
              {colorOptions.map((c, i) => (
                <button
                  key={i}
                  onClick={() => handleColorGuess(c)}
                  className="aspect-square rounded-full border border-slate-800 active:scale-90 transition-transform cursor-pointer"
                  style={{ backgroundColor: c, WebkitTapHighlightColor: 'transparent' }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================================== */}
      {/* 2. MEMORY GAME GRAPHICS */}
      {/* ==================================== */}
      {gameId === 'memory' && (
        <div className="flex flex-col items-center">
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-3 w-full text-center mb-4">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Matched Couples</span>
            <span className="text-base font-black text-purple-400 font-mono block mt-0.5">{matchesCount} / {memoryIcons.length} Pairs</span>
          </div>

          <div className="grid grid-cols-4 gap-3 w-full bg-slate-950 border border-slate-880 rounded-3xl p-4 shadow-xl">
            {cards.map((c, idx) => (
              <button
                key={c.id}
                onClick={() => handleCardClick(idx)}
                className="aspect-square rounded-xl bg-slate-900 border border-slate-800/80 active:scale-95 transition-all text-xl font-bold flex items-center justify-center cursor-pointer select-none"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                {c.flipped || c.matched ? c.symbol : '❓'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ==================================== */}
      {/* 3. TIC TACT TOE BOARD */}
      {/* ==================================== */}
      {gameId === 'ttt' && (
        <div className="flex flex-col items-center">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 w-full text-center mb-4">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Turn Owner</span>
            <span className="text-base font-black text-blue-400 block mt-0.5">
              {tttWinner
                ? tttWinner === 'draw'
                  ? 'Is a Draw Tie!'
                  : `${tttWinner} Wins the Round!`
                : turn === 'X'
                ? 'Your Choice (X)'
                : 'AI Bot Thinking (O)...'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 w-full max-w-[280px] aspect-square bg-slate-950 border border-slate-800/80 p-4 rounded-3xl shadow-2xl mb-4">
            {board.map((cell, idx) => (
              <button
                key={idx}
                onClick={() => handleTTTClick(idx)}
                className={`rounded-xl bg-slate-900 border border-slate-800/80 text-3xl font-black flex items-center justify-center cursor-pointer ${
                  cell === 'X' ? 'text-blue-400' : 'text-rose-400'
                }`}
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                {cell}
              </button>
            ))}
          </div>

          <button
            onClick={resetTTTGame}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-xs font-bold font-mono uppercase tracking-widest transition-all cursor-pointer"
          >
            Reset Arena
          </button>
        </div>
      )}

      {/* ==================================== */}
      {/* 4. MATCH 3 GRID (HIGH DIFFICULTY) */}
      {/* ==================================== */}
      {gameId === 'match3' && (
        <div className="flex flex-col items-center">
          <div className="grid grid-cols-2 gap-3.5 w-full mb-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 text-center">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-0.5">Matches Score</span>
              <span className="text-base font-black text-emerald-400 font-mono">{m3Matches} pts</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 text-center">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-0.5">Next Ad Trigger</span>
              <span className="text-base font-black text-rose-500 font-mono">{5 - (m3Matches % 5)} matches key</span>
            </div>
          </div>

          <div className="bg-slate-950 border-2 border-slate-800/80 p-3.5 rounded-3xl shadow-2xl w-full max-w-[320px]">
            <div className="grid grid-cols-6 gap-1.5">
              {m3Board.map((row, rIdx) =>
                row.map((val, cIdx) => {
                  const isSelected = selectedM3Cell?.r === rIdx && selectedM3Cell?.c === cIdx;
                  return (
                    <button
                      key={`${rIdx}-${cIdx}`}
                      onClick={() => selectMatch3Cell(rIdx, cIdx)}
                      className={`aspect-square rounded-lg flex items-center justify-center text-xl transition-all cursor-pointer ${
                        isSelected ? 'bg-indigo-600/30 border-indigo-400 border-[1.5px] scale-110' : 'bg-slate-900/60 border border-slate-800/40'
                      }`}
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                      {val}
                    </button>
                  );
                })
              )}
            </div>
          </div>
          <p className="text-[10px] text-slate-500 text-center mt-3 max-w-[240px]">
            Swap adjacent elements to form groups of 3+ matching gems. Achieve score steps of 5 to trigger sponsors bonus rewards!
          </p>
        </div>
      )}

      {/* ==================================== */}
      {/* 5. OPEN BOX (LUCKY BOX) */}
      {/* ==================================== */}
      {gameId === 'luckybox' && (
        <div className="flex flex-col items-center w-full max-w-sm mx-auto">
          {/* Main glowing ultra-premium container */}
          <div className="bg-gradient-to-b from-[#131122] via-[#0b0a11] to-[#06050a] border-2 border-violet-500/35 rounded-[40px] px-6 py-9 w-full text-center relative overflow-hidden flex flex-col items-center min-h-[420px] justify-between shadow-[0_25px_60px_rgba(139,92,246,0.25),_0_0_100px_rgba(245,158,11,0.08)]">
            
            {/* Top design header */}
            <div className="z-10 mb-2 w-full">
              <span className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500/20 via-violet-500/20 to-amber-500/20 border border-amber-400/30 rounded-full text-[8.5px] font-black uppercase text-amber-300 tracking-widest block w-max mx-auto mb-2.5 animate-pulse">
                👑 MYSTERY CELESTIAL BOX
              </span>
              <h3 className="text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-white to-violet-300 uppercase tracking-wider leading-none mt-1">
                মহামূল্যবান রয়্যাল চেস্ট
              </h3>
              <p className="text-[10px] text-white/40 mt-2 font-medium px-4 leading-relaxed">
                Crack open the premium vault to disperse randomized gold coins! No risk, maximum bounty.
              </p>
            </div>

            {/* Glowing spinning celestial rings behind the chest with multiple orbits */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden h-[280px] mt-20 scale-100">
              <div className="absolute w-[240px] h-[240px] rounded-full border-2 border-dashed border-violet-500/10 animate-[spin_60s_linear_infinite]" />
              <div className="absolute w-[200px] h-[200px] rounded-full border border-violet-500/20 animate-[spin_30s_linear_infinite]" />
              <div className="absolute w-[160px] h-[160px] rounded-full border-2 border-dashed border-amber-500/15 animate-[spin_15s_linear_infinite]" />
              <div className="absolute w-[120px] h-[120px] bg-gradient-to-tr from-violet-600/10 to-amber-500/10 rounded-full blur-[40px] animate-pulse" />
            </div>

            {/* Simulated floating premium sparkle stars and floating coins */}
            <div className="absolute left-[15%] top-[45%] text-amber-400 opacity-70 animate-bounce pointer-events-none">
              <Sparkles className="w-5 h-5 drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]" />
            </div>
            <div className="absolute right-[16%] top-[38%] text-indigo-400 opacity-70 animate-[pulse_1.5s_infinite] pointer-events-none">
              <Star className="w-4.5 h-4.5 fill-indigo-400/30" />
            </div>
            <div className="absolute left-[24%] bottom-[35%] text-amber-300 opacity-50 animate-ping pointer-events-none">
              <Star className="w-3.5 h-3.5 fill-amber-300/20" />
            </div>

            {/* Shaking or Open image animations wrapper with high-fidelity glow aura */}
            <motion.div
              animate={
                boxState === 'shaking'
                  ? {
                      rotate: [0, -15, 15, -15, 15, -10, 10, -5, 5, 0],
                      scale: [1, 1.25, 1.25, 1.2, 1.2, 1.1, 1.1, 1],
                    }
                  : boxState === 'idle'
                  ? {
                      y: [0, -8, 0],
                    }
                  : {}
              }
              transition={
                boxState === 'shaking'
                  ? { repeat: Infinity, duration: 0.5 }
                  : boxState === 'idle'
                  ? { repeat: Infinity, duration: 2.2, ease: "easeInOut" }
                  : {}
              }
              className="w-40 h-40 flex items-center justify-center relative mt-3 mb-3 z-10"
            >
              {boxState === 'idle' && (
                <div 
                  className="relative cursor-pointer group" 
                  onClick={handleOpenBox}
                >
                  {/* Glowing core orbital aura */}
                  <div className="absolute -inset-6 bg-gradient-to-r from-violet-600 via-amber-400 to-indigo-600 rounded-full blur-2xl opacity-40 group-hover:opacity-75 transition-all duration-500 animate-pulse" />
                  
                  {/* Floating Chest base styled like a royal gem */}
                  <div className="bg-[#1f1b39]/95 p-6 rounded-[35px] border-2 border-violet-400/40 group-hover:border-amber-300 shadow-[0_15px_45px_rgba(139,92,246,0.35)] group-hover:shadow-[0_15px_50px_rgba(245,158,11,0.4)] transition-all duration-300 select-encode flex items-center justify-center">
                    <Box className="w-20 h-20 text-violet-300 group-hover:text-amber-300 drop-shadow-[0_0_20px_rgba(139,92,246,0.5)] transition-all duration-300" />
                  </div>
                  
                  {/* Dynamic Premium Tag */}
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-max px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-[#000] font-black text-[7.5px] uppercase tracking-widest leading-none shadow-md font-sans border border-amber-300">
                    CLICK TO DROP
                  </div>
                </div>
              )}

              {boxState === 'shaking' && (
                <div className="relative">
                  <div className="absolute -inset-10 bg-gradient-to-tr from-amber-500/20 to-indigo-500/20 rounded-full blur-2xl animate-spin" />
                  <div className="bg-gradient-to-tr from-amber-500/15 via-violet-950/40 to-transparent p-8 rounded-[45px] border-2 border-dashed border-amber-400/60 shadow-[0_0_50px_rgba(245,158,11,0.4)] relative">
                    <Box className="w-20 h-20 text-amber-300 drop-shadow-[0_0_25px_rgba(245,158,11,0.73)]" />
                  </div>
                </div>
              )}

              {boxState === 'opened' && cooldownTime > 0 && (
                <div className="relative opacity-25 select-none grayscale scale-90">
                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-[35px]">
                    <Box className="w-18 h-18 text-slate-600" />
                  </div>
                </div>
              )}
            </motion.div>

            {/* Interactive states control deck */}
            <div className="z-10 w-full mt-3">
              {boxState === 'idle' && (
                <button
                  onClick={handleOpenBox}
                  className="w-full py-4 px-6 bg-gradient-to-r from-[#ffb020] via-violet-600 to-[#ff9e00] hover:brightness-110 rounded-2xl font-black text-[#000] hover:text-[#000] text-[11px] tracking-widest uppercase shadow-[0_6px_25px_rgba(245,158,11,0.35)] cursor-pointer transition-all active:scale-95 select-none font-sans"
                >
                  🔓 UNLOCK TREASURE VAULT
                </button>
              )}

              {boxState === 'shaking' && (
                <div className="bg-black/40 border border-white/5 py-4 px-3 rounded-2xl">
                  <span className="text-[10px] text-amber-400 font-extrabold tracking-widest uppercase animate-pulse block">
                    ✨ DISMANTLING CRYPTO LOCKS... ✨
                  </span>
                  <div className="w-[85%] h-1 bg-white/5 rounded-full mx-auto mt-2 overflow-hidden relative">
                    <div className="absolute top-0 bottom-0 left-0 bg-amber-400 animate-[pulse_1s_infinite] w-[45%]" />
                  </div>
                </div>
              )}

              {boxState === 'opened' && boxWinnings > 0 && (
                <div className="w-full flex flex-col items-center animate-scale-up space-y-4">
                  <span className="text-[9px] text-[#000] bg-gradient-to-r from-amber-400 to-yellow-300 font-black tracking-widest uppercase px-4 py-1.5 rounded-full shadow-md animate-bounce">
                    🎁 VAULT REVEAL SUCCESSFUL!
                  </span>
                  
                  {/* Huge glowing prize indicator */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3 flex items-center gap-2.5 drop-shadow-[0_0_20px_rgba(245,158,11,0.3)] animate-pulse">
                    <Trophy className="w-7 h-7 text-amber-400 shrink-0" /> 
                    <span className="text-2xl font-black font-mono text-amber-300">
                      {boxWinnings} BDT / 🪙
                    </span>
                  </div>

                  <div className="flex gap-2.5 w-full">
                    <button
                      onClick={handleClaimBoxCoins}
                      className="flex-1 py-3.5 bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 hover:brightness-110 text-slate-950 font-black text-[11px] uppercase tracking-widest rounded-2xl cursor-pointer transition-all active:scale-95 shadow-lg shadow-green-500/20"
                    >
                      🎁 Claim Wallet (Watch Ad)
                    </button>
                    <button
                      onClick={handleSkipBox}
                      className="py-3.5 px-5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-wider cursor-pointer transition-colors"
                    >
                      Skip
                    </button>
                  </div>
                </div>
              )}

              {boxState === 'opened' && cooldownTime > 0 && (
                <div className="flex flex-col items-center animate-fade-in w-full space-y-2">
                  <span className="text-[9px] text-rose-400 font-black uppercase tracking-widest block bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-full mb-1">
                    ⏳ VAULT RELOAD ACTIVE
                  </span>
                  
                  <div className="bg-[#0c0c0f] border border-white/5 p-4 rounded-2xl w-full">
                    <span className="text-2xl font-black font-mono text-rose-400 tracking-wider block drop-shadow-[0_0_10px_rgba(239,68,68,0.3)]">
                      {formatCooldownText(cooldownTime)}
                    </span>
                    <span className="text-[8px] text-rose-500 font-semibold uppercase tracking-widest block mt-1">
                      Time remaining until reload
                    </span>
                  </div>
                  
                  {/* Custom linear cooldown gauge indicator */}
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-1.5 relative">
                    <div 
                      className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-rose-500 to-[#ff4c4c]" 
                      style={{ width: `${(cooldownTime / 10800) * 100}%` }}
                    />
                  </div>
                  
                  <p className="text-[9.5px] text-white/35 mt-1 max-w-[270px] leading-normal font-sans">
                    Treasure chests require a 3-hour stellar cooling cycle to gather next celestial bounties.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AD TIMER SCREEN */}
      <AnimatePresence>
        {adOverlayOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/98 backdrop-blur"
          >
            <div className="text-center p-6 bg-slate-900 border border-slate-800 rounded-3xl max-w-xs shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 animate-pulse" />
              <div className="w-16 h-16 rounded-full bg-blue-500/15 flex items-center justify-center mx-auto mb-4 animate-bounce">
                <PlayCircle className="w-10 h-10 text-blue-400" />
              </div>
              <h3 className="text-slate-100 font-extrabold text-base mb-1.5 uppercase tracking-wider">PREMIUM PARTNER AD</h3>
              <p className="text-slate-400 text-xs mb-5">Your game transaction is being secured. Payout triggers immediately after the timer.</p>

              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border-2 border-blue-400 text-blue-400 text-lg font-black font-mono">
                {adCountdown}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
