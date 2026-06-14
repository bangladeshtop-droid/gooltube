import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Volume2, VolumeX, Sparkles, Trophy, Users, History, Play } from 'lucide-react';
import { User, AppNotification } from '../types';

interface CrashGameProps {
  user: User;
  onAddCoins: (amt: number, reason: string) => void;
  onDeductCoins: (amt: number, reason: string) => boolean;
  onAddNotification: (notif: Omit<AppNotification, 'id' | 'timestamp'>) => void;
  onBack: () => void;
}

interface BetRecord {
  name: string;
  amount: number;
  multiplier?: number;
  profit?: number;
  status: 'running' | 'cashed' | 'busted';
}

interface HistoryRecord {
  multiplier: number;
  timestamp: string;
}

export default function CrashGame({
  user,
  onAddCoins,
  onDeductCoins,
  onAddNotification,
  onBack,
}: CrashGameProps) {
  const [balance, setBalance] = useState(user.coins);
  const [phase, setPhase] = useState<'waiting' | 'flying' | 'crashed'>('waiting');
  const [countdown, setCountdown] = useState<number>(10);
  const [currentMult, setCurrentMult] = useState<number>(1.0);
  const [soundOn, setSoundOn] = useState<boolean>(() => {
    return localStorage.getItem('taskx_v1_sound_effects') !== 'false';
  });

  useEffect(() => {
    const handleStorage = () => {
      setSoundOn(localStorage.getItem('taskx_v1_sound_effects') !== 'false');
    };
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Betting slots A and B
  const [betAUnit, setBetAUnit] = useState<number>(10);
  const [betBUnit, setBetBUnit] = useState<number>(20);
  const [placedA, setPlacedA] = useState<boolean>(false);
  const [placedB, setPlacedB] = useState<boolean>(false);
  const [cashedA, setCashedA] = useState<boolean>(false);
  const [cashedB, setCashedB] = useState<boolean>(false);
  const [profitA, setProfitA] = useState<number>(0);
  const [profitB, setProfitB] = useState<number>(0);

  // Auto cashouts
  const [autoCashAOn, setAutoCashAOn] = useState<boolean>(true);
  const [autoCashAVal, setAutoCashAVal] = useState<number>(2.0);
  const [autoCashBOn, setAutoCashBOn] = useState<boolean>(true);
  const [autoCashBVal, setAutoCashBVal] = useState<number>(3.0);

  // Auto bets
  const [autoBetA, setAutoBetA] = useState<boolean>(false);
  const [autoBetB, setAutoBetB] = useState<boolean>(false);

  // Tabs: current, my_bets, top_wins
  const [activeTab, setActiveTab] = useState<'current' | 'my_bets' | 'top'>('current');

  // Play lists
  const [liveBets, setLiveBets] = useState<BetRecord[]>([]);
  const [myBets, setMyBets] = useState<BetRecord[]>([]);
  const [topWins, setTopWins] = useState<BetRecord[]>([
    { name: 'Kryptos', amount: 500, multiplier: 85.2, profit: 42600, status: 'cashed' },
    { name: 'GigaBones', amount: 800, multiplier: 45.4, profit: 36320, status: 'cashed' },
    { name: 'DegenRulez', amount: 2000, multiplier: 12.5, profit: 25000, status: 'cashed' },
    { name: 'TaskLord', amount: 120, multiplier: 144.5, profit: 17340, status: 'cashed' },
  ]);
  const [crashHistory, setCrashHistory] = useState<HistoryRecord[]>([]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const flightTimerRef = useRef<number | null>(null);
  const countdownTimerRef = useRef<number | null>(null);
  const crashMultLimitRef = useRef<number>(2.0);
  const audioContextRef = useRef<AudioContext | null>(null);

  // REFERENCES (CRITICAL solution to prevent state closures in requestAnimationFrame)
  const placedARef = useRef(placedA);
  const cashedARef = useRef(cashedA);
  const autoCashAOnRef = useRef(autoCashAOn);
  const autoCashAValRef = useRef(autoCashAVal);
  const betAUnitRef = useRef(betAUnit);
  const autoBetARef = useRef(autoBetA);

  const placedBRef = useRef(placedB);
  const cashedBRef = useRef(cashedB);
  const autoCashBOnRef = useRef(autoCashBOn);
  const autoCashBValRef = useRef(autoCashBVal);
  const betBUnitRef = useRef(betBUnit);
  const autoBetBRef = useRef(autoBetB);

  const phaseRef = useRef(phase);

  useEffect(() => { placedARef.current = placedA; }, [placedA]);
  useEffect(() => { cashedARef.current = cashedA; }, [cashedA]);
  useEffect(() => { autoCashAOnRef.current = autoCashAOn; }, [autoCashAOn]);
  useEffect(() => { autoCashAValRef.current = autoCashAVal; }, [autoCashAVal]);
  useEffect(() => { betAUnitRef.current = betAUnit; }, [betAUnit]);
  useEffect(() => { autoBetARef.current = autoBetA; }, [autoBetA]);

  useEffect(() => { placedBRef.current = placedB; }, [placedB]);
  useEffect(() => { cashedBRef.current = cashedB; }, [cashedB]);
  useEffect(() => { autoCashBOnRef.current = autoCashBOn; }, [autoCashBOn]);
  useEffect(() => { autoCashBValRef.current = autoCashBVal; }, [autoCashBVal]);
  useEffect(() => { betBUnitRef.current = betBUnit; }, [betBUnit]);
  useEffect(() => { autoBetBRef.current = autoBetB; }, [autoBetB]);

  useEffect(() => { phaseRef.current = phase; }, [phase]);

  useEffect(() => {
    setBalance(user.coins);
  }, [user.coins]);

  // Initial historic rounds
  useEffect(() => {
    const historicals: HistoryRecord[] = [];
    for (let i = 0; i < 15; i++) {
      historicals.push({
        multiplier: parseFloat((1.01 + Math.random() * (Math.random() < 0.2 ? 15 : 3.5)).toFixed(2)),
        timestamp: new Date(Date.now() - i * 60000).toLocaleTimeString(),
      });
    }
    setCrashHistory(historicals);
    startCountdownPhase();

    return () => {
      cleanupTimers();
    };
  }, []);

  const cleanupTimers = () => {
    if (flightTimerRef.current) cancelAnimationFrame(flightTimerRef.current);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
  };

  // Play beep sound
  const playBeep = (freq = 600, duration = 0.1) => {
    if (!soundOn) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  };

  const startCountdownPhase = () => {
    cleanupTimers();
    setPhase('waiting');
    setCountdown(7);
    setCurrentMult(1.0);
    setCashedA(false);
    setCashedB(false);
    cashedARef.current = false;
    cashedBRef.current = false;
    setProfitA(0);
    setProfitB(0);

    // AUTO BET PLACEMENTS
    if (autoBetARef.current) {
      if (onDeductCoins(betAUnitRef.current, 'Crash Auto Bet A')) {
        setPlacedA(true);
        placedARef.current = true;
        setCashedA(false);
        cashedARef.current = false;
      } else {
        setAutoBetA(false);
        autoBetARef.current = false;
        onAddNotification({
          type: 'system',
          title: 'Auto Bet Disabled',
          description: 'Auto Bet Slot A disabled due to low balance.',
        });
      }
    }
    if (autoBetBRef.current) {
      if (onDeductCoins(betBUnitRef.current, 'Crash Auto Bet B')) {
        setPlacedB(true);
        placedBRef.current = true;
        setCashedB(false);
        cashedBRef.current = false;
      } else {
        setAutoBetB(false);
        autoBetBRef.current = false;
        onAddNotification({
          type: 'system',
          title: 'Auto Bet Disabled',
          description: 'Auto Bet Slot B disabled due to low balance.',
        });
      }
    }

    // Set fake live player lists
    const bots: BetRecord[] = [
      { name: 'ApeCoin_33', amount: 150, status: 'running' },
      { name: 'HodlGod', amount: 50, status: 'running' },
      { name: 'DEXMaster', amount: 300, status: 'running' },
      { name: 'KewlKid', amount: 100, status: 'running' },
      { name: 'GemHunter', amount: 500, status: 'running' },
    ];
    setLiveBets(bots);

    countdownTimerRef.current = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimerRef.current!);
          startFlightPhase();
          return 0;
        }
        playBeep(440, 0.08);
        return prev - 1;
      });
    }, 1000);
  };

  const startFlightPhase = () => {
    setPhase('flying');
    playBeep(880, 0.25);

    // Probability curves for Crash points
    const prob = Math.random();
    let point = 1.0;
    
    let crashMax = 100;
    try {
      const saved = localStorage.getItem('taskx_v1_coin_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.crashMax) crashMax = Number(parsed.crashMax);
      }
    } catch (e) {}

    if (prob < 0.03) point = 1.0; // instant crash
    else if (prob < 0.15) point = 1.01 + Math.random() * (crashMax * 0.005);
    else if (prob < 0.5) point = 1.41 + Math.random() * (crashMax * 0.02);
    else if (prob < 0.8) point = 3.0 + Math.random() * (crashMax * 0.08);
    else if (prob < 0.96) point = 8.0 + Math.random() * (crashMax * 0.3);
    else point = (crashMax * 0.35) + Math.random() * (crashMax * 0.65);

    crashMultLimitRef.current = parseFloat(point.toFixed(2));

    const startTime = Date.now();
    const tick = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      // Growth rate formula
      const current = Math.exp(0.065 * elapsed);

      if (current >= crashMultLimitRef.current) {
        handleCrashEnd(crashMultLimitRef.current);
      } else {
        const formattedMult = parseFloat(current.toFixed(2));
        setCurrentMult(formattedMult);

        // EVALUATE AUTO-CASHOUTS USING RELIABLE COPIED REFS
        if (placedARef.current && !cashedARef.current && autoCashAOnRef.current && current >= autoCashAValRef.current) {
          executeCashout('A', autoCashAValRef.current);
        }
        if (placedBRef.current && !cashedBRef.current && autoCashBOnRef.current && current >= autoCashBValRef.current) {
          executeCashout('B', autoCashBValRef.current);
        }

        // Random bot players exit flight
        setLiveBets((prev) =>
          prev.map((bot) => {
            if (bot.status === 'running' && Math.random() < 0.04 && current > 1.25) {
              const capMult = parseFloat((current - 0.05 + Math.random() * 0.1).toFixed(2));
              playBeep(520, 0.05);
              return {
                ...bot,
                status: 'cashed',
                multiplier: capMult,
                profit: Math.floor(bot.amount * capMult),
              };
            }
            return bot;
          })
        );

        // Continuous drawing
        drawGraph(current);
        flightTimerRef.current = requestAnimationFrame(tick);
      }
    };

    flightTimerRef.current = requestAnimationFrame(tick);
  };

  const handleCrashEnd = (crashPoint: number) => {
    cleanupTimers();
    setPhase('crashed');
    setCurrentMult(crashPoint);
    playBeep(220, 0.4);

    // Save history
    setCrashHistory((prev) => [
      { multiplier: crashPoint, timestamp: new Date().toLocaleTimeString() },
      ...prev,
    ]);

    // Handle losses/unclaimed states
    if (placedARef.current && !cashedARef.current) {
      setMyBets((prev) => [
        { name: 'Bet A', amount: betAUnitRef.current, status: 'busted', multiplier: crashPoint },
        ...prev,
      ]);
    }
    if (placedBRef.current && !cashedBRef.current) {
      setMyBets((prev) => [
        { name: 'Bet B', amount: betBUnitRef.current, status: 'busted', multiplier: crashPoint },
        ...prev,
      ]);
    }

    setPlacedA(false);
    setPlacedB(false);
    placedARef.current = false;
    placedBRef.current = false;

    // Restart sequence automatically
    setTimeout(() => {
      setPlacedA(false);
      setPlacedB(false);
      startCountdownPhase();
    }, 4500);
  };

  const executeCashout = (slot: 'A' | 'B', mult: number) => {
    if (slot === 'A') {
      if (!placedARef.current || cashedARef.current) return;
      setCashedA(true);
      cashedARef.current = true;
      const winVal = Math.floor(betAUnitRef.current * mult);
      setProfitA(winVal);
      onAddCoins(winVal, 'Crash Game Cashout A');
      playBeep(980, 0.15);
      onAddNotification({
        type: 'game',
        title: 'Crash Profit - Slot A',
        description: `Successfully cashed out at ${mult.toFixed(2)}x for Bet A.`,
        coinsChange: winVal,
      });
      setMyBets((prev) => [
        { name: 'Bet A', amount: betAUnitRef.current, multiplier: mult, status: 'cashed', profit: winVal },
        ...prev,
      ]);
    } else {
      if (!placedBRef.current || cashedBRef.current) return;
      setCashedB(true);
      cashedBRef.current = true;
      const winVal = Math.floor(betBUnitRef.current * mult);
      setProfitB(winVal);
      onAddCoins(winVal, 'Crash Game Cashout B');
      playBeep(980, 0.15);
      onAddNotification({
        type: 'game',
        title: 'Crash Profit - Slot B',
        description: `Successfully cashed out at ${mult.toFixed(2)}x for Bet B.`,
        coinsChange: winVal,
      });
      setMyBets((prev) => [
        { name: 'Bet B', amount: betBUnitRef.current, multiplier: mult, status: 'cashed', profit: winVal },
        ...prev,
      ]);
    }
  };

  const handlePlaceBet = (slot: 'A' | 'B') => {
    if (phaseRef.current !== 'waiting') {
      alert('You can only place or edit stakes during the countdown phase!');
      return;
    }
    if (slot === 'A') {
      if (placedA) {
        if (phase !== 'flying') {
          onAddCoins(betAUnit, 'Crash Refund A');
          setPlacedA(false);
          placedARef.current = false;
        }
      } else {
        if (onDeductCoins(betAUnit, 'Crash Game A')) {
          setPlacedA(true);
          placedARef.current = true;
          setCashedA(false);
          cashedARef.current = false;
        }
      }
    } else {
      if (placedB) {
        if (phase !== 'flying') {
          onAddCoins(betBUnit, 'Crash Refund B');
          setPlacedB(false);
          placedBRef.current = false;
        }
      } else {
        if (onDeductCoins(betBUnit, 'Crash Game B')) {
          setPlacedB(true);
          placedBRef.current = true;
          setCashedB(false);
          cashedBRef.current = false;
        }
      }
    }
  };

  const drawGraph = (multiplier: number, isCrashed = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i < w; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, h);
      ctx.stroke();
    }
    for (let j = 0; j < h; j += 40) {
      ctx.beginPath();
      ctx.moveTo(0, j);
      ctx.lineTo(w, j);
      ctx.stroke();
    }

    // Let's calculate the current progress factor asymptotically so the rocket moves seamlessly
    const progress = 1 - Math.exp(-0.12 * (multiplier - 1));

    // Let's compute current rocket position on the visual curve:
    const rocketX = 30 + progress * (w - 70);
    const rocketY = h - 30 - (Math.pow(progress, 1.4) * (h - 70));

    // Draw live growth vector curve path up to current location
    const steps = 30;
    const pathPoints: { x: number; y: number }[] = [];
    for (let k = 0; k <= steps; k++) {
      const stepProgress = (k / steps) * progress;
      const xCoord = 30 + stepProgress * (w - 70);
      const yCoord = h - 30 - (Math.pow(stepProgress, 1.4) * (h - 70));
      pathPoints.push({ x: xCoord, y: yCoord });
    }

    ctx.strokeStyle = phaseRef.current === 'crashed' ? '#ef4444' : '#3b82f6';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(30, h - 30);
    pathPoints.forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.stroke();

    // Fill area below trajectory
    ctx.fillStyle = phaseRef.current === 'crashed'
      ? 'rgba(239, 68, 68, 0.08)'
      : 'rgba(59, 130, 246, 0.08)';
    ctx.beginPath();
    ctx.moveTo(30, h - 30);
    pathPoints.forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.lineTo(rocketX, h - 30);
    ctx.closePath();
    ctx.fill();

    // Rocket Icon
    ctx.font = '24px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(phaseRef.current === 'crashed' ? '💥' : '🚀', rocketX, rocketY);
  };

  useEffect(() => {
    drawGraph(currentMult);
  }, [phase, currentMult]);

  return (
    <div className="w-full flex flex-col pt-1">
      {/* Header section */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <button onClick={onBack} className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back</span>
        </button>
        <span className="font-bold text-base tracking-wide text-blue-500 flex items-center gap-1.5 drop-shadow-[0_0_8px_rgba(59,130,246,0.2)]">
          <Sparkles className="w-4 h-4 text-blue-400" />
          VIP ROCKET CRASH
        </span>
        <button
          onClick={() => {
            const nextVal = !soundOn;
            setSoundOn(nextVal);
            localStorage.setItem('taskx_v1_sound_effects', String(nextVal));
            window.dispatchEvent(new Event('storage'));
          }}
          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
        >
          {soundOn ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-600" />}
        </button>
      </div>

      {/* ROCKET STAGE CANVAS */}
      <div className="bg-[#0b0c10] border border-white/5 rounded-3xl h-44 relative flex items-center justify-center overflow-hidden shadow-inner">
        <canvas ref={canvasRef} className="w-full h-full" width={340} height={176} />

        {/* Dynamic Center Panel overlay */}
        <div className="absolute z-10 flex flex-col items-center text-center pointer-events-none">
          {phase === 'waiting' && (
            <div className="flex flex-col items-center">
              <span className="text-3xl font-black text-slate-100 tracking-wider font-mono">
                {countdown}s
              </span>
              <span className="text-[10px] text-blue-400 font-semibold uppercase tracking-widest mt-1">
                PREPARING ENGINE
              </span>
            </div>
          )}

          {phase === 'flying' && (
            <div className="flex flex-col items-center">
              <span className="text-4xl font-black text-blue-400 font-mono tracking-wider drop-shadow-[0_4px_15px_rgba(59,130,246,0.4)]">
                {currentMult.toFixed(2)}x
              </span>
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-1">
                SPEED RUSHING
              </span>
            </div>
          )}

          {phase === 'crashed' && (
            <div className="flex flex-col items-center">
              <span className="text-4xl font-black text-red-500 font-mono tracking-wider drop-shadow-[0_4px_15px_rgba(239,68,68,0.4)]">
                CRASHED
              </span>
              <span className="text-[11px] text-slate-400 font-medium tracking-wide mt-1">
                Busted @ {currentMult.toFixed(2)}x
              </span>
            </div>
          )}
        </div>

        {/* Live multiplier history tags overlay */}
        <div className="absolute top-2 left-2 right-2 flex items-center gap-1.5 overflow-x-auto scrollable py-1">
          {crashHistory.slice(0, 6).map((hist, idx) => {
            const isHigh = hist.multiplier >= 2.0;
            return (
              <span
                key={idx}
                className={`text-[8px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                  isHigh
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                }`}
              >
                {hist.multiplier.toFixed(2)}x
              </span>
            );
          })}
        </div>
      </div>

      {/* BET CONTROL SHEETS (Directly Underneath Graph as Requested) */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        {/* Slot A */}
        <div className="bg-[#141418] border border-white/5 rounded-2xl p-3 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[10px] font-bold tracking-wider text-slate-400">BET SLOT A</span>
              {placedA && !cashedA && (
                <span className="text-[9px] text-emerald-400 font-bold tracking-tight animate-bounce">
                  Live: {(betAUnit * currentMult).toFixed(0)} 🪙
                </span>
              )}
            </div>

            {/* Input adjustment buttons */}
            <div className="flex items-center gap-1.5">
              <button
                disabled={placedA}
                onClick={() => setBetAUnit(Math.max(5, betAUnit - 5))}
                className="w-7 h-7 flex items-center justify-center bg-white/5 disabled:opacity-30 rounded-lg text-slate-300 font-bold text-xs cursor-pointer"
              >
                -
              </button>
              <input
                type="number"
                disabled={placedA}
                value={betAUnit}
                onChange={(e) => setBetAUnit(Math.max(5, parseInt(e.target.value) || 5))}
                className="flex-1 text-center bg-black/45 border border-white/5 text-slate-200 text-xs font-bold py-1 px-1 rounded-lg"
              />
              <button
                disabled={placedA}
                onClick={() => setBetAUnit(betAUnit + 5)}
                className="w-7 h-7 flex items-center justify-center bg-white/5 disabled:opacity-30 rounded-lg text-slate-300 font-bold text-xs cursor-pointer"
              >
                +
              </button>
            </div>

            {/* Selection row */}
            <div className="flex justify-between gap-1 mt-1.5 font-mono">
              {[20, 50, 100, 200].map((v) => (
                <button
                  key={v}
                  disabled={placedA}
                  onClick={() => setBetAUnit(v)}
                  className={`text-[9px] font-bold py-0.5 px-1 rounded grow border cursor-pointer ${
                    betAUnit === v ? 'border-blue-500/35 bg-blue-500/10 text-blue-400' : 'border-white/5 bg-[#121216] text-white/40'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>

            {/* Auto controls (A) */}
            <div className="border-t border-white/5 mt-2.5 pt-2 space-y-1.5 text-[10px]">
              <label className="flex items-center gap-1.5 text-slate-300 select-none cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoBetA}
                  onChange={() => setAutoBetA(!autoBetA)}
                  className="rounded border-slate-700 accent-blue-500"
                />
                Auto Bet next round
              </label>
              
              <label className="flex items-center gap-1.5 text-slate-300 select-none cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoCashAOn}
                  onChange={() => setAutoCashAOn(!autoCashAOn)}
                  className="rounded border-slate-700 accent-blue-500"
                />
                Auto cashout
              </label>
              {autoCashAOn && (
                <div className="flex items-center gap-1">
                  <span className="text-slate-500">Rate:</span>
                  <input
                    type="number"
                    step={0.1}
                    value={autoCashAVal}
                    onChange={(e) => setAutoCashAVal(Math.max(1.05, parseFloat(e.target.value) || 1.1))}
                    className="w-16 bg-[#121216] border border-white/5 text-center font-bold text-yellow-400 text-[10px] rounded py-0.5 px-0.5"
                  />
                  <span className="text-slate-500">x</span>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => {
              if (placedA) {
                if (!cashedA && phase === 'flying') {
                  executeCashout('A', currentMult);
                }
              } else {
                handlePlaceBet('A');
              }
            }}
            disabled={phase === 'flying' && placedA && cashedA}
            className={`w-full py-2.5 rounded-xl font-bold text-xs mt-3 select-none cursor-pointer transition-all ${
              placedA
                ? cashedA
                  ? 'bg-white/5 text-slate-500 border border-white/5 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-[0_4px_15px_rgba(245,158,11,0.25)] font-black'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_4px_15px_rgba(59,130,246,0.25)]'
            }`}
          >
            {placedA ? (cashedA ? 'CASHED ✓' : 'CASHOUT') : 'BET'}
          </button>
        </div>

        {/* Slot B */}
        <div className="bg-[#141418] border border-white/5 rounded-2xl p-3 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[10px] font-bold tracking-wider text-slate-400">BET SLOT B</span>
              {placedB && !cashedB && (
                <span className="text-[9px] text-emerald-400 font-bold tracking-tight animate-bounce">
                  Live: {(betBUnit * currentMult).toFixed(0)} 🪙
                </span>
              )}
            </div>

            {/* Input adjustment buttons */}
            <div className="flex items-center gap-1.5">
              <button
                disabled={placedB}
                onClick={() => setBetBUnit(Math.max(5, betBUnit - 5))}
                className="w-7 h-7 flex items-center justify-center bg-white/5 disabled:opacity-30 rounded-lg text-slate-300 font-bold text-xs cursor-pointer"
              >
                -
              </button>
              <input
                type="number"
                disabled={placedB}
                value={betBUnit}
                onChange={(e) => setBetBUnit(Math.max(5, parseInt(e.target.value) || 5))}
                className="flex-1 text-center bg-black/45 border border-white/5 text-slate-200 text-xs font-bold py-1 px-1 rounded-lg"
              />
              <button
                disabled={placedB}
                onClick={() => setBetBUnit(betBUnit + 5)}
                className="w-7 h-7 flex items-center justify-center bg-white/5 disabled:opacity-30 rounded-lg text-slate-300 font-bold text-xs cursor-pointer"
              >
                +
              </button>
            </div>

            {/* Selection row */}
            <div className="flex justify-between gap-1 mt-1.5 font-mono">
              {[20, 50, 100, 200].map((v) => (
                <button
                  key={v}
                  disabled={placedB}
                  onClick={() => setBetBUnit(v)}
                  className={`text-[9px] font-bold py-0.5 px-1 rounded grow border cursor-pointer ${
                    betBUnit === v ? 'border-blue-500/35 bg-blue-500/10 text-blue-400' : 'border-white/5 bg-[#121216] text-white/40'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>

            {/* Auto controls (B) */}
            <div className="border-t border-white/5 mt-2.5 pt-2 space-y-1.5 text-[10px]">
              <label className="flex items-center gap-1.5 text-slate-300 select-none cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoBetB}
                  onChange={() => setAutoBetB(!autoBetB)}
                  className="rounded border-slate-700 accent-blue-500"
                />
                Auto Bet next round
              </label>

              <label className="flex items-center gap-1.5 text-slate-300 select-none cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoCashBOn}
                  onChange={() => setAutoCashBOn(!autoCashBOn)}
                  className="rounded border-slate-700 accent-blue-500"
                />
                Auto cashout
              </label>
              {autoCashBOn && (
                <div className="flex items-center gap-1">
                  <span className="text-slate-500">Rate:</span>
                  <input
                    type="number"
                    step={0.1}
                    value={autoCashBVal}
                    onChange={(e) => setAutoCashBVal(Math.max(1.05, parseFloat(e.target.value) || 1.1))}
                    className="w-16 bg-[#121216] border border-white/5 text-center font-bold text-yellow-400 text-[10px] rounded py-0.5 px-0.5"
                  />
                  <span className="text-slate-500">x</span>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => {
              if (placedB) {
                if (!cashedB && phase === 'flying') {
                  executeCashout('B', currentMult);
                }
              } else {
                handlePlaceBet('B');
              }
            }}
            disabled={phase === 'flying' && placedB && cashedB}
            className={`w-full py-2.5 rounded-xl font-bold text-xs mt-3 select-none cursor-pointer transition-all ${
              placedB
                ? cashedB
                  ? 'bg-white/5 text-slate-500 border border-white/5 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-[0_4px_15px_rgba(245,158,11,0.25)] font-black'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_4px_15px_rgba(59,130,246,0.25)]'
            }`}
          >
            {placedB ? (cashedB ? 'CASHED ✓' : 'CASHOUT') : 'BET'}
          </button>
        </div>
      </div>

      {/* HORIZONTAL TAB SELECTOR (Sitting at bottom underneath bets as requested) */}
      <div className="flex gap-2 bg-[#141418] border border-white/5 p-1 rounded-xl mt-4">
        <button
          onClick={() => setActiveTab('current')}
          className={`flex-1 flex items-center justify-center gap-1 py-2 px-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'current' ? 'bg-blue-600/15 border border-blue-500/25 text-blue-300 shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" /> Current Round
        </button>
        <button
          onClick={() => setActiveTab('my_bets')}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'my_bets' ? 'bg-blue-600/15 border border-blue-500/25 text-blue-300 shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <History className="w-3.5 h-3.5" /> My Bets
        </button>
        <button
          onClick={() => setActiveTab('top')}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'top' ? 'bg-blue-600/15 border border-blue-500/25 text-blue-300 shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" /> Top wins
        </button>
      </div>

      {/* TAB RESULTS */}
      <div className="bg-[#141418] border border-white/5 rounded-2xl p-3.5 min-h-[140px] max-h-[140px] overflow-y-auto scrollable mt-2">
        {activeTab === 'current' && (
          <div className="space-y-1.5 text-xs">
            {liveBets.map((record, index) => (
              <div key={index} className="flex items-center justify-between py-1 border-b border-white/5 last:border-0">
                <span className="text-slate-400 font-medium">{record.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-mono">{record.amount} 🪙</span>
                  {record.status === 'cashed' ? (
                    <span className="text-emerald-400 font-bold bg-emerald-500/5 px-1.5 py-0.5 rounded border border-emerald-500/10 font-mono">
                      Cashed {record.multiplier}x
                    </span>
                  ) : record.status === 'busted' ? (
                    <span className="text-red-400 font-medium bg-red-500/5 px-1.5 py-0.5 rounded border border-red-500/10 font-mono">
                      Busted
                    </span>
                  ) : (
                    <span className="text-blue-400 italic animate-pulse">Flying...</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'my_bets' && (
          <div className="space-y-1.5 text-xs">
            {myBets.length === 0 ? (
              <p className="text-slate-500 text-center py-8 italic text-xs">No simulation stats found for this session</p>
            ) : (
              myBets.map((record, idx) => (
                <div key={idx} className="flex items-center justify-between py-1 border-b border-white/5 last:border-0">
                  <span className="text-slate-300 font-semibold">{record.name}</span>
                  <div className="text-right">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 font-mono">({record.amount} bet)</span>
                      <span className={`font-bold font-mono ${record.status === 'cashed' ? 'text-emerald-500' : 'text-red-500'}`}>
                        {record.status === 'cashed' ? `+${record.profit} 🪙` : `-${record.amount} 🪙`}
                      </span>
                    </div>
                    {record.multiplier && (
                      <span className="text-[10px] text-slate-500 block font-mono">Out: {record.multiplier.toFixed(2)}x</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'top' && (
          <div className="space-y-1.5 text-xs">
            {topWins.map((record, index) => (
              <div key={index} className="flex items-center justify-between py-1 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-yellow-500 font-bold font-mono">#{index + 1}</span>
                  <span className="text-slate-300 font-medium">{record.name}</span>
                </div>
                <div className="text-right font-mono">
                  <span className="text-emerald-400 font-bold">+{record.profit?.toLocaleString()} 🪙</span>
                  <span className="text-[10px] text-slate-500 block">Mult: {record.multiplier}x</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
