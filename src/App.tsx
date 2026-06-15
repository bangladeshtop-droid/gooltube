import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell,
  Coins,
  Shield,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  Headphones,
  Hammer,
  HelpCircle,
  HelpCircle as SupportIcon,
  MessageCircle,
  FileText,
  ShieldAlert,
  Film,
  Activity,
  Cpu,
  Download,
  ChevronRight,
} from 'lucide-react';
import { User, Task, AppNotification, Transaction, GameID } from './types';
import BottomNavBar from './components/BottomNavBar';
import WalletCard from './components/WalletCard';
import NotificationCenter from './components/NotificationCenter';
import ProfileCenter from './components/ProfileCenter';
import TaskCenter from './components/TaskCenter';
import CrashGame from './components/CrashGame';
import CoinFlipGame from './components/CoinFlipGame';
import SlotMachineGame from './components/SlotMachineGame';
import SpinWheelGame from './components/SpinWheelGame';
import OtherGames from './components/OtherGames';
import PlinkoGame from './components/PlinkoGame';
import LeaderboardCenter from './components/LeaderboardCenter';
import Auth from './components/Auth';
import AdminPanel from './components/AdminPanel';
import BankCardHub from './components/BankCardHub';
import InviteCenter from './components/InviteCenter';
import { playCoinClaimSound } from './utils/audio';

// Initial local seed tasks list
const INITIAL_TASKS: Task[] = [
  {
    id: 'task_youtube_premium',
    title: 'Watch YouTube Short Sponsor',
    taskType: 'watch',
    instructions: 'Open and watch the full video. Wait 4 seconds for immediate claim.',
    rewardCoins: 50,
    imageUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=120&auto=format&fit=crop&q=80',
    targetUrl: 'https://youtube.com',
    buttonLabel: 'Watch and Stream',
  },
  {
    id: 'task_visit_blog',
    title: 'Visit Crypto Partner Blog',
    taskType: 'visit',
    instructions: 'Navigate to our partner site and read the promotional crypto update.',
    rewardCoins: 30,
    imageUrl: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=120&auto=format&fit=crop&q=80',
    targetUrl: 'https://google.com',
    buttonLabel: 'Visit Article',
  },
  {
    id: 'task_register_wallet',
    title: 'Register on AI Trading App',
    taskType: 'registration',
    instructions: 'Create an account on the sponsor’s app. Submit handles & proof screenshots.',
    rewardCoins: 250,
    imageUrl: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=120&auto=format&fit=crop&q=80',
    targetUrl: 'https://github.com',
    buttonLabel: 'Download & Register',
  },
  {
    id: 'task_telegram_group',
    title: 'Join TaskX Pro Community',
    taskType: 'joined',
    instructions: 'Join our public Announcement channel. Submit your handle details for approval.',
    rewardCoins: 120,
    imageUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=120&auto=format&fit=crop&q=80',
    targetUrl: 'https://t.me',
    buttonLabel: 'Join Channel',
  },
  {
    id: 'task_post_review',
    title: 'Write a Trustpilot Review',
    taskType: 'post',
    instructions: 'Submit a five-star review with notes. Provide screenshot confirmation proof.',
    rewardCoins: 180,
    imageUrl: 'https://images.unsplash.com/photo-1552581234-2612b75dc89b?w=120&auto=format&fit=crop&q=80',
    targetUrl: 'https://trustpilot.com',
    buttonLabel: 'Leave Review',
  },
];

