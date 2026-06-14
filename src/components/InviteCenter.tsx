import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Gift, 
  Copy, 
  Check, 
  Share2, 
  Award, 
  Coins, 
  ChevronRight, 
  UserPlus, 
  Sparkles, 
  HelpCircle,
  TrendingUp,
  Info,
  ArrowLeft,
  X,
  Search
} from 'lucide-react';
import { User } from '../types';

interface ReferralRecord {
  id: string;
  name: string;
  username: string;
  joinedAt: string;
  referrerId: string;
  rewardCoins: number;
}

interface InviteCenterProps {
  user: User;
  onAddCoins: (amt: number, note: string) => void;
  onAddNotification: (notif: { type: 'task' | 'game' | 'transfer' | 'withdraw' | 'system'; title: string; description: string; coinsChange?: number }) => void;
}

export default function InviteCenter({
  user,
  onAddCoins,
  onAddNotification,
}: InviteCenterProps) {
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showSimAlert, setShowSimAlert] = useState(false);
  const [simulatedName, setSimulatedName] = useState('');
  const [showAllInviteModal, setShowAllInviteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Generate unique referral link
  const refCode = user.id.slice(-8).toUpperCase();
  const referralLink = `${window.location.origin}/?ref=${refCode}`;

  // Load referrals on mount
  useEffect(() => {
    const saved = localStorage.getItem('taskx_v1_referrals');
    if (saved) {
      try {
        const parsed: ReferralRecord[] = JSON.parse(saved);
        // Filter referrals invited by this user
        const filtered = parsed.filter((r) => r.referrerId === user.id || r.referrerId === refCode);
        setReferrals(filtered);
      } catch (err) {
        console.error('Error loading referrals', err);
      }
    }
  }, [user.id, refCode]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(refCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleShareTelegram = () => {
    const text = `Join GoalTube BD, complete simple social sponsor tasks, and earn real wallet payouts! Registered users receive a 500 coin welcome bonus. Join using my referral link:`;
    const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`;
    window.open(tgUrl, '_blank');
  };

  // --- REWARD SIMULATOR ---
  // Generates a mock registration under this user's referral code
  const handleSimulateReferral = () => {
    const mockNames = [
      'Alamin Hossain', 'Arifur Rahman', 'Farhana Yasmin', 'Mehrab Khan', 
      'Tariqul Islam', 'Sultana Razia', 'Ayan Chowdhury', 'Faria Zaman',
      'Kamrul Hasan', 'Nasrin Akter', 'Tanvir Ahmed', 'Sadia Afrin'
    ];
    const mockUsernames = [
      'alamin_bd', 'arif_dhaka', 'farhana_99', 'mehrab_pro',
      'tariq_v1', 'razia_sultana', 'ayan_cyber', 'faria_swe',
      'kamrul_hasan', 'nasrin_cyber', 'tanvir_gold', 'sadia_star'
    ];

    const randIdx = Math.floor(Math.random() * mockNames.length);
    const selectedName = mockNames[randIdx];
    const userName = `${mockUsernames[randIdx]}_${Math.floor(100 + Math.random() * 900)}`;
    const rewardAmt = 250; // standard referral reward

    const newReferral: ReferralRecord = {
      id: `usr_mock_${Date.now()}`,
      name: selectedName,
      username: userName,
      joinedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      referrerId: user.id,
      rewardCoins: rewardAmt
    };

    // Save referral state globally
    const saved = localStorage.getItem('taskx_v1_referrals');
    let allReferrals: ReferralRecord[] = [];
    if (saved) {
      try {
        allReferrals = JSON.parse(saved);
      } catch (err) {
        console.error(err);
      }
    }
    allReferrals.push(newReferral);
    localStorage.setItem('taskx_v1_referrals', JSON.stringify(allReferrals));

    // Update local state
    setReferrals((prev) => [...prev, newReferral]);

    // Reward the user with coins
    onAddCoins(rewardAmt, `Referral Registration Bonus: @${userName}`);

    // Add alert notification
    onAddNotification({
      type: 'task',
      title: '👥 Referral Registered!',
      description: `@${userName} joined using your referral link. Premium bonus of +${rewardAmt} 🪙 released.`,
      coinsChange: rewardAmt
    });

    setSimulatedName(selectedName);
    setShowSimAlert(true);
  };

  // Statistics summaries
  const totalEarned = referrals.reduce((sum, r) => sum + r.rewardCoins, 0);

  return (
    <div className="w-full flex flex-col pt-1 space-y-4 pb-12 text-left">
      {/* Banner / Header Card */}
      <div className="bg-gradient-to-br from-[#1E1B4B] via-[#0F172A] to-[#121216] border border-indigo-500/15 p-5 rounded-3xl relative overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
        {/* Glow highlights */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-2 right-2 bg-purple-500/15 text-purple-300 border border-purple-500/20 text-[8px] font-black tracking-widest uppercase py-1 px-3 rounded-full flex items-center gap-1">
          <Award className="w-2.5 h-2.5 text-purple-400" />
          Earn 250 Coins
        </div>

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <Gift className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <span className="text-[9px] text-purple-400 font-extrabold tracking-wider uppercase block">REFERRAL PLATFORM</span>
            <h3 className="text-sm font-black text-white tracking-tight mt-0.5 leading-snug">
              Invite Friends & Level Up Together!
            </h3>
            <p className="text-[10px] text-slate-400 mt-1 max-w-xs leading-relaxed font-medium">
              Invite your friends to join GoalTube BD and earn a premium bonus of <span className="text-purple-400 font-bold">250 🪙 Coins</span> for every successful registration!
            </p>
          </div>
        </div>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-2 gap-3.5">
        <div className="bg-[#141418] border border-white/5 p-4 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.15)] relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[8px] font-extrabold text-[#94A3B8] tracking-widest uppercase">My Referrals</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-4">
            <span className="text-xl font-mono font-black text-white block leading-none">{referrals.length}</span>
            <span className="text-[9px] text-[#64748B] block font-bold mt-1 uppercase">Friends Joined</span>
          </div>
        </div>

        <div className="bg-[#141418] border border-white/5 p-4 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.15)] relative overflow-hidden flex flex-col justify-between font-sans">
          <div className="flex justify-between items-start">
            <span className="text-[8px] font-extrabold text-[#94A3B8] tracking-widest uppercase">Rewards Earned</span>
            <Coins className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-4">
            <span className="text-xl font-mono font-black text-amber-400 block leading-none">+{totalEarned} 🪙</span>
            <span className="text-[9px] text-[#64748B] block font-bold mt-1 uppercase">Bonus Credits</span>
          </div>
        </div>
      </div>

      {/* Interactive Link Generator Box */}
      <div className="bg-[#141418] border border-white/5 p-5 rounded-[28px] shadow-[0_10px_30px_rgba(0,0,0,0.25)] space-y-4">
        <div className="flex items-center gap-1.5 border-b border-white/5 pb-2.5">
          <Share2 className="w-4 h-4 text-purple-400" />
          <span className="text-[10px] font-black text-slate-200 tracking-wider uppercase">Your Unique Invite Code & URL</span>
        </div>

        {/* 1. SHORT CODE BOX */}
        <div className="space-y-1.5 text-left">
          <span className="text-[8px] text-white/35 font-extrabold uppercase tracking-widest">Share invitation code</span>
          <div className="flex items-center justify-between gap-3 bg-[#0A0A0C] border border-white/10 rounded-2xl p-3 shadow-inner">
            <div className="min-w-0">
              <span className="font-mono font-black text-purple-400 text-sm tracking-wider uppercase block truncate select-all">{refCode}</span>
            </div>
            <button
              onClick={handleCopyCode}
              className="py-1.5 px-3.5 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 text-slate-300 font-bold text-[9px] uppercase tracking-wide cursor-pointer transition-all flex items-center gap-1 shrink-0 active:scale-95"
            >
              {copiedCode ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 2. ENTIRE DIRECT LINK */}
        <div className="space-y-1.5 text-left">
          <span className="text-[8px] text-white/35 font-extrabold uppercase tracking-widest">Direct referral register link</span>
          <div className="flex items-center justify-between gap-3 bg-[#0A0A0C] border border-white/10 rounded-2xl p-3 shadow-inner">
            <div className="min-w-0 flex-1">
              <span className="font-mono font-bold text-slate-300 text-[10px] block break-all truncate font-semibold select-all">
                {referralLink}
              </span>
            </div>
            <button
              onClick={handleCopyLink}
              className="py-1.5 px-3.5 bg-indigo-600/10 border border-indigo-600/20 text-indigo-400 hover:bg-indigo-600/15 font-bold text-[9px] uppercase tracking-wide cursor-pointer transition-all flex items-center gap-1 shrink-0 active:scale-95"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Telegram Direct trigger */}
        <button
          onClick={handleShareTelegram}
          className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:brightness-110 text-white font-black text-[10.5px] uppercase tracking-widest rounded-2xl cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95 select-none"
        >
          <Share2 className="w-3.5 h-3.5 text-white" /> Share with Telegram Friends
        </button>
      </div>

      {/* Referral Program Guidelines Info Box */}
      <div className="bg-[#1C1C24]/40 border border-white/5 rounded-2xl p-3 px-3.5 flex gap-2">
        <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[9px] text-[#94A3B8] leading-normal font-medium">
          <strong className="text-white/60">Referral Policy (Rules):</strong> The invited friend must register a new account using your referral link or code. Once registered, an instant bonus of 250 Coins will be credited to your main balance immediately.
        </p>
      </div>

      {/* List of Joined Referrals Log */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Referred Friends Log ({referrals.length})
          </h4>
          <button
            onClick={() => setShowAllInviteModal(true)}
            className="text-[9px] text-[#A855F7] bg-[#A855F7]/10 hover:bg-[#A855F7]/20 border border-[#A855F7]/20 px-3 py-1 rounded-full font-bold transition-all cursor-pointer active:scale-95"
          >
            All Invite
          </button>
        </div>

        {referrals.length === 0 ? (
          <div className="bg-[#141418] border border-white/5 p-10 text-center rounded-2xl font-sans">
            <Users className="w-8 h-8 text-white/10 mx-auto mb-2" />
            <p className="text-white/30 text-[10.5px] font-bold">No friends have registered using your link yet.</p>
            <p className="text-white/20 text-[9px] mt-1">Copy and send your link above to start generating team level-ups!</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[240px] overflow-y-auto scrollable">
            <AnimatePresence>
              {[...referrals].reverse().map((friend) => (
                <motion.div
                  key={friend.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-[#141418] border border-white/5 p-3 rounded-2xl flex items-center justify-between gap-3 shadow-inner"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                      <UserPlus className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="min-w-0">
                      <h5 className="text-[11px] font-black text-slate-200 truncate leading-tight">{friend.name}</h5>
                      <span className="text-[9px] text-slate-500 font-mono tracking-wide">@{friend.username}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[9px] font-black text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-lg block font-mono">
                      +{friend.rewardCoins} 🪙
                    </span>
                    <span className="text-[8px] text-white/30 block mt-0.5 uppercase font-bold font-mono">
                      {friend.joinedAt}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* SIMULATED CONGRATS POPUP ALERT */}
      <AnimatePresence>
        {showSimAlert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/98 backdrop-blur"
          >
            <div className="bg-[#141418] border-2 border-purple-500/20 p-6 rounded-[32px] w-full max-w-sm text-center relative overflow-hidden shadow-2xl space-y-4">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-500 via-pink-400 to-indigo-500 animate-pulse" />
              
              <div className="w-14 h-14 bg-purple-500/15 border border-purple-500/25 rounded-full flex items-center justify-center mx-auto">
                <Gift className="w-7 h-7 text-purple-400 animate-bounce" />
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-black text-purple-400 uppercase tracking-widest">🎁 Invitation Successful!</h3>
                <h4 className="text-[15px] font-black text-slate-100">{simulatedName} Joined!</h4>
              </div>

              <p className="text-[11.5px] text-slate-300 leading-relaxed font-sans font-medium">
                Congratulations! A new member has registered on GoalTube BD using your unique referral link. A premium bonus of <span className="text-amber-400 font-extrabold">+250 coins</span> has been added to your wallet!
              </p>

              <button
                type="button"
                onClick={() => setShowSimAlert(false)}
                className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl cursor-pointer transition-colors active:scale-95 text-center block select-none font-sans shadow-lg shadow-purple-600/25"
              >
                Claim Coins & Close Dialog
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ALL REFERRALS LIST OVERLAY/MODAL PAGE */}
      <AnimatePresence>
        {showAllInviteModal && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="fixed inset-0 z-50 bg-[#0A0A0C] text-left flex flex-col"
          >
            {/* Header section of All Invite page */}
            <header className="sticky top-0 bg-[#121216]/95 border-b border-white/5 backdrop-blur px-4 py-4 flex items-center gap-3">
              <button
                onClick={() => setShowAllInviteModal(false)}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-slate-300 flex items-center justify-center cursor-pointer border border-white/5"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h3 className="text-sm font-black text-white tracking-tight uppercase">All Referred Users</h3>
                <p className="text-[10px] text-purple-400 font-mono">Total Invited: {referrals.length} active registered</p>
              </div>
            </header>

            {/* List and Search Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-md mx-auto w-full pb-10">
              {/* Search bar */}
              <div className="relative">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search members by username or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-9 py-2.5 bg-[#141418] border border-white/10 rounded-2xl text-slate-200 placeholder:text-slate-500 text-xs font-semibold outline-none focus:border-purple-500 transition-all shadow-inner"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Filtering results */}
              {(() => {
                const query = searchQuery.toLowerCase().trim();
                const filtered = referrals.filter(
                  (f) =>
                    f.name.toLowerCase().includes(query) ||
                    f.username.toLowerCase().includes(query)
                );

                if (filtered.length === 0) {
                  return (
                    <div className="py-16 text-center">
                      <Users className="w-10 h-10 text-white/5 mx-auto mb-2" />
                      <p className="text-white/40 text-xs font-bold">No users found!</p>
                      <p className="text-white/20 text-[10px] mt-1">Try a different spelling or keyword search again.</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-2.5">
                    {[...filtered].reverse().map((friend) => (
                      <motion.div
                        key={friend.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-[#141418] border border-white/5 p-3.5 rounded-2xl flex items-center justify-between gap-3 shadow-inner"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                            <UserPlus className="w-4 h-4 text-purple-400" />
                          </div>
                          <div className="min-w-0">
                            <h5 className="text-[12px] font-black text-slate-100 truncate leading-tight">{friend.name}</h5>
                            <span className="text-[10px] text-slate-500 font-mono tracking-wide">@{friend.username}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] font-black text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-lg block font-mono">
                            +{friend.rewardCoins} 🪙
                          </span>
                          <span className="text-[9px] text-white/30 block mt-0.5 uppercase font-bold font-mono">
                            {friend.joinedAt}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
