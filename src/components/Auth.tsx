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
    try {
      // Check if running inside Telegram web app container
      const webapp = (window as any).Telegram?.WebApp;
      if (webapp) {
        // Wrap in try catch as some old clients (version 6.0) throw CloudStorage unsupported errors
        try {
          webapp.ready();
          webapp.expand();
        } catch (e) {}

      try {
        let deviceId = localStorage.getItem('taskx_v1_device_id');
        if (!deviceId) {
          deviceId = `dev_${Date.now()}_${Math.random()}`;
          localStorage.setItem('taskx_v1_device_id', deviceId);
        }

        const registeredDevicesStr = localStorage.getItem('taskx_v1_registered_devices') || '{}';
        const registeredDevices = JSON.parse(registeredDevicesStr);

        // Telegram WebApp Auto Login Duplicate Checks
        const tgUser = webapp.initDataUnsafe?.user;
        if (tgUser) {
          setIsTelegramWeb(true);
          setLoading(true);

          if (registeredDevices[deviceId] && registeredDevices[deviceId] !== `usr_tg_${tgUser.id}`) {
             setError('Security Alert: Sub-accounts or multiple accounts are strictly not allowed on a single device! You can only use one account per phone.');
             setLoading(false);
             return;
          }

          // Auto sign-up/login of Telegram User
          setTimeout(() => {
            const autoUser: UserType = {
              id: `usr_tg_${tgUser.id}`,
              name: `${tgUser.first_name || ''} ${tgUser.last_name || ''}`.trim() || 'Telegram User',
              username: tgUser.username || `tg_${tgUser.id}`,
              email: tgUser.email || `${tgUser.username || tgUser.id}@telegram.com`,
              picture: tgUser.photo_url || 'https://telegram.org/img/t_logo.png',
              coins: 1000,
              joinedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              status: 'Active',
              cvp: '992',
              cardNumber: `54127512${Math.floor(10000000 + Math.random() * 90000000)}`,
              miningStartTime: 0,
            };
            
            registeredDevices[deviceId] = autoUser.id;
            localStorage.setItem('taskx_v1_registered_devices', JSON.stringify(registeredDevices));

            localStorage.setItem('taskx_v1_is_logged_in', 'true');
            localStorage.setItem('taskx_v1_user', JSON.stringify(autoUser));
            onLoginSuccess(autoUser);
            setLoading(false);
          }, 1500);
        }
      } catch (err) {}
      }
    } catch (e) {
      console.warn("Telegram init fail:", e);
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

        try {
          let deviceId = localStorage.getItem('taskx_v1_device_id');
          if (!deviceId) {
            deviceId = `dev_${Date.now()}_${Math.random()}`;
            localStorage.setItem('taskx_v1_device_id', deviceId);
          }

          const registeredDevicesStr = localStorage.getItem('taskx_v1_registered_devices') || '{}';
          const registeredDevices = JSON.parse(registeredDevicesStr);

          if (registeredDevices[deviceId]) {
             setError('Security Alert: Sub-accounts or multiple accounts are strictly not allowed on a single device! You can only use one account per phone.');
             setLoading(false);
             return;
          }
        } catch (e) { console.error('Device validation DB error', e); }

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

        try {
          const deviceId = localStorage.getItem('taskx_v1_device_id');
          if (deviceId) {
            const registeredDevicesStr = localStorage.getItem('taskx_v1_registered_devices') || '{}';
            const registeredDevices = JSON.parse(registeredDevicesStr);
            registeredDevices[deviceId] = registered.id;
            localStorage.setItem('taskx_v1_registered_devices', JSON.stringify(registeredDevices));
          }
        } catch (e) {}

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
    <div className="min-h-screen bg-[#05050A] flex flex-col justify-center items-center px-4 py-8 relative font-sans overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[100px] animate-pulse pointer-events-none" />
      <div className="absolute top-[30%] left-[20%] w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none mix-blend-overlay" />

      <div className="w-full max-w-sm flex flex-col text-center relative z-10">
        {/* BRAND LOGO CARD */}
        <div className="mb-8 flex flex-col items-center">
          <div className="w-20 h-20 bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-300 rounded-[24px] flex items-center justify-center shadow-[0_0_40px_rgba(251,191,36,0.3)] mb-4 relative overflow-hidden group">
            <div className="absolute inset-0 bg-white/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <Sparkles className="w-10 h-10 text-slate-950 animate-pulse relative z-10" />
          </div>
          <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-white to-amber-200 tracking-tight leading-none uppercase">
            GOALTUBE BD
          </h2>
          <p className="text-[10px] text-amber-500/70 uppercase tracking-widest font-black font-mono mt-2 mb-2 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
            Premium Task & Social Payouts
          </p>
        </div>

        {/* AUTH BOX */}
        <div className="bg-[#0b0b12]/90 backdrop-blur-2xl border border-white/5 rounded-[32px] p-7 shadow-2xl relative">
          <div className="absolute top-0 inset-x-8 h-[1px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />

          <div className="text-left mb-6">
             <h3 className="text-xl font-black text-white uppercase tracking-wider">
               {isLogin ? 'SECURE LOGIN' : 'CREATE ACCOUNT'}
             </h3>
             <p className="text-[11px] font-semibold text-white/40 mt-1.5 leading-relaxed">
               {isLogin
                 ? 'Access your unified Goaltube dashboard and earn premium rewards instantly.'
                 : 'Register one account per device. Duplicate accounts will be automatically banned.'}
             </p>
          </div>

          {/* Feedback alerts */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-3.5 rounded-2xl flex items-start gap-2 mb-5 text-left shadow-inner">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span className="text-[11px] text-red-300 font-bold leading-normal">{error}</span>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4 text-left">
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-[9px] tracking-widest text-white/40 uppercase font-bold pl-1">Full Name</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="w-4 h-4 text-slate-500 group-focus-within:text-amber-400 transition-colors" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="E.g. Sayed Islam"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#15151a] border border-white/5 rounded-2xl pl-11 pr-4 py-3.5 text-slate-100 text-[13px] font-semibold focus:border-amber-500 focus:bg-[#1a1a24] outline-none transition-all shadow-inner"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[9px] tracking-widest text-white/40 uppercase font-bold pl-1">Phone Number</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Phone className="w-4 h-4 text-slate-500 group-focus-within:text-amber-400 transition-colors" />
                </div>
                <input
                  type="tel"
                  required
                  placeholder="017XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#15151a] border border-white/5 rounded-2xl pl-11 pr-4 py-3.5 text-slate-100 text-[13px] font-semibold focus:border-amber-500 focus:bg-[#1a1a24] outline-none transition-all font-mono shadow-inner"
                />
              </div>
            </div>

            {!isLogin && (
              <>
                <div className="space-y-1.5">
                  <label className="text-[9px] tracking-widest text-white/40 uppercase font-bold pl-1">Telegram / Social Handle</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Send className="w-4 h-4 text-slate-500 group-focus-within:text-amber-400 transition-colors" />
                    </div>
                    <input
                      type="text"
                      placeholder="@username"
                      value={tgHandle}
                      onChange={(e) => setTgHandle(e.target.value)}
                      className="w-full bg-[#15151a] border border-white/5 rounded-2xl pl-11 pr-4 py-3.5 text-slate-100 text-[13px] font-semibold focus:border-amber-500 focus:bg-[#1a1a24] outline-none transition-all font-mono shadow-inner"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <label className="text-[9px] tracking-widest text-white/40 uppercase font-bold pl-1">Secure Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-slate-500 group-focus-within:text-amber-400 transition-colors" />
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#15151a] border border-white/5 rounded-2xl pl-11 pr-4 py-3.5 text-slate-100 text-[13px] font-semibold focus:border-amber-500 focus:bg-[#1a1a24] outline-none transition-all shadow-inner tracking-widest"
                />
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-[9px] tracking-widest text-white/40 uppercase font-bold pl-1">Confirm Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <CheckCircle2 className="w-4 h-4 text-slate-500 group-focus-within:text-amber-400 transition-colors" />
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-[#15151a] border border-white/5 rounded-2xl pl-11 pr-4 py-3.5 text-slate-100 text-[13px] font-semibold focus:border-amber-500 focus:bg-[#1a1a24] outline-none transition-all shadow-inner tracking-widest"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full relative py-4 rounded-2xl overflow-hidden group cursor-pointer active:scale-95 transition-all shadow-[0_0_20px_rgba(251,191,36,0.15)] mt-3"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-amber-400 to-amber-600 group-hover:from-amber-300 group-hover:to-amber-500 transition-colors" />
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-overlay pointer-events-none" />
              <div className="relative z-10 flex items-center justify-center gap-2">
                 {loading ? (
                   <>
                     <Loader2 className="w-4 h-4 text-amber-950 animate-spin" />
                     <span className="text-amber-950 font-black text-xs uppercase tracking-widest drop-shadow-sm">Processing...</span>
                   </>
                 ) : (
                   <span className="text-amber-950 font-black text-xs uppercase tracking-widest drop-shadow-sm flex items-center gap-2">
                     {isLogin ? <Lock className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                     {isLogin ? 'Secure Authenticate' : 'Register System'}
                   </span>
                 )}
              </div>
            </button>
          </form>

          {/* Toggle link */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
                setPhone('');
                setPassword('');
                setConfirmPassword('');
              }}
              className="text-[10px] tracking-wider font-bold text-slate-400 uppercase hover:text-amber-400 cursor-pointer transition-colors"
            >
              {isLogin ? "New user? Create a profile" : 'Already have an account? Log In'}
            </button>
          </div>
        </div>

        {/* SECURE MARK */}
        <div className="mt-8 flex items-center justify-center gap-2 text-white/20 text-[9px] font-bold uppercase tracking-widest mb-10">
          <Shield className="w-4 h-4 text-emerald-500/40" />
          <span>GOALTUBE SECURE PRO v1.05 &copy; 2026</span>
        </div>
      </div>
    </div>
  );
}
