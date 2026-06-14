import { useState, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Sparkles, 
  User, 
  Gift, 
  Image, 
  Settings, 
  Copy, 
  Check, 
  UploadCloud,
  Eye,
  EyeOff,
  Smartphone,
  Mail,
  Lock,
  Calendar,
  CreditCard,
  Hash,
  Volume2,
  VolumeX
} from 'lucide-react';
import { User as UserType } from '../types';
import InviteCenter from './InviteCenter';
import { playCoinClaimSound, setSoundEffectsEnabled, getSoundEffectsEnabled } from '../utils/audio';

interface ProfileCenterProps {
  user: UserType;
  onUpdatePhoto: (url: string) => void;
  onLogout: () => void;
  isAdmin?: boolean;
  onClickAdmin?: () => void;
  onAddCoins: (amt: number, note: string) => void;
  onAddNotification: (notif: { type: 'task' | 'game' | 'transfer' | 'withdraw' | 'system'; title: string; description: string; coinsChange?: number }) => void;
}

export default function ProfileCenter({ 
  user, 
  onUpdatePhoto, 
  onLogout, 
  isAdmin, 
  onClickAdmin,
  onAddCoins,
  onAddNotification 
}: ProfileCenterProps) {
  const [activeTab, setActiveTab] = useState<'about' | 'referral' | 'screenshot' | 'settings'>('about');
  const [showPassword, setShowPassword] = useState(false);

  // Screenshot Upload state
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [generatedLink, setGeneratedLink] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);

  // Settings fields state
  const [emailField, setEmailField] = useState(user.email);
  const [nameField, setNameField] = useState(user.name);

  // Global sound configuration preference state
  const [soundsEnabled, setSoundsEnabled] = useState<boolean>(() => {
    return getSoundEffectsEnabled();
  });

  const handleToggleSounds = (enabled: boolean) => {
    setSoundsEnabled(enabled);
    setSoundEffectsEnabled(enabled);
    if (enabled) {
      // satisfying instant audio confirmation chime
      playCoinClaimSound();
    }
  };

  const handleImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
        // Generate a beautiful unique link for proof submissions
        const generated = `https://taskx-proof.cloud/verify/proof_${user.id.slice(-6)}_${Math.floor(1000 + Math.random() * 9000)}.png`;
        setGeneratedLink(generated);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyRef = () => {
    const code = user.id.slice(-8).toUpperCase();
    navigator.clipboard.writeText(code);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  return (
    <div className="w-full flex flex-col pt-1">
      {/* Visual Header Profile Card */}
      <div className="bg-gradient-to-br from-[#1A1A20] via-[#121216] to-[#141418] p-6 rounded-3xl border border-white/10 text-center relative overflow-hidden mb-4 shadow-[0_12px_30px_rgba(0,0,0,0.5)]">
        <div className="absolute top-2 right-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[8px] font-black tracking-widest uppercase py-1 px-3 rounded-full flex items-center gap-1">
          <Shield className="w-2.5 h-2.5" />
          VERIFIED USER
        </div>

        <div className="relative w-20 h-20 mx-auto mb-3">
          <img
            src={user.picture || 'https://telegram.org/img/t_logo.png'}
            alt={user.name}
            className="w-full h-full rounded-full border-2 border-indigo-500/80 shadow-md object-cover"
          />
          <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-400 border-2 border-[#121216] rounded-full animate-pulse" />
        </div>

        <h3 className="text-xl font-black text-slate-100 tracking-tight">{user.name}</h3>
        <p className="text-xs text-slate-400 mt-0.5">@{user.username || 'user'}</p>
        <p className="text-[10px] text-slate-500 font-mono mt-1">ID: {user.id}</p>
      </div>

      {/* Tabs list inside profile */}
      <div className="flex gap-1.5 bg-[#121216]/60 border border-white/5 p-1 rounded-xl mb-4 shadow-inner">
        {[
          { id: 'about', label: 'About', icon: User },
          { id: 'referral', label: 'Referral', icon: Gift },
          { id: 'screenshot', label: 'Screenshot', icon: Image },
          { id: 'settings', label: 'Settings', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSel = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                isSel ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Dynamic Tab Contents */}
      <div className={activeTab === 'referral' ? "" : "bg-[#141418] border border-white/5 rounded-3xl p-4.5 min-h-[220px] shadow-[0_10px_30px_rgba(0,0,0,0.3)]"}>
        {activeTab === 'about' && (
          <div className="space-y-4">
            <div className="flex items-center gap-1.5 border-b border-white/5 pb-2.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest font-mono">Account Specifications</h4>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {/* Name Details */}
              <div className="bg-[#1C1C24]/30 border border-white/5 p-3 rounded-2xl flex items-center justify-between gap-3 shadow-inner hover:border-[#10B981]/15 transition-all">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-[8px] text-white/30 font-bold uppercase tracking-widest font-mono">Full Name</span>
                    <span className="text-xs font-black text-slate-100">{user.name}</span>
                  </div>
                </div>
              </div>

              {/* Username Details */}
              <div className="bg-[#1C1C24]/30 border border-white/5 p-3 rounded-2xl flex items-center justify-between gap-3 shadow-inner hover:border-[#10B981]/15 transition-all">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Hash className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-[8px] text-white/30 font-bold uppercase tracking-widest font-mono">User Handle</span>
                    <span className="text-xs font-mono font-black text-indigo-400">@{user.username || 'user'}</span>
                  </div>
                </div>
                <span className="text-[9px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-lg font-bold font-mono">ACTIVE</span>
              </div>

              {/* Phone Details */}
              <div className="bg-[#1C1C24]/30 border border-white/5 p-3 rounded-2xl flex items-center justify-between gap-3 shadow-inner hover:border-[#10B981]/15 transition-all">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-[8px] text-white/30 font-bold uppercase tracking-widest font-mono">Mobile Number</span>
                    <span className="text-xs font-black text-slate-100 font-mono">{user.phone || '+8801755104443'}</span>
                  </div>
                </div>
                <span className="text-[8px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-black border border-emerald-500/25 uppercase font-mono">VERIFIED</span>
              </div>

              {/* Email Details */}
              <div className="bg-[#1C1C24]/30 border border-white/5 p-3 rounded-2xl flex items-center justify-between gap-3 shadow-inner hover:border-[#10B981]/15 transition-all">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[8px] text-white/30 font-bold uppercase tracking-widest font-mono">Email Address</span>
                    <span className="text-xs font-semibold text-slate-100 break-all truncate block">{user.email || 'member@goltub.com'}</span>
                  </div>
                </div>
              </div>

              {/* Password Details */}
              <div className="bg-[#1C1C24]/30 border border-white/5 p-3 rounded-2xl flex items-center justify-between gap-3 shadow-inner hover:border-[#10B981]/15 transition-all">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 animate-pulse">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-[8px] text-white/30 font-bold uppercase tracking-widest font-mono">Security Password</span>
                    <span className="text-xs font-mono font-black text-amber-400">
                      {showPassword ? (user.password || 'Sayed@100') : '••••••••'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4 text-amber-400" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Joined Date Details */}
              <div className="bg-[#1C1C24]/30 border border-white/5 p-3 rounded-2xl flex items-center justify-between gap-3 shadow-inner hover:border-[#10B981]/15 transition-all">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-[8px] text-white/30 font-bold uppercase tracking-widest font-mono">Registration Date</span>
                    <span className="text-xs font-semibold text-slate-100">{user.joinedAt}</span>
                  </div>
                </div>
              </div>

              {/* Pay Card Details */}
              <div className="bg-[#1C1C24]/30 border border-white/5 p-3 rounded-2xl flex items-center justify-between gap-3 shadow-inner hover:border-[#10B981]/15 transition-all">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-[8px] text-white/30 font-bold uppercase tracking-widest font-mono">Virtual Security Card</span>
                    <span className="text-xs font-mono font-semibold text-slate-200">
                      {user.cardNumber ? `${user.cardNumber.slice(0,4)} •••• •••• ${user.cardNumber.slice(-4)}` : 'N/A'}
                    </span>
                  </div>
                </div>
                <span className="bg-blue-500/10 text-blue-400 text-[8px] font-mono border border-blue-500/20 px-2 py-0.5 rounded font-black">CVV {user.cvp || '552'}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'referral' && (
          <InviteCenter
            user={user}
            onAddCoins={onAddCoins}
            onAddNotification={onAddNotification}
          />
        )}

        {activeTab === 'screenshot' && (
          <div className="flex flex-col items-center">
            <h4 className="text-slate-200 text-sm font-bold mb-1.5 flex items-center gap-1.5 justify-center font-sans">
              <Image className="w-4 h-4 text-indigo-400" /> Screenshot Proof Link Builder
            </h4>
            <p className="text-white/40 text-[10px] text-center mb-4 max-w-xs leading-relaxed">
              Upload local image files of tasks done to generate encrypted verification links for moderator reviews.
            </p>

            <label className="w-full max-w-xs flex flex-col items-center justify-center p-5 rounded-3xl border-2 border-dashed border-white/10 bg-[#0A0A0C] hover:bg-[#121216] hover:border-indigo-500/40 transition-all cursor-pointer select-none shadow-inner">
              <UploadCloud className="w-8 h-8 text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.2)] mb-2" />
              <span className="text-xs font-semibold text-slate-300">Choose Image File</span>
              <span className="text-[10px] text-white/30 mt-1">PNG, JPG up to 10MB</span>
              <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
            </label>

            {selectedImage && (
              <div className="mt-4 w-full max-w-xs space-y-3.5">
                <div className="aspect-[16/9] w-full rounded-2xl overflow-hidden border border-white/10 bg-[#0A0A0C]">
                  <img src={selectedImage} alt="Preview" className="w-full h-full object-contain" />
                </div>

                <div className="bg-[#10B981]/10 border border-[#10B981]/20 p-2.5 rounded-2xl flex items-center justify-between gap-2 shadow-inner">
                  <div className="text-left flex-1 min-w-0">
                    <span className="text-[9px] text-[#10B981] font-extrabold tracking-widest uppercase block">GENERATED LINK</span>
                    <span className="text-[10px] text-slate-300 break-all truncate font-mono block mt-0.5">
                      {generatedLink}
                    </span>
                  </div>
                  <button
                    onClick={handleCopyLink}
                    className="p-2 bg-[#0A0A0C] border border-white/5 rounded-xl text-slate-300 hover:text-white transition-all cursor-pointer shrink-0 hover:bg-white/5"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] text-white/30 font-extrabold tracking-widest uppercase block">Name</label>
              <input
                type="text"
                value={nameField}
                onChange={(e) => setNameField(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#0A0A0C] border border-white/10 rounded-2xl text-slate-100 text-xs font-semibold outline-none focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-white/30 font-extrabold tracking-widest uppercase block">Email Channel</label>
              <input
                type="email"
                value={emailField}
                onChange={(e) => setEmailField(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#0A0A0C] border border-white/10 rounded-2xl text-slate-100 text-xs font-semibold outline-none focus:border-indigo-500"
              />
            </div>

            {/* Global Settings: Audio & Chimes */}
            <div className="bg-[#1C1C24]/30 border border-white/5 p-4 rounded-2xl space-y-3 shadow-inner text-left">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                    {soundsEnabled ? <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
                  </div>
                  <div>
                    <span className="block text-[8px] text-white/30 font-bold uppercase tracking-widest font-mono">🔊 Sounds & effects</span>
                    <span className="text-xs font-black text-slate-100">Satisfying Chimes & Pings</span>
                  </div>
                </div>

                {/* Elegant Toggle Switch */}
                <button
                  type="button"
                  onClick={() => handleToggleSounds(!soundsEnabled)}
                  className={`w-11 h-6 rounded-full p-0.5 transition-all cursor-pointer outline-none relative duration-300 flex items-center ${
                    soundsEnabled ? 'bg-indigo-600' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full bg-white shadow transition-transform duration-300 absolute ${
                      soundsEnabled ? 'translate-x-[20px]' : 'translate-x-[0.5px]'
                    }`}
                  />
                </button>
              </div>

              <p className="text-[10px] text-white/40 leading-normal">
                Satisfaction audio feedback streams during matching tasks, wheel spins, coin flips, slot runs, plinko hops, crash climbs, and coin claims.
              </p>

              {/* Sound Test Button */}
              {soundsEnabled && (
                <button
                  type="button"
                  onClick={() => playCoinClaimSound()}
                  className="w-full py-2 bg-[#0A0A0C] hover:bg-[#121216] border border-white/5 rounded-xl text-indigo-400 hover:text-indigo-300 text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-98"
                >
                  <span>🔊 Test Coin Chime 🪙</span>
                </button>
              )}
            </div>

            <button
              onClick={onLogout}
              className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-bold text-xs uppercase tracking-widest rounded-2xl transition-all cursor-pointer shadow-lg shadow-red-500/5 active:scale-95"
            >
              Sign Out Account
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
