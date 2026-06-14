import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Sparkles, Phone, Lock, User, Mail, Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { User as UserType } from '../types';

interface AuthProps {
  onLoginSuccess: (user: UserType) => void;
}

export default function Auth({ onLoginSuccess }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [tgHandle, setTgHandle] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status message
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isTelegramWeb, setIsTelegramWeb] = useState(false);

  // Detect Telegram WebApp Auto Login
  useEffect(() => {
    // Check if running inside Telegram web app container
    const isTG = !!(window as any).Telegram?.WebApp;
    if (isTG) {
      setIsTelegramWeb(true);
      const webapp = (window as any).Telegram.WebApp;
      webapp.ready();
      webapp.expand();

      const tgUser = webapp.initDataUnsafe?.user;
      if (tgUser) {
        setLoading(true);
        // Auto sign-up/login of Telegram User
        setTimeout(() => {
          const autoUser: UserType = {
            id: `usr_tg_${tgUser.id}`,
            name: `${tgUser.first_name || ''} ${tgUser.last_name || ''}`.trim() || 'Telegram User',
            username: tgUser.username || `tg_${tgUser.id}`,
            email: tgUser.email || `${tgUser.username || tgUser.id}@telegram.com`,
            picture: tgUser.photo_url || 'https://telegram.org/img/t_logo.png',
            coins: 1000, // starting bonus for Telegram members
            joinedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            status: 'Active',
            cvp: '992',
            cardNumber: `54127512${Math.floor(10000000 + Math.random() * 90000000)}`,
            miningStartTime: 0,
          };
          localStorage.setItem('taskx_v1_is_logged_in', 'true');
          localStorage.setItem('taskx_v1_user', JSON.stringify(autoUser));
          onLoginSuccess(autoUser);
          setLoading(false);
        }, 1500);
      }
    }
  }, []);

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic validates
    if (!phone.replace(/\D/g, '')) {
      setError('Please provide a valid Phone Number!');
      return;
    }
    if (password.length < 4) {
      setError('Password must be at least 4 characters long!');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      if (isLogin) {
        // Simple mock validation or retrieve existing user
        const savedUser = localStorage.getItem('taskx_v1_user');
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          // If existing matches email or phone, let them in
          parsed.joinedAt = parsed.joinedAt || new Date().toLocaleDateString();
          localStorage.setItem('taskx_v1_is_logged_in', 'true');
          onLoginSuccess(parsed);
        } else {
          // If no user exists, let them log in anyway by creating a fresh account
          const freshUser: UserType = {
            id: `usr_${Math.floor(100000 + Math.random() * 900000)}`,
            name: 'Sayed Islam',
            username: 'sayed_pro',
            email: 'sayedislam201545@gmail.com',
            picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
            coins: 1250,
            joinedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            status: 'Active',
            cvp: '782',
            cardNumber: '5412751288349402',
            miningStartTime: 0,
            phone: phone || '+8801712345678',
            telegramMobile: tgHandle || '@sayed_pro',
            password: password || 'Sayed@100',
          };
          localStorage.setItem('taskx_v1_is_logged_in', 'true');
          localStorage.setItem('taskx_v1_user', JSON.stringify(freshUser));
          onLoginSuccess(freshUser);
        }
      } else {
        // Registering a newly typed account
        if (!name.trim()) {
          setError('Please write down your Full Name!');
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setError('Passwords do not match!');
          setLoading(false);
          return;
        }

        const registered: UserType = {
          id: `usr_${Math.floor(100000 + Math.random() * 900000)}`,
          name: name.trim(),
          username: tgHandle.toLowerCase().replace('@', '').trim() || 'user_id',
          email: email.trim() || 'member@payout.com',
          picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          coins: 500, // welcome registrars bonus
          joinedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          status: 'Active',
          cvp: `${Math.floor(100 + Math.random() * 900)}`,
          cardNumber: `54127512${Math.floor(10000000 + Math.random() * 90000000)}`,
          miningStartTime: 0,
          phone: phone,
          telegramMobile: tgHandle,
          password: password,
        };

        // --- CHECK REFERRED PENDING REGISTRATIONS ---
        const pendingRefCode = localStorage.getItem('taskx_v1_pending_ref_code');
        if (pendingRefCode) {
          try {
            const pendingDbRaw = localStorage.getItem('taskx_v1_pending_credits_db') || '{}';
            const pendingDb = JSON.parse(pendingDbRaw);
            
            const refKey = pendingRefCode.toUpperCase();
            pendingDb[refKey] = (pendingDb[refKey] || 0) + 250;
            
            if (pendingRefCode.startsWith('usr_')) {
              pendingDb[pendingRefCode] = (pendingDb[pendingRefCode] || 0) + 250;
            }

            localStorage.setItem('taskx_v1_pending_credits_db', JSON.stringify(pendingDb));

            // Record in referrals logs
            const savedRefsRaw = localStorage.getItem('taskx_v1_referrals') || '[]';
            const savedRefs = JSON.parse(savedRefsRaw);
            const newRef = {
              id: `ref_${Date.now()}`,
              name: registered.name,
              username: registered.username,
              joinedAt: registered.joinedAt,
              referrerId: pendingRefCode,
              rewardCoins: 250,
            };
            localStorage.setItem('taskx_v1_referrals', JSON.stringify([...savedRefs, newRef]));

            // Welcome notifications
            const savedNotifsRaw = localStorage.getItem('taskx_v1_notifs') || '[]';
            const savedNotifs = JSON.parse(savedNotifsRaw);
            const refNotif = {
              id: `notif_ref_welcome_${Date.now()}`,
              type: 'system',
              title: 'Referred Welcome Reward Activated',
              description: `Welcome! You successfully signed up via referral invitation.`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            localStorage.setItem('taskx_v1_notifs', JSON.stringify([refNotif, ...savedNotifs]));

            // Consume
            localStorage.removeItem('taskx_v1_pending_ref_code');
          } catch (err) {
            console.error('Error handling registration referral:', err);
          }
        }

        localStorage.setItem('taskx_v1_is_logged_in', 'true');
        localStorage.setItem('taskx_v1_user', JSON.stringify(registered));
        onLoginSuccess(registered);
      }
      setLoading(false);
    }, 1200);
  };

  if (loading && isTelegramWeb) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 px-6 text-slate-100">
        <div className="w-16 h-16 rounded-full bg-blue-500/15 flex items-center justify-center border border-blue-500/20 mb-4 animate-bounce">
          <Send className="w-8 h-8 text-blue-400" />
        </div>
        <h4 className="font-black text-sm uppercase tracking-widest text-slate-300">Telegram Web App</h4>
        <p className="text-xs text-slate-500 font-medium text-center mt-1 animate-pulse">Auto-authenticating user secure credentials...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0C] flex flex-col justify-center items-center px-4 py-8 relative font-sans">
      {/* Background radial highlights */}
      <div className="absolute inset-0 bg-radial-gradient(ellipse at center, rgba(234,179,8,0.03) 0%, transparent 70%) pointer-events-none" />

      <div className="w-full max-w-sm flex flex-col text-center">
        {/* GOALTUBE BRAND LOGO CARD */}
        <div className="mb-6 space-y-1">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-3xl mx-auto flex items-center justify-center shadow-lg shadow-amber-500/10 border border-yellow-300/30">
            <Sparkles className="w-8 h-8 text-slate-950 animate-pulse" />
          </div>
          <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-400 tracking-tight leading-none pt-2 uppercase">
            GOALTUBE BD
          </h2>
          <p className="text-[10px] text-white/40 uppercase tracking-widest font-extrabold font-mono">
            Premium Task & Social Payouts
          </p>
        </div>

        {/* AUTH BOX */}
        <div className="bg-[#121216]/95 border border-white/10 rounded-[28px] p-6 shadow-2xl relative overflow-hidden">
          {/* Top gloss */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-yellow-600" />

          <h3 className="text-lg font-black text-slate-100 uppercase tracking-wide mb-1.5 text-left">
            {isLogin ? 'Welcome Back!' : 'Create Account'}
          </h3>
          <p className="text-xs text-white/40 text-left mb-5">
            {isLogin
              ? 'Provide your phone number to access premium multi-games.'
              : 'Add accurate details to prevent withdrawal claim rejection.'}
          </p>

          {/* Feedback alerts */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-2xl flex items-center gap-2 mb-4 text-left">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span className="text-[10px] text-red-300 font-bold leading-normal">{error}</span>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4 text-left">
            {!isLogin && (
              <div className="space-y-1">
                <label className="text-[10px] tracking-wider text-white/50 uppercase font-black">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="Enter your real full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#0A0A0C] border border-white/5 rounded-2xl pl-11 pr-4 py-3 text-slate-200 text-xs font-semibold focus:border-amber-500 outline-none transition-all"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] tracking-wider text-white/50 uppercase font-black">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="e.g. 017XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#0A0A0C] border border-white/5 rounded-2xl pl-11 pr-4 py-3 text-slate-200 text-xs font-semibold focus:border-amber-500 font-mono outline-none transition-all"
                />
              </div>
            </div>

            {!isLogin && (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] tracking-wider text-white/50 uppercase font-black">Email Address (Optional)</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      placeholder="e.g. sayed@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#0A0A0C] border border-white/5 rounded-2xl pl-11 pr-4 py-3 text-slate-200 text-xs font-semibold focus:border-amber-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] tracking-wider text-white/50 uppercase font-black">Telegram Handle / Code</label>
                  <div className="relative">
                    <Send className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="e.g. @sayed_pro"
                      value={tgHandle}
                      onChange={(e) => setTgHandle(e.target.value)}
                      className="w-full bg-[#0A0A0C] border border-white/5 rounded-2xl pl-11 pr-4 py-3 text-slate-200 text-xs font-semibold focus:border-amber-500 outline-none transition-all font-mono"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1">
              <label className="text-[10px] tracking-wider text-white/50 uppercase font-black">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="Enter secure password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0A0A0C] border border-white/5 rounded-2xl pl-11 pr-4 py-3 text-slate-200 text-xs font-semibold focus:border-amber-500 outline-none transition-all"
                />
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-1">
                <label className="text-[10px] tracking-wider text-white/50 uppercase font-black">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    placeholder="Confirm secure password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-[#0A0A0C] border border-white/5 rounded-2xl pl-11 pr-4 py-3 text-slate-200 text-xs font-semibold focus:border-amber-500 outline-none transition-all"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-black text-xs uppercase tracking-widest rounded-2xl cursor-pointer transition-all active:scale-[0.98] shadow-lg shadow-amber-500/10 flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 text-slate-950 animate-spin" />
                  Processing...
                </>
              ) : isLogin ? (
                'Secure Log In'
              ) : (
                'Register Account'
              )}
            </button>
          </form>

          {/* Toggle link */}
          <div className="mt-5 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              className="text-[10px] tracking-wide font-extrabold text-amber-400 uppercase hover:text-amber-300 cursor-pointer"
            >
              {isLogin ? "DON'T HAVE AN ACCOUNT? REGISTER" : 'ALREADY REGISTERED? LOG IN'}
            </button>
          </div>
        </div>

        {/* SECURE MARK */}
        <div className="mt-6 flex items-center justify-center gap-1.5 text-white/20 text-[9px] font-bold uppercase tracking-widest">
          <Shield className="w-3.5 h-3.5 text-amber-500/30" />
          <span>GOALTUBE BD SECURE SYSTEM SECURITY LICENSE v1.02</span>
        </div>
      </div>
    </div>
  );
}
