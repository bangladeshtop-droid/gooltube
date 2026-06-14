import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Sparkles, PlayCircle, Star, Shuffle, Volume2, VolumeX } from 'lucide-react';
import { User, AppNotification } from '../types';

interface CoinFlipGameProps {
  user: User;
  onAddCoins: (amt: number, reason: string) => void;
  onDeductCoins: (amt: number, reason: string) => boolean;
  onAddNotification: (notif: Omit<AppNotification, 'id' | 'timestamp'>) => void;
  onBack: () => void;
}

export default function CoinFlipGame({
  user,
  onAddCoins,
  onDeductCoins,
  onAddNotification,
  onBack,
}: CoinFlipGameProps) {
  const [flipping, setFlipping] = useState(false);
  const [choice, setChoice] = useState<'heads' | 'tails' | null>(null);
  const [result, setResult] = useState<'heads' | 'tails' | null>(null);
  const [statusText, setStatusText] = useState('Select Heads/Tails and choose your stake!');
  const [multiplierTrackSide, setMultiplierTrackSide] = useState<'heads' | 'tails' | null>(null);
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

  // Stats
  const [wins, setWins] = useState(0);
  const [totalWon, setTotalWon] = useState(0);

  // Ad simulation
  const [adOverlayOpen, setAdOverlayOpen] = useState(false);
  const [adCountdown, setAdCountdown] = useState(4);
  const adCallbackRef = useRef<(() => void) | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Spin Wheel Multiplier modal states
  const [showWheelModal, setShowWheelModal] = useState(false);
  const [wheelSpinning, setWheelSpinning] = useState(false);
  const [wheelTargetDeg, setWheelTargetDeg] = useState(0);
  const [chosenMultiplier, setChosenMultiplier] = useState(1);
  const [baseCoinWon, setBaseCoinWon] = useState(0);

  const wheelMuls = [2, 3, 5, 8, 10, 15];
  const wheelColors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];

  const playBeep = (freq = 600, duration = 0.08) => {
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

  const watchSimulatedAd = (onDone: () => void) => {
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

  const startFlipSequence = (betOn: 'heads' | 'tails', isFreeAd = false) => {
    if (flipping || adOverlayOpen) return;

    const executeFlip = () => {
      setChoice(betOn);
      setResult(null);
      setFlipping(true);
      setStatusText('Flipping the crown coin...');

      // Randomly choose. At least 50% chance of matching multi track side
      const randMultSide = Math.random() < 0.5 ? 'heads' : 'tails';
      setMultiplierTrackSide(randMultSide);

      // Perform ticking sound intervals
      let tick = 0;
      const ticker = setInterval(() => {
        playBeep(500 + (tick % 6) * 100, 0.04);
        tick++;
        if (tick > 10) clearInterval(ticker);
      }, 150);

      setTimeout(() => {
        clearInterval(ticker);
        const flipOutcome = Math.random() < 0.5 ? 'heads' : 'tails';
        setResult(flipOutcome);
        setFlipping(false);

        // If betting coins they win with dynamic multiplier coefficient, if ad play they win flat 15 coins
        let coinflipMult = 2.0;
        try {
          const saved = localStorage.getItem('taskx_v1_coin_config');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.coinflipMultiplier !== undefined) coinflipMult = Number(parsed.coinflipMultiplier);
          }
        } catch (e) {}

        const wonBase = isFreeAd ? 15 : Math.round(betAmt * coinflipMult);

        if (betOn === flipOutcome) {
          setWins((prev) => prev + 1);
          playBeep(920, 0.2);

          // If correct side AND matched the Multiplier Track jackpot indicators:
          if (betOn === randMultSide) {
            setBaseCoinWon(wonBase);
            setStatusText(`🔥 Double Win Match! Multiplier jackpot wheel unlocked!`);
            setTimeout(() => {
              setShowWheelModal(true);
            }, 700);
          } else {
            setTotalWon((prev) => prev + wonBase);
            onAddCoins(wonBase, 'Coin Flip Win');
            setStatusText(`🎉 You Won! Earned +${wonBase} 🪙!`);

            onAddNotification({
              type: 'game',
              title: 'Coin Flip Victory',
              description: `Correct prediction on ${betOn.toUpperCase()} yielded ${wonBase} 🪙.`,
              coinsChange: wonBase,
            });
          }
        } else {
          playBeep(220, 0.35);
          setStatusText(`Busted! Landed on ${flipOutcome.toUpperCase()}. Try again!`);

          onAddNotification({
            type: 'game',
            title: 'Coin Flip Loss',
            description: `Predicted ${betOn.toUpperCase()} but landed on ${flipOutcome.toUpperCase()}.`,
            coinsChange: isFreeAd ? 0 : -betAmt,
          });
        }
      }, 1600);
    };

    if (isFreeAd) {
      watchSimulatedAd(executeFlip);
    } else {
      if (onDeductCoins(betAmt, 'Coin Multiplier Prediction')) {
        executeFlip();
      }
    }
  };

  const spinMultiplierWheel = () => {
    if (wheelSpinning) return;
    setWheelSpinning(true);

    const randSector = Math.floor(Math.random() * wheelMuls.length);
    const chosenMulValue = wheelMuls[randSector];
    const anglePerSector = 360 / wheelMuls.length;
    const finalRot = 360 * 5 + (360 - (randSector * anglePerSector + anglePerSector / 2));

    setWheelTargetDeg(finalRot);

    // Audio tick
    let wt = 0;
    const interval = setInterval(() => {
      playBeep(450 + (wt % 4) * 80, 0.05);
      wt++;
      if (wt > 15) clearInterval(interval);
    }, 250);

    setTimeout(() => {
      clearInterval(interval);
      setWheelSpinning(false);
      setChosenMultiplier(chosenMulValue);

      const finalCoins = baseCoinWon * chosenMulValue;
      setTotalWon((prev) => prev + finalCoins);
      onAddCoins(finalCoins, `Coin Flip Multiplied x${chosenMulValue} payout`);
      playBeep(1000, 0.25);

      onAddNotification({
        type: 'game',
        title: `Multiplied Winner!`,
        description: `Your ${baseCoinWon} 🪙 Coin Flip win was multiplied by ${chosenMulValue}x! Handed ${finalCoins} 🪙.`,
        coinsChange: finalCoins,
      });

      setStatusText(`Mega Win! Multiplied ${baseCoinWon} 🪙 by ${chosenMulValue}x = ${finalCoins} 🪙!`);
    }, 4500);
  };

  const closeWheelModal = () => {
    setShowWheelModal(false);
    setWheelTargetDeg(0);
    setBaseCoinWon(0);
    setChosenMultiplier(1);
    setMultiplierTrackSide(null);
  };

  return (
    <div className="w-full flex flex-col pt-1 relative">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <button onClick={onBack} className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back</span>
        </button>
        <span className="font-bold text-base tracking-wide text-amber-500 flex items-center gap-1.5 drop-shadow-[0_0_8px_rgba(245,158,11,0.2)]">
          <Sparkles className="w-4 h-4 text-amber-400" />
          COIN MULTIPLIER
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

      {/* STATS */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-[#141418] border border-white/5 rounded-2xl p-3 text-center">
          <span className="text-[9px] text-[#FFF]/30 font-bold uppercase tracking-widest block mb-0.5">Victories</span>
          <span className="text-base font-black text-emerald-400 font-mono">{wins} Won</span>
        </div>
        <div className="bg-[#141418] border border-white/5 rounded-2xl p-3 text-center">
          <span className="text-[9px] text-[#FFF]/30 font-bold uppercase tracking-widest block mb-0.5">Coins Earned</span>
          <span className="text-base font-black text-yellow-500 font-mono">{totalWon} 🪙</span>
        </div>
      </div>

      {/* PREMIUM CENTRAL DISK */}
      <div className="bg-gradient-to-b from-[#141418] to-black border border-white/5 rounded-3xl p-6 flex flex-col items-center justify-center min-h-[220px] shadow-2xl relative overflow-hidden">
        {/* Shimmer background */}
        <div className="absolute inset-0 bg-radial-gradient(circle, rgba(245,158,11,0.03) 0%, transparent 70%)" />

        {/* Floating Coin Area */}
        <div className="relative w-36 h-36 flex items-center justify-center">
          <motion.div
            animate={
              flipping
                ? {
                    rotateY: [0, 1440, 2880],
                    scale: [1, 1.25, 1],
                  }
                : { rotateY: result === 'tails' ? 180 : 0 }
            }
            transition={{
              duration: flipping ? 1.6 : 0.6,
              ease: 'easeInOut',
            }}
            className="w-24 h-24 rounded-full relative transform-style-3d cursor-pointer shadow-[0_10px_25px_rgba(245,158,11,0.25)] flex items-center justify-center border-4 border-amber-400"
            style={{
              backgroundImage: 'radial-gradient(circle, #f59e0b 20%, #d97706 80%, #92400e 100%)',
            }}
          >
            {/* Front Heads */}
            <div className="absolute inset-0 rounded-full flex items-center justify-center text-3xl backface-hidden font-black text-slate-950">
              👑
            </div>
            {/* Back Tails */}
            <div
              className="absolute inset-0 rounded-full flex items-center justify-center text-3xl font-black text-slate-950"
              style={{ transform: 'rotateY(180deg)' }}
            >
              💰
            </div>
          </motion.div>
        </div>

        {/* Action descriptions */}
        <div className="mt-4 text-center z-10">
          <p className="text-slate-100 font-bold text-xs leading-relaxed">{statusText}</p>
        </div>
      </div>

      {/* COIN BETTING OPTIONS */}
      <div className="bg-[#141418] border border-white/5 p-4 rounded-3xl mt-4 space-y-3">
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/55">Prediction Stake</span>
            <span className="text-[10px] text-yellow-400 font-extrabold">{betAmt} 🪙</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              disabled={flipping}
              onClick={() => setBetAmt(Math.max(10, betAmt - 10))}
              className="w-8 h-8 bg-white/5 disabled:opacity-35 hover:bg-white/10 rounded-lg text-white font-bold text-xs cursor-pointer"
            >
              -
            </button>
            <input
              type="number"
              disabled={flipping}
              value={betAmt}
              onChange={(e) => setBetAmt(Math.max(10, parseInt(e.target.value) || 10))}
              className="flex-1 text-center bg-black/45 border border-white/5 text-yellow-400 text-xs font-black py-1.5 px-2 rounded-lg"
            />
            <button
              disabled={flipping}
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
                disabled={flipping}
                onClick={() => setBetAmt(v)}
                className={`text-[9px] font-bold py-1 px-1.5 rounded grow border cursor-pointer ${
                  betAmt === v ? 'border-amber-500 bg-amber-500/10 text-amber-300' : 'border-white/5 bg-white/5 text-white/40'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* HEADS / TAILS ACTION PANELS */}
      <div className="grid grid-cols-2 gap-3.5 mt-4">
        {/* Heads Column Button block */}
        <div className="flex flex-col gap-2">
          {multiplierTrackSide === 'heads' && (
            <div className="mx-auto bg-gradient-to-r from-red-500 to-pink-500 text-slate-100 text-[8px] font-black tracking-widest uppercase px-2.5 py-0.5 rounded-full shadow-[0_0_12px_rgba(239,68,68,0.4)] border border-red-400/20 z-10 flex items-center gap-1">
              <Star className="w-2.5 h-2.5 fill-current text-white" />
              MEGA MULTIPLIER
            </div>
          )}
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => startFlipSequence('heads', false)}
              disabled={flipping}
              className="w-full bg-[#141418] hover:bg-[#18181f] border border-white/5 hover:border-white/10 py-3 rounded-2xl flex flex-col items-center justify-center font-black text-xs text-slate-100 transition-transform active:scale-95 cursor-pointer"
            >
              👑 Heads (Staked)
            </button>
            <button
              onClick={() => startFlipSequence('heads', true)}
              disabled={flipping}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/5 py-1 px-2 rounded-xl flex items-center justify-center gap-1 text-[9px] font-bold text-white/55 cursor-pointer"
            >
              <PlayCircle className="w-3.5 h-3.5 text-red-500" /> Free Ad Flip
            </button>
          </div>
        </div>

        {/* Tails Column Button block */}
        <div className="flex flex-col gap-2">
          {multiplierTrackSide === 'tails' && (
            <div className="mx-auto bg-gradient-to-r from-red-500 to-pink-500 text-slate-100 text-[8px] font-black tracking-widest uppercase px-2.5 py-0.5 rounded-full shadow-[0_0_12px_rgba(239,68,68,0.4)] border border-red-400/20 z-10 flex items-center gap-1">
              <Star className="w-2.5 h-2.5 fill-current text-white" />
              MEGA MULTIPLIER
            </div>
          )}
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => startFlipSequence('tails', false)}
              disabled={flipping}
              className="w-full bg-[#141418] hover:bg-[#18181f] border border-white/5 hover:border-white/10 py-3 rounded-2xl flex flex-col items-center justify-center font-black text-xs text-slate-100 transition-transform active:scale-95 cursor-pointer"
            >
              💰 Tails (Staked)
            </button>
            <button
              onClick={() => startFlipSequence('tails', true)}
              disabled={flipping}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/5 py-1 px-2 rounded-xl flex items-center justify-center gap-1 text-[9px] font-bold text-white/55 cursor-pointer"
            >
              <PlayCircle className="w-3.5 h-3.5 text-red-500" /> Free Ad Flip
            </button>
          </div>
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
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-amber-500 to-red-500 animate-pulse" />
              <div className="w-16 h-16 rounded-full bg-red-500/15 flex items-center justify-center mx-auto mb-4 animate-bounce">
                <PlayCircle className="w-10 h-10 text-red-400" />
              </div>
              <h3 className="text-slate-100 font-extrabold text-base mb-1.5 uppercase tracking-wider">PREMIUM VIDEO AD</h3>
              <p className="text-slate-400 text-xs mb-5">Your Heads/Tails challenge will load automatically after this brief promotional sequence.</p>

              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border-2 border-red-400 text-red-400 text-lg font-black font-mono">
                {adCountdown}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SPIN WHEEL MULTIPLIER MODAL */}
      <AnimatePresence>
        {showWheelModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-900 border border-amber-500/30 rounded-3xl p-6 text-center max-w-xs w-full shadow-[0_20px_50px_rgba(245,158,11,0.25)] relative"
            >
              <h3 className="text-amber-400 font-black text-lg flex items-center justify-center gap-1.5 drop-shadow-[0_0_8px_rgba(245,158,11,0.3)] mb-1">
                <Sparkles className="w-5 h-5" /> MULTIPLIER WHEEL
              </h3>
              <p className="text-[10px] text-slate-400 mb-4 uppercase tracking-widest">Auto spins to multiply your flip win!</p>

              {/* Graphical Circular Wheel Component */}
              <div className="relative w-44 h-44 mx-auto mb-5 overflow-hidden rounded-full border-4 border-slate-950 shadow-inner flex items-center justify-center">
                {/* Pointer overlay */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-30 w-0 h-0 border-l-[10px] border-r-[10px] border-t-[14px] border-l-transparent border-r-transparent border-t-amber-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />

                <motion.div
                  animate={{ rotate: wheelTargetDeg }}
                  transition={{
                    duration: wheelSpinning ? 4.5 : 0,
                    ease: 'cubic-bezier(0.25, 0.1, 0.1, 1)',
                  }}
                  className="w-full h-full rounded-full relative"
                >
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                    <g>
                      {wheelMuls.map((val, idx) => {
                        const degPerSect = 360 / wheelMuls.length;
                        const startAng = (idx * degPerSect * Math.PI) / 180;
                        const endAng = (((idx + 1) * degPerSect) * Math.PI) / 180;
                        const x1 = 100 + 100 * Math.cos(startAng);
                        const y1 = 100 + 100 * Math.sin(startAng);
                        const x2 = 100 + 100 * Math.cos(endAng);
                        const y2 = 100 + 100 * Math.sin(endAng);

                        const midAng = startAng + (endAng - startAng) / 2;
                        const labelX = 100 + 60 * Math.cos(midAng);
                        const labelY = 100 + 60 * Math.sin(midAng);

                        return (
                          <g key={idx}>
                            <path d={`M 100 100 L ${x1} ${y1} A 100 100 0 0 1 ${x2} ${y2} Z`} fill={wheelColors[idx]} />
                            <text
                              x={labelX}
                              y={labelY}
                              fill="white"
                              fontSize="13"
                              fontWeight="900"
                              textAnchor="middle"
                              dominantBaseline="middle"
                              transform={`rotate(${(midAng * 180) / Math.PI + 90}, ${labelX}, ${labelY})`}
                            >
                              {val}x
                            </text>
                          </g>
                        );
                      })}
                    </g>
                  </svg>
                  <div className="absolute inset-x-0 inset-y-0 m-auto w-10 h-10 rounded-full bg-slate-900 border-2 border-amber-300 z-10 flex items-center justify-center text-xs font-bold text-amber-200">
                    SPIN
                  </div>
                </motion.div>
              </div>

              {chosenMultiplier > 1 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl mb-4"
                >
                  <p className="text-emerald-400 font-extrabold text-sm flex items-center justify-center gap-1">
                    <Shuffle className="w-4 h-4" /> Multiplier: {chosenMultiplier}x
                  </p>
                  <p className="text-slate-300 text-xs mt-0.5">
                    Coins rewarded: {baseCoinWon} x {chosenMultiplier} = {baseCoinWon * chosenMultiplier} 🪙!
                  </p>
                </motion.div>
              )}

              <div className="flex gap-2">
                {!wheelTargetDeg ? (
                  <button
                    onClick={spinMultiplierWheel}
                    className="flex-1 py-3 bg-amber-500 text-slate-950 hover:bg-amber-400 rounded-xl font-bold text-xs shadow-md tracking-wider cursor-pointer font-black"
                  >
                    SPIN AUTOMATICALLY
                  </button>
                ) : (
                  <button
                    onClick={closeWheelModal}
                    disabled={wheelSpinning}
                    className="flex-1 py-3 bg-slate-800 disabled:opacity-45 hover:bg-slate-700 text-white rounded-xl font-bold text-xs cursor-pointer"
                  >
                    CLOSE & CLAIM
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
