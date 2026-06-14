import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Landmark, Send, History, Check, DollarSign, Wallet, ShieldCheck, CreditCard, ChevronRight } from 'lucide-react';
import { User, Transaction, AppNotification } from '../types';

interface BankCardHubProps {
  user: User;
  onDeductCoins: (amt: number, reason: string) => boolean;
  onAddCoins: (amt: number, reason: string) => void;
  onAddNotification: (notif: Omit<AppNotification, 'id' | 'timestamp'>) => void;
  onBack: () => void;
}

interface MainMethod {
  id: string;
  name: string;
  photoUrl: string;
  inputLabel?: string;
  inputPlaceholder?: string;
}

interface SubMethod {
  id: string;
  parentId: string;
  name: string;
  photoUrl: string;
}

interface FinalItem {
  id: string;
  subId: string;
  packageName: string;
  coinCost: number;
  equivalentValue: string;
  photoUrl: string;
}

function parseTargetDetails(targetDetails: string) {
  let packageName = 'Unknown Package';
  let payoutNo = '';
  let memo = '';
  let userPhoto = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80';
  let userName = 'User';

  if (!targetDetails) {
    return { packageName, payoutNo, memo, userPhoto, userName };
  }

  if (targetDetails.includes('Package:')) {
    const pkgMatch = targetDetails.match(/Package:\s*([^|]+)/);
    if (pkgMatch) packageName = pkgMatch[1].trim();

    const toMatch = targetDetails.match(/To:\s*([^|]+)/);
    if (toMatch) payoutNo = toMatch[1].trim();

    const memoMatch = targetDetails.match(/Memo:\s*([^|]+)/);
    if (memoMatch) memo = memoMatch[1].trim();

    const photoMatch = targetDetails.match(/UserPhoto:\s*([^|]+)/);
    if (photoMatch) userPhoto = photoMatch[1].trim();

    const nameMatch = targetDetails.match(/Name:\s*(.+)$/);
    if (nameMatch) userName = nameMatch[1].trim();
  } else {
    const toMatch = targetDetails.match(/To:\s*([^|]+)/);
    if (toMatch) payoutNo = toMatch[1].trim();

    const memoMatch = targetDetails.match(/Memo:\s*(.+)$/);
    if (memoMatch) memo = memoMatch[1].trim();
  }

  return { packageName, payoutNo, memo, userPhoto, userName };
}

