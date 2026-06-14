import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Menu, X, Users, ShieldAlert, CheckCircle, XCircle, 
  ChevronRight, Activity, PlusCircle, Bookmark, Landmark, HelpCircle,
  Search, Download, Trash2, Edit2, Save, Bot, Settings, Lock, Plus,
  Eye, Clock, Link, DollarSign, FileText, AlertTriangle, Coins, Cpu
} from 'lucide-react';
import { User, Task, TaskSubmission, Transaction, AppNotification } from '../types';

interface AdminPanelProps {
  user: User;
  tasks: Task[];
  onAddTask: (task: Task) => void;
  onUpdateTasks?: (newTasks: Task[]) => void;
  onBack: () => void;
  onAddNotification: (notif: Omit<AppNotification, 'id' | 'timestamp'>) => void;
  onAddCoins: (amt: number, reason: string) => void;
  loggedAdminRole?: 'Maine admin' | 'Sub admin' | 'Visit admin' | null;
}

function parseWithdrawDetails(targetDetails: string) {
  let packageName = 'bKash dynamic payout';
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
    // legacy support
    const parts = targetDetails.split('|');
    if (parts[0]) {
      const pkgTxt = parts[0].replace('To:', '').trim();
      payoutNo = pkgTxt;
    }
    if (parts[1]) {
      memo = parts[1].replace('Memo:', '').trim();
    }
  }

  return { packageName, payoutNo, memo, userPhoto, userName };
}

