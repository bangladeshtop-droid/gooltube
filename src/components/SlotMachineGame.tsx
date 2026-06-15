import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, PlayCircle, Trophy, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { User, AppNotification } from '../types';
import { triggerExternalAds } from '../utils';

interface SlotMachineGameProps {
  user: User;
  onAddCoins: (amt: number, reason: string) => void;
  onDeductCoins: (amt: number, reason: string) => boolean;
  onAddNotification: (notif: Omit<AppNotification, 'id' | 'timestamp'>) => void;
  onBack: () => void;
}

export default function SlotMachineGame({
  user,
  onAddCoins,
  onDeductCoins,
  onAddNotification,
  onBack,
}: SlotMachineGameProps) {
  const [spinning, setSpinning] = useState(false);
  const [reels, setReels] = useState<string[]>(['💎', '🍒', '🍒']);
  const [outcomeMessage, setOutcomeMessage] = useState('Stake coins or watch an ad to spin reels!');
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
  const [totalSpins, setTotalSpins] = useState(0);
  const [totalWon, setTotalWon] = useState(0);

  // Ad triggers modal
  const [adOverlayOpen, setAdOverlayOpen] = useState(false);
  const [adCountdown, setAdCountdown] = useState(4);
  const adCallbackRef = useRef<(() => void) | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const symbols = ['🍒', '🍋', '🍇', '🔔', '💎', '7️⃣', '⭐'];

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

  const startSpinSequence = (isFreeAd = false) => {
    if (spinning || adOverlayOpen) return;

    const runReels = () => {
      setSpinning(true);
      setOutcomeMessage('Rolling slot drums...');

      let tickCount = 0;
      const interval = setInterval(() => {
        setReels([
          symbols[Math.floor(Math.random() * symbols.length)],
          symbols[Math.floor(Math.random() * symbols.length)],
          symbols[Math.floor(Math.random() * symbols.length)],
        ]);
        playBeep(350 + (tickCount % 4) * 80, 0.05);
        tickCount++;
        if (tickCount > 15) {
          clearInterval(interval);
          finalizeSpin(isFreeAd);
        }
      }, 100);
    };

    if (isFreeAd) {
      watchAdSequence(runReels);
    } else {
      if (onDeductCoins(betAmt, 'Slot Machine Bet')) {
        runReels();
      }
    }
  };

  const finalizeSpin = (isFreeAd: boolean) => {
    const finalReels = [
      symbols[Math.floor(Math.random() * symbols.length)],
      symbols[Math.floor(Math.random() * symbols.length)],
      symbols[Math.floor(Math.random() * symbols.length)],
    ];
    setReels(finalReels);
    setTotalSpins((prev) => prev + 1);

    const [r1, r2, r3] = finalReels;
    let multiplier = 0;

    // Check combos
    if (r1 === r2 && r2 === r3) {
      if (r1 === '7️⃣') multiplier = 25;
      else if (r1 === '💎') multiplier = 18;
      else if (r1 === '⭐') multiplier = 12;
      else if (r1 === '🔔') multiplier = 10;
      else multiplier = 7; // fruit matches
    } else if (r1 === r2 || r2 === r3 || r1 === r3) {
      multiplier = 2; // minor 2x payout
    }

    let slotRewardMax = 250;
    try {
      const saved = localStorage.getItem('taskx_v1_coin_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.slotMach !== undefined) slotRewardMax = Number(parsed.slotMach);
      }
    } catch (e) {}

    let payout = isFreeAd 
      ? (multiplier > 0 ? (multiplier === 2 ? 25 : multiplier * 15) : 0)
      : Math.floor(betAmt * multiplier);

    // Scale premium jackpot based on configured slotMach coefficient
    if (multiplier >= 20 && !isFreeAd) {
      payout = Math.round((betAmt / 10) * slotRewardMax);
    }

    if (payout > 0) {
      setTotalWon((prev) => prev + payout);
      onAddCoins(payout, 'Slot Machine Jackpot');
      playBeep(920, 0.25);
      
      const multiplierLabel = multiplier > 0 ? ` (${multiplier}x Multiplier!)` : '';
      setOutcomeMessage(`🔥 JACKPOT WINNER! Received +${payout} 🪙${multiplierLabel}!`);

      onAddNotification({
        type: 'game',
        title: 'Golden Slots Match!',
        description: `Matched keys: ${r1} | ${r2} | ${r3} and scored a payout of ${payout} 🪙.`,
        coinsChange: payout,
      });
    } else {
      playBeep(210, 0.3);
      setOutcomeMessage('No matches completed. Let’s try again!');
    }
    setSpinning(false);
  };

  return (
    <div className="w-full flex flex-col pt-1">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <button onClick={onBack} className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back</span>
        </button>
        <span className="font-bold text-base tracking-wide text-rose-500 flex items-center gap-1.5 drop-shadow-[0_0_8px_rgba(244,63,94,0.2)]">
          <Trophy className="w-4 h-4 text-rose-400" />
          GOLDEN SLOTS
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
          <span className="text-[9px] text-[#FFF]/30 font-bold uppercase tracking-widest block mb-0.5">Spins Placed</span>
          <span className="text-base font-black text-rose-400 font-mono">{totalSpins}</span>
        </div>
        <div className="bg-[#141418] border border-white/5 rounded-2xl p-3 text-center">
          <span className="text-[9px] text-[#FFF]/30 font-bold uppercase tracking-widest block mb-0.5">Coins Won</span>
          <span className="text-base font-black text-yellow-500 font-mono">{totalWon} 🪙</span>
        </div>
      </div>

      {/* REELS BOARD CARD */}
      <div className="bg-gradient-to-b from-[#18181f] to-[#121216] border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col items-center">
        {/* Neon indicators */}
        <div className="flex justify-between w-full px-4 mb-4">
          <div className="flex gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0" />
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse shrink-0" />
          </div>
          <p className="text-[9px] text-zinc-500 font-black tracking-widest uppercase">AUTOMATED DRUM SLOTS</p>
          <div className="flex gap-1.5">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse shrink-0" />
            <span className="w-2 h-2 rounded-full bg-green-500 animate-ping shrink-0" />
          </div>
        </div>

        {/* Reels layout box */}
        <div className="flex justify-center gap-3 w-full max-w-[280px] bg-black/60 p-4 border border-white/5 rounded-2xl shadow-inner mb-5">
          {reels.map((reelItem, index) => (
            <motion.div
              animate={spinning ? { y: [0, -18, 18, 0] } : {}}
              transition={{ repeat: Infinity, duration: 0.12 }}
              key={index}
              className="flex-1 aspect-[3/4] rounded-xl bg-gradient-to-b from-[#18181f] via-black to-[#18181f] border border-white/5 shadow flex items-center justify-center text-4xl select-none"
            >
              {reelItem}
            </motion.div>
          ))}
        </div>

        {/* Outcome dialog message */}
        <p className="text-slate-100 text-xs font-bold text-center max-w-xs px-2 min-h-5 mb-1">
          {outcomeMessage}
        </p>
      </div>

      {/* COIN BETTING CONTROL CONSOLE */}
      <div className="bg-[#141418] border border-white/5 p-4 rounded-3xl mt-4 space-y-3.5">
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/55">Slot Betting Amount</span>
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
                  betAmt === v ? 'border-rose-500 bg-rose-500/10 text-rose-300' : 'border-white/5 bg-white/5 text-white/40'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* DOUBLE ACTION SLOTS */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            onClick={() => startSpinSequence(false)}
            disabled={spinning}
            className="w-full bg-rose-600 hover:bg-rose-500 active:scale-[0.98] transition-all disabled:opacity-40 text-slate-100 py-3 rounded-2xl font-black text-[11px] uppercase tracking-wider shadow-md cursor-pointer"
          >
            SPIN WITH STAKE
          </button>
          <button
            onClick={() => startSpinSequence(true)}
            disabled={spinning}
            className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 active:scale-[0.98] transition-all disabled:opacity-40 text-slate-100 py-3 rounded-2xl font-black text-[11px] uppercase tracking-wider shadow-md cursor-pointer"
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
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-amber-500 to-red-500 animate-pulse" />
              <div className="w-16 h-16 rounded-full bg-rose-500/15 flex items-center justify-center mx-auto mb-4 animate-bounce">
                <PlayCircle className="w-10 h-10 text-rose-400" />
              </div>
              <h3 className="text-slate-100 font-extrabold text-base mb-1.5 uppercase tracking-wider">SLOT SPONSOR AD</h3>
              <p className="text-slate-400 text-xs mb-5">Your slot rolling sequence will begin automatically as soon as this brief ad ends.</p>

              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border-2 border-rose-400 text-rose-400 text-lg font-black font-mono">
                {adCountdown}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