import { triggerExternalAds } from './utils';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentTab, setCurrentTab] = useState<string>('home'); // active primary nav tab
  const [activePage, setActivePage] = useState<'main' | 'notification' | 'game_detail' | 'bank_card_hub' | 'admin_panel'>('main');
  const [currentGameId, setCurrentGameId] = useState<GameID | null>(null);

  // Triple-tap secret admin logic
  const [photoTapCount, setPhotoTapCount] = useState<number>(0);
  const [lastPhotoTapTime, setLastPhotoTapTime] = useState<number>(0);
  const [showAdminLogin, setShowAdminLogin] = useState<boolean>(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState<string>('');
  const [adminLoginError, setAdminLoginError] = useState<string>('');
  const [isAdminLoggingIn, setIsAdminLoggingIn] = useState<boolean>(false);

  // Core records lists
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Local Miner progression state
  const [miningSeconds, setMiningSeconds] = useState(0);

  // Simulated ad watch for mining
  const [adRunningForMining, setAdRunningForMining] = useState<'start' | 'claim' | null>(null);
  const [adSecondsForMining, setAdSecondsForMining] = useState(0);

  // Home ad slots cooldown and watch states (Requirement 1 & 3)
  const [homeAdSlotCooldowns, setHomeAdSlotCooldowns] = useState<{[key: number]: number}>({1: 0, 2: 0, 3: 0, 4: 0});
  const [activeAdSlotWatch, setActiveAdSlotWatch] = useState<number | null>(null);
  const [activeAdSlotSeconds, setActiveAdSlotSeconds] = useState<number>(0);

  // Admin Toggles Configuration
  const [adminToggles, setAdminToggles] = useState({
    showCategories: true,
    showGames: true,
    showGameLogos: true,
  });

  useEffect(() => {
    const saved = localStorage.getItem('__admin_toggles_config');
    if (saved) {
      try {
        setAdminToggles(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setHomeAdSlotCooldowns((prev) => {
        const next = { ...prev };
        let changed = false;
        for (const idx of [1, 2, 3, 4]) {
          if (next[idx] > 0) {
            next[idx]--;
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const triggerHomeAdSlotWatch = (slotId: number) => {
    if (homeAdSlotCooldowns[slotId] > 0) return;
    setActiveAdSlotWatch(slotId);
    setActiveAdSlotSeconds(4);
    triggerExternalAds();
    
    let currentCount = 4;
    const adTicker = setInterval(() => {
      currentCount--;
      setActiveAdSlotSeconds(currentCount);
      if (currentCount <= 0) {
        clearInterval(adTicker);
        setActiveAdSlotWatch(null);
        
        // Claim Ad reward! Load homeAdReward configuration from localStorage
        let adReward = 10;
        try {
          const saved = localStorage.getItem('taskx_v1_coin_config');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.homeAdReward !== undefined) adReward = Number(parsed.homeAdReward);
          }
        } catch (e) {}

        addCoins(adReward, `Home Ad Slot #${slotId} Payout`);
        addNotification({
          type: 'game',
          title: `Ad Payout Claimed`,
          description: `Watched partner sponsor stream and collected +${adReward} 🪙!`,
          coinsChange: adReward,
        });

        // Set 60-second cooldown
        setHomeAdSlotCooldowns((old) => ({ ...old, [slotId]: 60 }));
      }
    }, 1000);
  };

  // Detect referral code in URL on launch
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      let refCode = searchParams.get('ref');
      if (!refCode && window.location.hash) {
        // Fallback for SPA hash routing parameter extraction
        const hashQueryStr = window.location.hash.split('?')[1];
        if (hashQueryStr) {
          const hashParams = new URLSearchParams(hashQueryStr);
          refCode = hashParams.get('ref');
        }
      }
      if (refCode) {
        localStorage.setItem('taskx_v1_pending_ref_code', refCode);
        console.log('Referral code captured from window URL:', refCode);
      }
    } catch (err) {
      console.error('Error detecting referral query code', err);
    }
  }, []);

  // Check and claim any pending referral credits when a logged-in user initializes
  useEffect(() => {
    if (!user) return;
    try {
      const pendingDbRaw = localStorage.getItem('taskx_v1_pending_credits_db');
      if (pendingDbRaw) {
        const pendingDb = JSON.parse(pendingDbRaw);
        const shortCode = user.id.slice(-8).toUpperCase();
        const pendingCoinsId = pendingDb[user.id] || 0;
        const pendingCoinsCode = pendingDb[shortCode] || 0;
        const totalPending = pendingCoinsId + pendingCoinsCode;

        if (totalPending > 0) {
          // Add coins to balance
          const updatedCoins = user.coins + totalPending;
          const nextUser = { ...user, coins: updatedCoins };
          setUser(nextUser);
          localStorage.setItem('taskx_v1_user', JSON.stringify(nextUser));

          // Clear reward
          delete pendingDb[user.id];
          delete pendingDb[shortCode];
          localStorage.setItem('taskx_v1_pending_credits_db', JSON.stringify(pendingDb));

          // Log transaction or notification
          const msg = `🎉 Your invited friend joined GoalTube BD! Ref bonus of +${totalPending} 🪙 credited.`;
          addNotification({
            type: 'system',
            title: 'Invite Bonus Credited!',
            description: msg,
            coinsChange: totalPending,
          });

          // Custom visual alert
          alert(msg);
        }
      }
    } catch (err) {
      console.error('Error processing pending referral credits:', err);
    }
  }, [user?.id]);

  // Initialize/Load user data structure from local storage
  useEffect(() => {
    // Check custom and base tasks
    const savedCustomTasks = localStorage.getItem('taskx_v1_custom_tasks');
    if (savedCustomTasks) {
      setTasks(JSON.parse(savedCustomTasks));
    } else {
      setTasks(INITIAL_TASKS);
      localStorage.setItem('taskx_v1_custom_tasks', JSON.stringify(INITIAL_TASKS));
    }

    const isLoggedIn = localStorage.getItem('taskx_v1_is_logged_in') === 'true';
    const savedUser = localStorage.getItem('taskx_v1_user');
    const savedCompleted = localStorage.getItem('taskx_v1_completed_tasks');
    const savedNotifs = localStorage.getItem('taskx_v1_notifs');
    const savedTx = localStorage.getItem('taskx_v1_transactions');

    if (isLoggedIn && savedUser) {
      setUser(JSON.parse(savedUser));
    } else {
      setUser(null);
    }

    if (savedCompleted) {
      setCompletedTaskIds(JSON.parse(savedCompleted));
    }
    if (savedNotifs) {
      setNotifications(JSON.parse(savedNotifs));
    } else {
      const defaultNotifs: AppNotification[] = [
        {
          id: 'n_welcome',
          type: 'system',
          title: 'Welcome to TaskX Pro!',
          description: 'Start completing video and social media tasks to earn coin rewards.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ];
      setNotifications(defaultNotifs);
      localStorage.setItem('taskx_v1_notifs', JSON.stringify(defaultNotifs));
    }
    if (savedTx) {
      setTransactions(JSON.parse(savedTx));
    }
  }, []);

  // Synchronize tasks live whenever user navigates or opens the active task center
  useEffect(() => {
    if (currentTab === 'tasks') {
      const savedCustomTasks = localStorage.getItem('taskx_v1_custom_tasks');
      if (savedCustomTasks) {
        setTasks(JSON.parse(savedCustomTasks));
      }
      const savedCompleted = localStorage.getItem('taskx_v1_completed_tasks');
      if (savedCompleted) {
        setCompletedTaskIds(JSON.parse(savedCompleted));
      }
    }
  }, [currentTab]);

  // Update loop for mining progression
  useEffect(() => {
    if (!user || user.miningStartTime === 0) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - user.miningStartTime) / 1000);
      setMiningSeconds(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [user?.miningStartTime]);

  const handlePhotoTap = () => {
    const now = Date.now();
    if (now - lastPhotoTapTime < 800) {
      const nextCount = photoTapCount + 1;
      setPhotoTapCount(nextCount);
      if (nextCount >= 3) {
        setShowAdminLogin(true);
        setPhotoTapCount(0);
      }
    } else {
      setPhotoTapCount(1);
    }
    setLastPhotoTapTime(now);
  };

  const handleAdminVerifySubmit = (e: FormEvent) => {
    e.preventDefault();
    setAdminLoginError('');
    setIsAdminLoggingIn(true);

    setTimeout(() => {
      const savedPassword = localStorage.getItem('taskx_v1_admin_password') || 'Sayed@100';
      if (adminPasswordInput === savedPassword) {
        setActivePage('admin_panel');
        setShowAdminLogin(false);
        setAdminPasswordInput('');
      } else {
        setAdminLoginError('Incorrect password! Please try again.');
      }
      setIsAdminLoggingIn(false);
    }, 1200);
  };

  const addCoins = (amount: number, reason: string) => {
    if (!user) return;
    const nextUser = { ...user, coins: user.coins + amount };
    setUser(nextUser);
    localStorage.setItem('taskx_v1_user', JSON.stringify(nextUser));

    // Play satisfying coin claim sound
    playCoinClaimSound();

    // Dynamic notification logging
    const newNotif: AppNotification = {
      id: `notif_${Date.now()}`,
      type: 'system',
      title: 'Coins Credited',
      description: `Earned +${amount} 🪙 for: ${reason}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      coinsChange: amount,
    };
    const nextNotifs = [newNotif, ...notifications];
    setNotifications(nextNotifs);
    localStorage.setItem('taskx_v1_notifs', JSON.stringify(nextNotifs));
  };

  const deductCoins = (amount: number, reason: string) => {
    if (!user) return false;
    if (user.coins < amount) {
      alert(`Insufficient funds! You need ${amount} 🪙 to perform this action.`);
      return false;
    }
    const nextUser = { ...user, coins: user.coins - amount };
    setUser(nextUser);
    localStorage.setItem('taskx_v1_user', JSON.stringify(nextUser));

    const newNotif: AppNotification = {
      id: `notif_${Date.now()}`,
      type: 'system',
      title: 'Coins Debited',
      description: `Spent ${amount} 🪙 on: ${reason}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      coinsChange: -amount,
    };
    const nextNotifs = [newNotif, ...notifications];
    setNotifications(nextNotifs);
    localStorage.setItem('taskx_v1_notifs', JSON.stringify(nextNotifs));
    return true;
  };

  const addNotification = (notif: Omit<AppNotification, 'id' | 'timestamp'>) => {
    const isApproved = notif.title.includes('Approved') || notif.title.includes('Profit') || notif.title.includes('Win');
    const newNotif: AppNotification = {
      ...notif,
      id: `notif_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    const next = [newNotif, ...notifications];
    setNotifications(next);
    localStorage.setItem('taskx_v1_notifs', JSON.stringify(next));
  };

  // Mining functions Tap To Mine with mandatory ad watching overlays
  const triggerMiningAdStart = () => {
    if (!user || user.miningStartTime > 0) return;
    setAdRunningForMining('start');
    setAdSecondsForMining(4);
    triggerExternalAds();
    const interval = setInterval(() => {
      setAdSecondsForMining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setAdRunningForMining(null);
          startMiningSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startMiningSession = () => {
    if (!user) return;
    const nextUser = { ...user, miningStartTime: Date.now() };
    setUser(nextUser);
    setMiningSeconds(0);
    localStorage.setItem('taskx_v1_user', JSON.stringify(nextUser));

    addNotification({
      type: 'task',
      title: 'Miner Engaged',
      description: 'You started an active 24H coin mining loop.',
    });
  };

  const triggerMiningAdClaim = () => {
    if (!user || user.miningStartTime === 0) return;
    setAdRunningForMining('claim');
    setAdSecondsForMining(4);
    triggerExternalAds();
    const interval = setInterval(() => {
      setAdSecondsForMining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setAdRunningForMining(null);
          claimMiningYield();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const claimMiningYield = () => {
    if (!user || user.miningStartTime === 0) return;
    // Calculate proportional earnings
    const ratePerSecond = 0.01;
    const earned = Math.floor(miningSeconds * ratePerSecond) + 150; // generous base of 150 + rate

    const nextUser = { ...user, miningStartTime: 0 };
    setUser(nextUser);
    setMiningSeconds(0);
    localStorage.setItem('taskx_v1_user', JSON.stringify(nextUser));

    addCoins(earned, 'Mining Session Yield');
    addNotification({
      type: 'task',
      title: 'Mining Claimed',
      description: `Claimed +${earned} 🪙 from passive mining node.`,
      coinsChange: earned,
    });
  };

  // Task proof uploads submissions handling
  const handleSubmitProof = (taskId: string, imageProofs: string[], note: string) => {
    // Under the new moderated task system, submissions are stored as 'pending'
    // in localStorage and approved by the admin. Real coin release occurs when the user
    // claims after a 1-minute Firebase verification checking process.
    addNotification({
      type: 'task',
      title: 'Proof Submitted Securely',
      description: 'Proof uploaded! Awaiting administrator approval.',
    });
  };

  const handleClaimAdCoins = (taskId: string, rewardAmt: number) => {
    const nextCompleted = [...completedTaskIds, taskId];
    setCompletedTaskIds(nextCompleted);
    localStorage.setItem('taskx_v1_completed_tasks', JSON.stringify(nextCompleted));
    addCoins(rewardAmt, 'Ad task stream bonus');
  };

  const handleClearNotifications = () => {
    setNotifications([]);
    localStorage.setItem('taskx_v1_notifs', JSON.stringify([]));
  };

  const playVIPCrashGame = () => {
    setCurrentGameId('crash');
    setActivePage('game_detail');
  };

  const playCoinFlip = () => {
    setCurrentGameId('coinflip');
    setActivePage('game_detail');
  };

  const playSlotMachine = () => {
    setCurrentGameId('slot');
    setActivePage('game_detail');
  };

  const playSpinWheel = () => {
    setCurrentGameId('spinwheel');
    setActivePage('game_detail');
  };

  const handleOpenGame = (gid: GameID) => {
    setCurrentGameId(gid);
    setActivePage('game_detail');
  };

  if (!user) {
    return (
      <Auth
        onLoginSuccess={(loggedInUser) => {
          setUser(loggedInUser);
          localStorage.setItem('taskx_v1_user', JSON.stringify(loggedInUser));
          localStorage.setItem('taskx_v1_is_logged_in', 'true');
        }}
      />
    );
  }

  if (showAdminLogin) {
    return (
      <div className="min-h-screen bg-[#0A0A0C] text-slate-100 flex flex-col justify-center items-center p-6 relative font-sans">
        {/* Ambient background accent */}
        <div className="absolute inset-0 bg-[#121216] opacity-40 pointer-events-none" />
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-sm bg-[#121216] border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden z-10 text-center"
        >
          {/* Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-600 via-indigo-500 to-emerald-500" />

          <div className="mb-6">
            <div className="w-14 h-14 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 mx-auto mb-3">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-black text-slate-100 tracking-tight uppercase">
              Admin Security Verification
            </h2>
            <p className="text-white/40 text-xs mt-1 leading-relaxed">
              A valid security passcode is required to access systems and resources.
            </p>
          </div>

          <form onSubmit={handleAdminVerifySubmit} className="space-y-4">
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] text-white/30 font-bold uppercase tracking-widest block text-center">
                Enter Security Admin PIN
              </label>
              <input
                type="password"
                required
                autoFocus
                value={adminPasswordInput}
                onChange={(e) => setAdminPasswordInput(e.target.value)}
                placeholder="••••••••••••••"
                className="w-full px-4 py-3 bg-[#0A0A0C] border border-white/10 rounded-xl text-slate-100 text-sm outline-none focus:border-indigo-500 transition-all text-center tracking-widest font-mono"
              />
            </div>

            {adminLoginError && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs py-2.5 px-3 rounded-lg text-center font-bold font-sans"
              >
                {adminLoginError}
              </motion.div>
            )}

            <div className="flex gap-2.5 pt-1.5">
              <button
                type="button"
                onClick={() => {
                  setShowAdminLogin(false);
                  setAdminPasswordInput('');
                  setAdminLoginError('');
                }}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer active:scale-95"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isAdminLoggingIn}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
              >
                {isAdminLoggingIn ? 'Verifying PIN...' : 'Verify Pin'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    );
  }

  const isAdminPage = activePage === 'admin_panel';

  return (
    <div className={`min-h-screen bg-[#0A0A0C] text-slate-100 relative font-sans ${isAdminPage ? 'pb-8' : 'pb-28'}`}>
      {/* GLOBAL TOP HEADER */}
      {!isAdminPage && (
        <header className="sticky top-0 left-0 right-0 max-w-md mx-auto bg-[#121216]/90 border-b border-white/5 backdrop-blur-md px-4 py-3 z-40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src={user.picture || 'https://telegram.org/img/t_logo.png'}
              alt={user.name}
              onClick={handlePhotoTap}
              className="w-9 h-9 rounded-full object-cover border border-white/10 shadow-sm cursor-pointer hover:border-indigo-500/60 hover:scale-105 active:scale-95 transition-all duration-200"
            />
            <div>
              <h1 className="text-xs font-black text-slate-100 tracking-tight leading-none">{user.name}</h1>
            </div>
          </div>


        {/* Action Widgets */}
        <div className="flex items-center gap-3">
          <div className="bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/5 hover:bg-white/10 transition-all">
            <Coins className="w-3.5 h-3.5 text-amber-400 drop-shadow-[0_2px_4px_rgba(250,204,21,0.3)] animate-pulse" />
            <span className="text-xs font-extrabold text-amber-400 font-mono tracking-wide">
              {user.coins.toLocaleString()}
            </span>
          </div>

          <button
            onClick={() => setActivePage('notification')}
            className="w-9 h-9 rounded-xl border border-white/5 bg-white/5 flex items-center justify-center hover:bg-white/10 cursor-pointer relative transition-all"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <Bell className="w-4 h-4 text-slate-300 hover:text-white" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border border-[#121216]">
                {notifications.length}
              </span>
            )}
          </button>
        </div>
      </header>
      )}

      {/* PRIMARY CENTRALIZED CELL AREA */}
      <main className="max-w-md mx-auto px-4 pt-4">
        {activePage === 'notification' ? (
          <NotificationCenter
            notifications={notifications}
            onClearAll={handleClearNotifications}
            onBack={() => setActivePage('main')}
          />
        ) : activePage === 'bank_card_hub' ? (
          <BankCardHub
            user={user}
            onDeductCoins={deductCoins}
            onAddCoins={addCoins}
            onAddNotification={addNotification}
            onBack={() => setActivePage('main')}
          />
        ) : activePage === 'support_hub' ? (
          <div className="space-y-4 text-left">
            {/* Header with back button */}
            <div className="flex items-center gap-3 bg-[#121216]/95 border border-white/5 p-4 rounded-3xl shadow-md">
              <button
                onClick={() => setActivePage('main')}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 hover:bg-[#1A1A22] text-slate-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors active:scale-95"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-sm font-black text-slate-100 tracking-wider">SUPPORT HELP DESK</h2>
                <p className="text-[10px] text-white/40">Official support lines and social channels linked by the Administrator</p>
              </div>
            </div>

            {/* List of Support Links with premium card designs */}
            <div className="space-y-3.5">
              {(() => {
                const saved = localStorage.getItem('taskx_v1_support_links');
                let links = [];
                if (saved) {
                  try {
                    links = JSON.parse(saved);
                  } catch (e) {
                    console.error('Error parsing support links', e);
                  }
                }
                
                if (links.length === 0) {
                  return (
                    <div className="bg-[#141418] border border-white/5 p-12 rounded-3xl text-center">
                      <Headphones className="w-8 h-8 text-white/10 mx-auto mb-2" />
                      <p className="text-white/40 text-[10px] italic">No support links active currently.</p>
                    </div>
                  );
                }

                return links.map((lnk: any) => {
                  const defaultPhoto = lnk.category === 'telegram' 
                    ? 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=120&auto=format&fit=crop&q=80'
                    : lnk.category === 'facebook' || lnk.category === 'group'
                    ? 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=120&auto=format&fit=crop&q=80'
                    : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80';

                  const photo = lnk.photoUrl || defaultPhoto;
                  const buttonLabel = lnk.buttonText || 'Contact Support';

                  return (
                    <div 
                      key={lnk.id} 
                      className="bg-gradient-to-r from-[#141418] to-[#121216] border border-white/5 p-4 rounded-3xl flex items-center gap-4 hover:border-indigo-500/30 transition-all duration-300 shadow-md relative overflow-hidden group"
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-2xl pointer-events-none group-hover:bg-indigo-500/10 transition-colors" />
                      
                      <img 
                        src={photo} 
                        alt={lnk.title} 
                        className="w-14 h-14 rounded-2xl object-cover border border-white/10 shrink-0 shadow-sm"
                      />
                      
                      <div className="grow text-left space-y-1">
                        <span className="text-[8px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider inline-block">
                          {lnk.category || 'Support'}
                        </span>
                        <h4 className="text-xs font-black text-slate-100 group-hover:text-indigo-300 transition-colors">{lnk.title}</h4>
                        {lnk.description && (
                          <p className="text-[10px] text-white/40 leading-snug font-semibold">{lnk.description}</p>
                        )}
                        
                        <div className="pt-2">
                          <a 
                            href={lnk.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer active:scale-95 shadow-md shadow-indigo-600/20"
                          >
                            {buttonLabel}
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        ) : activePage === 'admin_panel' ? (
          <AdminPanel
            user={user}
            tasks={tasks}
            onAddTask={(newTask) => {
              const nextTasks = [...tasks, newTask];
              setTasks(nextTasks);
              localStorage.setItem('taskx_v1_custom_tasks', JSON.stringify(nextTasks));
            }}
            onUpdateTasks={(newTasks) => {
              setTasks(newTasks);
              localStorage.setItem('taskx_v1_custom_tasks', JSON.stringify(newTasks));
            }}
            onAddNotification={addNotification}
            onAddCoins={addCoins}
            onBack={() => setActivePage('main')}
          />
        ) : activePage === 'game_detail' && currentGameId ? (
          currentGameId === 'crash' ? (
            <CrashGame
              user={user}
              onAddCoins={addCoins}
              onDeductCoins={deductCoins}
              onAddNotification={addNotification}
              onBack={() => {
                setActivePage('main');
                setCurrentGameId(null);
              }}
            />
          ) : currentGameId === 'coinflip' ? (
            <CoinFlipGame
              user={user}
              onAddCoins={addCoins}
              onDeductCoins={deductCoins}
              onAddNotification={addNotification}
              onBack={() => {
                setActivePage('main');
                setCurrentGameId(null);
              }}
            />
          ) : currentGameId === 'slot' ? (
            <SlotMachineGame
              user={user}
              onAddCoins={addCoins}
              onDeductCoins={deductCoins}
              onAddNotification={addNotification}
              onBack={() => {
                setActivePage('main');
                setCurrentGameId(null);
              }}
            />
          ) : currentGameId === 'spinwheel' ? (
            <SpinWheelGame
              user={user}
              onAddCoins={addCoins}
              onDeductCoins={deductCoins}
              onAddNotification={addNotification}
              onBack={() => {
                setActivePage('main');
                setCurrentGameId(null);
              }}
            />
          ) : currentGameId === 'plinko' ? (
            <PlinkoGame
              user={user}
              onAddCoins={addCoins}
              onDeductCoins={deductCoins}
              onAddNotification={addNotification}
              onBack={() => {
                setActivePage('main');
                setCurrentGameId(null);
              }}
            />
          ) : (
            <OtherGames
              gameId={currentGameId}
              user={user}
              onAddCoins={addCoins}
              onAddNotification={addNotification}
              onBack={() => {
                setActivePage('main');
                setCurrentGameId(null);
              }}
            />
          )
        ) : (
          <AnimatePresence mode="wait">
            {/* 1. HOME SCREEN TAB VIEW */}
            {currentTab === 'home' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* 3D Bank/Payment Hub Card */}
                <WalletCard 
                  user={user} 
                  onClickChip={() => setActivePage('bank_card_hub')} 
                  onClickSupport={() => setActivePage('support_hub')}
                />

                {/* ACTIVE TEAM SPONSOR AD SLOTS */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h4 className="text-[11px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-400 flex items-center justify-center shadow-[0_0_15px_rgba(251,191,36,0.3)]">
                        <MonitorPlay className="w-3.5 h-3.5 text-black" />
                      </div>
                      Premium Ad Slots
                    </h4>
                    <span className="text-[9px] bg-gradient-to-r from-amber-500/20 to-yellow-500/10 text-amber-400 font-bold border border-amber-500/20 px-2.5 py-1 rounded-full font-mono uppercase tracking-widest flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      Sponsor Vault
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    {[1, 2, 3, 4].map((slotIdx) => {
                      const cooldown = homeAdSlotCooldowns[slotIdx] || 0;
                      return (
                        <div
                          key={slotIdx}
                          onClick={() => cooldown === 0 && triggerHomeAdSlotWatch(slotIdx)}
                          className={`relative rounded-[24px] overflow-hidden flex flex-col transition-all duration-300 select-none ${
                            cooldown > 0
                              ? 'bg-[#121216] border border-white/5 opacity-50 cursor-not-allowed grayscale'
                              : 'bg-gradient-to-br from-[#1a1a24] to-[#121216] border border-amber-500/30 hover:border-amber-400 cursor-pointer shadow-[0_8px_30px_rgba(251,191,36,0.1)] active:scale-95 group'
                          }`}
                        >
                          {!cooldown && (
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 pointer-events-none mix-blend-overlay" />
                          )}
                          {!cooldown && (
                            <div className="absolute -inset-x-8 top-0 h-10 bg-gradient-to-b from-amber-500/20 to-transparent opacity-50 group-hover:opacity-100 transition-opacity blur-md" />
                          )}
                          
                          {/* Ad Visual Layer */}
                          <div className="h-24 w-full relative bg-[#05050A] flex items-center justify-center overflow-hidden">
                            {cooldown > 0 ? (
                               <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center backdrop-blur-md z-10">
                                  <Lock className="w-5 h-5 text-white/30 mb-1" />
                                  <span className="text-[10px] font-black tracking-widest text-white/50 border border-white/10 bg-white/5 px-3 py-1 rounded-full uppercase">
                                    {cooldown}s Wait
                                  </span>
                               </div>
                            ) : (
                               <>
                                 <div className="absolute inset-0 bg-gradient-to-br from-amber-600/20 via-yellow-500/10 to-transparent group-hover:scale-110 transition-transform duration-700" />
                                 <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors shadow-[0_0_20px_rgba(251,191,36,0.15)] relative z-10 border border-amber-500/20">
                                   <PlayCircle className="w-6 h-6 text-amber-400 group-hover:scale-110 group-hover:text-amber-300 transition-all drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
                                 </div>
                               </>
                            )}
                          </div>
                          
                          <div className="p-3 text-center flex flex-col justify-center relative z-10 border-t border-white/5 bg-[#0A0A0E] backdrop-blur">
                            <h5 className="text-[11px] font-black text-slate-100 uppercase tracking-widest">Sponsored #{slotIdx}</h5>
                            {cooldown > 0 ? (
                               <span className="text-[9px] text-[#ff4c4c] font-mono font-bold mt-1 block tracking-wider">Cooldown active</span>
                            ) : (
                               <span className="text-[9.5px] text-amber-400 font-bold mt-1 flex items-center justify-center gap-1 uppercase tracking-wider group-hover:text-amber-300 transition-colors">
                                 Watch & Earn <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                               </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* 2. GAME SECTOR GRID (Moved from Homepage as requested) */}
            {currentTab === 'game' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[#FFF]/30">Games Room</h3>
                  <span className="text-[10px] text-[#ffb020] font-bold bg-[#ffb020]/10 border border-[#ffb020]/25 px-2.5 py-0.5 rounded-full">
                    Sponsoring Entertainment
                  </span>
                </div>

                {/* ACTIVE MINER ENGINES (Moved to Games page) */}
                <div className="relative group rounded-3xl overflow-hidden p-[1px]">
                  <div className={`absolute inset-0 bg-gradient-to-b ${user.miningStartTime > 0 ? 'from-indigo-500/50 via-amber-400/20 to-transparent animate-pulse' : 'from-slate-700/50 to-transparent'}`} />
                  <div className="bg-[#0b0b0f] relative rounded-[23px] p-6 shadow-2xl flex flex-col items-center justify-center text-center overflow-hidden h-full z-10 font-sans border border-white/5 backdrop-blur-xl">
                    <div className="absolute top-0 inset-x-0 h-[100px] bg-indigo-500/10 blur-[50px] -z-10" />
                    
                    {/* Visual CPU Node */}
                    <div className="w-20 h-20 mb-5 relative flex items-center justify-center">
                       {user.miningStartTime > 0 && <div className="absolute inset-0 bg-indigo-600/20 blur-xl rounded-full animate-pulse" />}
                       <div className={`w-full h-full rounded-[18px] border-2 flex items-center justify-center bg-[#15151a] relative z-10 transition-colors duration-500 ${user.miningStartTime > 0 ? 'border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.4)]' : 'border-slate-800'}`}>
                         <Cpu className={`w-8 h-8 transition-colors duration-500 ${user.miningStartTime > 0 ? 'text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.8)] animate-pulse' : 'text-slate-600'}`} />
                         {user.miningStartTime > 0 && (
                            <svg className="absolute inset-[-4px] w-[calc(100%+8px)] h-[calc(100%+8px)] rotate-90 animate-[spin_4s_linear_infinite]" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="1" className="text-indigo-500/30 font-mono" strokeDasharray="20 10" />
                            </svg>
                         )}
                       </div>
                    </div>

                    {user.miningStartTime === 0 ? (
                      <>
                        <h4 className="text-sm font-black text-slate-100 uppercase tracking-widest drop-shadow-md">Passive Mining Node</h4>
                        <p className="text-slate-400 text-[11px] mt-2 mb-6 max-w-xs leading-relaxed">
                          Initialize cloud computational stream. Generate passive income continuously for 24 hours.
                        </p>
                        <button
                          onClick={triggerMiningAdStart}
                          className="w-full relative py-3.5 px-6 rounded-2xl overflow-hidden group cursor-pointer active:scale-95 transition-all shadow-[0_0_20px_rgba(79,70,229,0.2)]"
                        >
                           <div className="absolute inset-0 bg-gradient-to-r from-indigo-700 to-indigo-500 hover:from-indigo-600 hover:to-indigo-400 transition-colors" />
                           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay pointer-events-none" />
                           <span className="relative z-10 text-white font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 drop-shadow-md">
                              <Hammer className="w-3.5 h-3.5" /> Initialize Run
                           </span>
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                          <h4 className="text-[11px] font-black text-emerald-400 uppercase tracking-widest">Node Active (24H)</h4>
                        </div>
                        
                        <div className="my-5 w-full">
                           <div className="bg-[#050508] border border-white/5 rounded-2xl p-4 flex flex-col shadow-inner relative overflow-hidden">
                             <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                               <Activity className="w-24 h-24" />
                             </div>
                             
                             <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black text-left mb-1">Time Remaining</span>
                             <span className="text-3xl font-black text-slate-100 font-mono tracking-wider text-left tabular-nums bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
                               {(() => {
                                 const remaining = Math.max(0, 86400 - miningSeconds);
                                 const hrs = Math.floor(remaining / 3600);
                                 const mins = Math.floor((remaining % 3600) / 60);
                                 const secs = remaining % 60;
                                 return [
                                   hrs.toString().padStart(2, '0'),
                                   mins.toString().padStart(2, '0'),
                                   secs.toString().padStart(2, '0')
                                 ].join(':');
                               })()}
                             </span>

                             <div className="h-1.5 w-full bg-[#121216] rounded-full mt-4 overflow-hidden relative border border-white/5">
                               <div 
                                 className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 shadow-[0_0_10px_rgba(79,70,229,0.5)] transition-all duration-1000" 
                                 style={{ width: `${(miningSeconds / 86400) * 100}%` }}
                               />
                             </div>
                             <div className="flex justify-between items-center mt-2">
                               <span className="text-[9px] text-slate-500 font-mono">Hashrate: 1.2 GH/s</span>
                               <span className="text-[9px] text-slate-400 font-bold">Yield: <span className="text-amber-400">+{((miningSeconds * 0.01) || 0).toFixed(2)}</span></span>
                             </div>
                           </div>
                        </div>

                        <button
                          onClick={triggerMiningAdClaim}
                          className="w-full relative py-3.5 px-6 rounded-2xl overflow-hidden group cursor-pointer active:scale-95 transition-all shadow-[0_0_20px_rgba(251,191,36,0.15)]"
                        >
                          <div className="absolute inset-0 bg-gradient-to-b from-amber-500 to-amber-600 group-hover:from-amber-400 group-hover:to-amber-500 transition-colors" />
                          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay pointer-events-none" />
                          <span className="relative z-10 text-slate-950 font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2">
                             <Download className="w-3.5 h-3.5" /> Claim Yield & Reset
                          </span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Premium Active Quick Launch Columns - Exact 2 Items Per Row */}
                {adminToggles.showGames !== false && (
                  <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'mining', name: 'VIP Rocket Crash', subtitle: 'AXIS CRASH', icon: '🚀', color: 'text-[#FF4C4C]', action: playVIPCrashGame },
                    { id: 'coin', name: 'Coin Multiplier', subtitle: 'SPEED FLIP', icon: '🪙', color: 'text-amber-500', action: playCoinFlip },
                    { id: 'slot', name: 'Golden Slots', subtitle: 'AD ROLL SPINS', icon: '🎰', color: 'text-rose-500', action: playSlotMachine },
                    { id: 'spin', name: 'Spin Multiplier', subtitle: 'CHOOSE MULTIPLIER', icon: '🎡', color: 'text-indigo-400', action: playSpinWheel },
                    { id: 'plinko', name: 'Mega Plinko', subtitle: 'PHYSICS DROP', icon: '🟢', color: 'text-emerald-400', action: () => handleOpenGame('plinko') },
                    { id: 'color', name: 'Color Match', subtitle: 'MATCH SHADES', icon: '🎨', color: 'text-indigo-400', action: () => handleOpenGame('color') },
                    { id: 'memory', name: 'Memory Matrix', subtitle: 'BRAIN BOOSTER', icon: '🧠', color: 'text-yellow-500', action: () => handleOpenGame('memory') },
                    { id: 'ttt', name: 'TicTacToe', subtitle: 'DUEL BOT', icon: '❌', color: 'text-purple-400', action: () => handleOpenGame('ttt') },
                    { id: 'match3', name: 'Match-3 Quest', subtitle: 'JEWELS BLAST', icon: '💎', color: 'text-pink-500', action: () => handleOpenGame('match3') },
                    { id: 'luckybox', name: 'Loot Box', subtitle: 'GOLD REVEAL', icon: '📦', color: 'text-[#ffb020]', action: () => handleOpenGame('luckybox') },
                    { id: 'quiz', name: 'Trivia Quiz', subtitle: 'MIND EARN', icon: '💡', color: 'text-emerald-500', action: () => handleOpenGame('quiz') },
                    { id: 'rps', name: 'Rock Paper Scissor', subtitle: 'RPS DUEL', icon: '✌️', color: 'text-amber-500', action: () => handleOpenGame('rps') },
                    { id: 'ad', name: 'Watch Ads', subtitle: 'AD REWARD', icon: '🎬', color: 'text-indigo-400', action: () => handleOpenGame('ad') },
                  ].filter(game => {
                     const conf = JSON.parse(localStorage.getItem('__taskx_game_toggles') || '{}');
                     return conf[game.id] !== false;
                  }).map(game => {
                     const logs = JSON.parse(localStorage.getItem('__taskx_game_logos') || '{}');
                     const customLogo = logs[game.id];
                     
                     return (
                        <div
                          key={game.id}
                          onClick={game.action}
                          className="bg-[#141418] hover:bg-[#18181f] border border-white/5 hover:border-white/10 rounded-3xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:scale-[1.02] shadow-[0_10px_30px_rgba(0,0,0,0.3)] relative overflow-hidden"
                        >
                          {customLogo ? (
                             <img src={customLogo} alt={game.name} className="w-10 h-10 mb-2 rounded-xl object-cover shadow-lg" />
                          ) : (
                             <span className="text-3xl mb-1.5">{game.icon}</span>
                          )}
                          <h4 className="text-xs font-black text-slate-100">{game.name}</h4>
                          <span className={`text-[8px] ${game.color} font-extrabold mt-1 uppercase`}>{game.subtitle}</span>
                        </div>
                     );
                  })}
                  </div>
                )}
              </motion.div>
            )}

            {/* 3. TASK ROOM VIEW */}
            {currentTab === 'tasks' && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
              >
                <TaskCenter
                  user={user}
                  tasks={tasks}
                  completedTaskIds={completedTaskIds}
                  onSubmitProof={handleSubmitProof}
                  onClaimAdCoins={handleClaimAdCoins}
                  onBack={() => {}}
                />
              </motion.div>
            )}

            {/* 4. LEADERBOARDS ROADMAP VIEW */}
            {currentTab === 'leaderboard' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
              >
                <LeaderboardCenter user={user} />
              </motion.div>
            )}

            {/* 5. PROFILE MANAGER TAB VIEW */}
            {currentTab === 'profile' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <ProfileCenter
                  user={user}
                  isAdmin={user?.id === 'usr_admin' || user?.username === 'sayed_pro' || user?.email === 'sayedislam201545@gmail.com'}
                  onUpdatePhoto={(url) => {
                    const next = { ...user, picture: url };
                    setUser(next);
                    localStorage.setItem('taskx_v1_user', JSON.stringify(next));
                  }}
                  onClickAdmin={() => {
                    setActivePage('admin_panel');
                  }}
                  onLogout={() => {
                    localStorage.removeItem('taskx_v1_user');
                    localStorage.setItem('taskx_v1_is_logged_in', 'false');
                    setUser(null);
                    setCurrentTab('home');
                    setActivePage('main');
                  }}
                  onAddCoins={addCoins}
                  onAddNotification={addNotification}
                />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>

      {/* FIXED BOTTOM NAVIGATOR CONTAINER */}
      {!isAdminPage && (
        <BottomNavBar currentTab={currentTab} onChangeTab={setCurrentTab} />
      )}

      {/* Interactive Miner Ad Watching Overlay Gateway */}
      <AnimatePresence>
        {adRunningForMining !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0A0A0C]/95 backdrop-blur-xl z-50 flex flex-col items-center justify-center p-6 text-center select-none"
          >
            <div className="max-w-xs space-y-6 animate-pulse">
              {/* Spinning sponsor gold coin element */}
              <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-500 animate-spin opacity-30 blur-md" />
                <div className="w-24 h-24 rounded-full bg-[#141418] border-2 border-amber-400/40 flex items-center justify-center shadow-lg relative">
                  <span className="text-4xl animate-bounce">💎</span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] text-[#ffb020] font-bold bg-[#ffb020]/10 border border-[#ffb020]/25 px-2.5 py-0.5 rounded-full block w-fit mx-auto tracking-widest uppercase">
                  SPONSOR DISCOVERY AD
                </span>
                <h3 className="text-sm font-black text-slate-100 tracking-tight leading-tight">
                  {adRunningForMining === 'start' 
                    ? 'Synchronizing Neural Hash Node...' 
                    : 'Unlocking Secure Yield Coins...'}
                </h3>
                <p className="text-[10px] text-white/40 leading-normal">
                  Our network nodes require secure verification. Please stand by for sponsor authentication.
                </p>
              </div>

              {/* Progress Count Badge */}
              <div className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/5 border border-white/5 rounded-2xl">
                <span className="text-xs font-black font-mono text-slate-100">
                  SECURE TIMEOUT: {adSecondsForMining}s
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interactive Home Ad Slot Watching Overlay (Requirement 3) */}
      <AnimatePresence>
        {activeAdSlotWatch !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0A0A0C]/95 backdrop-blur-xl z-50 flex flex-col items-center justify-center p-6 text-center select-none"
          >
            <div className="max-w-xs space-y-6 animate-pulse">
              {/* Spinning sponsor cinema ad element */}
              <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#ffb020] via-indigo-400 to-[#ffb020] animate-spin opacity-30 blur-md" />
                <div className="w-24 h-24 rounded-full bg-[#141418] border-2 border-indigo-400/40 flex items-center justify-center shadow-lg relative">
                  <span className="text-4xl animate-bounce">🎬</span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] text-indigo-400 font-bold bg-indigo-500/10 border border-indigo-500/25 px-2.5 py-0.5 rounded-full block w-fit mx-auto tracking-widest uppercase">
                  SPONSOR STREAM AD
                </span>
                <h3 className="text-sm font-black text-slate-100 tracking-tight leading-tight">
                  Streaming Sponsor Ad Slot #{activeAdSlotWatch}...
                </h3>
                <p className="text-[10px] text-white/40 leading-normal">
                  Your reward is being compiled securely. Do not close this session.
                </p>
              </div>

              {/* Progress Count Badge */}
              <div className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/5 border border-white/5 rounded-2xl">
                <span className="text-xs font-black font-mono text-slate-100">
                  SECURE TIMEOUT: {activeAdSlotSeconds}s
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LoaderSpinner() {
  return (
    <div className="text-center space-y-3">
      <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
      <p className="text-xs font-bold tracking-wider text-slate-500 uppercase animate-pulse">Launching App Engine</p>
    </div>
  );
}
