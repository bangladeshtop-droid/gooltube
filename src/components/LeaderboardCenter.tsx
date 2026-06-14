import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Users, Zap, Award, Search, TrendingUp, Sparkles, Star } from 'lucide-react';
import { User } from '../types';

interface LeaderboardCenterProps {
  user: User | null;
}

interface ReferRankUser {
  rank: number;
  name: string;
  username: string;
  avatar: string;
  refCount: number;
  earnings: number;
  isMe?: boolean;
}

interface MiningRankUser {
  rank: number;
  name: string;
  username: string;
  avatar: string;
  minedAmount: number;
  activeRate: number; // e.g., coins/hr
  status: 'online' | 'idle';
  isMe?: boolean;
}

export default function LeaderboardCenter({ user }: LeaderboardCenterProps) {
  const [activeSubTab, setActiveSubTab] = useState<'refer' | 'running'>('refer');
  const [searchQuery, setSearchQuery] = useState('');
  const [usersList, setUsersList] = useState<User[]>([]);
  const [rawReferrals, setRawReferrals] = useState<any[]>([]);

  useEffect(() => {
    try {
      const savedUsers = localStorage.getItem('taskx_v1_all_users');
      if (savedUsers) {
        setUsersList(JSON.parse(savedUsers));
      } else if (user) {
        setUsersList([user]);
      }
      const savedRefs = localStorage.getItem('taskx_v1_referrals');
      if (savedRefs) {
        setRawReferrals(JSON.parse(savedRefs));
      }
    } catch (e) {
      console.error('Error loading lists in Leaderboard', e);
    }
  }, [user]);

  // Compute real Refer rankings based on actual accounts in database
  const computedRefersList: ReferRankUser[] = usersList
    .map((u) => {
      // Find referral code: last 8 chars of user ID or match by referrerId === u.id
      const uRefCode = u.id.slice(-8).toUpperCase();
      const count = rawReferrals.filter(
        (r) => r.referrerId === u.id || r.referrerId === uRefCode || r.referrerId === u.username
      ).length;
      return {
        rank: 0,
        name: u.name,
        username: u.username || 'user',
        avatar: u.picture || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
        refCount: count,
        earnings: count * 250,
        isMe: u.id === user?.id,
      };
    })
    .sort((a, b) => b.refCount - a.refCount)
    .map((item, idx) => ({ ...item, rank: idx + 1 }));

  // Compute real Mining/Running rankings based on real coin balances & active tickers
  const computedRunningsList: MiningRankUser[] = usersList
    .map((u) => {
      const isOnline = u.miningStartTime > 0;
      return {
        rank: 0,
        name: u.name,
        username: u.username || 'user',
        avatar: u.picture || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
        minedAmount: u.coins, // Rank by coins in system
        activeRate: isOnline ? 30 : 0,
        status: isOnline ? ('online' as const) : ('idle' as const),
        isMe: u.id === user?.id,
      };
    })
    .sort((a, b) => b.minedAmount - a.minedAmount)
    .map((item, idx) => ({ ...item, rank: idx + 1 }));

  // Search filter
  const filteredRefers = computedRefersList.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRunnings = computedRunningsList.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full flex flex-col pb-24">
      
      {/* HEADER BANNER ZONE */}
      <div className="bg-gradient-to-br from-[#1A1A20] via-[#121216] to-[#141418] border border-white/5 p-4 rounded-3xl text-left relative overflow-hidden mb-4 shadow-lg flex items-center justify-between">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-[40px] rounded-full pointer-events-none" />
        <div>
          <div className="flex items-center gap-1.5 text-purple-400 font-extrabold text-[10px] uppercase tracking-widest mb-1">
            <Sparkles className="w-3.5 h-3.5" /> Stars Arena
          </div>
          <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider">CHAMPIONS LEADERBOARD</h3>
          <p className="text-white/40 text-[10px] mt-1 leading-relaxed max-w-xs">
            Verify top-level partners, run metrics, and verify where your profile sits in our community rankings pool.
          </p>
        </div>
        <div className="w-12 h-12 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-xl shrink-0">
          🏆
        </div>
      </div>

      {/* SEARCH BOX INPUT */}
      <div className="relative mb-4">
        <input
          type="text"
          placeholder="Search member tag..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#141418] border border-white/5 text-slate-200 placeholder-slate-500 rounded-2xl py-3 pl-10 pr-4 text-xs font-medium focus:outline-none focus:border-purple-500/30 transition-all shadow-sm"
        />
        <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
      </div>

      {/* TOP OPTION SWITCH BAR (1. Top Refer, 2. Top Running) */}
      <div className="relative bg-[#141418] border border-white/5 p-1 rounded-2xl flex items-center justify-around mb-4">
        {/* Toggle option: Top Refer */}
        <button
          onClick={() => setActiveSubTab('refer')}
          className="relative flex-1 py-2.5 text-center cursor-pointer select-none transition-all outline-none z-10"
        >
          {activeSubTab === 'refer' && (
            <motion.div
              layoutId="subTabHighlight"
              className="absolute inset-0 bg-purple-600 rounded-xl shadow-[0_4px_15px_rgba(168,85,247,0.3)] border border-purple-500/20"
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            />
          )}
          <span className={`relative text-xs font-extrabold uppercase tracking-widest z-10 flex items-center justify-center gap-1.5 ${
            activeSubTab === 'refer' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
          }`}>
            <Users className="w-4 h-4" /> Top Refer
          </span>
        </button>

        {/* Toggle option: Top Running */}
        <button
          onClick={() => setActiveSubTab('running')}
          className="relative flex-1 py-2.5 text-center cursor-pointer select-none transition-all outline-none z-10"
        >
          {activeSubTab === 'running' && (
            <motion.div
              layoutId="subTabHighlight"
              className="absolute inset-0 bg-purple-600 rounded-xl shadow-[0_4px_15px_rgba(168,85,247,0.3)] border border-purple-500/20"
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            />
          )}
          <span className={`relative text-xs font-extrabold uppercase tracking-widest z-10 flex items-center justify-center gap-1.5 ${
            activeSubTab === 'running' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
          }`}>
            <Zap className="w-4 h-4" /> Top Running
          </span>
        </button>
      </div>

      {/* RANKINGS CONTENT */}
      <div className="bg-[#141418]/50 border border-white/5 rounded-3xl p-3 space-y-2 max-w-md mx-auto w-full">
        <AnimatePresence mode="wait">
          {activeSubTab === 'refer' ? (
            <motion.div
              key="refer-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-1.5"
            >
              <div className="flex justify-between items-center px-2 py-1 text-[9px] font-black uppercase text-slate-500 tracking-wider">
                <span>Rank & User tags</span>
                <span>Referral units</span>
              </div>

              {filteredRefers.map((userObj) => (
                <div
                  key={userObj.rank}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                    userObj.isMe
                      ? 'bg-purple-500/10 border-purple-500/25 shadow-[0_0_15px_rgba(168,85,247,0.1)]'
                      : 'bg-[#141418]/90 border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Rank Indicator */}
                    <div className="w-5 flex justify-center text-center">
                      {userObj.rank === 1 ? (
                        <span className="text-lg">🥇</span>
                      ) : userObj.rank === 2 ? (
                        <span className="text-lg">🥈</span>
                      ) : userObj.rank === 3 ? (
                        <span className="text-lg">🥉</span>
                      ) : (
                        <span className="text-xs font-black text-slate-500 font-mono">#{userObj.rank}</span>
                      )}
                    </div>

                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <img
                        src={userObj.avatar}
                        alt="avatar"
                        className="w-8 h-8 rounded-full border border-white/10 object-cover"
                      />
                      {userObj.isMe && (
                        <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border border-slate-900" />
                      )}
                    </div>

                    {/* Identity Info */}
                    <div className="text-left leading-normal">
                      <span className="text-xs font-black text-slate-200 block flex items-center gap-1">
                        {userObj.name}
                        {userObj.isMe && (
                          <span className="bg-purple-500 text-slate-950 font-black text-[7px] py-[0.5px] px-1.5 rounded-full uppercase tracking-wider scale-90">ME</span>
                        )}
                      </span>
                      <span className="text-[9px] text-slate-500 block">@{userObj.username}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-black text-slate-100 block font-mono">{userObj.refCount.toLocaleString()} refs</span>
                  </div>
                </div>
              ))}

              {filteredRefers.length === 0 && (
                <p className="text-slate-500 text-center py-12 italic text-xs">No matching partners found</p>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="running-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-1.5"
            >
              <div className="flex justify-between items-center px-2 py-1 text-[9px] font-black uppercase text-slate-500 tracking-wider">
                <span>Rank & Active Users</span>
                <span>Mined coins</span>
              </div>

              {filteredRunnings.map((u) => (
                <div
                  key={u.rank}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                    u.isMe
                      ? 'bg-purple-500/10 border-purple-500/25 shadow-[0_0_15px_rgba(168,85,247,0.1)]'
                      : 'bg-[#141418]/90 border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Rank Indicator */}
                    <div className="w-5 flex justify-center text-center">
                      {u.rank === 1 ? (
                        <span className="text-lg">🥇</span>
                      ) : u.rank === 2 ? (
                        <span className="text-lg">🥈</span>
                      ) : u.rank === 3 ? (
                        <span className="text-lg">🥉</span>
                      ) : (
                        <span className="text-xs font-black text-slate-500 font-mono">#{u.rank}</span>
                      )}
                    </div>

                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <img
                        src={u.avatar}
                        alt="avatar"
                        className="w-8 h-8 rounded-full border border-white/10 object-cover"
                      />
                      <span className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-slate-900 ${
                        u.status === 'online' ? 'bg-emerald-500' : 'bg-yellow-400'
                      }`} />
                    </div>

                    {/* Identity Info */}
                    <div className="text-left leading-normal">
                      <span className="text-xs font-black text-slate-200 block flex items-center gap-1">
                        {u.name}
                        {u.isMe && (
                          <span className="bg-purple-500 text-slate-950 font-black text-[7px] py-[0.5px] px-1.5 rounded-full uppercase tracking-wider scale-90">ME</span>
                        )}
                      </span>
                      <span className="text-[9px] text-slate-500 block flex items-center gap-1 font-mono">
                        <TrendingUp className="w-2.5 h-2.5 text-[#10b981]" />
                        {u.activeRate} coins/hr
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-black text-slate-100 block font-mono">{u.minedAmount.toLocaleString()} 🪙</span>
                    <span className={`text-[8px] font-bold block uppercase tracking-wide ${
                      u.status === 'online' ? 'text-emerald-400 animate-pulse' : 'text-slate-500'
                    }`}>
                      {u.status}
                    </span>
                  </div>
                </div>
              ))}

              {filteredRunnings.length === 0 && (
                <p className="text-slate-500 text-center py-12 italic text-xs">No active miners matched</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