export default function BankCardHub({
  user,
  onDeductCoins,
  onAddCoins,
  onAddNotification,
  onBack,
}: BankCardHubProps) {
  const [activeTab, setActiveTab] = useState<'withdraw' | 'transfer' | 'history'>('withdraw');

  // Withdrawal Steps states: 1 = Main, 2 = Sub, 3 = Final package select, 4 = Details Submit form
  const [withdrawStep, setWithdrawStep] = useState<number>(1);
  const [selectedMainId, setSelectedMainId] = useState<string>('');
  const [selectedSubId, setSelectedSubId] = useState<string>('');
  const [selectedPackage, setSelectedPackage] = useState<FinalItem | null>(null);

  // Form Fields
  const [payoutNumber, setPayoutNumber] = useState<string>('');
  const [payoutNotes, setPayoutNotes] = useState<string>('');

  // Transfer coin state
  const [receiverId, setReceiverId] = useState<string>('');
  const [transferAmount, setTransferAmount] = useState<number>(100);
  const [transferNotes, setTransferNotes] = useState<string>('');

  // Dynamic user list loading for verification
  const [userList, setUserList] = useState<User[]>([]);
  const [checkedUser, setCheckedUser] = useState<User | null>(null);
  const [checkingError, setCheckingError] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem('taskx_v1_all_users') || '[]';
    setUserList(JSON.parse(raw));
  }, []);

  // Reset verification when receiverId changes
  useEffect(() => {
    setCheckedUser(null);
    setCheckingError(null);
  }, [receiverId]);

  const handleCheckUser = () => {
    if (!receiverId.trim()) {
      setCheckingError('Please enter a username or user ID.');
      setCheckedUser(null);
      return;
    }
    const matched = userList.find(u => u.username.toLowerCase() === receiverId.trim().toLowerCase() || u.id === receiverId.trim());
    if (matched) {
      setCheckedUser(matched);
      setCheckingError(null);
    } else {
      setCheckedUser(null);
      setCheckingError('Invalid User! No matching account found.');
    }
  };

  // Dynamic payment methods loading
  const [mainMethods, setMainMethods] = useState<MainMethod[]>([]);
  const [subMethods, setSubMethods] = useState<SubMethod[]>([]);
  const [finalPackages, setFinalPackages] = useState<FinalItem[]>([]);

  useEffect(() => {
    const savedMains = localStorage.getItem('taskx_v1_main_methods');
    const savedMethods = localStorage.getItem('taskx_v1_payment_methods');
    const savedPackages = localStorage.getItem('taskx_v1_payment_packages');

    const defaultMains: MainMethod[] = [
      {
        id: 'm_mobile',
        name: 'Mobile Banking',
        photoUrl: 'https://images.unsplash.com/photo-1563013544-824ae1d704d3?w=150&auto=format&fit=crop&q=80',
      },
      {
        id: 'm_crypto',
        name: 'Crypto Wallets',
        photoUrl: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=150&auto=format&fit=crop&q=80',
      },
      {
        id: 'm_game_diamonds',
        name: 'Diamonds & UC Topups',
        photoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
      },
    ];

    const defaultMethods: SubMethod[] = [
      { id: 'sub_bkash', parentId: 'm_mobile', name: 'bKash Cashout', photoUrl: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=120&auto=format&fit=crop&q=80' },
      { id: 'sub_nagad', parentId: 'm_mobile', name: 'Nagad Payout', photoUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=120&auto=format&fit=crop&q=80' },
      { id: 'sub_rocket', parentId: 'm_mobile', name: 'Rocket Cash', photoUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=120&auto=format&fit=crop&q=80' },
      { id: 'sub_usdt', parentId: 'm_crypto', name: 'USDT TRC20 Token', photoUrl: 'https://images.unsplash.com/photo-1622630998477-20aa696ecb05?w=120&auto=format&fit=crop&q=80' },
      { id: 'sub_ton', parentId: 'm_crypto', name: 'TON Network SDK', photoUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=120&auto=format&fit=crop&q=80' },
      { id: 'sub_ff', parentId: 'm_game_diamonds', name: 'Free Fire Diamonds', photoUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=120&auto=format&fit=crop&q=80' },
      { id: 'sub_pubg', parentId: 'm_game_diamonds', name: 'PUBG UC Packs', photoUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=120&auto=format&fit=crop&q=80' }
    ];

    const defaultPackages: FinalItem[] = [
      { id: 'p_bkash_1', subId: 'sub_bkash', packageName: 'bKash Starter Bundle', coinCost: 500, equivalentValue: '50 BDT Money', photoUrl: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=100&auto=format&fit=crop&q=80' },
      { id: 'p_bkash_2', subId: 'sub_bkash', packageName: 'bKash Regular Bundle', coinCost: 1000, equivalentValue: '100 BDT Money', photoUrl: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=100&auto=format&fit=crop&q=80' },
      { id: 'p_bkash_3', subId: 'sub_bkash', packageName: 'bKash Extreme Fortune', coinCost: 5000, equivalentValue: '550 BDT Reward', photoUrl: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=100&auto=format&fit=crop&q=80' },
      { id: 'p_nagad_1', subId: 'sub_nagad', packageName: 'Nagad Economy Pack', coinCost: 500, equivalentValue: '50 BDT Money', photoUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=100&auto=format&fit=crop&q=80' },
      { id: 'p_nagad_2', subId: 'sub_nagad', packageName: 'Nagad Mega Yield', coinCost: 2000, equivalentValue: '210 BDT Cash', photoUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=100&auto=format&fit=crop&q=80' }
    ];

    if (savedMains) {
      setMainMethods(JSON.parse(savedMains));
    } else {
      setMainMethods(defaultMains);
      localStorage.setItem('taskx_v1_main_methods', JSON.stringify(defaultMains));
    }

    if (savedMethods) {
      setSubMethods(JSON.parse(savedMethods));
    } else {
      setSubMethods(defaultMethods);
      localStorage.setItem('taskx_v1_payment_methods', JSON.stringify(defaultMethods));
    }

    if (savedPackages) {
      setFinalPackages(JSON.parse(savedPackages));
    } else {
      setFinalPackages(defaultPackages);
      localStorage.setItem('taskx_v1_payment_packages', JSON.stringify(defaultPackages));
    }
  }, []);

  // Local Transactions list
  const [localTxHistory, setLocalTxHistory] = useState<Transaction[]>([]);

  // Load Transactions History on mount
  useEffect(() => {
    const saved = localStorage.getItem('taskx_v1_transactions');
    if (saved) {
      setLocalTxHistory(JSON.parse(saved));
    } else {
      const defaultTx: Transaction[] = [
        {
          id: 'tx_seed_1',
          type: 'transfer_recv',
          amount: 500,
          targetName: 'System Reward',
          targetDetails: 'Initial account signup promotion',
          status: 'completed',
          timestamp: new Date(Date.now() - 3600000 * 48).toLocaleDateString(),
        },
      ];
      setLocalTxHistory(defaultTx);
      localStorage.setItem('taskx_v1_transactions', JSON.stringify(defaultTx));
    }
  }, []);

  const saveTransactions = (newList: Transaction[]) => {
    setLocalTxHistory(newList);
    localStorage.setItem('taskx_v1_transactions', JSON.stringify(newList));
  };

  // SUB_METHODS and FINAL_PACKAGES are now loaded dynamically from localStorage as subMethods and finalPackages

  // Logic handlers
  const handleSelectMain = (mainId: string) => {
    setSelectedMainId(mainId);
    setWithdrawStep(2);
  };

  const handleSelectSub = (subId: string) => {
    setSelectedSubId(subId);
    setWithdrawStep(3);
  };

  const handleSelectPackage = (pack: FinalItem) => {
    setSelectedPackage(pack);
    setWithdrawStep(4);
    setPayoutNumber('');
    setPayoutNotes('');
  };

  const handleConfirmWithdrawalSubmit = () => {
    if (!selectedPackage) return;
    if (!payoutNumber.trim()) {
      alert('Fill in the specific payout account number or crypto wallet address!');
      return;
    }

    const deducted = onDeductCoins(selectedPackage.coinCost, `Withdrawal request: ${selectedPackage.packageName}`);
    if (!deducted) return;

    // Create a new Transaction
    const newTx: Transaction = {
      id: `tx_withdraw_${Date.now()}`,
      type: 'withdraw',
      amount: selectedPackage.coinCost,
      targetName: user.username || 'unknown_user',
      targetDetails: `Package: ${selectedPackage.packageName} | To: ${payoutNumber} | Memo: ${payoutNotes || 'None'} | UserPhoto: ${user.picture || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80'} | Name: ${user.name}`,
      status: 'pending',
      timestamp: new Date().toLocaleDateString(),
    };

    const updatedHistory = [newTx, ...localTxHistory];
    saveTransactions(updatedHistory);

    onAddNotification({
      type: 'withdraw',
      title: 'Withdraw submitted',
      description: `Pending approval for ${selectedPackage.equivalentValue}.`,
    });

    alert('Your premium withdrawal request was sent to moderators. Expect approval in 2-4 hours.');
    
    // Reset steps
    setWithdrawStep(1);
    setSelectedPackage(null);
  };

  // Coin transfer handler
  const handleExecuteTransfer = () => {
    if (!receiverId.trim()) {
      alert('Enter receiver member ID or Username details!');
      return;
    }
    if (transferAmount < 10) {
      alert('Minimum transfer amount is 10 coins!');
      return;
    }

    const deducted = onDeductCoins(transferAmount, `Coin Transfer to username @${receiverId}`);
    if (!deducted) return;

    const newTx: Transaction = {
      id: `tx_transfer_${Date.now()}`,
      type: 'transfer_send',
      amount: transferAmount,
      targetName: `@${receiverId.replace('@', '')}`,
      targetDetails: `Transfer: ${transferNotes || 'Private peer-to-peer transfer'}`,
      status: 'completed',
      timestamp: new Date().toLocaleDateString(),
    };

    const updatedHistory = [newTx, ...localTxHistory];
    saveTransactions(updatedHistory);

    onAddNotification({
      type: 'transfer',
      title: 'Coins Transferred',
      description: `Sent -${transferAmount} 🪙 to user: @${receiverId}`,
    });

    alert(`Successfully transferred ${transferAmount} coins directly to user: @${receiverId}!`);
    setReceiverId('');
    setTransferAmount(100);
    setTransferNotes('');
  };

  return (
    <div className="w-full flex flex-col pt-1">
      {/* Header Bar */}
      <div className="flex items-center gap-3 border-b border-white/5 pb-3 mb-4">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-2xl bg-[#141418]/90 border border-white/10 hover:border-purple-500/30 text-slate-350 hover:text-purple-400 hover:scale-[1.06] active:scale-90 active:bg-purple-500/10 active:border-purple-500/20 flex items-center justify-center cursor-pointer transition-all duration-200 shadow-[0_4px_15px_rgba(0,0,0,0.5)] hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <span className="text-[9px] text-[#A855F7] font-black uppercase tracking-widest block">SECURE CENTRAL</span>
          <h2 className="text-sm font-black text-slate-100 uppercase tracking-tight leading-tight">Payment & Transfer Hub</h2>
        </div>
      </div>

      {/* TOP NAVIGATION TABS */}
      <div className="flex bg-[#121216]/85 border border-white/5 p-1 rounded-2xl mb-4 shadow-inner">
        <button
          onClick={() => {
            setActiveTab('withdraw');
            setWithdrawStep(1);
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'withdraw' ? 'bg-[#9333EA] text-white shadow-lg shadow-purple-600/30' : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Landmark className="w-3.5 h-3.5" /> Withdraw
        </button>
        <button
          onClick={() => setActiveTab('transfer')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'transfer' ? 'bg-[#9333EA] text-white shadow-lg shadow-purple-600/30' : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Send className="w-3.5 h-3.5" /> Transfer Coin
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'history' ? 'bg-[#9333EA] text-white shadow-lg shadow-purple-600/30' : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <History className="w-3.5 h-3.5" /> History
        </button>
      </div>

      {/* SCREEN SCROLL CONTROLLER ACTIONS */}
      <div className="min-h-[300px]">
        {/* TAB 1: WITHDRAW SYSTEM (3 STEPS + 1 SUBMIT FORM) */}
        {activeTab === 'withdraw' && (
          <AnimatePresence mode="wait">
            {/* STEP 1: Main Method Select */}
            {withdrawStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-3.5"
              >
                <div className="text-left mb-1">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Step 1: Main Method</h3>
                  <p className="text-[10px] text-white/30">Select your preferred banking or reward distribution category.</p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {mainMethods.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => handleSelectMain(m.id)}
                      className="bg-[#141418] hover:bg-[#18181f] border border-white/5 hover:border-indigo-500/20 px-4 py-4 rounded-3xl flex items-center justify-between gap-4 cursor-pointer transition-all hover:scale-[1.01] shadow-[0_4px_15px_rgba(0,0,0,0.2)]"
                    >
                      <div className="flex items-center gap-3">
                        <img src={m.photoUrl} alt={m.name} className="w-11 h-11 rounded-2xl object-cover border border-white/10" />
                        <span className="text-xs font-black text-slate-100 tracking-wide font-sans">{m.name}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP 2: Sub Method Select */}
            {withdrawStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-3.5"
              >
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setWithdrawStep(1)}
                    className="flex items-center gap-1 text-[10px] text-slate-400 font-bold hover:text-white"
                  >
                    ← BACK
                  </button>
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest font-mono">Step 2: Sub-Method</span>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {subMethods.filter((sm) => sm.parentId === selectedMainId).map((sm) => (
                    <div
                      key={sm.id}
                      onClick={() => handleSelectSub(sm.id)}
                      className="bg-[#141418] hover:bg-[#18181f] border border-white/5 hover:border-indigo-500/20 px-4 py-3.5 rounded-3xl flex items-center justify-between gap-4 cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-3.5">
                        <img src={sm.photoUrl} alt={sm.name} className="w-10 h-10 rounded-xl object-cover" />
                        <span className="text-xs font-extrabold text-slate-200">{sm.name}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500 animate-pulse" />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP 3: List Packages Select */}
            {withdrawStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-3.5"
              >
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setWithdrawStep(2)}
                    className="flex items-center gap-1 text-[10px] text-slate-400 font-bold hover:text-white"
                  >
                    ← BACK
                  </button>
                  <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest font-mono">Step 3: List Packages</span>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  {finalPackages.filter((p) => p.subId === selectedSubId).map((p) => {
                    const haveCoins = user.coins >= p.coinCost;
                    return (
                      <div
                        key={p.id}
                        onClick={() => handleSelectPackage(p)}
                        className={`relative overflow-hidden bg-[#101014] border p-3 rounded-2xl flex flex-col items-center justify-between text-center cursor-pointer transition-all hover:scale-105 active:scale-95 group select-none ${
                          haveCoins 
                            ? 'border-white/5 hover:border-[#ffb020]/40 hover:bg-[#15151e] shadow-[0_4px_12px_rgba(0,0,0,0.3)]' 
                            : 'border-red-500/10 opacity-60 bg-red-500/2'
                        }`}
                        title={haveCoins ? 'Select package' : 'Insufficient coins'}
                      >
                        {/* Package image with premium glow */}
                        <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-white/5 bg-black/40 flex items-center justify-center p-0.5">
                          <img src={p.photoUrl} alt={p.packageName} className="w-full h-full object-cover rounded-lg group-hover:scale-110 transition-transform duration-300" />
                          {!haveCoins && (
                            <div className="absolute inset-0 bg-red-900/30 backdrop-blur-[1px] flex items-center justify-center">
                              <span className="text-[7px] text-red-400 font-extrabold uppercase">LOCKED</span>
                            </div>
                          )}
                        </div>

                        {/* Name & details */}
                        <div className="mt-2 text-center w-full grow flex flex-col justify-between">
                          <h4 className="text-[9px] font-black tracking-tight text-slate-100 line-clamp-2 leading-tight h-6 flex items-center justify-center">{p.packageName.replace('Bundle', '').replace('Pack', '').replace('Fortune', '').trim()}</h4>
                          <span className="text-[9px] text-emerald-400 font-black tracking-wide block leading-none py-1.5">{p.equivalentValue}</span>
                        </div>

                        {/* Coin cost badge */}
                        <div className="w-full mt-1.5 px-1.5 py-1 bg-white/5 border border-white/5 rounded-lg text-center">
                          <span className={`text-[8.5px] font-mono font-black ${haveCoins ? 'text-amber-400' : 'text-red-400'}`}>
                            {p.coinCost} 🪙
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* STEP 4: Form Fields details execution */}
            {withdrawStep === 4 && selectedPackage && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="bg-[#141418] border border-white/5 p-5 rounded-3xl space-y-4"
              >
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <button onClick={() => setWithdrawStep(3)} className="text-[10px] text-slate-400 font-bold uppercase">
                    ← Change Package
                  </button>
                  <span className="text-[9px] text-[#22C55E] bg-[#22C55E]/10 border border-[#22C55E]/15 px-2 py-0.5 rounded font-black tracking-widest uppercase">
                    CONFIRMATION
                  </span>
                </div>

                {/* Bundle review */}
                <div className="bg-[#0A0A0C] border border-white/5 p-3.5 rounded-2xl flex items-center gap-3 shadow-inner">
                  <img src={selectedPackage.photoUrl} className="w-10 h-10 rounded-xl object-cover" />
                  <div className="space-y-0.5 text-left grow">
                    <span className="text-[9px] text-indigo-400 font-black block tracking-widest uppercase">STAKED SPECIFICATION</span>
                    <h4 className="text-[11px] font-black text-slate-100">{selectedPackage.packageName}</h4>
                    <span className="text-[10px] text-slate-400 font-semibold block">Equivalent out: {selectedPackage.equivalentValue}</span>
                  </div>
                  <div className="text-right text-amber-400 font-mono font-bold text-xs shrink-0 self-center">
                    {selectedPackage.coinCost} 🪙
                  </div>
                </div>

                {/* Form fields */}
                <div className="space-y-3.5 text-left">
                  <div className="space-y-1">
                    <label className="text-[9px] tracking-wider font-extrabold uppercase text-white/45">
                      {mainMethods.find(m => m.id === selectedMainId)?.inputLabel || 'BKash / Wallet Address / ID'}
                    </label>
                    <input
                      type="text"
                      placeholder={mainMethods.find(m => m.id === selectedMainId)?.inputPlaceholder || 'e.g. 017XXXXXXXX or TRC20 Crypto Wallet Address'}
                      value={payoutNumber}
                      onChange={(e) => setPayoutNumber(e.target.value)}
                      className="w-full bg-[#0A0A0C] border border-white/5 rounded-xl px-3 py-2 text-slate-100 text-xs font-medium focus:border-[#9333EA] font-mono outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] tracking-wider font-extrabold uppercase text-white/45">Extra Note (Optional ID references)</label>
                    <input
                      type="text"
                      placeholder="e.g. Free Fire Character Uid, or personal memo notes"
                      value={payoutNotes}
                      onChange={(e) => setPayoutNotes(e.target.value)}
                      className="w-full bg-[#0A0A0C] border border-white/5 rounded-xl px-3 py-2 text-slate-100 text-xs font-medium focus:border-[#9333EA] outline-none"
                    />
                  </div>
                </div>

                <button
                  onClick={handleConfirmWithdrawalSubmit}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl cursor-pointer transition-all shadow-md shadow-purple-600/10 active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400 animate-pulse" /> Submit Withdrawal Request
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* TAB 2: COIN TRANSFER ACTUATOR */}
        {activeTab === 'transfer' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#141418] border border-white/5 p-5 rounded-3xl space-y-4 text-left"
          >
            <div className="text-center pb-2 border-b border-white/5">
              <h3 className="text-xs font-black text-slate-100 uppercase tracking-widest">Direct Coin P2P Transfer</h3>
              <p className="text-[10px] text-white/40 mt-0.5">Push coins directly to other members instant free transfer.</p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1.5">
                <label className="text-[9px] text-white/45 font-extrabold uppercase tracking-widest block">Receiver User Username / ID</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. sayed_pro, or random user_id"
                    value={receiverId}
                    onChange={(e) => setReceiverId(e.target.value)}
                    className="w-full bg-[#0A0A0C] border border-white/5 rounded-xl pl-3.5 pr-24 py-2.5 text-slate-100 font-bold outline-none focus:border-[#9333EA]"
                  />
                  <button
                    type="button"
                    onClick={handleCheckUser}
                    className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-[#9333EA]/20 hover:bg-[#9333EA]/3c text-[#d8b4fe] hover:text-white border border-[#9333EA]/25 font-black text-[9px] uppercase tracking-wide rounded-lg cursor-pointer transition-all active:scale-95"
                  >
                    Check Name
                  </button>
                </div>

                {/* Verification Info output block */}
                {checkedUser && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl flex items-center gap-2.5 mt-2 shadow-[0_4px_12px_rgba(16,185,129,0.06)]"
                  >
                    <img
                      src={checkedUser.picture || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80'}
                      alt={checkedUser.name}
                      className="w-8 h-8 rounded-full border border-emerald-500/20 object-cover"
                    />
                    <div className="text-left">
                      <span className="text-[8px] text-emerald-400 font-extrabold uppercase tracking-widest block">Account Verified</span>
                      <h5 className="text-[10px] font-black text-slate-100 leading-tight">{checkedUser.name}</h5>
                      <span className="text-[9px] text-slate-400 font-mono">@{checkedUser.username}</span>
                    </div>
                  </motion.div>
                )}

                {checkingError && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-500/10 border border-red-500/20 p-2 rounded-xl mt-2 flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 block shrink-0" />
                    <span className="text-[9.5px] text-red-400 font-bold leading-none">{checkingError}</span>
                  </motion.div>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <label className="text-[9px] text-white/45 font-extrabold uppercase tracking-widest">Coins Amount</label>
                  <span className="text-[9px] text-amber-500 font-extrabold font-mono">Current: {user.coins} 🪙</span>
                </div>
                <input
                  type="number"
                  placeholder="Minimum 10 🪙"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full bg-[#0A0A0C] border border-white/5 rounded-xl px-3.5 py-2.5 text-yellow-400 font-black font-mono outline-none focus:border-[#9333EA]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] text-white/45 font-extrabold uppercase tracking-widest block">Private memo / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Birthday coins splash reward"
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  className="w-full bg-[#0A0A0C] border border-white/5 rounded-xl px-3.5 py-2.5 text-slate-100 outline-none focus:border-[#9333EA]"
                />
              </div>
            </div>

            <button
              onClick={handleExecuteTransfer}
              className="w-full py-3 bg-[#9333EA] hover:bg-[#8225e2] text-white font-black text-xs uppercase tracking-widest rounded-2xl cursor-pointer transition-all shadow-md active:scale-95 flex items-center justify-center gap-1"
            >
              <Send className="w-3.5 h-3.5" /> Send Coins Now
            </button>
          </motion.div>
        )}

        {/* TAB 3: HISTORY LOGS LIST */}
        {activeTab === 'history' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2.5"
          >
            <div className="text-left mb-1.5">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Ledger Logs</h3>
              <p className="text-[10px] text-white/30">Your historic blockchain deposit, withdrawal & transfer state histories.</p>
            </div>

            <div className="space-y-2 max-h-[320px] overflow-y-auto scrollable">
              {localTxHistory.length === 0 ? (
                <div className="bg-[#141418] border border-white/5 p-12 rounded-3xl text-center">
                  <CreditCard className="w-8 h-8 text-white/15 mx-auto mb-2" />
                  <p className="text-white/40 text-[10px] italic">No transfer records found in account ledger.</p>
                </div>
              ) : (
                localTxHistory.map((tx) => {
                  const isDeposit = tx.type === 'transfer_recv';
                  const isWithdraw = tx.type === 'withdraw';
                  const isTransferSend = tx.type === 'transfer_send';
                  const details = parseTargetDetails(tx.targetDetails);
                  
                  // Extract correct details to display
                  const photo = isWithdraw ? (details.userPhoto || user.picture || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80') : (user.picture || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80');
                  const dispName = isWithdraw ? (details.userName || user.name) : user.name;

                  if (isWithdraw) {
                    return (
                      <div key={tx.id} className="bg-[#141419] border border-white/10 p-4.5 rounded-3xl space-y-3.5 hover:border-purple-500/20 hover:shadow-[0_4px_15px_rgba(0,0,0,0.4)] transition-all">
                        {/* Top row with user avatar and order ID */}
                        <div className="flex justify-between items-start border-b border-white/5 pb-2.5">
                          <div className="flex items-center gap-2.5">
                            <img 
                              src={photo} 
                              alt={dispName} 
                              className="w-8 h-8 rounded-full object-cover border border-purple-500/10 shadow-md" 
                            />
                            <div className="text-left leading-normal">
                              <h4 className="text-[11px] font-black text-slate-100">{dispName}</h4>
                              <p className="text-[8px] text-purple-400 font-bold uppercase tracking-wider">Withdraw Request</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-black text-red-500 font-mono block">-{tx.amount.toLocaleString()} 🪙</span>
                            <span className="text-[8.5px] text-emerald-400 font-extrabold block uppercase tracking-wide">Value: {details.packageName}</span>
                          </div>
                        </div>

                        {/* Layout Details */}
                        <div className="bg-black/40 border border-white/5 p-2.5 rounded-2xl space-y-2 text-left font-mono text-[9px] leading-relaxed">
                          <div className="grid grid-cols-2 gap-2 border-b border-white/5 pb-1.5">
                            <div>
                              <span className="text-white/35 text-[7px] uppercase block">User ID:</span>
                              <span className="text-slate-350 font-semibold">{user.id}</span>
                            </div>
                            <div>
                              <span className="text-white/35 text-[7px] uppercase block">Order ID:</span>
                              <span className="text-slate-200 font-bold select-all">{tx.id.replace('tx_withdraw_', '')}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 border-b border-white/5 pb-1.5 font-mono">
                            <div>
                              <span className="text-white/35 text-[7px] uppercase block">Payment Method:</span>
                              <span className="text-indigo-300 font-black">{details.packageName}</span>
                            </div>
                            <div>
                              <span className="text-white/35 text-[7px] uppercase block">Payment Acc/UID:</span>
                              <span className="text-emerald-400 font-black select-all">{details.payoutNo}</span>
                            </div>
                          </div>

                          <div className="flex justify-between items-center pt-1 text-[8.5px]">
                            <div>
                              <span className="text-white/35 text-[7px] uppercase inline">Submitted At: </span>
                              <span className="text-slate-400 font-semibold">{tx.timestamp}</span>
                            </div>
                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${
                              tx.status === 'completed'
                                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                : tx.status === 'pending'
                                  ? 'bg-amber-500/15 text-amber-500 border-amber-500/20 animate-pulse'
                                  : 'bg-red-500/10 text-red-400 border-red-500/20'
                            }`}>
                              {tx.status}
                            </span>
                          </div>
                          {details.memo && details.memo !== 'None' && (
                            <div className="pt-1 text-[8px] border-t border-white/5 text-gray-500 font-medium italic">
                              Memo Notes: "{details.memo}"
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }

                  // Non-withdrawal transactions
                  return (
                    <div
                      key={tx.id}
                      className="bg-[#141418] border border-white/5 p-3.5 rounded-2xl flex items-center justify-between gap-3 text-xs hover:border-white/10 transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        <img 
                          src={photo} 
                          alt={dispName} 
                          className="w-8 h-8 rounded-full border border-white/10 object-cover shrink-0" 
                        />
                        <div className="text-left leading-normal">
                          <h4 className="font-extrabold text-slate-200 capitalize flex items-center gap-1.5 leading-none">
                            {tx.type.replace('_', ' ').replace('recv', 'received').replace('send', 'sent')}
                          </h4>
                          
                          <span className="text-[10px] text-slate-400 block mt-1">@{tx.targetName}</span>
                          <span className="text-[8px] text-white/30 block mt-0.5">{dispName}</span>
                        </div>
                      </div>

                      <div className="text-right flex flex-col justify-between items-end h-full">
                        <span className="text-[8px] text-slate-500 font-mono block">{tx.timestamp}</span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span
                            className={`font-black font-mono text-[11px] ${
                              isDeposit ? 'text-green-400' : 'text-slate-450'
                            }`}
                          >
                            {isDeposit ? '+' : '-'}{tx.amount} 🪙
                          </span>
                          <span
                            className="text-[8px] font-black uppercase px-2 py-0.5 rounded border bg-green-500/10 text-green-400 border-green-500/20"
                          >
                            Approved
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
