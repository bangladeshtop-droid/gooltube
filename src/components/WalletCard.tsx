import { useState } from 'react';
import { Eye, EyeOff, Headphones, ShieldCheck } from 'lucide-react';
import { User } from '../types';

interface WalletCardProps {
  user: User;
  onClickChip?: () => void;
  onClickSupport?: () => void;
}

export default function WalletCard({ user, onClickChip, onClickSupport }: WalletCardProps) {
  const [showName, setShowName] = useState(true);
  const [showCardNumber, setShowCardNumber] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [showCvp, setShowCvp] = useState(false);

  // Helper to format card number: e.g. "5412 7512 8834 9402"
  const getFormattedCardNumber = () => {
    const raw = user.cardNumber || '5412751288349402';
    if (showCardNumber) {
      return raw.replace(/(\d{4})/g, '$1 ').trim();
    } else {
      return `•••• •••• •••• ${raw.slice(-4)}`;
    }
  };

  return (
    <div className="relative overflow-hidden w-full bg-gradient-to-br from-[#1A1A20] via-[#121216] to-[#141418] border border-white/10 rounded-3xl p-6 shadow-[0_15px_35px_rgba(0,0,0,0.6)]">
      {/* Glossy overlay effect */}
      <div className="absolute -top-32 -left-32 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <span className="text-indigo-400 font-bold tracking-widest text-[9px] uppercase">CARD HOLDER</span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="font-semibold text-slate-100 text-sm tracking-wide">
              {showName ? user.name : '••••••••••••'}
            </span>
            <button
              onClick={() => setShowName(!showName)}
              className="p-1 rounded-full text-white/40 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
            >
              {showName ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Chip & Logo */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onClickChip}
            className="w-10 h-8 rounded-lg bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 border border-yellow-200/40 shadow-md hover:brightness-110 flex flex-col justify-between p-1 cursor-pointer active:scale-95 transition-transform"
            title="Withdraw, Transfer or view History"
          >
            <div className="flex justify-between w-full">
              <span className="w-1.5 h-1 border-r border-b border-black/10" />
              <span className="w-1.5 h-1 border-l border-b border-black/10" />
            </div>
            <div className="h-0.5 w-full border-t border-b border-black/15" />
            <div className="flex justify-between w-full">
              <span className="w-1.5 h-1 border-r border-t border-black/10" />
              <span className="w-1.5 h-1 border-l border-t border-black/10" />
            </div>
          </button>
          <button
            onClick={onClickSupport}
            className="w-10 h-8 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 hover:border-indigo-500/40 hover:text-white flex items-center justify-center cursor-pointer active:scale-95 transition-all text-indigo-400"
            title="Help & Support Desk"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <Headphones className="w-4.5 h-4.5 animate-pulse" />
          </button>
        </div>
      </div>

      {/* Card Number */}
      <div className="mb-6">
        <span className="text-indigo-400 font-bold tracking-widest text-[9px] uppercase">CARD NUMBER</span>
        <div className="flex items-center justify-between gap-2 mt-1">
          <span className="font-mono text-lg text-slate-100 tracking-[0.2em]">
            {getFormattedCardNumber()}
          </span>
          <button
            onClick={() => setShowCardNumber(!showCardNumber)}
            className="p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
          >
            {showCardNumber ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Footer Details */}
      <div className="flex items-end justify-between">
        <div>
          <span className="text-indigo-400 font-bold tracking-widest text-[9px] uppercase">WALLET BALANCE</span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xl font-black text-amber-400 tracking-wide drop-shadow-[0_2px_8px_rgba(251,191,36,0.2)]">
              {showBalance ? `${user.coins.toLocaleString()} 🪙` : '•••••• 🪙'}
            </span>
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="p-1 rounded-full text-white/40 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
            >
              {showBalance ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <div className="text-right">
          <span className="text-indigo-400 font-bold tracking-widest text-[9px] uppercase block">CVP CODE</span>
          <div className="flex items-center justify-end gap-1.5 mt-0.5">
            <span className="font-mono text-sm text-slate-300 tracking-wider">
              {showCvp ? user.cvp : '•••'}
            </span>
            <button
              onClick={() => setShowCvp(!showCvp)}
              className="p-1 rounded-full text-white/40 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
            >
              {showCvp ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Fully Secured design sign */}
      <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-1.5 text-[10px] text-white/30">
        <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
        <span>Fully Encrypted & Authorized Multi-chain Hub</span>
      </div>
    </div>
  );
}
