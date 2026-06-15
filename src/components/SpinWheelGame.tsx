import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, PlayCircle, Loader2, Sparkles, Star, Volume2, VolumeX } from 'lucide-react';
import { User, AppNotification } from '../types';
import { triggerExternalAds } from '../utils';

interface SpinWheelGameProps {
  user: User;
  onAddCoins: (amt: number, reason: string) => void;
  onDeductCoins: (amt: number, reason: string) => boolean;
  onAddNotification: (notif: Omit<AppNotification, 'id' | 'timestamp'>) => void;
  onBack: () => void;
}

export default function SpinWheelGame({
  user,
  onAddCoins,
  onDeductCoins,
  onAddNotification,
  onBack,
}: SpinWheelGameProps) {
  const [spinning, setSpinning] = useState(false);
  const [rotationDeg, setRotationDeg] = useState(0);
  const [outcomesText, setOutcomesText] = useState('Stake coins or watch an ad to spin!');
  const [betAmt, setBetAmt] = useState<number>(20);
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

  // Multiplier Slots Tracker
  const [multiplierSlots, setMultiplierSlots] = useState<{ [index: number]: number }>({});

  // Stats
  const [totalSpins, setTotalSpins] = useState(0);
  const [totalWon, setTotalWon] = useState(0);

  // Ad Overlay
  const [adOverlayOpen, setAdOverlayOpen] = useState(false);
  const [adCountdown, setAdCountdown] = useState(4);
  const adCallbackRef = useRef<(() => void) | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const segments = [10, 20, 50, 80, 100, 120, 150, 200, 250, 300, 400, 500];
  const sectorColors = [
    '#3b82f6', '#1d4ed8', // Blues
    '#10b981', '#047857', // Greens
    '#f59e0b', '#b45309', // Ambers
    '#ec4899', '#be185d', // Pinks
    '#8b5cf6', '#6d28d9', // Violets
    '#ef4444', '#b91c1c'  // Reds
  ];

  // Sync to refs for safety in timeouts
  const rotationDegRef = useRef(0);
  useEffect(() => {
    rotationDegRef.current = rotationDeg;
  }, [rotationDeg]);

  const playBeep = (freq = 700, duration = 0.08) => {
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

  const watchAdSequence = (onDone: () => void) => {
    setAdOverlayOpen(true);
    setAdCountdown(4);
    triggerExternalAds();
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

  const spinWheel = (isFreeAd = false) => {
    if (spinning || adOverlayOpen) return;

    const executeSpin = () => {
      setSpinning(true);
      setOutcomesText('Spinning the giant wheel...');

      // Highlight 2-3 random slots with secondary multipliers
      const selectedIndices: { [key: number]: number } = {};
      const multipliersPool = [2, 3, 5];

      while (Object.keys(selectedIndices).length < 2) {
        const randIdx = Math.floor(Math.random() * segments.length);
        const randMulNum = multipliersPool[Math.floor(Math.random() * multipliersPool.length)];
        selectedIndices[randIdx] = randMulNum;
      }
      setMultiplierSlots(selectedIndices);

      // PERFECT SPIN CALCULATION FOR CONTINUOUS CLOCKWISE MOTION
      const targetSector = Math.floor(Math.random() * segments.length);
      const degreesPerSector = 360 / segments.length;
      const sectorCenterAngle = 360 - (targetSector * degreesPerSector + degreesPerSector / 2);

      // Remaining angle for full circle rotation + standard laps + sector offset
      const currentRotationMod = rotationDegRef.current % 360;
      const additionalRotation = (360 - currentRotationMod) + sectorCenterAngle + (360 * 5);
      const finalRot = rotationDegRef.current + additionalRotation;

      setRotationDeg(finalRot);

      // Trigger tick sound during spinning
      let tickTracker = 0;
      const ticker = setInterval(() => {
        playBeep(450 + (tickTracker % 5) * 50, 0.05);
        tickTracker++;
        if (tickTracker > 20) clearInterval(ticker);
      }, 200);

      setTimeout(() => {
        clearInterval(ticker);
        finalizeSpin(targetSector, selectedIndices, isFreeAd);
      }, 5500);
    };

    if (isFreeAd) {
      watchAdSequence(executeSpin);
    } else {
      if (onDeductCoins(betAmt, 'Mega Spin Wheel Stake')) {
        executeSpin();
      }
    }
  };

  const finalizeSpin = (targetIdx: number, activeMultipliers: { [idx: number]: number }, isFreeAd: boolean) => {
    const baseWin = segments[targetIdx];
    const multiplier = activeMultipliers[targetIdx] || 1;
    
    let spinWheelMax = 80;
    try {
      const saved = localStorage.getItem('taskx_v1_coin_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.spinWheelMax !== undefined) {
          spinWheelMax = Number(parsed.spinWheelMax);
        }
      }
    } catch (e) {}

    const factorMultiplier = spinWheelMax / 80;
    // If they bet coins, their payout is based on multiplying their bet, otherwise standard flat payout
    const finalPrize = Math.round(
      (isFreeAd ? (baseWin * multiplier) : Math.floor(betAmt * (baseWin / 100) * multiplier)) * factorMultiplier
    );

    setTotalSpins((prev) => prev + 1);
    setTotalWon((prev) => prev + finalPrize);
    onAddCoins(finalPrize, `Spin Wheel payout`);
    playBeep(880, 0.2);

    const bonusWord = multiplier > 1 ? ` (MULTIPLIED ${multiplier}x!)` : '';
    setOutcomesText(
      `🎉 Winner! Landed on ${baseWin} ticks${bonusWord}. Earned +${finalPrize} 🪙!`
    );

    onAddNotification({
      type: 'game',
      title: 'Spin Wheel Result!',
      description: `Landed on sector ${baseWin}${bonusWord}. Collected payout of ${finalPrize} 🪙.`,
      coinsChange: finalPrize,
    });

    setSpinning(false);
  };

  return (
    <div className="w-full flex flex-col pt-1">
      {/* Header wrapper */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <button onClick={onBack} className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back</span>
        </button>
        <span className="font-bold text-base tracking-wide text-purple-500 flex items-center gap-1.5 drop-shadow-[0_0_8px_rgba(168,85,247,0.2)]">
          <Sparkles className="w-4 h-4 text-purple-400" />
          MEGA SPIN WHEEL
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

      {/* STAT TILES */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-[#141418] border border-white/5 rounded-2xl p-3 text-center">
          <span className="text-[9px] text-[#FFF]/30 font-bold uppercase tracking-widest block mb-0.5">Rounds Played</span>
          <span className="text-base font-black text-purple-400 font-mono">{totalSpins}</span>
        </div>
        <div className="bg-[#141418] border border-white/5 rounded-2xl p-3 text-center">
          <span className="text-[9px] text-[#FFF]/30 font-bold uppercase tracking-widest block mb-0.5">Total Won</span>
          <span className="text-base font-black text-yellow-500 font-mono">{totalWon} 🪙</span>
        </div>
      </div>

      {/* WHEEL MOUNT */}
      <div className="bg-gradient-to-b from-slate-900 via-[#121216] to-[#141418] border border-white/5 rounded-3xl p-5 shadow-2xl relative overflow-hidden flex flex-col items-center">
        {/* Pointer at the top */}
        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 z-30 w-0 h-0 border-l-[11px] border-r-[11px] border-t-[16px] border-l-transparent border-r-transparent border-t-yellow-400 drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)]" />

        {/* Circular Wheel */}
        <div className="relative w-56 h-56 rounded-full overflow-hidden border-4 border-[#0b0c10] shadow-2xl">
          <motion.div
            animate={{ rotate: rotationDeg }}
            transition={{
              duration: 5.5,
              ease: [0.25, 0.1, 0.1, 1],
            }}
            className="w-full h-full rounded-full relative"
          >
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
              <g>
                {segments.map((val, idx) => {
                  const degPerSect = 360 / segments.length;
                  const startAng = (idx * degPerSect * Math.PI) / 180;
                  const endAng = (((idx + 1) * degPerSect) * Math.PI) / 180;
                  const x1 = 100 + 100 * Math.cos(startAng);
                  const y1 = 100 + 100 * Math.sin(startAng);
                  const x2 = 100 + 100 * Math.cos(endAng);
                  const y2 = 100 + 100 * Math.sin(endAng);

                  const midAng = startAng + (endAng - startAng) / 2;
                  const labelX = 100 + 64 * Math.cos(midAng);
                  const labelY = 100 + 64 * Math.sin(midAng);

                  const hasMultiplier = multiplierSlots[idx] !== undefined;

                  return (
                    <g key={idx}>
                      {/* Sector wedge path */}
                      <path
                        d={`M 100 100 L ${x1} ${y1} A 100 100 0 0 1 ${x2} ${y2} Z`}
                        fill={hasMultiplier ? '#4f46e5' : sectorColors[idx]}
                        className={`transition-colors duration-200 ${
                          hasMultiplier ? 'stroke-indigo-400 stroke-[1.5px]' : ''
                        }`}
                      />

                      {/* Value labeling */}
                      <text
                        x={labelX}
                        y={labelY}
                        fill="white"
                        fontSize="9"
                        fontWeight="900"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        transform={`rotate(${(midAng * 180) / Math.PI + 90}, ${labelX}, ${labelY})`}
                      >
                        {val}
                      </text>

                      {/* Overlapping Multiplier Badge */}
                      {hasMultiplier && (
                        <g transform={`translate(${100 + 38 * Math.cos(midAng)}, ${100 + 38 * Math.sin(midAng)})`}>
                          <circle r="8.5" fill="#f43f5e" stroke="#fff" strokeWidth="1" />
                          <text
                            fill="#fff"
                            fontSize="7.5"
                            fontWeight="bold"
                            textAnchor="middle"
                            dominantBaseline="central"
                          >
                            {multiplierSlots[idx]}x
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </g>
            </svg>
            <div className="absolute inset-x-0 inset-y-0 m-auto w-10 h-10 rounded-full bg-slate-950 border-2 border-yellow-400 z-10 flex items-center justify-center text-[10px] font-black text-yellow-400 shadow-lg">
              {spinning ? <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" /> : 'MEGA'}
            </div>
          </motion.div>
        </div>

        {/* Display Status */}
        <p className="text-slate-300 text-xs text-center font-bold max-w-xs mt-4 leading-relaxed">
          {outcomesText}
        </p>
      </div>

      {/* COIN BETTING CONTROL CONSOLE */}
      <div className="bg-[#141418] border border-white/5 p-4 rounded-3xl mt-4 space-y-3.5">
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/55">Spin Bet Stakes</span>
            <span className="text-[10px] text-yellow-400 font-extrabold">{betAmt} 🪙</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              disabled={spinning}
              onClick={() => setBetAmt(Math.max(10, betAmt - 10))}
              className="w-8 h-8 bg-white/5 disabled:opacity-35 hover:bg-white/10 rounded-lg text-white font-bold text-xs cursor-pointer"
            >
              -
            </button>
            <input
              type="number"
              disabled={spinning}
              value={betAmt}
              onChange={(e) => setBetAmt(Math.max(10, parseInt(e.target.value) || 10))}
              className="flex-1 text-center bg-black/45 border border-white/5 text-yellow-400 text-xs font-black py-1.5 px-2 rounded-lg"
            />
            <button
              disabled={spinning}
              onClick={() => setBetAmt(betAmt + 10)}
              className="w-8 h-8 bg-white/5 disabled:opacity-35 hover:bg-white/10 rounded-lg text-white font-bold text-xs cursor-pointer"
            >
              +
            </button>
          </div>

          <div className="flex gap-2 justify-between mt-2">
            {[20, 50, 100, 200].map((v) => (
              <button
                key={v}
                disabled={spinning}
                onClick={() => setBetAmt(v)}
                className={`text-[9px] font-bold py-1 px-1.5 rounded grow border cursor-pointer ${
                  betAmt === v ? 'border-purple-500 bg-purple-500/10 text-purple-300' : 'border-white/5 bg-white/5 text-white/40'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* DOUBLE BUTTON ACTUATORS */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            onClick={() => spinWheel(false)}
            disabled={spinning}
            className="w-full bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] transition-all disabled:opacity-40 text-slate-100 py-3 rounded-2xl font-black text-[11px] uppercase tracking-wider shadow-md cursor-pointer"
          >
            SPIN WITH BET
          </button>
          <button
            onClick={() => spinWheel(true)}
            disabled={spinning}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-[0.98] transition-all disabled:opacity-40 text-slate-100 py-3 rounded-2xl font-black text-[11px] uppercase tracking-wider shadow-md cursor-pointer"
          >
            FREE AD SPIN
          </button>
        </div>
      </div>

      {/* AD OVERLAY MODAL */}
      <AnimatePresence>
        {adOverlayOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/98 backdrop-blur"
          >
            <div className="text-center p-6 bg-slate-900 border border-slate-800 rounded-3xl max-w-xs shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-500 animate-pulse" />
              <div className="w-16 h-16 rounded-full bg-purple-500/15 flex items-center justify-center mx-auto mb-4 animate-bounce">
                <PlayCircle className="w-10 h-10 text-purple-400" />
              </div>
              <h3 className="text-slate-100 font-extrabold text-base mb-1.5 uppercase tracking-wider">SPONSOR INTERSTITIAL</h3>
              <p className="text-slate-400 text-xs mb-5">Your hyper-spin multiplier wheel will trigger as soon as this brief ad ends.</p>

              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border-2 border-purple-400 text-purple-400 text-lg font-black font-mono">
                {adCountdown}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