export default function AdminPanel({
  user,
  tasks,
  onAddTask,
  onUpdateTasks,
  onBack,
  onAddNotification,
  onAddCoins,
  loggedAdminRole = 'Maine admin',
}: AdminPanelProps) {
  // Read-only guard for Visit admin role
  const checkWriteAccess = () => {
    if (loggedAdminRole === 'Visit admin') {
      alert('Action Denied! Visit Admins are permitted for Read-Only navigation. Write operations are disabled.');
      return false;
    }
    return true;
  };

  // Sidebar Controls
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'resource_center' | 'settings'>('dashboard');

  // Resource Center Subpages
  const [resSubPage, setResSubPage] = useState<'none' | 'control_center' | 'transactions'>('none');
  const [controlCenterPage, setControlCenterPage] = useState<'none' | 'tasks' | 'payments' | 'support'>('none');

  // Core Data Lists
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [withdrawals, setWithdrawals] = useState<Transaction[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [paymentPackages, setPaymentPackages] = useState<any[]>([]);
  const [supportLinks, setSupportLinks] = useState<any[]>([]);

  // Users Tab States
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState<'all' | 'active' | 'blocked' | 'inactive'>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userTab, setUserTab] = useState<'about' | 'actions' | 'withdraws'>('about');
  const [coinsDelta, setCoinsDelta] = useState('');

  // Tasks Management sub-states
  const [taskSubTab, setTaskSubTab] = useState<'add' | 'added'>('added');
  const [taskCategoryFilter, setTaskCategoryFilter] = useState<string>('all');
  const [selectedEditTask, setSelectedEditTask] = useState<Task | null>(null);

  // Forms States - Tasks
  const [tTitle, setTTitle] = useState('');
  const [tCategory, setTCategory] = useState<'watch' | 'visit' | 'post' | 'registration' | 'joined'>('watch');
  const [tInstructions, setTInstructions] = useState('');
  const [tReward, setTReward] = useState(100);
  const [tTargetUrl, setTTargetUrl] = useState('https://');
  const [tImageUrl, setTImageUrl] = useState('https://imgBB.com/demo.png');
  const [tLabel, setTLabel] = useState('Inspect Now');
  const [tDuration, setTDuration] = useState(15);
  const [tIsUpcoming, setTIsUpcoming] = useState(false);
  const [tUpcomingMins, setTUpcomingMins] = useState(10);

  // Forms States - Payments & Custom Hierarchy
  const [mainMethods, setMainMethods] = useState<any[]>([]);
  const [selectedAddedMainId, setSelectedAddedMainId] = useState<string>('');
  const [addMethodTab, setAddMethodTab] = useState<'main' | 'sub' | 'list'>('main');
  const [addedMethodSubTab, setAddedMethodSubTab] = useState<'main' | 'sub' | 'list'>('main');

  const [newMainName, setNewMainName] = useState('');
  const [newMainPhoto, setNewMainPhoto] = useState('https://images.unsplash.com/photo-1563013544-824ae1d704d3?w=150&auto=format&fit=crop&q=80');
  const [newMainInputLabel, setNewMainInputLabel] = useState('Payout Wallet Number / Crypto Address');
  const [newMainInputPlaceholder, setNewMainInputPlaceholder] = useState('Enter your 11-digit wallet number');

  // Edit states
  const [editingMainId, setEditingMainId] = useState<string | null>(null);
  const [editMainName, setEditMainName] = useState('');
  const [editMainPhoto, setEditMainPhoto] = useState('');
  const [editMainInputLabel, setEditMainInputLabel] = useState('');
  const [editMainInputPlaceholder, setEditMainInputPlaceholder] = useState('');

  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [editSubName, setEditSubName] = useState('');
  const [editSubPhoto, setEditSubPhoto] = useState('');
  const [editSubParentId, setEditSubParentId] = useState('');

  const [editingPkgId, setEditingPkgId] = useState<string | null>(null);
  const [editPkgName, setEditPkgName] = useState('');
  const [editPkgVal, setEditPkgVal] = useState('');
  const [editPkgCoins, setEditPkgCoins] = useState(500);
  const [editPkgSubId, setEditPkgSubId] = useState('');
  const [editPkgPhoto, setEditPkgPhoto] = useState('');

  const [paySubTab, setPaySubTab] = useState<'add' | 'added'>('added');
  const [payCatFilter, setPayCatFilter] = useState<string>('all');
  const [newMethodName, setNewMethodName] = useState('');
  const [newMethodParent, setNewMethodParent] = useState(''); // Selected Main Method ID
  const [newMethodPhoto, setNewMethodPhoto] = useState('https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=120&auto=format&fit=crop&q=80');
  
  const [newPkgName, setNewPkgName] = useState('');
  const [newPkgCoins, setNewPkgCoins] = useState(500);
  const [newPkgVal, setNewPkgVal] = useState('50 BDT');
  const [newPkgSubId, setNewPkgSubId] = useState('');
  const [newPkgPhoto, setNewPkgPhoto] = useState('https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=100&auto=format&fit=crop&q=80');

  // Forms States - Support Links
  const [suppSubTab, setSuppSubTab] = useState<'add' | 'added'>('added');
  const [newSuppTitle, setNewSuppTitle] = useState('');
  const [newSuppUrl, setNewSuppUrl] = useState('https://t.me/');
  const [newSuppCat, setNewSuppCat] = useState<'telegram' | 'facebook' | 'web' | 'group'>('telegram');
  const [newSuppDesc, setNewSuppDesc] = useState('');

  // Transactions lists filter state
  const [transTab, setTransTab] = useState<'withdraws' | 'submissions'>('withdraws');
  const [withdrawFilter, setWithdrawFilter] = useState<'pending' | 'completed' | 'rejected'>('pending');
  const [submissionFilter, setSubmissionFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [fullscreenScreenshot, setFullscreenScreenshot] = useState<string | null>(null);
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [proofSearch, setProofSearch] = useState('');

  // Security & App Settings States
  const [settSubTab, setSettSubTab] = useState<'bot' | 'general' | 'password'>('general');
  const [botUsername, setBotUsername] = useState('@GoalTubeBDBot');
  const [botToken, setBotToken] = useState('784918231:AAFdB981hB8D_d98qhasd');
  const [appName, setAppName] = useState('GoalTube BD');
  const [imgbbKey, setImgbbKey] = useState('8d381hsa90da98shdn921hsa09');
  
  const [oldAdminPass, setOldAdminPass] = useState('Sayed@100');
  const [newAdminPass, setNewAdminPass] = useState('');

  // Sandbox-safe custom confirm modal state
  const [customConfirmAction, setCustomConfirmAction] = useState<{ message: string, onConfirm: () => void } | null>(null);

  // User permissions states (Requirement 4)
  const [permSearchUserId, setPermSearchUserId] = useState('');
  const [permFoundUser, setPermFoundUser] = useState<any | null>(null);
  const [permActive, setPermActive] = useState(false);
  const [permRole, setPermRole] = useState<'Maine admin' | 'Sub admin' | 'Visit admin'>('Sub admin');
  const [permPassword, setPermPassword] = useState('');

  // Game Coin Config States (Requirement 3)
  const [coinCrashMax, setCoinCrashMax] = useState(10);
  const [coinCoinflipMult, setCoinCoinflipMult] = useState(1.8);
  const [coinSlotMach, setCoinSlotMach] = useState(250);
  const [coinSpinWheelMax, setCoinSpinWheelMax] = useState(500);
  const [coinPlinkoReward, setCoinPlinkoReward] = useState(100);
  const [coinColorMatch, setCoinColorMatch] = useState(120);
  const [coinMemoryChal, setCoinMemoryChal] = useState(150);
  const [coinTictactoeWin, setCoinTictactoeWin] = useState(80);
  const [coinMatch3Reward, setCoinMatch3Reward] = useState(140);
  const [coinLootboxMin, setCoinLootboxMin] = useState(50);
  const [coinLootboxMax, setCoinLootboxMax] = useState(500);
  const [coinHomeAdReward, setCoinHomeAdReward] = useState(50);
  const [coinReferrerBonus, setCoinReferrerBonus] = useState(250);
  const [coinReferredBonus, setCoinReferredBonus] = useState(100);

  // Load all initial data from local storage or set defaults
  useEffect(() => {
    // 1. App Settings
    const botRaw = localStorage.getItem('taskx_v1_bot_settings');
    if (botRaw) {
      const bObj = JSON.parse(botRaw);
      setBotUsername(bObj.username || '');
      setBotToken(bObj.token || '');
    }
    const genRaw = localStorage.getItem('taskx_v1_general_settings');
    if (genRaw) {
      const gObj = JSON.parse(genRaw);
      setAppName(gObj.name || 'GoalTube BD');
      setImgbbKey(gObj.imgbb || '');
    }
    const savedPass = localStorage.getItem('taskx_v1_admin_password') || 'Sayed@100';
    setOldAdminPass(savedPass);

    // Load coin configurations
    const coinConfigRaw = localStorage.getItem('taskx_v1_coin_config');
    if (coinConfigRaw) {
      try {
        const cObj = JSON.parse(coinConfigRaw);
        setCoinCrashMax(cObj.crashMax ?? 10);
        setCoinCoinflipMult(cObj.coinflipMultiplier ?? 1.8);
        setCoinSlotMach(cObj.slotMach ?? 250);
        setCoinSpinWheelMax(cObj.spinWheelMax ?? 500);
        setCoinPlinkoReward(cObj.plinkoReward ?? 100);
        setCoinColorMatch(cObj.colorMatch ?? 120);
        setCoinMemoryChal(cObj.memoryChal ?? 150);
        setCoinTictactoeWin(cObj.tictactoeWin ?? 80);
        setCoinMatch3Reward(cObj.match3Reward ?? 140);
        setCoinLootboxMin(cObj.lootboxMin ?? 50);
        setCoinLootboxMax(cObj.lootboxMax ?? 500);
        setCoinHomeAdReward(cObj.homeAdReward ?? 50);
        setCoinReferrerBonus(cObj.referrerBonus ?? 250);
        setCoinReferredBonus(cObj.referredBonus ?? 100);
      } catch (e) {}
    }

    // 2. Load Users
    const usersRaw = localStorage.getItem('taskx_v1_all_users');
    if (usersRaw) {
      setAllUsers(JSON.parse(usersRaw));
    } else {
      const defaultUsers: User[] = [
        {
          id: user.id,
          name: user.name,
          username: user.username || 'sayed_pro',
          email: user.email,
          picture: user.picture,
          coins: user.coins,
          joinedAt: new Date().toLocaleDateString('bn-BD'),
          status: 'active',
          cvp: user.cvp || '123',
          cardNumber: user.cardNumber || '8840 9182 3121 0048',
          miningStartTime: user.miningStartTime || 0,
          phone: user.phone || '+8801755104443',
          password: user.password || 'sayed1234'
        },
        {
          id: 'usr_mock_1',
          name: 'Md. Rezaul Karim',
          username: 'rezaul_bd',
          email: 'rezaul@goltub.com',
          picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
          coins: 24500,
          joinedAt: '12/05/2026',
          status: 'active',
          cvp: '990',
          cardNumber: '1029 4819 4432 9901',
          miningStartTime: 0,
          phone: '+8801928374829',
          password: 'pass1'
        },
        {
          id: 'usr_mock_2',
          name: 'Anika Sultana',
          username: 'anika_dhaka',
          email: 'anika@gmail.com',
          picture: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
          coins: 340,
          joinedAt: '28/05/2026',
          status: 'inactive',
          cvp: '210',
          cardNumber: '7748 1029 9982 7701',
          miningStartTime: 0,
          phone: '+8801874221199',
          password: 'pass2'
        },
        {
          id: 'usr_mock_3',
          name: 'Fahad Ahmed',
          username: 'fahad_game',
          email: 'fahad@goltub.com',
          picture: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&auto=format&fit=crop&q=80',
          coins: 1050,
          joinedAt: '01/06/2026',
          status: 'blocked',
          cvp: '344',
          cardNumber: '2283 9102 3810 5591',
          miningStartTime: 0,
          phone: '+8801552881122',
          password: 'pass3'
        }
      ];
      setAllUsers(defaultUsers);
      localStorage.setItem('taskx_v1_all_users', JSON.stringify(defaultUsers));
    }

    // 3. Submissions
    const savedSubs = localStorage.getItem('taskx_v1_task_submissions');
    if (savedSubs) {
      setSubmissions(JSON.parse(savedSubs));
    } else {
      const demoSubs: TaskSubmission[] = [
        {
          id: 'sub_demo_1',
          taskId: 'task_register_wallet',
          userId: 'usr_mock_1',
          screenshotUrls: ['https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=400&auto=format&fit=crop&q=80'],
          idLink: 'https://t.me/rezaul_bd',
          status: 'pending',
          submittedAt: Date.now() - 3600000 * 2,
        },
      ];
      setSubmissions(demoSubs);
      localStorage.setItem('taskx_v1_task_submissions', JSON.stringify(demoSubs));
    }

    // 4. Withdrawals
    const savedTx = localStorage.getItem('taskx_v1_transactions') || '[]';
    const parsedTx: Transaction[] = JSON.parse(savedTx);
    setWithdrawals(parsedTx.filter((t) => t.type === 'withdraw'));

    // 5. Maine Methods, Payment Methods & Packages
    const savedMainVal = localStorage.getItem('taskx_v1_main_methods');
    const defaultMain = [
      { id: 'm_mobile', name: 'Mobile Banking', photoUrl: 'https://images.unsplash.com/photo-1563013544-824ae1d704d3?w=150&auto=format&fit=crop&q=80' },
      { id: 'm_crypto', name: 'Crypto Wallets', photoUrl: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=150&auto=format&fit=crop&q=80' },
      { id: 'm_game_diamonds', name: 'Diamonds & UC Topups', photoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80' }
    ];
    let initialMains = defaultMain;
    if (savedMainVal) {
      initialMains = JSON.parse(savedMainVal);
      setMainMethods(initialMains);
    } else {
      setMainMethods(defaultMain);
      localStorage.setItem('taskx_v1_main_methods', JSON.stringify(defaultMain));
    }
    if (initialMains.length > 0) {
      setSelectedAddedMainId(initialMains[0].id);
      setNewMethodParent(initialMains[0].id);
    }

    const savedMethodsVal = localStorage.getItem('taskx_v1_payment_methods');
    const defaultMethods = [
      { id: 'sub_bkash', parentId: 'm_mobile', name: 'bKash Cashout', photoUrl: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=120&auto=format&fit=crop&q=80' },
      { id: 'sub_nagad', parentId: 'm_mobile', name: 'Nagad Payout', photoUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=120&auto=format&fit=crop&q=80' },
      { id: 'sub_usdt', parentId: 'm_crypto', name: 'USDT TRC20 Token', photoUrl: 'https://images.unsplash.com/photo-1622630998477-20aa696ecb05?w=120&auto=format&fit=crop&q=80' },
      { id: 'sub_ff', parentId: 'm_game_diamonds', name: 'Free Fire Diamonds', photoUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=120&auto=format&fit=crop&q=80' }
    ];
    let initialSubs = defaultMethods;
    if (savedMethodsVal) {
      initialSubs = JSON.parse(savedMethodsVal);
      setPaymentMethods(initialSubs);
    } else {
      setPaymentMethods(defaultMethods);
      localStorage.setItem('taskx_v1_payment_methods', JSON.stringify(defaultMethods));
    }
    if (initialSubs.length > 0) {
      setNewPkgSubId(initialSubs[0].id);
    }

    const savedPkgsVal = localStorage.getItem('taskx_v1_payment_packages');
    const defaultPkgs = [
      { id: 'p_bkash_1', subId: 'sub_bkash', packageName: 'bKash Premium Wallet', coinCost: 1000, equivalentValue: '100 BDT Cash', photoUrl: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=100&auto=format&fit=crop&q=80' },
      { id: 'p_nagad_1', subId: 'sub_nagad', packageName: 'Nagad Economy Pack', coinCost: 500, equivalentValue: '50 BDT Money', photoUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=100&auto=format&fit=crop&q=80' }
    ];
    if (savedPkgsVal) {
      setPaymentPackages(JSON.parse(savedPkgsVal));
    } else {
      setPaymentPackages(defaultPkgs);
      localStorage.setItem('taskx_v1_payment_packages', JSON.stringify(defaultPkgs));
    }

    // 6. Support links
    const savedLinks = localStorage.getItem('taskx_v1_support_links');
    const defaultLinks = [
      { id: 'lnk_1', title: 'Official Telegram Channel', url: 'https://t.me/goaltub_bd', category: 'telegram', description: 'Join to get all recent updates.' },
      { id: 'lnk_2', title: 'Helpline Facebook Page', url: 'https://facebook.com/goaltub_bd', category: 'facebook', description: 'Message us for any assistance.' }
    ];
    if (savedLinks) {
      setSupportLinks(JSON.parse(savedLinks));
    } else {
      setSupportLinks(defaultLinks);
      localStorage.setItem('taskx_v1_support_links', JSON.stringify(defaultLinks));
    }
  }, []);

  // Save utility triggers
  const saveAllUsers = (newUsers: User[]) => {
    setAllUsers(newUsers);
    localStorage.setItem('taskx_v1_all_users', JSON.stringify(newUsers));
  };

  const saveSubmissions = (newList: TaskSubmission[]) => {
    setSubmissions(newList);
    localStorage.setItem('taskx_v1_task_submissions', JSON.stringify(newList));
  };

  const saveTransactions = (newList: Transaction[]) => {
    localStorage.setItem('taskx_v1_transactions', JSON.stringify(newList));
    setWithdrawals(newList.filter((t) => t.type === 'withdraw'));
  };

  // 1. User Actions Handlers
  const handleExportUsers = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allUsers, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `goaltube_users_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      alert('All user data has been successfully saved to a JSON file!');
    } catch {
      alert('Failed to export data. Please try again.');
    }
  };

  const handleUpdateCoins = () => {
    if (!selectedUser || !coinsDelta) return;
    const amount = parseInt(coinsDelta);
    if (isNaN(amount)) {
      alert('Please enter a valid number!');
      return;
    }
    const updated = allUsers.map(u => {
      if (u.id === selectedUser.id) {
        const nextCoins = Math.max(0, u.coins + amount);
        // Sync if logged-in user
        if (u.id === user.id) onAddCoins(amount, 'Coins adjusted from the Admin Panel.');
        return { ...u, coins: nextCoins };
      }
      return u;
    });
    saveAllUsers(updated);
    setSelectedUser({ ...selectedUser, coins: Math.max(0, selectedUser.coins + amount) });
    setCoinsDelta('');
    alert(`User balance updated successfully! (${amount >= 0 ? '+' : ''}${amount} 🪙)`);
  };

  const handleBlockUser = () => {
    if (!selectedUser) return;
    const isCurrentlyBlocked = selectedUser.status === 'blocked';
    const nextStatus = isCurrentlyBlocked ? 'active' : 'blocked';
    const updated = allUsers.map(u => {
      if (u.id === selectedUser.id) return { ...u, status: nextStatus };
      return u;
    });
    saveAllUsers(updated);
    setSelectedUser({ ...selectedUser, status: nextStatus });
    alert(isCurrentlyBlocked ? 'User has been successfully activated and unblocked!' : 'User account has been successfully blocked!');
  };

  const handleDeleteUser = () => {
    if (!checkWriteAccess()) return;
    if (!selectedUser) return;
    if (selectedUser.id === user.id) {
      alert('You cannot delete your own account!');
      return;
    }
    setCustomConfirmAction({
      message: 'Are you sure you want to delete this user? This action cannot be undone!',
      onConfirm: () => {
        const updated = allUsers.filter(u => u.id !== selectedUser.id);
        saveAllUsers(updated);
        setSelectedUser(null);
        alert('User has been deleted successfully.');
      }
    });
  };

  // 2. Submission approval
  const handleApproveSub = (subId: string, simulateHacker = false) => {
    const subIndex = submissions.findIndex(s => s.id === subId);
    if (subIndex === -1) return;
    const listCopy = [...submissions];
    const item = listCopy[subIndex];
    item.status = 'approved';
    item.approvedBy = simulateHacker ? 'spoofed_bypass_node' : 'admin_sayed';
    item.approvedAt = Date.now();
    
    // Process optional admin feedback note if typed
    const note = adminNotes[subId]?.trim();
    if (note) {
      item.adminNote = note;
    }
    
    saveSubmissions(listCopy);

    // Reward coins dynamically to that user in allUsers list
    const updatedUsers = allUsers.map(u => {
      if (u.id === item.userId) {
        const taskObj = tasks.find(t => t.id === item.taskId);
        const reward = taskObj?.rewardCoins || 100;
        if (u.id === user.id) onAddCoins(reward, `Task completion reward: ${taskObj?.title || 'Sponsor Task'}`);
        return { ...u, coins: u.coins + reward };
      }
      return u;
    });
    saveAllUsers(updatedUsers);

    onAddNotification({
      type: 'task',
      title: simulateHacker ? 'Double verification failed alert' : 'Task proof approved!',
      description: simulateHacker ? `Blocked script bypass attempt` : `Proof for Task ID: ${item.taskId} has been successfully approved.`
    });

    alert(simulateHacker ? 'Hacker simulation confirmed. Customer firewall blocking security active!' : 'Screenshot verified successfully! Coins have been credited to the user wallet.');
  };

  const handleRejectSub = (subId: string) => {
    const note = adminNotes[subId]?.trim();
    const reason = note || rejectionReasons[subId]?.trim() || 'Proof is incorrect / Invalid screenshot uploaded';
    const subIndex = submissions.findIndex(s => s.id === subId);
    if (subIndex === -1) return;
    
    const listCopy = [...submissions];
    listCopy[subIndex].status = 'rejected';
    listCopy[subIndex].rejectionReason = reason;
    listCopy[subIndex].adminNote = reason; // ensure user gets feedback note immediately
    saveSubmissions(listCopy);
    alert(`Proof rejected because: ${reason}`);
  };

  // 3. Withdrawal triggers
  const handleApproveWithdraw = (txId: string) => {
    const savedTxRaw = localStorage.getItem('taskx_v1_transactions') || '[]';
    const parsed: Transaction[] = JSON.parse(savedTxRaw);
    const txIndex = parsed.findIndex(t => t.id === txId);
    if (txIndex === -1) return;
    
    parsed[txIndex].status = 'completed';
    saveTransactions(parsed);

    // Notify user
    onAddNotification({
      type: 'withdraw',
      title: 'Withdrawal Order Completed!',
      description: `Your payout of ${parsed[txIndex].targetName} has been successfully processed.`
    });
    alert('Withdrawal request completed and paid successfully!');
  };

  const handleRejectWithdraw = (txId: string) => {
    const savedTxRaw = localStorage.getItem('taskx_v1_transactions') || '[]';
    const parsed: Transaction[] = JSON.parse(savedTxRaw);
    const txIndex = parsed.findIndex(t => t.id === txId);
    if (txIndex === -1) return;
    
    parsed[txIndex].status = 'rejected';
    const refundedCoins = parsed[txIndex].amount;
    const targetDetails = parsed[txIndex].targetDetails || '';
    const targetUsrId = targetDetails.split(':')[0] || ''; // try find ID

    // Refund coins of user
    const updatedUsrs = allUsers.map(u => {
      // Just match current user if ID matches or is logged-in info
      if (u.id === user.id || u.username === parsed[txIndex].targetName) {
        if (u.id === user.id) onAddCoins(refundedCoins, 'Withdrawal Rejected Refund');
        return { ...u, coins: u.coins + refundedCoins };
      }
      return u;
    });
    saveAllUsers(updatedUsrs);
    saveTransactions(parsed);

    alert(`Withdrawal has been rejected and ${refundedCoins} coins returned to user balance.`);
  };

  // 4. Tasks Forms Handlers
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tTitle.trim() || !tInstructions.trim()) {
      alert('Please fill out all fields correctly!');
      return;
    }
    const upcomingReleaseTimestamp = tIsUpcoming ? (Date.now() + tUpcomingMins * 60 * 1000) : undefined;
    const newTask: Task = {
      id: `task_${Date.now()}`,
      title: tTitle.trim(),
      taskType: tCategory,
      instructions: tInstructions.trim(),
      rewardCoins: tReward,
      imageUrl: tImageUrl.trim(),
      targetUrl: tTargetUrl.trim(),
      buttonLabel: tLabel.trim(),
      durationSeconds: tDuration,
      upcomingReleaseTimestamp
    };

    onAddTask(newTask);
    alert(`New sponsor task "${tTitle}" has been successfully added!`);
    
    // reset form
    setTTitle('');
    setTInstructions('');
    setTReward(100);
    setTTargetUrl('https://');
    setTLabel('Inspect Now');
    setTIsUpcoming(false);
  };

  const handleDeleteTask = (taskId: string) => {
    if (!checkWriteAccess()) return;
    setCustomConfirmAction({
      message: 'Are you sure you want to delete this task completely?',
      onConfirm: () => {
        const filtered = tasks.filter(t => t.id !== taskId);
        if (onUpdateTasks) onUpdateTasks(filtered);
        alert('Task deleted successfully.');
      }
    });
  };

  // 5. Upgraded Payments Forms & Custom Hierarchy Handlers

  // --- Main Methods ---
  const handleAddMainMethod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMainName.trim()) {
      alert('Main Payout Category name is required!');
      return;
    }
    const newMain = {
      id: `main_${Date.now()}`,
      name: newMainName.trim(),
      photoUrl: newMainPhoto.trim() || 'https://images.unsplash.com/photo-1563013544-824ae1d704d3?w=150&auto=format&fit=crop&q=80',
      inputLabel: newMainInputLabel.trim() || 'Payout Wallet Number / Crypto Address',
      inputPlaceholder: newMainInputPlaceholder.trim() || 'Enter your 11-digit wallet number'
    };
    const updated = [...mainMethods, newMain];
    setMainMethods(updated);
    localStorage.setItem('taskx_v1_main_methods', JSON.stringify(updated));
    setNewMainName('');
    setNewMainPhoto('https://images.unsplash.com/photo-1563013544-824ae1d704d3?w=150&auto=format&fit=crop&q=80');
    setNewMainInputLabel('Payout Wallet Number / Crypto Address');
    setNewMainInputPlaceholder('Enter your 11-digit wallet number');
    
    // Automatically set parent selection is first created
    if (!newMethodParent) {
      setNewMethodParent(newMain.id);
    }
    if (!selectedAddedMainId) {
      setSelectedAddedMainId(newMain.id);
    }

    alert('Main Category created successfully!');
  };

  const handleUpdateMainMethod = (id: string) => {
    if (!editMainName.trim()) {
      alert('Name cannot be empty!');
      return;
    }
    const updated = mainMethods.map(m => m.id === id ? { 
      ...m, 
      name: editMainName.trim(), 
      photoUrl: editMainPhoto.trim(),
      inputLabel: editMainInputLabel.trim() || 'Payout Wallet Number / Crypto Address',
      inputPlaceholder: editMainInputPlaceholder.trim() || 'Enter your 11-digit wallet number'
    } : m);
    setMainMethods(updated);
    localStorage.setItem('taskx_v1_main_methods', JSON.stringify(updated));
    setEditingMainId(null);
    alert('Main Category updated successfully!');
  };

  const handleDeleteMainMethod = (id: string) => {
    if (!checkWriteAccess()) return;
    setCustomConfirmAction({
      message: 'Are you sure you want to delete this Main Category? All Sub and List Methods under it will also be deleted!',
      onConfirm: () => {
        const remainingMains = mainMethods.filter(m => m.id !== id);
        setMainMethods(remainingMains);
        localStorage.setItem('taskx_v1_main_methods', JSON.stringify(remainingMains));

        // Cascade delete sub methods
        const subsToDelete = paymentMethods.filter(sub => sub.parentId === id).map(sub => sub.id);
        const remainingSubs = paymentMethods.filter(sub => sub.parentId !== id);
        setPaymentMethods(remainingSubs);
        localStorage.setItem('taskx_v1_payment_methods', JSON.stringify(remainingSubs));

        // Cascade delete list methods (packages)
        const remainingPkgs = paymentPackages.filter(pkg => !subsToDelete.includes(pkg.subId));
        setPaymentPackages(remainingPkgs);
        localStorage.setItem('taskx_v1_payment_packages', JSON.stringify(remainingPkgs));

        // reset selections if needed
        if (selectedAddedMainId === id) {
          setSelectedAddedMainId(remainingMains[0]?.id || '');
        }
        if (newMethodParent === id) {
          setNewMethodParent(remainingMains[0]?.id || '');
        }

        alert('Main Category and all related Sub & List Methods deleted successfully!');
      }
    });
  };

  // --- Sub Methods ---
  const handleAddPaymentMethod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMethodName.trim()) {
      alert('Please specify the Sub method brand name!');
      return;
    }
    const parentId = newMethodParent || (mainMethods[0]?.id || '');
    if (!parentId) {
      alert('Please create a Main Category first before adding a Sub method brand!');
      return;
    }

    const newSub = {
      id: `sub_${Date.now()}`,
      parentId: parentId,
      name: newMethodName.trim(),
      photoUrl: newMethodPhoto.trim() || 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=120&auto=format&fit=crop&q=80'
    };
    const updated = [...paymentMethods, newSub];
    setPaymentMethods(updated);
    localStorage.setItem('taskx_v1_payment_methods', JSON.stringify(updated));
    setNewMethodName('');
    setNewMethodPhoto('https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=120&auto=format&fit=crop&q=80');

    if (!newPkgSubId) {
      setNewPkgSubId(newSub.id);
    }

    alert('Sub Method brand created successfully!');
  };

  const handleUpdatePaymentMethod = (id: string) => {
    if (!editSubName.trim()) {
      alert('Brand name cannot be empty!');
      return;
    }
    const updated = paymentMethods.map(sub => sub.id === id ? { 
      ...sub, 
      name: editSubName.trim(), 
      photoUrl: editSubPhoto.trim(), 
      parentId: editSubParentId 
    } : sub);
    setPaymentMethods(updated);
    localStorage.setItem('taskx_v1_payment_methods', JSON.stringify(updated));
    setEditingSubId(null);
    alert('Sub method brand updated successfully!');
  };

  const handleDeletePayMethod = (id: string) => {
    if (!checkWriteAccess()) return;
    setCustomConfirmAction({
      message: 'Are you sure you want to delete this Sub Method and all its list packages?',
      onConfirm: () => {
        const filteredM = paymentMethods.filter(m => m.id !== id);
        const filteredP = paymentPackages.filter(p => p.subId !== id);
        setPaymentMethods(filteredM);
        setPaymentPackages(filteredP);
        localStorage.setItem('taskx_v1_payment_methods', JSON.stringify(filteredM));
        localStorage.setItem('taskx_v1_payment_packages', JSON.stringify(filteredP));
        
        if (newPkgSubId === id) {
          setNewPkgSubId(filteredM[0]?.id || '');
        }

        alert('Sub-method and all its associated packages deleted successfully!');
      }
    });
  };

  // --- List Methods (Packages) ---
  const handleAddPackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPkgName.trim()) {
      alert('Please specify the package name!');
      return;
    }
    const subId = newPkgSubId || (paymentMethods[0]?.id || '');
    if (!subId) {
      alert('Please create a Sub method brand first before adding a payout Package!');
      return;
    }

    // Inherit sub method photoUrl or fallback
    const parentSub = paymentMethods.find(s => s.id === subId);
    const pkgPhoto = newPkgPhoto.trim() || parentSub?.photoUrl || 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=100&auto=format&fit=crop&q=80';

    const updated = [...paymentPackages, {
      id: `pkg_${Date.now()}`,
      subId,
      packageName: newPkgName.trim(),
      coinCost: newPkgCoins,
      equivalentValue: newPkgVal.trim(),
      photoUrl: pkgPhoto
    }];
    setPaymentPackages(updated);
    localStorage.setItem('taskx_v1_payment_packages', JSON.stringify(updated));
    setNewPkgName('');
    alert('Withdrawal package (List Method) has been successfully added!');
  };

  const handleUpdatePackage = (id: string) => {
    if (!editPkgName.trim()) {
      alert('Package name cannot be empty!');
      return;
    }
    const updated = paymentPackages.map(pkg => pkg.id === id ? {
      ...pkg,
      packageName: editPkgName.trim(),
      equivalentValue: editPkgVal.trim(),
      coinCost: editPkgCoins,
      subId: editPkgSubId,
      photoUrl: editPkgPhoto.trim()
    } : pkg);
    setPaymentPackages(updated);
    localStorage.setItem('taskx_v1_payment_packages', JSON.stringify(updated));
    setEditingPkgId(null);
    alert('Package updated successfully!');
  };

  const handleDeletePackage = (id: string) => {
    if (!checkWriteAccess()) return;
    setCustomConfirmAction({
      message: 'Are you sure you want to delete this payout Package?',
      onConfirm: () => {
        const filtered = paymentPackages.filter(p => p.id !== id);
        setPaymentPackages(filtered);
        localStorage.setItem('taskx_v1_payment_packages', JSON.stringify(filtered));
        alert('Payment package deleted successfully.');
      }
    });
  };

  // 6. Support Links Handlers
  const handleAddSupportLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkWriteAccess()) return;
    if (!newSuppTitle.trim() || !newSuppUrl.trim()) return;
    const updated = [...supportLinks, {
      id: `lnk_${Date.now()}`,
      title: newSuppTitle.trim(),
      url: newSuppUrl.trim(),
      category: newSuppCat,
      description: newSuppDesc.trim()
    }];
    setSupportLinks(updated);
    localStorage.setItem('taskx_v1_support_links', JSON.stringify(updated));
    setNewSuppTitle('');
    alert('Support link listed successfully!');
  };

  const handleDeleteSupportLink = (id: string) => {
    if (!checkWriteAccess()) return;
    setCustomConfirmAction({
      message: 'Are you sure you want to delete this link?',
      onConfirm: () => {
        const filtered = supportLinks.filter(l => l.id !== id);
        setSupportLinks(filtered);
        localStorage.setItem('taskx_v1_support_links', JSON.stringify(filtered));
        alert('Support link deleted successfully.');
      }
    });
  };

  // 6.5 Coin Configuration Handlers (Requirement 3)
  const handleSaveCoinConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkWriteAccess()) return;

    const config = {
      crashMax: coinCrashMax,
      coinflipMultiplier: coinCoinflipMult,
      slotMach: coinSlotMach,
      spinWheelMax: coinSpinWheelMax,
      plinkoReward: coinPlinkoReward,
      colorMatch: coinColorMatch,
      memoryChal: coinMemoryChal,
      tictactoeWin: coinTictactoeWin,
      match3Reward: coinMatch3Reward,
      lootboxMin: coinLootboxMin,
      lootboxMax: coinLootboxMax,
      homeAdReward: coinHomeAdReward,
      referrerBonus: coinReferrerBonus,
      referredBonus: coinReferredBonus
    };

    localStorage.setItem('taskx_v1_coin_config', JSON.stringify(config));
    alert('Game Coin Configurations saved successfully!');
  };

  // 6.6 User Permission Handlers (Requirement 4)
  const handleSearchUserForPermissions = () => {
    if (!permSearchUserId.trim()) {
      alert('Please enter a User ID first!');
      return;
    }
    
    const usersRaw = localStorage.getItem('taskx_v1_all_users');
    const users = usersRaw ? JSON.parse(usersRaw) : [];
    
    const found = users.find((u: any) => u.id === permSearchUserId.trim() || u.username === permSearchUserId.trim());
    
    if (!found) {
      alert('No user found with this User ID or Username!');
      setPermFoundUser(null);
      return;
    }
    
    setPermFoundUser(found);
    
    const permissionsStr = localStorage.getItem('taskx_v1_admin_permissions') || '{}';
    const permissions = JSON.parse(permissionsStr);
    
    const perm = permissions[found.id];
    if (perm) {
      setPermActive(true);
      setPermRole(perm.role || 'Sub admin');
      setPermPassword(perm.password || '');
    } else {
      setPermActive(false);
      setPermRole('Sub admin');
      setPermPassword('');
    }
  };

  const handleSaveUserPermissions = () => {
    if (!checkWriteAccess()) return;
    if (loggedAdminRole !== 'Maine admin') {
      alert('Action Denied! Only Maine Admin can configure system access permissions.');
      return;
    }
    if (!permFoundUser) {
      alert('Please search and find a user first!');
      return;
    }
    if (!permPassword.trim()) {
      alert('Please enter an admin passcode for this user!');
      return;
    }
    
    const permissionsStr = localStorage.getItem('taskx_v1_admin_permissions') || '{}';
    const permissions = JSON.parse(permissionsStr);
    
    permissions[permFoundUser.id] = {
      role: permRole,
      password: permPassword.trim()
    };
    
    localStorage.setItem('taskx_v1_admin_permissions', JSON.stringify(permissions));
    alert(`Success! Admin permissions granted for ${permFoundUser.name} as ${permRole}.`);
  };

  const handleRevokeUserPermissions = () => {
    if (!checkWriteAccess()) return;
    if (loggedAdminRole !== 'Maine admin') {
      alert('Action Denied! Only Maine Admin can configure system access permissions.');
      return;
    }
    if (!permFoundUser) return;
    
    const permissionsStr = localStorage.getItem('taskx_v1_admin_permissions') || '{}';
    const permissions = JSON.parse(permissionsStr);
    
    delete permissions[permFoundUser.id];
    
    localStorage.setItem('taskx_v1_admin_permissions', JSON.stringify(permissions));
    setPermActive(false);
    setPermPassword('');
    alert(`Admin access permissions successfully revoked for ${permFoundUser.name}.`);
  };

  // 7. Security Settings Handlers
  const handleSaveBot = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('taskx_v1_bot_settings', JSON.stringify({ username: botUsername, token: botToken }));
    alert('Telegram bot configuration updated successfully!');
  };

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('taskx_v1_general_settings', JSON.stringify({ name: appName, imgbb: imgbbKey }));
    alert('Application general settings updated successfully!');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminPass.trim()) {
      alert('Please enter a new password!');
      return;
    }
    localStorage.setItem('taskx_v1_admin_password', newAdminPass.trim());
    setOldAdminPass(newAdminPass.trim());
    setNewAdminPass('');
    alert('Admin security lock password changed successfully!');
  };

  // Computations for dashboard statistics
  const totalCoinsSum = allUsers.reduce((acc, u) => acc + u.coins, 0);
  const pendingSubCount = submissions.filter(s => s.status === 'pending').length;
  const pendingWithCount = withdrawals.filter(w => w.status === 'pending').length;
  const activeTasksCount = tasks.length;

  // Filtered users list
  const filteredUsers = allUsers.filter(u => {
    const sTerm = userSearch.toLowerCase();
    const name = u.name || '';
    const username = u.username || '';
    const uid = u.id || '';
    const email = u.email || '';
    const phone = u.phone || '';
    const matchesSearch = name.toLowerCase().includes(sTerm) || 
                          username.toLowerCase().includes(sTerm) || 
                          uid.toLowerCase().includes(sTerm) || 
                          (phone && phone.includes(sTerm)) ||
                          email.toLowerCase().includes(sTerm);
    
    if (userFilter === 'active') return matchesSearch && u.status === 'active';
    if (userFilter === 'blocked') return matchesSearch && u.status === 'blocked';
    if (userFilter === 'inactive') return matchesSearch && u.status === 'inactive';
    return matchesSearch;
  });

  return (
    <div className="w-full min-h-screen bg-[#0A0A0C] text-slate-100 flex flex-col relative pb-10">
      {/* Top Action & Navigation Bar */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3 px-4 pt-1 mb-4 z-20">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center hover:bg-indigo-500/20 text-indigo-400 transition-all cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <span className="text-[9px] text-[#ffb020] font-extrabold tracking-widest uppercase block animate-pulse">ADMIN CONTROL SERVER</span>
            <h2 className="text-sm font-black text-slate-100 uppercase tracking-tight leading-none pt-0.5">{appName}</h2>
          </div>
        </div>

        <button
          onClick={onBack}
          className="w-9 h-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10 text-slate-300 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Slide-out Sidebar Drawer Layout */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Dark Dimmer Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black z-50 cursor-pointer"
            />

            {/* Premium Sidebar Content */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 bottom-0 left-0 w-72 bg-[#121216] border-r border-white/10 p-5 z-50 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-5">
                  <div className="flex items-center gap-2">
                    <img src="https://telegram.org/img/t_logo.png" className="w-7 h-7 rounded-lg" alt="TL" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-100">System Navigation</h3>
                  </div>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1.5">
                  {[
                    { id: 'dashboard', label: 'Dashboard', icon: Activity, desc: 'System overview and live statistics' },
                    { id: 'users', label: 'User Manager', icon: Users, desc: 'Manage client accounts and balances' },
                    { id: 'resource_center', label: 'Resource Center', icon: Cpu, desc: 'Manage tasks, payments and support channels' },
                    { id: 'settings', label: 'Security & Settings', icon: Settings, desc: 'Configure bot API and admin security lock' }
                  ].map((m) => {
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.id}
                        onClick={() => {
                          setActiveTab(m.id as any);
                          setSidebarOpen(false);
                          setResSubPage('none');
                          setControlCenterPage('none');
                        }}
                        className={`w-full p-3.5 rounded-2xl text-left transition-all relative flex items-center gap-3 border ${
                          activeTab === m.id 
                            ? 'bg-indigo-600/10 border-indigo-500/30 text-white shadow-lg' 
                            : 'bg-[#18181F] border-transparent text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <div className={`p-2 rounded-xl shrink-0 ${activeTab === m.id ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-400'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold block leading-tight">{m.label}</span>
                          <span className="text-[9px] text-white/30 block capitalize leading-none pt-0.5">{m.id.replace('_', ' ')}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="bg-[#181822] p-3 rounded-2xl border border-white/5 text-center">
                <ShieldAlert className="w-5 h-5 text-indigo-400 mx-auto mb-1 animate-pulse" />
                <span className="text-[9px] text-white/40 block font-bold">LOGGED IN ADMIN</span>
                <span className="text-xs font-black text-slate-200 mt-1 block tracking-wide">{user.name}</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="max-w-md w-full mx-auto px-4 flex-1">
        
        {/* ======================= TAB 1: DASHBOARD ======================= */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4">
            <h3 className="text-xs font-black tracking-wider text-indigo-400 uppercase text-left">Live Server Logs & Dashboard</h3>
            
            {/* Colorful & Interactive Grid Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#121216] border border-white/5 p-3 rounded-3xl relative overflow-hidden group hover:border-indigo-500/30 transition-all duration-300">
                <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 rounded-full blur-xl group-hover:bg-indigo-500/10 transition-colors" />
                <Users className="w-5 h-5 text-indigo-400 mb-2" />
                <span className="text-[9px] text-white/40 font-bold uppercase tracking-widest block">Total Users</span>
                <span className="text-xl font-black text-slate-100 font-mono mt-0.5 block">{allUsers.length}</span>
              </div>

              <div className="bg-[#121216] border border-white/5 p-3 rounded-3xl relative overflow-hidden group hover:border-amber-500/30 transition-shadow duration-300">
                <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-full blur-xl group-hover:bg-amber-500/10 transition-colors" />
                <Bookmark className="w-5 h-5 text-amber-500 mb-2" />
                <span className="text-[9px] text-white/40 font-bold uppercase tracking-widest block">Active Tasks</span>
                <span className="text-xl font-black text-slate-100 font-mono mt-0.5 block">{activeTasksCount}</span>
              </div>

              <div className="bg-[#121216] border border-white/5 p-3 rounded-3xl relative overflow-hidden group hover:border-purple-500/30 transition-all">
                <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/5 rounded-full blur-xl" />
                <FileText className="w-5 h-5 text-purple-400 mb-2" />
                <span className="text-[9px] text-white/40 font-bold uppercase tracking-widest block">Submissions</span>
                <span className="text-xl font-black text-slate-100 font-mono mt-0.5 block">{submissions.length}</span>
                {pendingSubCount > 0 && (
                  <span className="text-[8px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded font-black mt-1 inline-block font-mono animate-bounce">{pendingSubCount} PENDING</span>
                )}
              </div>

              <div className="bg-[#121216] border border-white/5 p-3 rounded-3xl relative overflow-hidden group hover:border-[#10b981]/30 transition-all">
                <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl" />
                <Landmark className="w-5 h-5 text-[#10b981] mb-2" />
                <span className="text-[9px] text-white/40 font-bold uppercase tracking-widest block">Withdraw Orders</span>
                <span className="text-xl font-black text-slate-100 font-mono mt-0.5 block">{downloadsUrlCount(withdrawals)}</span>
                {pendingWithCount > 0 && (
                  <span className="text-[8px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-black mt-1 inline-block font-mono animate-pulse">{pendingWithCount} PENDING</span>
                )}
              </div>
            </div>

            {/* Glowing Large Stat Panel */}
            <div className="bg-gradient-to-r from-indigo-700/10 via-indigo-600/5 to-cyan-500/10 border border-white/10 rounded-3xl p-5 text-center relative overflow-hidden">
              <div className="absolute bottom-0 right-6 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl" />
              <Coins className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <span className="text-[10px] text-white/40 uppercase tracking-widest font-black block">Total Coins Circulated</span>
              <span className="text-3xl font-black text-amber-400 font-mono tracking-tight mt-1 block">
                {totalCoinsSum.toLocaleString()} <span className="text-xs text-slate-400">🪙</span>
              </span>
            </div>

            {/* Quick Actions Shortcuts */}
            <div className="bg-[#141418] border border-white/5 p-4 rounded-3xl space-y-3">
              <span className="text-[10px] text-white/30 uppercase tracking-widest font-black block text-left">Shortcut Quick Actions</span>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => { setActiveTab('users'); setSelectedUser(null); }}
                  className="p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-left cursor-pointer transition-all flex items-center justify-between"
                >
                  <span className="text-[11px] font-bold">Check Users</span>
                  <ChevronRight className="w-4 h-4 text-white/35" />
                </button>
                <button
                  onClick={() => { setActiveTab('resource_center'); setResSubPage('transactions'); setTransTab('submissions'); }}
                  className="p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-left cursor-pointer transition-all flex items-center justify-between"
                >
                  <span className="text-[11px] font-bold">Task Submissions</span>
                  <ChevronRight className="w-4 h-4 text-white/35" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================= TAB 2: USERS MANAGER ======================= */}
        {activeTab === 'users' && !selectedUser && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black tracking-wider text-indigo-400 uppercase text-left">Customer Accounts & User Control</h3>
              <button
                onClick={handleExportUsers}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-[10px] uppercase tracking-wider font-extrabold cursor-pointer transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                Export Users
              </button>
            </div>

            {/* Search Bar & Status Filters */}
            <div className="space-y-2.5">
              <div className="bg-[#121216] border border-white/10 rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5">
                <Search className="w-4 h-4 text-white/35 shrink-0" />
                <input
                  type="text"
                  placeholder="Search by name, username, ID, or phone..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="bg-transparent text-sm text-slate-100 outline-none w-full"
                />
              </div>

              {/* Filtering Buttons */}
              <div className="flex gap-1 bg-[#121216]/60 p-1 border border-white/5 rounded-xl overflow-x-auto">
                {[
                  { id: 'all', label: 'All Users' },
                  { id: 'active', label: 'Active User' },
                  { id: 'blocked', label: 'Block User' },
                  { id: 'inactive', label: 'UnActive User' }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setUserFilter(f.id as any)}
                    className={`py-1.5 px-3.5 rounded-lg text-[9px] font-black uppercase tracking-wider shrink-0 transition-all cursor-pointer ${
                      userFilter === f.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* User List Panel */}
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] text-white/30 px-1 font-bold">
                <span>User Identity</span>
                <span>Action</span>
              </div>

              {filteredUsers.length === 0 ? (
                <div className="p-10 text-center bg-[#121216] border border-white/5 rounded-3xl">
                  <AlertTriangle className="w-8 h-8 text-amber-500/20 mx-auto mb-2" />
                  <span className="text-[11px] text-white/30 block">No users found matching your search.</span>
                </div>
              ) : (
                filteredUsers.map((u) => (
                  <div key={u.id} className="bg-[#121216] border border-white/5 p-3.5 rounded-2xl flex items-center justify-between hover:border-white/10 transition-all">
                    <div className="flex items-center gap-3">
                      <img src={u.picture || 'https://telegram.org/img/t_logo.png'} alt={u.name} className="w-10 h-10 rounded-full object-cover border border-white/10" />
                      <div className="text-left">
                        <span className="text-[10px] text-white/30 block font-mono">ID: {u.id}</span>
                        <h4 className="text-xs font-black text-slate-100 leading-tight">{u.name}</h4>
                        <div className="flex items-center gap-1.5 mt-1 leading-none-div">
                          <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded leading-none ${
                            u.status === 'blocked' ? 'bg-red-500/20 text-red-400 border border-red-500/10' :
                            u.status === 'inactive' ? 'bg-amber-500/20 text-amber-400' : 'bg-green-500/20 text-green-400'
                          }`}>
                            {u.status}
                          </span>
                          <span className="text-[9px] text-amber-500 font-bold font-mono">{u.coins.toLocaleString()} 🪙</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => { setSelectedUser(u); setUserTab('about'); }}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl cursor-pointer transition-all leading-none"
                    >
                      View
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* User Details Modal page when user profile is selected */}
        {activeTab === 'users' && selectedUser && (
          <div className="space-y-4">
            <div className="bg-[#121216] border border-white/5 p-4 rounded-3xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={selectedUser.picture || 'https://telegram.org/img/t_logo.png'} alt={selectedUser.name} className="w-12 h-12 rounded-full object-cover border border-indigo-500/20" />
                <div className="text-left">
                  <h3 className="text-xs font-black text-slate-100">{selectedUser.name}</h3>
                  <span className="text-[9px] text-white/30 block tracking-wider uppercase">User ID: {selectedUser.id}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] uppercase font-bold cursor-pointer"
              >
                Close
              </button>
            </div>

            {/* Profile view 3 Top Navigation Sub Options */}
            <div className="flex gap-1.5 bg-[#121216]/60 border border-white/5 p-1 rounded-xl">
              {[
                { id: 'about', label: '১. About' },
                { id: 'actions', label: '২. Actions' },
                { id: 'withdraws', label: '৩. Withdraws' }
              ].map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setUserTab(sub.id as any)}
                  className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                    userTab === sub.id ? 'bg-[#ffb020] text-slate-900 font-black shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>

            {/* SUB-VIEW A: ABOUT INFORMATION LIST */}
            {userTab === 'about' && (
              <div className="space-y-3.5 text-left text-xs">
                {/* Basic Info */}
                <div className="bg-[#121216] border border-white/5 p-4 rounded-3xl space-y-2.5">
                  <span className="text-[9px] text-[#ffb020] uppercase font-black tracking-wider block">Basic Information</span>
                  <div className="grid grid-cols-2 gap-y-2 font-mono text-[11px] leading-relaxed">
                    <div>
                      <span className="text-white/30 block text-[9px] uppercase font-sans">Full Name:</span>
                      <span className="text-slate-200 font-sans font-bold">{selectedUser.name}</span>
                    </div>
                    <div>
                      <span className="text-white/30 block text-[9px] uppercase font-sans">Username:</span>
                      <span className="text-slate-200 font-bold">@{selectedUser.username}</span>
                    </div>
                    <div>
                      <span className="text-white/30 block text-[9px] uppercase font-sans">User ID:</span>
                      <span className="text-slate-200 select-all font-bold">{selectedUser.id}</span>
                    </div>
                    <div>
                      <span className="text-white/30 block text-[9px] uppercase font-sans">Phone Number:</span>
                      <span className="text-slate-200 font-bold">{selectedUser.phone || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-white/30 block text-[9px] uppercase font-sans">Email:</span>
                      <span className="text-slate-200 block truncate">{selectedUser.email || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-white/30 block text-[9px] uppercase font-sans">Password:</span>
                      <span className="text-slate-200 tracking-wider font-bold">{selectedUser.password || '••••••'}</span>
                    </div>
                    <div>
                      <span className="text-white/30 block text-[9px] uppercase font-sans">Platform Type:</span>
                      <span className="text-slate-200 capitalize font-sans font-bold">{selectedUser.id.startsWith('usr_mock_') ? 'Browser Account' : 'Telegram Wallet'}</span>
                    </div>
                    <div>
                      <span className="text-white/30 block text-[9px] uppercase font-sans">Status:</span>
                      <span className="text-slate-200 font-serif capitalize font-bold">{selectedUser.status}</span>
                    </div>
                    <div>
                      <span className="text-white/30 block text-[9px] uppercase font-sans">Joined Server:</span>
                      <span className="text-slate-200 font-serif font-bold">{selectedUser.joinedAt || '১২/০৫/২০২৬'}</span>
                    </div>
                  </div>
                </div>

                {/* Card Info */}
                <div className="bg-[#121216] border border-white/5 p-4 rounded-3xl space-y-2.5">
                  <span className="text-[9px] text-[#ffb020] uppercase font-black tracking-wider block">Card & Wallet Hub</span>
                  <div className="grid grid-cols-2 gap-y-2 font-mono text-[11px]">
                    <div>
                      <span className="text-white/30 block text-[9px] font-sans">Card Name:</span>
                      <span className="text-slate-200 font-sans font-bold">{selectedUser.name.split(' ')[0]} Golden Badge</span>
                    </div>
                    <div>
                      <span className="text-white/30 block text-[9px] font-sans">Card Number:</span>
                      <span className="text-slate-200 select-all font-bold">{selectedUser.cardNumber || '8810 4918 3121 9901'}</span>
                    </div>
                    <div>
                      <span className="text-white/30 block text-[9px] font-sans">CVP/PIN (Security):</span>
                      <span className="text-slate-200 font-bold">{selectedUser.cvp || '550'}</span>
                    </div>
                    <div>
                      <span className="text-white/30 block text-[9px] font-sans">Total Coins:</span>
                      <span className="text-amber-500 font-black">{selectedUser.coins.toLocaleString()} 🪙</span>
                    </div>
                  </div>
                </div>

                {/* Referred */}
                <div className="bg-[#121216] border border-white/5 p-4 rounded-3xl space-y-1">
                  <span className="text-[9px] text-indigo-400 uppercase font-black block text-left">Referred Settings (Invitation Log)</span>
                  <div className="grid grid-cols-2 gap-y-1.5 font-mono text-[11px] pt-1">
                    <div>
                      <span className="text-white/30 block text-[8px] font-sans">Referred-By / Inviter:</span>
                      <span className="text-slate-200 font-bold font-sans">Admin Sayed</span>
                    </div>
                    <div>
                      <span className="text-white/30 block text-[8px] font-sans">Referral ID:</span>
                      <span className="text-slate-200 font-bold">REF_{selectedUser.id.toUpperCase().slice(-6)}</span>
                    </div>
                  </div>
                </div>

                {/* Activity Tracker */}
                <div className="bg-[#121216] border border-white/5 p-4 rounded-3xl">
                  <span className="text-[9px] text-purple-400 uppercase font-black block mb-2">Activity Records</span>
                  <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs">
                    <div className="bg-[#18181F] p-2.5 rounded-2xl border border-white/5">
                      <span className="text-slate-200 font-bold block">{tasks.length}</span>
                      <span className="text-[8px] text-white/30 uppercase font-sans">Spons Tasks</span>
                    </div>
                    <div className="bg-[#18181F] p-2.5 rounded-2xl border border-white/5">
                      <span className="text-slate-200 font-bold block">{selectedUser.miningStartTime > 0 ? 'Active' : 'Inactive'}</span>
                      <span className="text-[8px] text-white/30 uppercase font-sans">Mining Node</span>
                    </div>
                    <div className="bg-[#18181F] p-2.5 rounded-2xl border border-white/5">
                      <span className="text-slate-200 font-bold block">1</span>
                      <span className="text-[8px] text-white/30 uppercase font-sans">Withdrawals</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-VIEW B: MANAGE ACTIONS (COINS ADD/SUB, BLOCK, DELETE) */}
            {userTab === 'actions' && (
              <div className="space-y-4 text-left">
                {/* Coins Updater Panel */}
                <div className="bg-[#121216] border border-white/5 p-4.5 rounded-3xl space-y-3">
                  <label className="text-xs font-black text-[#ffb020] uppercase block">Manage User Coins</label>
                  <p className="text-[10px] text-white/40">Enter a positive number to add coins (e.g. 500) or a negative number to subtract coins (e.g. -200).</p>
                  
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="e.g. 1000 or -500"
                      value={coinsDelta}
                      onChange={(e) => setCoinsDelta(e.target.value)}
                      className="flex-1 bg-[#0A0A0C] border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-yellow-500 text-slate-100 font-bold font-mono"
                    />
                    <button
                      onClick={handleUpdateCoins}
                      className="px-5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer"
                    >
                      Update
                    </button>
                  </div>
                </div>

                {/* Account Actions Control buttons */}
                <div className="space-y-2">
                  <button
                    onClick={handleBlockUser}
                    className="w-full py-4 bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/20 text-amber-400 font-extrabold text-xs uppercase tracking-widest rounded-2xl cursor-pointer transition-all active:scale-95"
                  >
                    {selectedUser.status === 'blocked' ? 'Active / Unblock User' : 'Block User account'}
                  </button>

                  <button
                    onClick={handleDeleteUser}
                    className="w-full py-4 bg-red-600/15 hover:bg-red-600/20 border border-red-500/20 text-red-400 font-black text-xs uppercase tracking-widest rounded-2xl cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete User account
                  </button>
                </div>
              </div>
            )}

            {/* SUB-VIEW C: WITHDRAW HISTORY */}
            {userTab === 'withdraws' && (
              <div className="space-y-3 text-left">
                <span className="text-[10px] text-white/30 uppercase tracking-widest font-bold block mb-1">User Payout/Withdrawal History Log</span>
                
                {withdrawals.filter(w => w.targetName === selectedUser.username).length === 0 ? (
                  <div className="p-8 text-center bg-[#121216] border border-white/5 rounded-3xl">
                    <Landmark className="w-8 h-8 text-white/10 mx-auto mb-2" />
                    <span className="text-[10px] text-white/20 italic block">This user does not have any active withdrawal records yet.</span>
                  </div>
                ) : (
                  withdrawals.filter(w => w.targetName === selectedUser.username).map((tx) => {
                    const parsed = parseWithdrawDetails(tx.targetDetails);
                    return (
                      <div key={tx.id} className="bg-[#121216] border border-white/5 p-3 rounded-2xl flex items-center justify-between font-mono text-[10px]">
                        <div>
                          <span className="text-white/40 block">Pkg: {parsed.packageName}</span>
                          <span className="text-emerald-400 block break-all">Acc: {parsed.payoutNo}</span>
                          <span className="text-slate-500 block font-bold mt-1">Date: {tx.timestamp}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-red-400 font-black block">-{tx.amount} 🪙</span>
                          <span className={`text-[8px] font-bold uppercase rounded px-1.5 py-0.5 text-slate-100 ${
                            tx.status === 'completed' ? 'bg-green-600/25 text-green-400 border border-green-500/20' : tx.status === 'rejected' ? 'bg-red-600/25 text-red-400 border border-red-500/10' : 'bg-yellow-600/25 text-amber-500 border border-yellow-500/10'
                          }`}>
                            {tx.status}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}

        {/* ======================= TAB 3: RESOURCE CENTER ======================= */}
        {activeTab === 'resource_center' && resSubPage === 'none' && (
          <div className="space-y-4">
            <h3 className="text-xs font-black tracking-wider text-indigo-400 uppercase text-left">Support Desk & Sponsor Resource Center</h3>
            
            <div className="space-y-2.5">
              <button
                onClick={() => alert('Toggle Manager: This setting is managed internally through cloud triggers.')}
                className="w-full p-4 bg-[#121216] border border-white/10 rounded-3xl text-left hover:border-indigo-500/30 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <Eye className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-100">Toggle Manager (Live State)</h4>
                    <span className="text-[9px] text-white/30 block">Pause task firewalls or screenshot proofs upload globally</span>
                  </div>
                </div>
                <span className="text-[8px] bg-indigo-500/20 text-indigo-300 font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider">Coming Soon</span>
              </button>

              <button
                onClick={() => { setResSubPage('control_center'); setControlCenterPage('none'); }}
                className="w-full p-4 bg-[#121216] border border-white/10 rounded-3xl text-left hover:border-emerald-500/30 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 text-[#10b981] rounded-2xl group-hover:bg-[#10b981] group-hover:text-white transition-all">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-100">Control Center (Live Presets)</h4>
                    <span className="text-[9px] text-white/30 block">Sponsor tasks, payout methods, and game settings</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors" />
              </button>

              <button
                onClick={() => { setResSubPage('transactions'); setTransTab('submissions'); }}
                className="w-full p-4 bg-[#121216] border border-white/10 rounded-3xl text-left hover:border-purple-500/30 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 text-purple-400 rounded-2xl group-hover:bg-purple-600 group-hover:text-white transition-all">
                    <Landmark className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-100 flex items-center gap-2">
                      <span>Transactions (Payouts & Proofs)</span>
                      {pendingSubCount > 0 && (
                        <span className="px-1.5 py-0.5 bg-red-650/90 text-[8.5px] font-mono font-black text-white rounded-lg animate-pulse">
                          {pendingSubCount} PENDING
                        </span>
                      )}
                    </h4>
                    <span className="text-[9px] text-white/30 block">Verification and user screenshot approvals</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors" />
              </button>
            </div>
          </div>
        )}

        {/* SUB SECTION: CONTROL CENTER PAGE */}
        {activeTab === 'resource_center' && resSubPage === 'control_center' && controlCenterPage === 'none' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
              <button
                onClick={() => setResSubPage('none')}
                className="p-1.5 px-3 bg-[#141418]/90 hover:bg-[#1a1a24] border border-white/10 hover:border-indigo-500/30 rounded-xl text-[10px] text-slate-350 hover:text-indigo-400 uppercase font-black cursor-pointer transition-all duration-200 hover:scale-[1.05] active:scale-95 shadow-md"
              >
                Back
              </button>
              <h3 className="text-xs font-black text-indigo-400 uppercase leading-none">LIVE CONTROL CENTER</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { setControlCenterPage('tasks'); setTaskSubTab('added'); }}
                className="bg-[#121216] border border-white/5 p-4 rounded-3xl hover:border-indigo-500/35 transition-all text-center relative group cursor-pointer"
              >
                <Bookmark className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
                <h4 className="text-xs font-black text-slate-100">1. Tasks Management</h4>
                <p className="text-[9px] text-white/30 mt-1 leading-relaxed">Configure, create, edit, or delete sponsor tasks</p>
              </button>

              <button
                onClick={() => { setControlCenterPage('payments'); setPaySubTab('added'); }}
                className="bg-[#121216] border border-white/5 p-4 rounded-3xl hover:border-amber-500/35 transition-all text-center relative group cursor-pointer"
              >
                <DollarSign className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                <h4 className="text-xs font-black text-slate-100">2. Payment Methods</h4>
                <p className="text-[9px] text-white/30 mt-1 leading-relaxed">Set up bKash, Nagad, TON, or crypto gateways</p>
              </button>

              <button
                onClick={() => setControlCenterPage('coin_config')}
                className="bg-[#121216] border border-white/5 p-4 rounded-3xl hover:border-yellow-500/30 hover:scale-[1.02] shadow transition-all text-center relative group cursor-pointer"
              >
                <Cpu className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                <h4 className="text-xs font-black text-slate-100">3. Game Coin Config</h4>
                <p className="text-[9px] text-[#ffb020] font-bold mt-1 leading-relaxed">Manage reward allocations and platform ad yields</p>
              </button>

              <button
                onClick={() => { setControlCenterPage('support'); setSuppSubTab('added'); }}
                className="bg-[#121216] border border-white/5 p-4 rounded-3xl hover:border-[#10b981]/35 transition-all text-center relative group cursor-pointer"
              >
                <Link className="w-6 h-6 text-[#10b981] mx-auto mb-2" />
                <h4 className="text-xs font-black text-slate-100">4. Support Links</h4>
                <p className="text-[9px] text-white/30 mt-1 leading-relaxed">Configure telegram channels and social handles</p>
              </button>
            </div>
          </div>
        )}

        {/* ======================= CONTROL HUB A: TASKS MANAGEMENT ======================= */}
        {activeTab === 'resource_center' && resSubPage === 'control_center' && controlCenterPage === 'tasks' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2.5">
              <button
                onClick={() => setControlCenterPage('none')}
                className="p-1.5 px-3 bg-[#141418]/90 hover:bg-[#1a1a24] border border-white/10 hover:border-indigo-500/30 rounded-xl text-[10px] text-slate-350 hover:text-indigo-400 uppercase font-black cursor-pointer transition-all duration-200 hover:scale-[1.05] active:scale-95 shadow-md"
              >
                Back
              </button>
              <h3 className="text-xs font-black text-indigo-400 uppercase">Sponsor Tasks Management</h3>
            </div>

            {/* Top Sub tabs add or added tasks */}
            <div className="flex gap-1.5 bg-[#121216]/60 p-1 border border-white/5 rounded-xl">
              {[
                { id: 'add', label: '1. Add Task' },
                { id: 'added', label: '2. Added Task' }
              ].map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => { setTaskSubTab(sub.id as any); setSelectedEditTask(null); }}
                  className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                    taskSubTab === sub.id ? 'bg-[#ffb020] text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>

            {/* TAB: ADD TASK FORM */}
            {taskSubTab === 'add' && (
              <form onSubmit={handleCreateTask} className="bg-[#121216] border border-white/5 p-4.5 rounded-3xl space-y-3.5 text-left text-xs font-semibold">
                <span className="text-[10px] text-[#ffb020] font-black block text-center uppercase tracking-wider">Connect New Sponsor Advertisement Task</span>
                
                <div className="space-y-1">
                  <span className="text-[9px] text-white/40 block">Task Title</span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Subscribe our Telegram channel"
                    value={tTitle}
                    onChange={(e) => setTTitle(e.target.value)}
                    className="w-full bg-[#0A0A0C] border border-white/10 rounded-xl px-3.5 py-2.5 text-slate-200 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[9px] text-white/40 block">Task Type</span>
                    <select
                      value={tCategory}
                      onChange={(e) => setTCategory(e.target.value as any)}
                      className="w-full bg-[#0A0A0C] border border-white/10 rounded-xl px-2 py-2 text-slate-300 font-bold"
                    >
                      <option value="watch">Watch Ad</option>
                      <option value="visit">Visit Partner</option>
                      <option value="post">Social Post</option>
                      <option value="registration">Service Registration</option>
                      <option value="joined">Join Group/Channel</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] text-white/40 block">Reward Coins</span>
                    <input
                      type="number"
                      value={tReward}
                      onChange={(e) => setTReward(parseInt(e.target.value) || 100)}
                      className="w-full bg-[#0A0A0C] border border-white/10 rounded-xl px-3 py-2 text-amber-400 font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] text-white/40 block">Task Instructions</span>
                  <textarea
                    required
                    placeholder="e.g. Join the channel and submit a screenshot as proof..."
                    value={tInstructions}
                    onChange={(e) => setTInstructions(e.target.value)}
                    className="w-full bg-[#0A0A0C] border border-white/10 rounded-xl px-3.5 py-2 text-slate-300 h-16 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] text-white/40 block">Task Destination Link URL</span>
                  <input
                    type="text"
                    placeholder="https://t.me/yourchannel"
                    value={tTargetUrl}
                    onChange={(e) => setTTargetUrl(e.target.value)}
                    className="w-full bg-[#0A0A0C] border border-white/10 rounded-xl px-3 py-2 text-indigo-400 font-mono"
                  />
                </div>

                <div className={`grid ${(tCategory === 'watch' || tCategory === 'visit') ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
                  <div className="space-y-1">
                    <span className="text-[9px] text-white/40 block">Button Label</span>
                    <input type="text" placeholder="e.g. JOIN TASK" value={tLabel} onChange={(e) => setTLabel(e.target.value)} className="w-full bg-[#0A0A0C] border border-white/10 rounded-xl px-3 py-2 text-slate-100" />
                  </div>
                  {(tCategory === 'watch' || tCategory === 'visit') && (
                    <div className="space-y-1">
                      <span className="text-[9px] text-white/40 block">Duration (Seconds)</span>
                      <input type="number" value={tDuration} onChange={(e) => setTDuration(parseInt(e.target.value) || 15)} className="w-full bg-[#0A0A0C] border border-white/10 rounded-xl px-3 py-2 text-slate-100 font-mono" />
                    </div>
                  )}
                </div>

                <div className="bg-[#1C1C24]/60 p-3 rounded-2xl space-y-2.5 border border-purple-500/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-purple-400 font-black block">📅 Register as Upcoming Task?</span>
                      <span className="text-[8px] text-white/30 block">Task will unlock automatically after countdown</span>
                    </div>
                    <input type="checkbox" checked={tIsUpcoming} onChange={(e) => setTIsUpcoming(e.target.checked)} className="w-5 h-5 accent-purple-500" />
                  </div>
                  {tIsUpcoming && (
                    <div className="space-y-1">
                      <span className="text-[8px] text-purple-300 block font-bold">Unlocks in (minutes):</span>
                      <input type="number" value={tUpcomingMins} onChange={(e) => setTUpcomingMins(parseInt(e.target.value) || 10)} className="w-20 bg-black/50 border border-purple-500/20 py-1 text-center font-mono rounded" />
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs uppercase tracking-widest rounded-2xl cursor-pointer"
                >
                  🚀 Dynamically Create Sponsor Task
                </button>
              </form>
            )}

            {/* TAB: ADDED TASK LIST WITH CATEGORIES TOP-BAR & EDIT DETAILS POPUP */}
            {taskSubTab === 'added' && !selectedEditTask && (
              <div className="space-y-3.5">
                {/* Category Top selector bar with all options */}
                <span className="text-[10px] text-white/30 font-bold block text-left uppercase">Category Filter</span>
                <div className="flex gap-1.5 bg-[#121216]/60 p-1 border border-white/5 rounded-xl overflow-x-auto select-none py-1.5 scrollable">
                  {[
                    { id: 'all', label: 'All Sponsor' },
                    { id: 'watch', label: 'Watch view' },
                    { id: 'visit', label: 'Partner visit' },
                    { id: 'post', label: 'Social post' },
                    { id: 'registration', label: 'Registration' },
                    { id: 'joined', label: 'Join groups' },
                    { id: 'upcoming', label: 'Upcoming' }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setTaskCategoryFilter(cat.id)}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-extrabold uppercase tracking-widest shrink-0 transition-all cursor-pointer ${
                        taskCategoryFilter === cat.id ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Listing */}
                <div className="space-y-2 text-left">
                  {tasks
                    .filter(t => {
                      if (taskCategoryFilter === 'all') return true;
                      if (taskCategoryFilter === 'upcoming') return !!t.upcomingTime;
                      return t.taskType === taskCategoryFilter && !t.upcomingTime;
                    })
                    .map((t) => (
                      <div key={t.id} className="bg-[#121216] border border-white/5 p-3 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <img src={t.imageUrl || 'https://telegram.org/img/t_logo.png'} className="w-9 h-9 rounded-xl object-cover border border-white/10" alt="Ico" />
                          <div>
                            <span className="text-[8px] text-indigo-400 font-mono uppercase block">{t.taskType}</span>
                            <h4 className="text-xs font-black text-slate-200 line-clamp-1">{t.title}</h4>
                            <span className="text-[9px] text-[#ffb020] font-mono font-black font-semibold">+{t.rewardCoins} 🪙</span>
                          </div>
                        </div>

                        <button
                          onClick={() => setSelectedEditTask(t)}
                          className="px-3.5 py-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-xl text-[9px] uppercase font-bold cursor-pointer"
                        >
                          View
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Task Detail / Inline Edit screen inside modal */}
            {taskSubTab === 'added' && selectedEditTask && (
              <div className="bg-[#121216] border border-white/5 p-4 rounded-3xl space-y-4 text-left">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <h4 className="text-xs font-black uppercase text-indigo-400 tracking-wider">Task View & Editor</h4>
                  <button onClick={() => setSelectedEditTask(null)} className="px-2.5 py-1 bg-white/5 rounded-lg text-[9px] uppercase font-bold text-slate-300">Back</button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <span className="text-[9px] text-white/30 block">Task Name:</span>
                    <input
                      type="text"
                      value={selectedEditTask.title}
                      onChange={(e) => setSelectedEditTask({ ...selectedEditTask, title: e.target.value })}
                      className="w-full bg-black/60 border border-white/10 px-3 py-2 rounded-xl text-slate-200 font-bold"
                    />
                  </div>

                  <span className="text-[10px] text-purple-400 font-extrabold uppercase tracking-widest block text-center mt-1">Configure Task Scope</span>

                  <div className={`grid ${selectedEditTask.taskType === 'watch' || selectedEditTask.taskType === 'visit' ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
                    <div className="space-y-1">
                      <span className="text-[9px] text-white/30 block">Coin Reward:</span>
                      <input
                        type="number"
                        value={selectedEditTask.rewardCoins}
                        onChange={(e) => setSelectedEditTask({ ...selectedEditTask, rewardCoins: parseInt(e.target.value) || 0 })}
                        className="w-full bg-black/60 border border-white/10 px-3 py-2 rounded-xl text-amber-400 font-bold"
                      />
                    </div>
                    {(selectedEditTask.taskType === 'watch' || selectedEditTask.taskType === 'visit') && (
                      <div className="space-y-1">
                        <span className="text-[9px] text-white/30 block">Lock Time Duration (seconds):</span>
                        <input
                          type="number"
                          value={selectedEditTask.durationSeconds || 15}
                          onChange={(e) => setSelectedEditTask({ ...selectedEditTask, durationSeconds: parseInt(e.target.value) || 15 })}
                          className="w-full bg-black/60 border border-white/10 px-3 py-2 rounded-xl text-indigo-400 font-mono font-bold"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] text-white/30 block">Destination URL Link:</span>
                    <input
                      type="text"
                      value={selectedEditTask.targetUrl}
                      onChange={(e) => setSelectedEditTask({ ...selectedEditTask, targetUrl: e.target.value })}
                      className="w-full bg-black/60 border border-white/10 px-3 py-1.5 rounded-xl font-mono text-[10px]"
                    />
                  </div>

                  {/* Actions buttons */}
                  <div className="flex gap-2 pt-2 border-t border-white/5">
                    <button
                      onClick={() => {
                        handleDeleteTask(selectedEditTask.id);
                        setSelectedEditTask(null);
                      }}
                      className="flex-1 py-2.5 bg-red-600/15 hover:bg-red-500/20 text-red-400 rounded-xl font-black text-[10px] uppercase cursor-pointer text-center active:scale-95 transition-all"
                    >
                      Delete Task
                    </button>
                    <button
                      onClick={() => {
                        const next = tasks.map(t => t.id === selectedEditTask.id ? selectedEditTask : t);
                        if (onUpdateTasks) onUpdateTasks(next);
                        setSelectedEditTask(null);
                        alert('Task details successfully saved!');
                      }}
                      className="flex-1 py-2.5 bg-green-500/10 hover:bg-green-600/20 text-green-400 rounded-xl font-black text-[10px] uppercase cursor-pointer text-center active:scale-95 transition-all"
                    >
                      Save Task Edit
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================= CONTROL HUB B: PAYMENT METHODS ======================= */}
        {activeTab === 'resource_center' && resSubPage === 'control_center' && controlCenterPage === 'payments' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 border-b border-white/5 pb-2.5">
              <button
                onClick={() => setControlCenterPage('none')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#141418] border border-white/10 hover:border-[#ffb020]/20 text-slate-300 hover:text-white rounded-xl font-bold text-[10px] uppercase cursor-pointer transition-all active:scale-95 shadow-md"
              >
                <ArrowLeft className="w-3 h-3 text-amber-450 animate-pulse" />
                <span>Back</span>
              </button>
              <h3 className="text-xs font-black text-amber-500 uppercase">2. Payments & Withdrawal Methods</h3>
            </div>

            {/* Sub menus */}
            <div className="flex gap-1.5 bg-[#121216]/60 p-1 border border-white/5 rounded-xl">
              <button onClick={() => setPaySubTab('add')} className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${paySubTab === 'add' ? 'bg-[#ffb020] text-slate-900 font-bold' : 'text-slate-400 hover:text-white'}`}>1. Add Method</button>
              <button 
                onClick={() => {
                  setPaySubTab('added');
                  if (mainMethods.length > 0 && !selectedAddedMainId) {
                    setSelectedAddedMainId(mainMethods[0].id);
                  }
                }} 
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${paySubTab === 'added' ? 'bg-[#ffb020] text-slate-900 font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                2. Added Method
              </button>
            </div>

            {/* FORM: ADD METHOD / PACKAGE */}
            {paySubTab === 'add' && (
              <div className="space-y-4 text-left">
                {/* Top bar with three choice tabs inside Add Method */}
                <div className="flex gap-1 bg-[#0f0f13] p-1 border border-white/5 rounded-xl">
                  {(['main', 'sub', 'list'] as const).map((tab) => {
                    const label = tab === 'main' ? 'Maine Methods' : tab === 'sub' ? 'Sub method' : 'List Method';
                    return (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setAddMethodTab(tab)}
                        className={`flex-1 py-1.5 rounded-lg text-[9px] font-extrabold uppercase transition-all cursor-pointer text-center ${
                          addMethodTab === tab 
                            ? 'bg-amber-500/10 text-[#ffb020] border border-amber-500/20' 
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                {/* 1. Maine Method Add Form */}
                {addMethodTab === 'main' && (
                  <form onSubmit={handleAddMainMethod} className="bg-[#121216] border border-white/5 p-4 rounded-3xl space-y-3">
                    <span className="text-[10px] text-amber-500 block font-black uppercase tracking-widest">1. Add Main Payout Category</span>
                    <div className="space-y-3 text-xs">
                      <div className="space-y-1">
                        <span className="text-[9px] text-white/40 block text-left">Method Name (e.g., Mobile Banking, Crypto Network)</span>
                        <input 
                          type="text" 
                          required 
                          placeholder="e.g. Mobile Banking, Crypto Network" 
                          value={newMainName} 
                          onChange={(e) => setNewMainName(e.target.value)} 
                          className="w-full bg-[#0A0A0C] border border-white/10 rounded-xl px-3 py-2 text-slate-100" 
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] text-white/40 block text-left">Method Brand Photo URL (Square ratio preferred)</span>
                        <input 
                          type="text" 
                          required 
                          placeholder="https://example.com/logo.png" 
                          value={newMainPhoto} 
                          onChange={(e) => setNewMainPhoto(e.target.value)} 
                          className="w-full bg-[#0A0A0C] border border-white/10 rounded-xl px-3 py-2 text-slate-100 font-mono text-[11px]" 
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] text-white/40 block text-left">Label displayed over Account input box (Input Item Label)</span>
                        <input 
                          type="text" 
                          required 
                          placeholder="e.g. bKash cashout wallet number" 
                          value={newMainInputLabel} 
                          onChange={(e) => setNewMainInputLabel(e.target.value)} 
                          className="w-full bg-[#0A0A0C] border border-white/10 rounded-xl px-3 py-2 text-slate-100 font-bold" 
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] text-white/40 block text-left">Placeholder value inside Account input box (Input Field Placeholder text)</span>
                        <input 
                          type="text" 
                          required 
                          placeholder="e.g. Enter dynamic 11-digit number" 
                          value={newMainInputPlaceholder} 
                          onChange={(e) => setNewMainInputPlaceholder(e.target.value)} 
                          className="w-full bg-[#0A0A0C] border border-white/10 rounded-xl px-3 py-2 text-slate-100 italic font-mono" 
                        />
                      </div>
                    </div>
                    <button type="submit" className="w-full py-2 bg-amber-500 hover:bg-amber-400 rounded-xl text-[10px] text-slate-950 font-black uppercase leading-none">Add Main Category</button>
                  </form>
                )}

                {/* 2. Sub Method Add Form */}
                {addMethodTab === 'sub' && (
                  <form onSubmit={handleAddPaymentMethod} className="bg-[#121216] border border-white/5 p-4 rounded-3xl space-y-3">
                    <span className="text-[10px] text-indigo-400 block font-black uppercase tracking-widest">2. Add Sub-Method Brand</span>
                    <div className="space-y-3 text-xs">
                      <div className="space-y-1">
                        <span className="text-[9px] text-white/40 block text-left">Sub-Method Name (e.g. bKash, Rocket, Nagad)</span>
                        <input 
                          type="text" 
                          required 
                          placeholder="e.g. bKash Cashout, Nagad" 
                          value={newMethodName} 
                          onChange={(e) => setNewMethodName(e.target.value)} 
                          className="w-full bg-[#0A0A0C] border border-white/10 rounded-xl px-3 py-2 text-slate-100" 
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] text-white/40 block text-left">Brand Photo/Logo URL (Photo URL)</span>
                        <input 
                          type="text" 
                          required 
                          placeholder="https://example.com/logo.png" 
                          value={newMethodPhoto} 
                          onChange={(e) => setNewMethodPhoto(e.target.value)} 
                          className="w-full bg-[#0A0A0C] border border-white/10 rounded-xl px-3 py-2 text-slate-100 font-mono text-[11px]" 
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] text-white/40 block text-left">Select Main Parent Category</span>
                        <select 
                          value={newMethodParent} 
                          onChange={(e) => setNewMethodParent(e.target.value)} 
                          className="w-full bg-[#0A0A0C] border border-white/10 rounded-xl px-2.5 py-2 text-slate-200 text-left"
                        >
                          <option value="">-- Select Main Category --</option>
                          {mainMethods.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <button type="submit" className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-[10px] text-white font-black uppercase leading-none">Add Sub-Method Brand</button>
                  </form>
                )}

                {/* 3. List method Add Form */}
                {addMethodTab === 'list' && (
                  <form onSubmit={handleAddPackage} className="bg-[#121216] border border-white/5 p-4 rounded-3xl space-y-3">
                    <span className="text-[10px] text-emerald-400 block font-black uppercase tracking-wider">3. Add Withdrawal Payout Package</span>
                    <div className="space-y-2 text-xs">
                      <div className="space-y-1">
                        <span className="text-[9px] text-white/40 block text-left">Parent Brand Sub Method</span>
                        <select 
                          value={newPkgSubId} 
                          onChange={(e) => setNewPkgSubId(e.target.value)} 
                          className="w-full bg-[#0A0A0C] border border-white/10 rounded-xl px-2.5 py-2 text-slate-100 text-left"
                        >
                          <option value="">-- Select Sub Method --</option>
                          {paymentMethods.map(m => {
                            const parentM = mainMethods.find(pm => pm.id === m.parentId);
                            return (
                              <option key={m.id} value={m.id}>
                                {m.name} ({parentM ? parentM.name : 'Unknown Main'})
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <span className="text-[9px] text-white/40 block text-left">Package Name (Display Name)</span>
                          <input 
                            type="text" 
                            required 
                            placeholder="e.g. Regular cash" 
                            value={newPkgName} 
                            onChange={(e) => setNewPkgName(e.target.value)} 
                            className="w-full bg-[#0A0A0C] border border-white/10 rounded-xl px-3 py-2 text-slate-100" 
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] text-white/40 block text-left">Equivalent Value (e.g., 50 BDT)</span>
                          <input 
                            type="text" 
                            required 
                            placeholder="50 BDT" 
                            value={newPkgVal} 
                            onChange={(e) => setNewPkgVal(e.target.value)} 
                            className="w-full bg-[#0A0A0C] border border-white/10 rounded-xl px-3 py-2 text-slate-100" 
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <span className="text-[9px] text-white/40 block text-left">Coin Cost Requirement</span>
                          <input 
                            type="number" 
                            value={newPkgCoins} 
                            onChange={(e) => setNewPkgCoins(parseInt(e.target.value) || 500)} 
                            className="w-full bg-[#0A0A0C] border border-white/10 rounded-xl px-3 py-2 font-mono" 
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] text-white/40 block text-left">Custom Photo Link (Optional)</span>
                          <input 
                            type="text" 
                            placeholder="https://example.com/pack.png" 
                            value={newPkgPhoto} 
                            onChange={(e) => setNewPkgPhoto(e.target.value)} 
                            className="w-full bg-[#0A0A0C] border border-white/10 rounded-xl px-3 py-2 text-slate-100 font-mono text-[10px]" 
                          />
                        </div>
                      </div>
                    </div>
                    <button type="submit" className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 rounded-xl text-[10px] text-slate-950 font-black uppercase">Add Package (Add List Method)</button>
                  </form>
                )}
              </div>
            )}

            {/* LIST: PAYMENT METHODS & PACKAGES FOR DISMISSAL */}
            {paySubTab === 'added' && (
              <div className="space-y-4 text-left">
                {/* Category tabs for each dynamic Main Method Name */}
                <div className="flex gap-1 bg-[#0A0A0C] p-1 border border-white/5 rounded-2xl overflow-x-auto scrollbar-none">
                  {mainMethods.length === 0 ? (
                    <span className="text-slate-400 text-[10px] p-2 italic w-full text-center">No Main Payout Categories created yet.</span>
                  ) : (
                    mainMethods.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setSelectedAddedMainId(m.id);
                          setAddedMethodSubTab('main'); // reset level 2 subtab
                        }}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all whitespace-nowrap cursor-pointer ${
                          selectedAddedMainId === m.id
                            ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 shadow-md font-black'
                            : 'text-slate-300 bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        {m.name}
                      </button>
                    ))
                  )}
                </div>

                {/* Sub top bar within the selected Main Method category */}
                {selectedAddedMainId && (
                  <div className="space-y-3.5">
                    {/* Level 2 Sub-top-bar selection: Maine method, Sub method, list method */}
                    <div className="flex gap-1.5 bg-[#121216]/80 p-1 border border-white/5 rounded-xl">
                      {(['main', 'sub', 'list'] as const).map((subTab) => {
                        const lbl = subTab === 'main' ? 'Maine method' : subTab === 'sub' ? 'Sub method' : 'list method';
                        return (
                          <button
                            key={subTab}
                            type="button"
                            onClick={() => setAddedMethodSubTab(subTab)}
                            className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all cursor-pointer text-center ${
                              addedMethodSubTab === subTab
                                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {lbl}
                          </button>
                        );
                      })}
                    </div>

                    {/* rendering child cards based on Level 2 sub tabs */}
                    {/* Sub Tab 1: Maine method list */}
                    {addedMethodSubTab === 'main' && (() => {
                      const m = mainMethods.find(pm => pm.id === selectedAddedMainId);
                      if (!m) return null;
                      const isEditing = editingMainId === m.id;
                      return (
                        <div className="bg-[#121216] border border-white/5 p-4 rounded-3xl space-y-3">
                          <span className="text-[9px] text-[#A855F7] uppercase tracking-wider block font-bold">Main Category Details</span>
                          
                          {isEditing ? (
                            <div className="space-y-2 text-xs text-left">
                              <div>
                                <span className="text-[9px] text-white/40 block mb-1 font-semibold text-left">Edit Name:</span>
                                <input 
                                  type="text" 
                                  value={editMainName} 
                                  onChange={(e) => setEditMainName(e.target.value)} 
                                  className="w-full bg-[#0A0A0C] border border-white/15 rounded-xl px-3 py-1.5 text-slate-100" 
                                />
                              </div>
                              <div>
                                <span className="text-[9px] text-white/40 block mb-1">Edit Photo Link URL:</span>
                                <input 
                                  type="text" 
                                  value={editMainPhoto} 
                                  onChange={(e) => setEditMainPhoto(e.target.value)} 
                                  className="w-full bg-[#0A0A0C] border border-white/15 rounded-xl px-3 py-1.5 text-slate-100 font-mono text-[10px]" 
                                />
                              </div>
                              <div>
                                <span className="text-[9px] text-white/40 block mb-1 font-semibold text-left">Edit Input Label (Over-text):</span>
                                <input 
                                  type="text" 
                                  value={editMainInputLabel} 
                                  onChange={(e) => setEditMainInputLabel(e.target.value)} 
                                  className="w-full bg-[#0A0A0C] border border-white/15 rounded-xl px-3 py-1.5 text-slate-100 font-bold text-left" 
                                />
                              </div>
                              <div>
                                <span className="text-[9px] text-white/40 block mb-1 font-semibold text-left">Edit Input Placeholder (Inner-clue):</span>
                                <input 
                                  type="text" 
                                  value={editMainInputPlaceholder} 
                                  onChange={(e) => setEditMainInputPlaceholder(e.target.value)} 
                                  className="w-full bg-[#0A0A0C] border border-white/15 rounded-xl px-3 py-1.5 text-slate-100 italic font-mono text-left" 
                                />
                              </div>
                              <div className="flex gap-2 pt-2">
                                <button 
                                  type="button"
                                  onClick={() => setEditingMainId(null)} 
                                  className="flex-1 py-1.5 rounded-lg bg-white/5 text-slate-300 text-[10px] font-bold cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => handleUpdateMainMethod(m.id)} 
                                  className="flex-1 py-1.5 rounded-lg bg-[#ffb020] text-slate-900 text-[10px] font-black cursor-pointer"
                                >
                                  Save Change
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-between items-center bg-black/35 p-3 rounded-2xl">
                              <div className="flex items-center gap-3">
                                <img src={m.photoUrl} className="w-10 h-10 rounded-xl object-cover border border-white/5 shadow-inner animate-pulse" alt="Main Method" />
                                <div>
                                  <h4 className="text-xs font-black text-slate-200">{m.name}</h4>
                                  <span className="text-[8px] text-white/30 uppercase block">ID: {m.id}</span>
                                </div>
                              </div>

                              <div className="flex gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingMainId(m.id);
                                    setEditMainName(m.name);
                                    setEditMainPhoto(m.photoUrl);
                                    setEditMainInputLabel(m.inputLabel || 'Payout Wallet Number / Crypto Address');
                                    setEditMainInputPlaceholder(m.inputPlaceholder || 'Enter your 11-digit wallet number');
                                  }}
                                  className="text-[9px] text-[#ffb020] bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-xl font-black uppercase transition-all cursor-pointer"
                                >
                                  Edit
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => handleDeleteMainMethod(m.id)} 
                                  className="text-[9px] text-red-400 bg-red-500/10 hover:bg-red-500/20 px-2.5 py-1.5 rounded-xl font-black uppercase transition-all cursor-pointer"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Sub Tab 2: Sub method list */}
                    {addedMethodSubTab === 'sub' && (() => {
                      const categorySubs = paymentMethods.filter(sub => sub.parentId === selectedAddedMainId);
                      return (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center px-1">
                            <span className="text-[9px] text-white/30 uppercase tracking-wider block font-bold text-left">Sub-Method Brand Listing</span>
                            <span className="text-[9px] text-slate-400 font-mono">Total Sub-methods: {categorySubs.length}</span>
                          </div>

                          {categorySubs.length === 0 ? (
                            <div className="bg-[#121216]/50 border border-white/5 p-6 rounded-2xl text-center italic text-white/20 text-xs">
                              No Sub-Method Brands exist under this Main Payout Category yet.
                            </div>
                          ) : (
                            categorySubs.map((sub) => {
                              const isEditing = editingSubId === sub.id;
                              return (
                                <div key={sub.id} className="bg-[#121216] border border-white/5 p-3 rounded-2xl text-left">
                                  {isEditing ? (
                                    <div className="space-y-2.5 text-xs text-left">
                                      <div>
                                        <span className="text-[9px] text-white/40 block mb-1 font-semibold text-left">Edit Name:</span>
                                        <input 
                                          type="text" 
                                          value={editSubName} 
                                          onChange={(e) => setEditSubName(e.target.value)} 
                                          className="w-full bg-[#0A0A0C] border border-white/15 rounded-xl px-3 py-1.5 text-slate-100" 
                                        />
                                      </div>
                                      <div>
                                        <span className="text-[9px] text-white/40 block mb-1 font-semibold text-left">Edit Photo Link URL:</span>
                                        <input 
                                          type="text" 
                                          value={editSubPhoto} 
                                          onChange={(e) => setEditSubPhoto(e.target.value)} 
                                          className="w-full bg-[#0A0A0C] border border-white/15 rounded-xl px-3 py-1.5 text-slate-100 font-mono text-[10px]" 
                                        />
                                      </div>
                                      <div>
                                        <span className="text-[9px] text-white/40 block mb-1 font-semibold text-left">Select Main Category Parent:</span>
                                        <select 
                                          value={editSubParentId} 
                                          onChange={(e) => setEditSubParentId(e.target.value)} 
                                          className="w-full bg-[#0A0A0C] border border-white/15 rounded-xl px-2.5 py-1.5 text-slate-200"
                                        >
                                          {mainMethods.map(m => (
                                            <option key={m.id} value={m.id}>{m.name}</option>
                                          ))}
                                        </select>
                                      </div>
                                      <div className="flex gap-2 pt-1.5">
                                        <button 
                                          type="button"
                                          onClick={() => setEditingSubId(null)} 
                                          className="flex-1 py-1.5 rounded-lg bg-white/5 text-slate-300 text-[10px] font-bold cursor-pointer"
                                        >
                                          Cancel
                                        </button>
                                        <button 
                                          type="button"
                                          onClick={() => handleUpdatePaymentMethod(sub.id)} 
                                          className="flex-1 py-1.5 rounded-lg bg-indigo-600 text-white text-[10px] font-black cursor-pointer"
                                        >
                                          Save Change
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex justify-between items-center">
                                      <div className="flex items-center gap-2.5">
                                        <img src={sub.photoUrl} className="w-8 h-8 rounded-lg object-cover border border-white/5" alt="Sub Method" />
                                        <div>
                                          <h5 className="text-[11px] font-extrabold text-slate-200">{sub.name}</h5>
                                          <span className="text-[8px] text-white/20 uppercase block">ID: {sub.id}</span>
                                        </div>
                                      </div>
                                      
                                      <div className="flex gap-1">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditingSubId(sub.id);
                                            setEditSubName(sub.name);
                                            setEditSubPhoto(sub.photoUrl);
                                            setEditSubParentId(sub.parentId);
                                          }}
                                          className="text-[8px] text-[#ffb020] bg-amber-500/10 hover:bg-amber-500/20 px-2 py-1.5 rounded bg-white/5 font-black uppercase cursor-pointer"
                                        >
                                          Edit
                                        </button>
                                        <button 
                                          type="button"
                                          onClick={() => handleDeletePayMethod(sub.id)} 
                                          className="text-[8px] text-red-500 hover:text-red-400 bg-red-500/10 px-2 py-1.5 rounded font-black uppercase cursor-pointer"
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      );
                    })()}

                    {/* Sub Tab 3: List method list */}
                    {addedMethodSubTab === 'list' && (() => {
                      const categorySubs = paymentMethods.filter(sub => sub.parentId === selectedAddedMainId);
                      const subIds = categorySubs.map(s => s.id);
                      const categoryListMethods = paymentPackages.filter(pkg => subIds.includes(pkg.subId));
                      return (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center px-1">
                            <span className="text-[9px] text-white/30 uppercase tracking-wider block font-bold text-left">Payout Packages (List Methods)</span>
                            <span className="text-[9px] text-slate-400 font-mono">Total Packages: {categoryListMethods.length}</span>
                          </div>

                          {categoryListMethods.length === 0 ? (
                            <div className="bg-[#121216]/50 border border-white/5 p-6 rounded-2xl text-center italic text-white/20 text-xs">
                              No payout packages exist under this main category.
                            </div>
                          ) : (
                            categoryListMethods.map((pkg) => {
                              const parentSub = paymentMethods.find(s => s.id === pkg.subId);
                              const isEditing = editingPkgId === pkg.id;
                              return (
                                <div key={pkg.id} className="bg-[#121216] border border-white/5 p-3 rounded-2xl text-left">
                                  {isEditing ? (
                                    <div className="space-y-2 text-xs text-left">
                                      <div className="grid grid-cols-2 gap-2 text-left">
                                        <div>
                                          <span className="text-[9px] text-white/40 block mb-1 font-semibold text-left">Package Name:</span>
                                          <input 
                                            type="text" 
                                            value={editPkgName} 
                                            onChange={(e) => setEditPkgName(e.target.value)} 
                                            className="w-full bg-[#0A0A0C] border border-white/15 rounded-xl px-3 py-1.5 text-slate-100 text-xs" 
                                          />
                                        </div>
                                        <div>
                                          <span className="text-[9px] text-white/40 block mb-1">Equivalent Value:</span>
                                          <input 
                                            type="text" 
                                            value={editPkgVal} 
                                            onChange={(e) => setEditPkgVal(e.target.value)} 
                                            className="w-full bg-[#0A0A0C] border border-white/15 rounded-xl px-3 py-1.5 text-slate-100 text-xs" 
                                          />
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-2 gap-2 text-left">
                                        <div>
                                          <span className="text-[9px] text-white/40 block mb-1 font-semibold text-left">Coin Cost:</span>
                                          <input 
                                            type="number" 
                                            value={editPkgCoins} 
                                            onChange={(e) => setEditPkgCoins(parseInt(e.target.value) || 0)} 
                                            className="w-full bg-[#0A0A0C] border border-white/15 rounded-xl px-3 py-1.5 text-slate-100 font-mono text-xs" 
                                          />
                                        </div>
                                        <div>
                                          <span className="text-[9px] text-white/40 block mb-1">Sub method:</span>
                                          <select 
                                            value={editPkgSubId} 
                                            onChange={(e) => setEditPkgSubId(e.target.value)} 
                                            className="w-full bg-[#0A0A0C] border border-white/15 rounded-xl px-2 py-1.5 text-slate-200 text-xs"
                                          >
                                            {paymentMethods.map(m => (
                                              <option key={m.id} value={m.id}>{m.name}</option>
                                            ))}
                                          </select>
                                        </div>
                                      </div>
                                      <div>
                                        <span className="text-[9px] text-white/40 block mb-1 font-semibold text-left">Photo URL (Photo URL):</span>
                                        <input 
                                          type="text" 
                                          value={editPkgPhoto} 
                                          onChange={(e) => setEditPkgPhoto(e.target.value)} 
                                          className="w-full bg-[#0A0A0C] border border-white/15 rounded-xl px-3 py-1.5 text-slate-100 font-mono text-[10px]" 
                                        />
                                      </div>
                                      <div className="flex gap-2 pt-1.5">
                                        <button 
                                          type="button"
                                          onClick={() => setEditingPkgId(null)} 
                                          className="flex-1 py-1.5 rounded-lg bg-white/5 text-slate-300 text-[10px] font-bold cursor-pointer"
                                        >
                                          Cancel
                                        </button>
                                        <button 
                                          type="button"
                                          onClick={() => handleUpdatePackage(pkg.id)} 
                                          className="flex-1 py-1.5 rounded-lg bg-emerald-600 text-white text-[10px] font-bold cursor-pointer"
                                        >
                                          Save Change
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex justify-between items-center">
                                      <div className="flex items-center gap-2.5">
                                        <img src={pkg.photoUrl || parentSub?.photoUrl} className="w-8 h-8 rounded-lg object-cover border border-white/5" alt="Package" />
                                        <div>
                                          <h5 className="text-[11px] font-extrabold text-slate-100">{pkg.packageName}</h5>
                                          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                            <span className="text-[8px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded font-black">{pkg.coinCost} 🪙</span>
                                            <span className="text-[8px] bg-purple-500/15 text-[#D8B4FE] px-1.5 py-0.5 rounded font-bold">= {pkg.equivalentValue}</span>
                                            <span className="text-[8px] text-slate-500">Under: {parentSub ? parentSub.name : 'Unknown Sub'}</span>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      <div className="flex gap-1">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditingPkgId(pkg.id);
                                            setEditPkgName(pkg.packageName);
                                            setEditPkgVal(pkg.equivalentValue);
                                            setEditPkgCoins(pkg.coinCost);
                                            setEditPkgSubId(pkg.subId);
                                            setEditPkgPhoto(pkg.photoUrl || '');
                                          }}
                                          className="text-[8px] text-[#ffb020] bg-amber-500/10 hover:bg-amber-500/20 px-2 py-1.5 rounded bg-white/5 font-black uppercase cursor-pointer"
                                        >
                                          Edit
                                        </button>
                                        <button 
                                          type="button"
                                          onClick={() => handleDeletePackage(pkg.id)} 
                                          className="text-[8px] text-red-500 hover:text-red-400 bg-red-500/10 px-2 py-1.5 rounded font-black uppercase cursor-pointer"
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ======================= CONTROL HUB B.5: GAME COIN CONFIG ======================= */}
        {activeTab === 'resource_center' && resSubPage === 'control_center' && controlCenterPage === 'coin_config' && (
          <form onSubmit={handleSaveCoinConfig} className="bg-[#0e0d15] border border-white/5 rounded-3xl p-5 space-y-4 text-left shadow-2xl">
            <div className="flex items-center gap-2.5 border-b border-white/5 pb-2.5">
              <button
                type="button"
                onClick={() => setControlCenterPage('none')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#141418] border border-white/10 hover:border-yellow-500/20 text-slate-300 hover:text-white rounded-xl font-bold text-[10px] uppercase cursor-pointer transition-all active:scale-95 shadow-md font-sans"
              >
                <ArrowLeft className="w-3 h-3 text-yellow-500 animate-pulse" />
                <span>Back</span>
              </button>
              <div>
                <h3 className="text-xs font-black text-yellow-500 uppercase leading-none font-sans">GAME COIN CONFIGURATION</h3>
                <span className="text-[9px] text-white/30 block mt-0.5">Manage virtual reward allocations, ad yields, and system invite bonuses</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Box 1: Classic High-Roller Games */}
              <div className="bg-[#141418] border border-white/5 p-4 rounded-2xl space-y-3">
                <h4 className="text-[10px] font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-1.5 font-sans">
                  🕹️ Classic Arcade Games
                </h4>
                
                <div className="space-y-1">
                  <label className="text-[9px] text-white/40 block font-semibold">VIP Rocket Crash Max Multiplier</label>
                  <input
                    type="number"
                    step="1"
                    value={coinCrashMax}
                    onChange={(e) => setCoinCrashMax(Number(e.target.value))}
                    className="w-full bg-[#08080c] border border-white/10 rounded-xl px-3 py-2 text-slate-100 font-mono text-[11px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-white/40 block font-semibold">Coin Multiplier Win Coefficient</label>
                  <input
                    type="number"
                    step="0.1"
                    value={coinCoinflipMult}
                    onChange={(e) => setCoinCoinflipMult(Number(e.target.value))}
                    className="w-full bg-[#08080c] border border-white/10 rounded-xl px-3 py-2 text-slate-100 font-mono text-[11px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-white/40 block font-semibold">Golden Slots Max Winning Reward (🪙)</label>
                  <input
                    type="number"
                    step="1"
                    value={coinSlotMach}
                    onChange={(e) => setCoinSlotMach(Number(e.target.value))}
                    className="w-full bg-[#08080c] border border-white/10 rounded-xl px-3 py-2 text-slate-100 font-mono text-[11px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-white/40 block font-semibold">Spin Multiplier Maximum Award (🪙)</label>
                  <input
                    type="number"
                    step="1"
                    value={coinSpinWheelMax}
                    onChange={(e) => setCoinSpinWheelMax(Number(e.target.value))}
                    className="w-full bg-[#08080c] border border-white/10 rounded-xl px-3 py-2 text-slate-100 font-mono text-[11px]"
                  />
                </div>
              </div>

              {/* Box 2: Skill & Casual Challenges */}
              <div className="bg-[#141418] border border-white/5 p-4 rounded-2xl space-y-3">
                <h4 className="text-[10px] font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-1.5 font-sans">
                  🧩 Skill & Puzzle Games
                </h4>

                <div className="space-y-1">
                  <label className="text-[9px] text-white/40 block font-semibold">Mega Plinko Winning Base (🪙)</label>
                  <input
                    type="number"
                    step="1"
                    value={coinPlinkoReward}
                    onChange={(e) => setCoinPlinkoReward(Number(e.target.value))}
                    className="w-full bg-[#08080c] border border-white/10 rounded-xl px-3 py-2 text-slate-100 font-mono text-[11px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-white/40 block font-semibold">Color Match Shade Success (🪙)</label>
                  <input
                    type="number"
                    step="1"
                    value={coinColorMatch}
                    onChange={(e) => setCoinColorMatch(Number(e.target.value))}
                    className="w-full bg-[#08080c] border border-white/10 rounded-xl px-3 py-2 text-slate-100 font-mono text-[11px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-white/40 block font-semibold">Memory Matrix Completion (🪙)</label>
                  <input
                    type="number"
                    step="1"
                    value={coinMemoryChal}
                    onChange={(e) => setCoinMemoryChal(Number(e.target.value))}
                    className="w-full bg-[#08080c] border border-white/10 rounded-xl px-3 py-2 text-slate-100 font-mono text-[11px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-white/40 block font-semibold">Tic-Tac-Toe Smart Win Payout (🪙)</label>
                  <input
                    type="number"
                    step="1"
                    value={coinTictactoeWin}
                    onChange={(e) => setCoinTictactoeWin(Number(e.target.value))}
                    className="w-full bg-[#08080c] border border-white/10 rounded-xl px-3 py-2 text-slate-100 font-mono text-[11px]"
                  />
                </div>
              </div>

              {/* Box 3: Loot Box Chest Bounds */}
              <div className="bg-[#141418] border border-white/5 p-4 rounded-2xl space-y-3 md:col-span-2">
                <h4 className="text-[10px] font-black uppercase text-violet-400 tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-1.5 font-sans">
                  📦 Premium Loot Box Settings
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] text-white/40 block font-semibold">Minimum Chest Winnings (🪙)</label>
                    <input
                      type="number"
                      step="1"
                      value={coinLootboxMin}
                      onChange={(e) => setCoinLootboxMin(Number(e.target.value))}
                      className="w-full bg-[#08080c] border border-white/10 rounded-xl px-3 py-2 text-slate-100 font-mono text-[11px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-white/40 block font-semibold">Maximum Chest Winnings (🪙)</label>
                    <input
                      type="number"
                      step="1"
                      value={coinLootboxMax}
                      onChange={(e) => setCoinLootboxMax(Number(e.target.value))}
                      className="w-full bg-[#08080c] border border-white/10 rounded-xl px-3 py-2 text-slate-100 font-mono text-[11px]"
                    />
                  </div>
                </div>
              </div>

              {/* Box 4: Match-3, Home Ad Slots, and Invitation Incentives */}
              <div className="bg-[#141418] border border-white/5 p-4 rounded-2xl space-y-3 md:col-span-2">
                <h4 className="text-[10px] font-black uppercase text-red-500 tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-1.5 font-sans">
                  📢 Platform Ad Payouts & Invite Bonuses
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] text-white/40 block font-semibold">Match-3 Quest Jewels Blast Payout (🪙)</label>
                    <input
                      type="number"
                      step="1"
                      value={coinMatch3Reward}
                      onChange={(e) => setCoinMatch3Reward(Number(e.target.value))}
                      className="w-full bg-[#08080c] border border-white/10 rounded-xl px-3 py-2 text-slate-100 font-mono text-[11px]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-white/40 block font-semibold text-amber-400">Home Ad Slot Watch Reward (🪙)</label>
                    <input
                      type="number"
                      step="1"
                      value={coinHomeAdReward}
                      onChange={(e) => setCoinHomeAdReward(Number(e.target.value))}
                      className="w-full bg-[#08080c] border-white/10 border p-2 rounded-xl text-amber-300 font-mono text-[11px]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-white/40 block font-semibold font-sans">Referrer Bonus (User who Invites) (🪙)</label>
                    <input
                      type="number"
                      step="1"
                      value={coinReferrerBonus}
                      onChange={(e) => setCoinReferrerBonus(Number(e.target.value))}
                      className="w-full bg-[#08080c] border border-white/10 rounded-xl px-3 py-2 text-slate-100 font-mono text-[11px]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-white/40 block font-semibold font-sans">Referee Bonus (User who joins) (🪙)</label>
                    <input
                      type="number"
                      step="1"
                      value={coinReferredBonus}
                      onChange={(e) => setCoinReferredBonus(Number(e.target.value))}
                      className="w-full bg-[#08080c] border border-white/10 rounded-xl px-3 py-2 text-slate-100 font-mono text-[11px]"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-yellow-600 via-amber-600 to-yellow-600 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl cursor-pointer hover:opacity-90 transition-opacity active:scale-[0.99] shadow-lg shadow-amber-950/20 font-sans"
            >
              💾 Save Game Coin Config
            </button>
          </form>
        )}

        {/* ======================= CONTROL HUB C: SUPPORT LINKS ======================= */}
        {activeTab === 'resource_center' && resSubPage === 'control_center' && controlCenterPage === 'support' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 border-b border-white/5 pb-2.5">
              <button
                onClick={() => setControlCenterPage('none')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#141418] border border-white/10 hover:border-[#10b981]/20 text-slate-300 hover:text-white rounded-xl font-bold text-[10px] uppercase cursor-pointer transition-all active:scale-95 shadow-md"
              >
                <ArrowLeft className="w-3 h-3 text-[#10b981] animate-pulse" />
                <span>Back</span>
              </button>
              <h3 className="text-xs font-black text-[#10b981] uppercase">4. Support Channels & Official Links</h3>
            </div>

            {/* support subtabs */}
            <div className="flex gap-1.5 bg-[#121216]/60 p-1 border border-white/5 rounded-xl">
              <button onClick={() => setSuppSubTab('add')} className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer ${suppSubTab === 'add' ? 'bg-[#ffb020] text-slate-900 font-bold' : 'text-slate-400 hover:text-white'}`}>1. Add Link</button>
              <button onClick={() => setSuppSubTab('added')} className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer ${suppSubTab === 'added' ? 'bg-[#ffb020] text-slate-900 font-bold' : 'text-slate-400 hover:text-white'}`}>2. Added Link</button>
            </div>

            {/* FORM: ADD LINK */}
            {suppSubTab === 'add' && (
              <form onSubmit={handleAddSupportLink} className="bg-[#121216] border border-white/10 p-5 rounded-3xl text-left space-y-3.5 text-xs">
                <span className="text-[10px] text-[#10b981] font-black tracking-wider block text-center uppercase">Add New Helpline or Support Connection</span>
                
                <div className="space-y-1">
                  <span className="text-[9px] text-white/45 block font-semibold text-left">Link Title (e.g. Official Telegram Support Support Channel)</span>
                  <input type="text" required placeholder="e.g. Help Line & Telegram Group" value={newSuppTitle} onChange={(e) => setNewSuppTitle(e.target.value)} className="w-full bg-[#0A0A0C] border border-white/10 rounded-xl px-3.5 py-2.5 text-slate-100 outline-none" />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1 text-left">
                    <span className="text-[9px] text-white/45 block font-semibold text-left">Platform Category</span>
                    <select value={newSuppCat} onChange={(e) => setNewSuppCat(e.target.value as any)} className="w-full bg-[#0A0A0C] border border-white/10 rounded-xl px-2 py-2 text-slate-200">
                      <option value="telegram">Telegram</option>
                      <option value="facebook">Facebook</option>
                      <option value="group">Facebook Group</option>
                      <option value="web">Website / Partner</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] text-white/45 block">URL Destination URL</span>
                    <input type="text" required value={newSuppUrl} onChange={(e) => setNewSuppUrl(e.target.value)} className="w-full bg-[#0A0A0C] border border-white/10 rounded-xl px-3 py-2 text-indigo-400 font-mono" />
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] text-white/45 block text-left">Link Description (Short context)</span>
                  <input type="text" placeholder="e.g. Active 24/7 administrator helpline support for query resolutions." value={newSuppDesc} onChange={(e) => setNewSuppDesc(e.target.value)} className="w-full bg-[#0A0A0C] border border-white/10 rounded-xl px-3 py-2.5 text-slate-300" />
                </div>

                <button type="submit" className="w-full py-3 bg-[#10b981] hover:bg-[#059669] text-white font-extrabold text-xs uppercase tracking-widest rounded-2xl cursor-pointer">➕ Add Support Link</button>
              </form>
            )}

            {/* TAB: LIST LINK LIST */}
            {suppSubTab === 'added' && (
              <div className="space-y-2 text-left text-xs">
                {supportLinks.map((lnk) => (
                  <div key={lnk.id} className="bg-[#121216] border border-white/5 p-4 rounded-3xl space-y-2 relative">
                    <div className="flex items-center gap-2">
                      <Link className="w-4 h-4 text-emerald-400" />
                      <div>
                        <h4 className="text-xs font-black text-slate-100">{lnk.title}</h4>
                        <span className="text-[8px] bg-emerald-500/20 text-emerald-300 px-1.5 uppercase font-mono rounded mt-0.5 inline-block">{lnk.category}</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-white/40 leading-relaxed font-semibold">{lnk.description || 'N/A'}</p>
                    <span className="text-[9.5px] text-indigo-400 font-mono select-all block truncate mt-1">{lnk.url}</span>
                    
                    <button onClick={() => handleDeleteSupportLink(lnk.id)} className="absolute top-2 right-4 p-2 bg-red-500/10 hover:bg-red-500/20 rounded-xl text-red-500 cursor-pointer transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}



        {/* ======================= CONTROL HUB D: TRANSACTIONS (SUBMISSIONS / WITHDRAWS OVERVIEW) ======================= */}
        {activeTab === 'resource_center' && resSubPage === 'transactions' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 border-b border-white/5 pb-3">
              <button
                onClick={() => setResSubPage('none')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#141418] border border-white/10 hover:border-indigo-500/30 text-slate-300 hover:text-white rounded-xl font-bold text-[10px] uppercase cursor-pointer transition-all active:scale-95 shadow-md"
              >
                <ArrowLeft className="w-3 h-3 text-amber-400" />
                <span>Back</span>
              </button>
              <h3 className="text-xs font-black text-purple-400 uppercase tracking-widest leading-none">payouts & core task submissions checkroom</h3>
            </div>

            {/* top subtabs */}
            <div className="flex gap-1.5 bg-[#121216]/60 p-1 border border-white/5 rounded-xl">
              <button
                onClick={() => setTransTab('withdraws')}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer ${
                  transTab === 'withdraws' ? 'bg-[#ffb020] text-slate-900 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                1. Withdraws
              </button>
              <button
                onClick={() => setTransTab('submissions')}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer ${
                  transTab === 'submissions' ? 'bg-[#ffb020] text-slate-900 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                2. Submissions
              </button>
            </div>

            {/* LIST: WITHDRAW REQUESTS */}
            {transTab === 'withdraws' && (
              <div className="space-y-3.5">
                {/* SUB FILTER TOP BAR FOR WITHDRAWS */}
                <div className="flex gap-1.5 bg-[#121216]/40 p-1 border border-white/5 rounded-xl">
                  {[
                    { id: 'pending', label: 'Pending Requests' },
                    { id: 'completed', label: 'Complete Requests' },
                    { id: 'rejected', label: 'Reject Requests' }
                  ].map((subf) => (
                    <button
                      key={subf.id}
                      onClick={() => setWithdrawFilter(subf.id as any)}
                      className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                        withdrawFilter === subf.id
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {subf.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-3.5 text-left text-xs">
                  {(() => {
                    const filtered = withdrawals.filter((w) => w.status === (withdrawFilter === 'completed' ? 'completed' : withdrawFilter === 'rejected' ? 'rejected' : 'pending'));
                    if (filtered.length === 0) {
                      return (
                        <div className="bg-[#121216] border border-white/5 py-12 rounded-3xl text-center">
                          <Landmark className="w-8 h-8 text-white/5 mx-auto mb-2 animate-bounce" />
                          <p className="text-[10px] text-white/30 italic">No withdrawal requests found in this list category.</p>
                        </div>
                      );
                    }

                    return filtered.map((tx) => {
                      const parsed = parseWithdrawDetails(tx.targetDetails);
                      return (
                        <div key={tx.id} className="bg-[#121216] border border-white/5 p-4 rounded-3xl space-y-3 hover:border-indigo-500/20 transition-all shadow-inner">
                          <div className="flex justify-between items-start border-b border-white/5 pb-2">
                            <div className="flex items-center gap-2.5">
                              <img 
                                src={parsed.userPhoto} 
                                alt={parsed.userName} 
                                className="w-9 h-9 rounded-full object-cover border border-white/10 shrink-0" 
                              />
                              <div>
                                <span className="text-[8px] text-indigo-400 font-mono uppercase block tracking-widest leading-none">ORDER ID: {tx.id.slice(-8)}</span>
                                <h4 className="text-xs font-black text-slate-100 mt-1 text-left">{parsed.packageName}</h4>
                                <span className="text-[8px] text-white/35 block font-semibold text-left">{parsed.userName}</span>
                              </div>
                            </div>
                            <span className="text-xs font-black text-amber-500 font-mono">-{tx.amount} 🪙</span>
                          </div>

                          <div className="bg-black/40 border border-white/5 p-3 rounded-2xl space-y-1.5 font-mono text-[10px] leading-relaxed">
                            <div className="text-left">
                              <span className="text-white/30 text-[9px] block">Receipt Address / Account UID:</span>
                              <span className="text-emerald-400 select-all block break-all font-bold text-[11px] font-mono">{parsed.payoutNo || 'Not specified'}</span>
                            </div>
                            {parsed.memo && parsed.memo !== 'None' && (
                              <div className="text-left">
                                <span className="text-white/30 text-[9px] block font-mono">Memo Note / Ref Char ID:</span>
                                <span className="text-slate-300 block font-semibold text-[10px]">"{parsed.memo}"</span>
                              </div>
                            )}
                            <div className="pt-1 select-all border-t border-white/5 mt-1.5 flex justify-between items-center text-[9px]">
                              <span className="text-white/33 font-mono">Username detail:</span>
                              <span className="text-indigo-300 font-bold">@{tx.targetName}</span>
                            </div>
                          </div>

                          {tx.status === 'pending' ? (
                            <div className="grid grid-cols-2 gap-2.5 pt-1">
                              <button onClick={() => handleRejectWithdraw(tx.id)} className="py-2.5 bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 text-red-400 hover:text-red-300 rounded-xl font-bold text-[10px] uppercase cursor-pointer active:scale-95 transition-transform" >Decline</button>
                              <button onClick={() => handleApproveWithdraw(tx.id)} className="py-2.5 bg-green-500/10 hover:bg-green-500/15 border border-green-500/20 text-green-400 hover:text-green-300 rounded-xl font-bold text-[10px] uppercase cursor-pointer active:scale-95 transition-transform" >Approve</button>
                            </div>
                          ) : (
                            <div className="pt-1 text-center">
                              <span className={`text-[10px] px-3.5 py-1 rounded font-bold uppercase ${tx.status === 'completed' ? 'bg-green-600/10 text-green-400 border border-green-500/20' : 'bg-red-600/10 text-red-400 border border-red-500/20'}`}>{tx.status}</span>
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}

            {/* LIST: SCREENSHOT PROOFS */}
            {transTab === 'submissions' && (
              <div className="space-y-4">
                {/* SUB FILTER TOP BAR FOR TASK SUBMISSIONS */}
                <div className="flex gap-1.5 bg-[#121216]/40 p-1 border border-white/5 rounded-xl">
                  {[
                    { id: 'pending', label: 'Pending Checklist', count: submissions.filter(s => s.status === 'pending').length },
                    { id: 'approved', label: 'Approved Proofs', count: submissions.filter(s => s.status === 'approved').length },
                    { id: 'rejected', label: 'Rejected Proofs', count: submissions.filter(s => s.status === 'rejected').length }
                  ].map((subf) => (
                    <button
                      key={subf.id}
                      onClick={() => setSubmissionFilter(subf.id as any)}
                      className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        submissionFilter === subf.id
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 font-bold'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <span>{subf.label}</span>
                      {subf.count > 0 && (
                        <span className="px-1.5 py-0.5 bg-white/15 text-white rounded font-mono text-[8.5px] font-black leading-none">
                          {subf.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* DYNAMIC SEARCH BAR */}
                <div className="flex items-center gap-2 bg-[#121216] border border-white/10 px-3.5 py-2.5 rounded-2xl">
                  <Search className="w-4 h-4 text-white/35 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search by User ID, Task title or proof handle..."
                    value={proofSearch}
                    onChange={(e) => setProofSearch(e.target.value)}
                    className="bg-transparent text-xs text-slate-100 outline-none w-full placeholder:text-white/20"
                  />
                  {proofSearch && (
                    <button
                      onClick={() => setProofSearch('')}
                      className="text-white/30 hover:text-white text-[9px] uppercase font-black px-1.5 py-0.5 bg-white/5 rounded-lg transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* PROOF FEEDBACK FLOW ITEMS */}
                <div className="space-y-4 text-left text-xs">
                  {(() => {
                    const queryVal = proofSearch.toLowerCase().trim();
                    const filtered = submissions.filter((sub) => {
                      if (sub.status !== submissionFilter) return false;
                      
                      if (queryVal) {
                        const matchedT = tasks.find(t => t.id === sub.taskId);
                        const taskTitle = matchedT?.title || '';
                        const subUser = allUsers.find(u => u.id === sub.userId);
                        const username = subUser?.username || '';
                        const name = subUser?.name || '';
                        
                        const subId = sub.id || '';
                        const subUserId = sub.userId || '';
                        const subIdLink = sub.idLink || '';
                        
                        return (
                          subId.toLowerCase().includes(queryVal) ||
                          subUserId.toLowerCase().includes(queryVal) ||
                          subIdLink.toLowerCase().includes(queryVal) ||
                          taskTitle.toLowerCase().includes(queryVal) ||
                          username.toLowerCase().includes(queryVal) ||
                          name.toLowerCase().includes(queryVal)
                        );
                      }
                      return true;
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="bg-[#121216] border border-white/5 py-16 rounded-3xl text-center">
                          <CheckCircle className="w-9 h-9 text-white/5 mx-auto mb-2.5" />
                          <p className="text-[10px] text-white/30 italic">No matching task proof submissions found.</p>
                        </div>
                      );
                    }

                    return filtered.map((sub) => {
                      const matchedT = tasks.find(t => t.id === sub.taskId);
                      const subUser = allUsers.find(u => u.id === sub.userId);
                      
                      return (
                        <div 
                          key={sub.id} 
                          className="bg-[#121216] border border-white/5 p-5 rounded-[32px] space-y-4 hover:border-purple-500/25 transition-all shadow-xl relative overflow-hidden"
                        >
                          <div className="flex justify-between items-start border-b border-white/5 pb-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src={subUser?.picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
                                alt={subUser?.name || 'User Profile'}
                                className="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0"
                              />
                              <div className="min-w-0">
                                <span className="text-[8px] text-purple-400 font-mono font-bold uppercase tracking-widest block leading-none">CLIENT ID: {sub.userId}</span>
                                <h4 className="text-xs font-black text-slate-100 mt-1 truncate">{subUser?.name || 'Referred Client'}</h4>
                                <span className="text-[9px] text-white/35 block font-bold">@{subUser?.username || 'no_tg_handle'}</span>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="text-[10px] text-[#ffb020] bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-xl font-black font-mono leading-none inline-block">
                                +{matchedT?.rewardCoins || 100} 🪙
                              </span>
                              <span className="text-[8.5px] text-white/30 font-mono block mt-1.5">
                                {new Date(sub.submittedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          {/* Display sponsor details */}
                          <div className="bg-black/25 border border-white/5 p-3.5 rounded-2xl space-y-1">
                            <span className="text-[8px] text-white/30 uppercase font-black tracking-widest block">Core Sponsoring Task:</span>
                            <span className="text-xs font-extrabold text-slate-100 block truncate">{matchedT?.title || 'External Sponsor Task Offer'}</span>
                            <span className="text-[8.5px] text-purple-350 font-mono font-bold uppercase">CATEGORY: {matchedT?.taskType || 'Sponsor task'}</span>
                          </div>

                          {/* Evidence Screenshot */}
                          <div className="space-y-1.5">
                            <span className="text-[8px] text-white/30 uppercase font-black block">Submitted Screenshot Proof (Click to Zoom):</span>
                            {sub.screenshotUrls && sub.screenshotUrls.length > 0 ? (
                              <div
                                onClick={() => setFullscreenScreenshot(sub.screenshotUrls[0])}
                                className="aspect-[16/9] w-full bg-black/60 border border-white/10 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center cursor-pointer hover:border-purple-500/40 hover:scale-[1.01] transition-all relative group"
                              >
                                <img src={sub.screenshotUrls[0]} alt="Screenshot Evidence" className="w-full h-full object-contain" />
                                <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 pb-1">
                                  <Eye className="w-5 h-5 text-purple-400" />
                                  <span className="text-[8.5px] text-white font-extrabold uppercase tracking-wide">Zoom Proof / Full Screen</span>
                                </div>
                              </div>
                            ) : (
                              <div className="p-6 bg-red-950/10 border border-red-900/20 rounded-2xl text-center">
                                <span className="text-red-400 text-xs font-bold font-mono">No Image Uploaded</span>
                              </div>
                            )}
                          </div>

                          {/* Handle / link detail */}
                          <div className="bg-black/40 border border-white/5 p-3.5 rounded-2xl font-mono text-[9.5px] leading-relaxed select-all">
                            <span className="text-white/35 block font-sans font-black uppercase text-[7.5px] tracking-wider mb-1">User Submission Username/Proof Link:</span>
                            <p className="text-slate-150 block truncate font-bold text-[10.5px]">{sub.idLink || 'No external URL/handle specified'}</p>
                          </div>

                          {/* Custom note to the client */}
                          {sub.status === 'pending' && (
                            <div className="space-y-1.5">
                              <span className="text-[8px] text-purple-400 font-black uppercase tracking-wider block text-left">
                                Feedback note for user (Rejection reason/Instruction):
                              </span>
                              <input
                                type="text"
                                placeholder="e.g. Well done! Reward credited inside wallet. / Telegram group not joined properly."
                                value={adminNotes[sub.id] || ''}
                                onChange={(e) => setAdminNotes({ ...adminNotes, [sub.id]: e.target.value })}
                                className="w-full bg-[#0A0A0C] border border-white/10 rounded-xl px-3.5 py-2.5 text-slate-200 text-[10px] outline-none focus:border-purple-500/40"
                              />
                            </div>
                          )}

                          {sub.status === 'pending' ? (
                            <div className="space-y-2.5 pt-1">
                              <div className="grid grid-cols-2 gap-2.5">
                                <button
                                  onClick={() => handleRejectSub(sub.id)}
                                  className="py-3 bg-red-650/10 hover:bg-red-655/15 border border-red-500/20 text-red-400 hover:text-red-300 rounded-xl font-bold text-[10px] uppercase cursor-pointer active:scale-95 transition-transform"
                                >
                                  Reject Task Proof
                                </button>
                                <button
                                  onClick={() => handleApproveSub(sub.id, false)}
                                  className="py-3 bg-green-500/10 hover:bg-green-500/15 border border-green-500/20 text-green-400 hover:text-green-300 rounded-xl font-bold text-[10px] uppercase cursor-pointer active:scale-95 transition-transform"
                                >
                                  Approve Task Proof
                                </button>
                              </div>
                              <button
                                onClick={() => handleApproveSub(sub.id, true)}
                                className="w-full py-2 bg-yellow-500/5 hover:bg-yellow-500/10 border border-yellow-500/15 text-yellow-400 hover:text-yellow-300 rounded-xl font-black text-[9px] uppercase tracking-wider cursor-pointer active:scale-95 transition-transform"
                              >
                                ⚡ Simulate Hacker Spoof Approval
                              </button>
                            </div>
                          ) : (
                            <div className="pt-2 flex items-center justify-between border-t border-white/5">
                              <span className="text-[9px] text-white/30 uppercase font-black tracking-wider">Processed State:</span>
                              <span className={`text-[9px] px-3 py-1 rounded-lg font-black uppercase border tracking-wider ${
                                sub.status === 'approved' 
                                  ? 'bg-green-600/10 text-green-400 border-green-500/20' 
                                  : 'bg-red-600/10 text-red-500 border-red-500/20'
                              }`}>
                                {sub.status}
                              </span>
                            </div>
                          )}

                          {sub.adminNote && (
                            <div className="bg-[#121216] border border-white/10 p-3 rounded-2xl mt-1 text-left">
                              <span className="block font-bold text-[8px] uppercase text-white/30 font-sans tracking-wide">Recorded Feedback Note:</span>
                              <span className="text-yellow-300 block font-mono text-[10px] italic">"{sub.adminNote}"</span>
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Fullscreen Screenshot Modal */}
        <AnimatePresence>
          {fullscreenScreenshot && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/98 backdrop-blur-md p-4"
            >
              <div className="absolute top-4 left-4 z-50">
                <button
                  onClick={() => setFullscreenScreenshot(null)}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 border border-white/10 hover:border-indigo-500/20 text-slate-200 hover:text-white rounded-2xl font-black text-[11px] uppercase tracking-wide cursor-pointer transition-all active:scale-95 shadow-lg shadow-black/40"
                >
                  <ArrowLeft className="w-4 h-4 text-amber-400" />
                  <span>Back to Submissions</span>
                </button>
              </div>

              <div className="w-full max-w-lg mt-14 flex-1 flex items-center justify-center select-none">
                <img
                  src={fullscreenScreenshot}
                  alt="Evidence Screenshot Fullscreen"
                  className="max-w-full max-h-[80vh] object-contain rounded-3xl border border-white/10 shadow-2xl"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ======================= TAB 4: SECURITY & SETTINGS ======================= */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            <h3 className="text-xs font-black tracking-wider text-indigo-400 uppercase text-left">Security & App Settings</h3>
            
            {/* Sub Tabs Selection topbar */}
            <div className="flex gap-1.5 bg-[#121216]/60 p-1 border border-white/5 rounded-xl">
              {[
                { id: 'general', label: '1. App Settings' },
                { id: 'password', label: '2. Admin Password' }
              ].map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setSettSubTab(sub.id as any)}
                  className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                    settSubTab === sub.id ? 'bg-[#ffb020] text-slate-900 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>

            {/* APP SETTINGS PAGE (SUB-MENUS SUB TABS) */}
            {settSubTab === 'general' && (
              <div className="space-y-4 text-left text-xs font-semibold">
                
                {/* Option 1: Telegram Bot */}
                <form onSubmit={handleSaveBot} className="bg-[#121216] border border-white/5 p-4.5 rounded-3xl space-y-3">
                  <span className="text-[10px] text-indigo-400 block font-black uppercase tracking-widest">1. Telegram Bot Settings</span>
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <span className="text-[9px] text-white/40 block text-left">Telegram Bot Username</span>
                      <input type="text" required placeholder="@GoalTubeBDBot" value={botUsername} onChange={(e) => setBotUsername(e.target.value)} className="w-full bg-[#0A0A0C] border border-white/10 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono text-left" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] text-white/40 block text-left">Telegram Bot API Token Key</span>
                      <input type="password" required placeholder="71823910:AAH_..." value={botToken} onChange={(e) => setBotToken(e.target.value)} className="w-full bg-[#0A0A0C] border border-white/10 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono text-left" />
                    </div>
                  </div>
                  <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[10px] uppercase tracking-widest rounded-xl cursor-pointer leading-none">Update Bot Settings</button>
                </form>

                {/* Option 2: General settings API key and App Name */}
                <form onSubmit={handleSaveGeneral} className="bg-[#121216] border border-white/5 p-4.5 rounded-3xl space-y-3">
                  <span className="text-[10px] text-amber-500 block font-black uppercase tracking-wider">2. General App Settings</span>
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <span className="text-[9px] text-white/40 block text-left">Application Display Name (App Name)</span>
                      <input type="text" required placeholder="GoalTube BD" value={appName} onChange={(e) => setAppName(e.target.value)} className="w-full bg-[#0A0A0C] border border-white/10 rounded-xl px-3.5 py-2.5 text-slate-100 text-left" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] text-white/40 block text-left">ImgBB API Secret Key (Picture Host Gateway)</span>
                      <input type="text" required placeholder="8d...b8" value={imgbbKey} onChange={(e) => setImgbbKey(e.target.value)} className="w-full bg-[#0A0A0C] border border-white/10 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono text-left" />
                    </div>
                  </div>
                  <button type="submit" className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-[10px] uppercase tracking-widest rounded-xl cursor-pointer leading-none">Update General Settings</button>
                </form>

              </div>
            )}

            {/* ADMIN PASSWORD MANAGEMENT */}
            {settSubTab === 'password' && (
              <div className="space-y-4">
                <form onSubmit={handleChangePassword} className="bg-[#121216] border border-white/10 p-5 rounded-3xl text-left space-y-3.5 text-xs">
                  <span className="text-[10px] text-[#ffb020] font-black tracking-wider block text-center uppercase font-sans">Update Admin Security Password</span>
                  
                  <div className="space-y-1">
                    <span className="text-[9px] text-white/45 block text-left">Current Password Code</span>
                    <div className="bg-[#0A0A0C] border border-white/5 rounded-xl px-4 py-2.5 text-slate-400 font-mono tracking-widest text-[11px] font-bold text-left">
                      {oldAdminPass}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] text-white/45 block text-left">New Security Passcode</span>
                    <input
                      type="password"
                      required
                      placeholder="••••••••••••••"
                      value={newAdminPass}
                      onChange={(e) => setNewAdminPass(e.target.value)}
                      className="w-full bg-[#0A0A0C] border border-white/10 rounded-xl px-4 py-3 text-slate-100 font-mono tracking-widest text-sm outline-none text-left"
                    />
                    <span className="text-[8px] text-white/30 block text-left">Future administrative sessions will require inputting and verifying this new passcode.</span>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs uppercase tracking-widest rounded-2xl cursor-pointer transition-all active:scale-95 font-sans animate-pulse"
                  >
                    Change Password Settings
                  </button>
                </form>

                {/* Box 2 (New): ADMIN PANEL VISIBLE & ROLES DECK */}
                <div className="bg-[#121216] border border-white/10 p-5 rounded-3xl text-left space-y-4 text-xs">
                  <span className="text-[10px] text-[#ffb020] font-black tracking-wider block text-center uppercase font-sans">Admin Panel Visible Settings</span>
                  <p className="text-[9.5px] text-white/40 leading-relaxed font-sans text-center">
                    Search for any registered user by User ID or Username to grant or revoke specialized levels of system permissions. Only visible users can access the administrative deck.
                  </p>

                  {loggedAdminRole !== 'Maine admin' ? (
                    <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl text-center space-y-1">
                      <ShieldAlert className="w-6 h-6 text-red-400 mx-auto" />
                      <span className="text-[9px] text-red-400 font-bold uppercase tracking-wider block font-sans">Access Blocked!</span>
                      <p className="text-[8.5px] text-white/40 leading-relaxed font-sans">Only Main Admins can configure visible roles and system credentials.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Search Input Box */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Search User ID or username..."
                          value={permSearchUserId}
                          onChange={(e) => setPermSearchUserId(e.target.value)}
                          className="flex-1 bg-[#0A0A0C] border border-white/10 rounded-xl px-3.5 py-2 text-slate-100 font-mono text-xs outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleSearchUserForPermissions}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[10px] uppercase tracking-widest rounded-xl cursor-pointer font-sans"
                        >
                          Search
                        </button>
                      </div>

                      {permFoundUser && (
                        <div className="bg-[#0b0a11] border border-white/5 p-4 rounded-2xl space-y-3.5 animate-fade-in text-left">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <img src={permFoundUser.picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'} className="w-8 h-8 rounded-full object-cover border border-white/10" />
                              <div>
                                <h5 className="text-[11px] font-black text-slate-200">{permFoundUser.name}</h5>
                                <span className="text-[9px] text-white/30 block font-mono">ID: {permFoundUser.id}</span>
                              </div>
                            </div>
                            
                            {/* Toggle Switch */}
                            <button
                              type="button"
                              onClick={() => {
                                setPermActive(!permActive);
                              }}
                              className={`w-11 h-6 rounded-full p-0.5 transition-all outline-none duration-300 relative flex items-center ${
                                permActive ? 'bg-indigo-600' : 'bg-slate-700'
                              }`}
                            >
                              <span
                                className={`w-5 h-5 rounded-full bg-white shadow transition-transform duration-300 absolute ${
                                  permActive ? 'translate-x-[20px]' : 'translate-x-[0.5px]'
                                }`}
                              />
                            </button>
                          </div>

                          {permActive ? (
                            <div className="space-y-3.5 pt-3 border-t border-white/5 animate-scale-up">
                              <div className="space-y-1">
                                <span className="text-[9px] text-white/40 block text-left font-bold uppercase tracking-wider font-sans">Select Access Role:</span>
                                <select
                                  value={permRole}
                                  onChange={(e) => setPermRole(e.target.value as any)}
                                  className="w-full bg-[#0A0A0C] border border-white/10 rounded-xl px-2.5 py-2 text-slate-200 font-bold text-xs"
                                >
                                  <option value="Maine admin">Maine admin (Full Control)</option>
                                  <option value="Sub admin">Sub admin (No settings)</option>
                                  <option value="Visit admin">Visit admin (Read only)</option>
                                </select>
                              </div>

                              <div className="space-y-1">
                                <span className="text-[9px] text-white/40 block text-left font-bold uppercase tracking-wider font-sans">Set Personalized Login Code:</span>
                                <input
                                  type="text"
                                  placeholder="Type admin login passcode (e.g., Sayed@99)"
                                  value={permPassword}
                                  onChange={(e) => setPermPassword(e.target.value)}
                                  className="w-full bg-[#0A0A0C] border border-white/10 rounded-xl px-3 py-2 text-slate-100 font-mono text-xs"
                                />
                              </div>

                              <button
                                type="button"
                                onClick={handleSaveUserPermissions}
                                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[10px] uppercase tracking-widest rounded-xl cursor-pointer font-sans"
                              >
                                💾 Save Admin Access Roll
                              </button>
                            </div>
                          ) : (
                            <div className="pt-2">
                              <button
                                type="button"
                                onClick={handleRevokeUserPermissions}
                                className="w-full py-2 bg-red-650/10 hover:bg-red-500/20 text-red-400 font-extrabold text-[10px] uppercase tracking-widest rounded-xl cursor-pointer border border-red-500/20 font-sans"
                              >
                                ❌ Revoke & De-authorize Admin Access
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}

// Small helper count download list size
function downloadsUrlCount(lists: any[]) {
  return lists?.length || 0;
}
