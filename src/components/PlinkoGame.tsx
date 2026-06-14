import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Play, Sparkles, Volume2, VolumeX, TrendingUp } from 'lucide-react';
import { User, AppNotification } from '../types';

interface PlinkoGameProps {
  user: User;
  onAddCoins: (amt: number, reason: string) => void;
  onDeductCoins: (amt: number, reason: string) => boolean;
  onAddNotification: (notif: Omit<AppNotification, 'id' | 'timestamp'>) => void;
  onBack: () => void;
}

interface PlinkoBall {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  row: number;
  path: number[]; // directions: 0 = left, 1 = right
  history: { x: number; y: number }[];
  isFinished: boolean;
  betAmt: number;
}

export default function PlinkoGame({
  user,
  onAddCoins,
  onDeductCoins,
  onAddNotification,
  onBack,
}: PlinkoGameProps) {
  const [balance, setBalance] = useState(user.coins);
  const [betAmt, setBetAmt] = useState<number>(20);
  const [risk, setRisk] = useState<'low' | 'medium' | 'high'>('medium');
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
  
  // Game stats
  const [ballsLaunched, setBallsLaunched] = useState(0);
  const [totalWon, setTotalWon] = useState(0);

  // Sound ref
  const audioContextRef = useRef<AudioContext | null>(null);

  // Match multipliers based on risk level for 8 rows (9 buckets)
  const multipliers = {
    low: [5.6, 1.6, 1.1, 1.0, 0.5, 1.0, 1.1, 1.6, 5.6],
    medium: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
    high: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29],
  };

  const currentMults = multipliers[risk];

  // Plinko phyiscs loop
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ballsRef = useRef<PlinkoBall[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  const ROWS = 8;
  const PEG_RADIUS = 3.5;
  const BALL_RADIUS = 5.5;

  // Track latest coins in ref to prevent stale closuring
  const balanceRef = useRef(user.coins);
  useEffect(() => {
    balanceRef.current = user.coins;
    setBalance(user.coins);
  }, [user.coins]);

  // Audio synthesize bleeps
  const playPop = (freq = 450, duration = 0.05) => {
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
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  };

  // Peg position calculators
  const getPegs = (width: number, height: number) => {
    const list: { x: number; y: number }[] = [];
    const startY = 40;
    const spacingY = (height - startY - 50) / ROWS;

    for (let r = 0; r <= ROWS; r++) {
      const rowY = startY + r * spacingY;
      // Peg count increases with each row (from 3 pegs to ROWS + 3 pegs)
      const count = r + 3;
      const spacingX = width / (count + 1);
      for (let c = 1; c <= count; c++) {
        list.push({
          x: c * spacingX,
          y: rowY,
        });
      }
    }
    return list;
  };

  // Setup/Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width;
    let height = canvas.height;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Draw Pegs with a subtle shadow
      const pegs = getPegs(width, height);
      ctx.fillStyle = '#ffffff';
      pegs.forEach((p) => {
        ctx.shadowColor = 'rgba(255, 255, 255, 0.1)';
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, PEG_RADIUS, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.shadowBlur = 0; // Reset shadow

      // 2. Draw Multiplier Shelves at the very bottom
      const lastRowY = 40 + ROWS * ((height - 90) / ROWS);
      const bottomY = lastRowY + 30;
      const bucketCount = ROWS + 1; // 9 buckets
      const bucketSpacing = width / bucketCount;

      currentMults.forEach((mult, idx) => {
        const xStart = idx * bucketSpacing + 2;
        const xSize = bucketSpacing - 4;

        // Choose color based on multiplier value
        let bColor = '#ef4444'; // Hot red for jackpot margins
        if (mult === 1.0) bColor = '#3b82f6'; // Neutral
        else if (mult < 1.0) bColor = '#475569'; // Lose/low
        else if (mult < 2.0 && mult > 1.0) bColor = '#a855f7'; // Medium
        else bColor = '#eab308'; // Premium gold / high multiplier

        // Bucket outer box
        ctx.fillStyle = bColor + 'A0'; // semi transparent
        ctx.strokeStyle = bColor;
        ctx.lineWidth = 1;
        
        ctx.beginPath();
        ctx.roundRect(xStart, bottomY - 12, xSize, 22, 5);
        ctx.fill();
        ctx.stroke();

        // Multiplier Text Label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${mult}x`, xStart + xSize / 2, bottomY + 2);
      });

      // 3. Update & Draw Balls
      const activeBalls = ballsRef.current;
      ballsRef.current = activeBalls.filter((ball) => {
        if (ball.isFinished) return false;

        // Gravity pull
        ball.vy += 0.22;
        ball.x += ball.vx;
        ball.y += ball.vy;

        // Bounce dampening
        ball.vx *= 0.98;

        // Track collision with pegs
        pegs.forEach((p) => {
          const dist = Math.hypot(ball.x - p.x, ball.y - p.y);
          if (dist < BALL_RADIUS + PEG_RADIUS) {
            // Push ball slightly away to prevent sticking
            const angle = Math.atan2(ball.y - p.y, ball.x - p.x);
            ball.x = p.x + (BALL_RADIUS + PEG_RADIUS + 0.5) * Math.cos(angle);
            ball.y = p.y + (BALL_RADIUS + PEG_RADIUS + 0.5) * Math.sin(angle);

            // Reflect speeds
            const speed = Math.hypot(ball.vx, ball.vy);
            // Always ensure downward bias
            ball.vx = (Math.random() - 0.5) * 3.5 + Math.cos(angle) * (speed * 0.5);
            ball.vy = Math.abs(Math.sin(angle) * speed * 0.6) + 1.2;

            playPop(300 + Math.random() * 200, 0.04);
          }
        });

        // Boundary controls
        if (ball.x < BALL_RADIUS) {
          ball.x = BALL_RADIUS;
          ball.vx = Math.abs(ball.vx) * 0.6;
        } else if (ball.x > width - BALL_RADIUS) {
          ball.x = width - BALL_RADIUS;
          ball.vx = -Math.abs(ball.vx) * 0.6;
        }

        // Landing condition
        if (ball.y >= bottomY - 5) {
          ball.isFinished = true;
          // Calculate which segment bucket it landed in based on x coordination
          const bucketIdx = Math.floor(ball.x / bucketSpacing);
          const finalIdx = Math.min(bucketCount - 1, Math.max(0, bucketIdx));
          const finalMult = currentMults[finalIdx];
          
          let plinkoReward = 50;
          try {
            const saved = localStorage.getItem('taskx_v1_coin_config');
            if (saved) {
              const parsed = JSON.parse(saved);
              if (parsed.plinkoReward !== undefined) plinkoReward = Number(parsed.plinkoReward);
            }
          } catch (e) {}

          const plinkoScalingFactor = plinkoReward / 50;
          const returns = Math.round(Math.floor(ball.betAmt * finalMult) * plinkoScalingFactor);

          // Payout
          onAddCoins(returns, `Plinko ${risk.toUpperCase()} ${finalMult}x win`);
          setTotalWon((prev) => prev + returns);

          playPop(650, 0.15);
          onAddNotification({
            type: 'game',
            title: `Plinko Multiplied: ${finalMult}x`,
            description: `Dipped ball under ${risk.toUpperCase()} risk for a winning payout of ${returns} 🪙.`,
            coinsChange: returns,
          });

          return false;
        }

        // Draw ball
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        return true;
      });

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [risk, currentMults]);

  const dropBallAction = () => {
    if (onDeductCoins(betAmt, 'Plinko stake drop')) {
      playPop(550, 0.08);
      setBallsLaunched((prev) => prev + 1);

      const canvas = canvasRef.current;
      const initialX = canvas ? canvas.width / 2 + (Math.random() - 0.5) * 16 : 150;

      const newBall: PlinkoBall = {
        id: Date.now() + Math.random(),
        x: initialX,
        y: 15,
        vx: (Math.random() - 0.5) * 1.5,
        vy: 1.0,
        row: 0,
        path: [],
        history: [],
        isFinished: false,
        betAmt: betAmt,
      };

      ballsRef.current.push(newBall);
    }
  };

  return (
    <div className="w-full flex flex-col pt-1">
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <button onClick={onBack} className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back</span>
        </button>
        <span className="font-bold text-base tracking-wide text-yellow-500 flex items-center gap-1.5 drop-shadow-[0_0_8px_rgba(234,179,8,0.2)]">
          <Sparkles className="w-4 h-4 text-yellow-400" />
          MEGA PLINKO
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
          <span className="text-[9px] text-[#FFF]/30 font-bold uppercase tracking-widest block mb-0.5">Balls Dropped</span>
          <span className="text-base font-black text-yellow-400 font-mono">{ballsLaunched}</span>
        </div>
        <div className="bg-[#141418] border border-white/5 rounded-2xl p-3 text-center">
          <span className="text-[9px] text-[#FFF]/30 font-bold uppercase tracking-widest block mb-0.5">Total Won</span>
          <span className="text-base font-black text-emerald-400 font-mono">{totalWon} 🪙</span>
        </div>
      </div>

      {/* DYNAMIC CANVAS PYRAMID */}
      <div className="bg-[#0b0c10] border border-white/5 rounded-3xl p-3.5 shadow-[inset_0_4px_30px_rgba(0,0,0,0.8)] relative flex flex-col items-center">
        {/* Glow behind target */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-yellow-500/5 blur-[50px] pointer-events-none" />
        
        {/* Launch hole marker */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-7 h-1.5 rounded-full bg-white/20 border border-white/10 z-10" />

        <canvas
          ref={canvasRef}
          className="w-full max-w-[320px] aspect-[4/5] bg-transparent"
          width={300}
          height={375}
        />
      </div>

      {/* BET CONTROL OPTIONS */}
      <div className="bg-[#141418] border border-white/5 p-4 rounded-3xl mt-4 space-y-4">
        
        {/* Bet Units adjustment row */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/55">Stake Bet Amount</span>
            <span className="text-[10px] text-yellow-400 font-black">{betAmt} 🪙</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setBetAmt(Math.max(10, betAmt - 10))}
              className="w-9 h-9 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-white font-bold text-sm cursor-pointer"
            >
              -
            </button>
            <div className="flex-1 text-center bg-black/45 hover:bg-black/75 transition-colors border border-white/5 py-1.5 px-3 rounded-xl text-yellow-400 font-black text-sm tracking-wide">
              {betAmt} 🪙
            </div>
            <button
              onClick={() => setBetAmt(betAmt + 10)}
              className="w-9 h-9 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-white font-bold text-sm cursor-pointer"
            >
              +
            </button>
          </div>

          {/* Preset Buttons */}
          <div className="flex gap-1.5 mt-2.5">
            {[20, 50, 100, 200].map((val) => (
              <button
                key={val}
                onClick={() => setBetAmt(val)}
                className={`flex-1 py-1 px-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                  betAmt === val
                    ? 'bg-yellow-500/10 border-yellow-500/35 text-yellow-500'
                    : 'bg-white/5 border-white/5 text-white/40'
                }`}
              >
                {val}
              </button>
            ))}
          </div>
        </div>

        {/* Risk Selection Header option */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/55 block mb-1.5">Risk Multipliers Profile</span>
          <div className="grid grid-cols-3 gap-2">
            {(['low', 'medium', 'high'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRisk(r)}
                className={`py-2 px-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border cursor-pointer ${
                  risk === r
                    ? r === 'low'
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                      : r === 'medium'
                      ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-400'
                      : 'bg-rose-500/15 border-rose-500/40 text-rose-400'
                    : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* SUBMIT ACTION */}
        <button
          onClick={dropBallAction}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-yellow-500 hover:from-yellow-400 to-amber-500 hover:to-amber-400 text-slate-950 font-black text-sm uppercase tracking-widest transition-all shadow-[0_8px_25px_rgba(234,179,8,0.25)] flex items-center justify-center gap-2 cursor-pointer"
        >
          <Play className="w-4 h-4 fill-current text-slate-950" />
          DROP PLINKO BALL
        </button>
      </div>
    </div>
  );
}
