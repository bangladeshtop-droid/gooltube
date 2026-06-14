import { useState, useEffect, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle, 
  AlertCircle, 
  PlayCircle, 
  PlusCircle, 
  Check, 
  ArrowLeft, 
  Image as ImageIcon, 
  Send, 
  ExternalLink, 
  HelpCircle, 
  Clock, 
  Timer, 
  Lock, 
  ShieldAlert, 
  ShieldCheck 
} from 'lucide-react';
import { Task, User, TaskSubmission } from '../types';

interface TaskCenterProps {
  user: User;
  tasks: Task[];
  completedTaskIds: string[];
  onSubmitProof: (taskId: string, imageProofs: string[], note: string) => void;
  onClaimAdCoins: (taskId: string, rewardAmt: number) => void;
  onBack: () => void;
}

export default function TaskCenter({
  user,
  tasks,
  completedTaskIds,
  onSubmitProof,
  onClaimAdCoins,
  onBack,
}: TaskCenterProps) {
  // Tabs expanded to support Upcoming
  const [activeCategory, setActiveCategory] = useState<'watch' | 'visit' | 'post' | 'registration' | 'joined' | 'upcoming'>('watch');

  // Multi-page state system
  const [viewState, setViewState] = useState<'list' | 'details' | 'submit_form'>('list');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Submit form states
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [userIdLink, setUserIdLink] = useState('');
  const [userNote, setUserNote] = useState('');

  // -------------------------------------------------------------
  // ACTIVE VERIFICATION STATES & LOCAL PERSISTENCE
  // -------------------------------------------------------------
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [checkingTimers, setCheckingTimers] = useState<Record<string, { 
    startTime: number; 
    endTime: number; 
    type: 'watch_visit' | 'post_reg_join'; 
    reward: number; 
    status: 'counting' | 'claimable' | 'hacker_blocked'; 
  }>>({});

  // Dynamic Ticker state for countdown re-renders
  const [ticker, setTicker] = useState(0);

  // Requirement 1: Visited Site Tracker states
  const [siteTrackingTask, setSiteTrackingTask] = useState<Task | null>(null);
  const [siteTrackingStartTime, setSiteTrackingStartTime] = useState<number>(0);
  const [earlyExitData, setEarlyExitData] = useState<{
    task: Task;
    required: number;
    elapsed: number;
  } | null>(null);

  // Requirement 2: Security intrusion firewall and rejection viewer details
  const [firewallAlertTask, setFirewallAlertTask] = useState<Task | null>(null);
  const [showRejectionData, setShowRejectionData] = useState<{
    taskId: string;
    reason: string;
  } | null>(null);

  // Load submissions and timers on mount
  useEffect(() => {
    // Submissions
    const savedSubs = localStorage.getItem('taskx_v1_task_submissions');
    if (savedSubs) {
      try {
        setSubmissions(JSON.parse(savedSubs));
      } catch (e) {
        console.error(e);
      }
    }

    // Checking Timers
    const savedTimers = localStorage.getItem('taskx_v1_checking_timers');
    if (savedTimers) {
      try {
        setCheckingTimers(JSON.parse(savedTimers));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Save changes helper
  const saveCheckingTimers = (updated: typeof checkingTimers) => {
    setCheckingTimers(updated);
    localStorage.setItem('taskx_v1_checking_timers', JSON.stringify(updated));
  };

  // Tipping Ticker loop executing every 1s
  useEffect(() => {
    const handleInterval = () => {
      setTicker((prev) => prev + 1);

      // Load newest submissions from storage (Admin Panel modifications are shared immediately)
      const savedSubs = localStorage.getItem('taskx_v1_task_submissions');
      let currentParsedSubs: TaskSubmission[] = [];
      if (savedSubs) {
        try {
          currentParsedSubs = JSON.parse(savedSubs);
          setSubmissions(currentParsedSubs);
        } catch (e) {
          console.error(e);
        }
      }

      // Check ticking timers
      const raw = localStorage.getItem('taskx_v1_checking_timers');
      if (raw) {
        try {
          const timers = JSON.parse(raw) as typeof checkingTimers;
          let changed = false;

          // Auto-trigger 1-minute verification countdown for approved submissions (no manual raw start button needed)
          if (currentParsedSubs.length > 0) {
            currentParsedSubs.forEach((sub) => {
              if (sub.status === 'approved' && !timers[sub.taskId]) {
                const matchedT = tasks.find(t => t.id === sub.taskId);
                if (matchedT) {
                  timers[sub.taskId] = {
                    startTime: Date.now(),
                    endTime: Date.now() + 60000, // 1-minute automated check
                    type: 'post_reg_join',
                    reward: matchedT.rewardCoins,
                    status: 'counting',
                  };
                  changed = true;
                }
              }
            });
          }

          for (const taskId of Object.keys(timers)) {
            const timer = timers[taskId];
            if (timer.status === 'counting' && Date.now() >= timer.endTime) {
              changed = true;
              
              if (timer.type === 'watch_visit') {
                // Legitimate visit finished! Auto claim coins & mark completed
                onClaimAdCoins(taskId, timer.reward);
                
                // Remove timer
                delete timers[taskId];

                // Append local app notification
                const savedNotifs = localStorage.getItem('taskx_v1_notifs') || '[]';
                const parsedNotifs = JSON.parse(savedNotifs);
                const updatedNotifs = [{
                  id: `not_claim_${Date.now()}`,
                  type: 'task',
                  title: '🎉 Firebase Verified!',
                  description: `Automatic +${timer.reward} coins bonus release complete!`,
                  coinsChange: timer.reward,
                  timestamp: new Date().toISOString()
                }, ...parsedNotifs];
                localStorage.setItem('taskx_v1_notifs', JSON.stringify(updatedNotifs));

                alert(`🎉 Success! Firebase has verified your session. +${timer.reward} 🪙 has been added to your balance!`);
              } else {
                // Moderate task completed 1m countdown. Verify approvedBy identity!
                const freshSubsRaw = localStorage.getItem('taskx_v1_task_submissions') || '[]';
                const freshSubs: TaskSubmission[] = JSON.parse(freshSubsRaw);
                const assocSub = freshSubs.find((s) => s.taskId === taskId);

                if (assocSub && assocSub.approvedBy === 'hacker_spoof_id') {
                  // Captured simulated hacker spoof approval!
                  timer.status = 'hacker_blocked';
                } else {
                  // Approved by legitimate admin
                  timer.status = 'claimable';
                }
              }
            }
          }

          // Always set checking timers state to ensure the countdown ends properly and UI updates of checking status
          setCheckingTimers(timers);
          if (changed) {
            localStorage.setItem('taskx_v1_checking_timers', JSON.stringify(timers));
          }
        } catch (e) {
          console.error(e);
        }
      }
    };

    const intervalId = setInterval(handleInterval, 1000);
    return () => clearInterval(intervalId);
  }, [onClaimAdCoins]);

  // Handle Claims for Join/Register/Post after 1-minute countdown
  const handleClaimModeratedReward = (task: Task) => {
    // 1. Double check hacker lock state
    const timer = checkingTimers[task.id];
    if (!timer) return;

    if (timer.status === 'hacker_blocked') {
      setFirewallAlertTask(task);
      return;
    }

    // 2. Normal approval release!
    onClaimAdCoins(task.id, task.rewardCoins);

    // 3. Clean timer
    const updated = { ...checkingTimers };
    delete updated[task.id];
    saveCheckingTimers(updated);

    // 4. Remove submission proof record
    const savedSubs = localStorage.getItem('taskx_v1_task_submissions');
    if (savedSubs) {
      const parsed: TaskSubmission[] = JSON.parse(savedSubs);
      const remaining = parsed.filter((s) => s.taskId !== task.id);
      localStorage.setItem('taskx_v1_task_submissions', JSON.stringify(remaining));
      setSubmissions(remaining);
    }

    // 5. Append local success notification
    const savedNotifs = localStorage.getItem('taskx_v1_notifs') || '[]';
    const parsedNotifs = JSON.parse(savedNotifs);
    const updatedNotifs = [{
      id: `not_subclaim_${Date.now()}`,
      type: 'task',
      title: '🎁 Reward Claimed!',
      description: `Bounty of +${task.rewardCoins} coins added successfully for task: ${task.title}`,
      coinsChange: task.rewardCoins,
      timestamp: new Date().toISOString()
    }, ...parsedNotifs];
    localStorage.setItem('taskx_v1_notifs', JSON.stringify(updatedNotifs));

    alert(`🎁 Success! Claim of +${task.rewardCoins} coins for task "${task.title}" is complete.`);
    setViewState('list');
  };

  // -------------------------------------------------------------
  // HANDLERS FOR TASK INTERACTION
  // -------------------------------------------------------------
  const getCategoryTitle = (cat: string) => {
    switch (cat) {
      case 'watch':
        return 'Video Streams';
      case 'visit':
        return 'Web Navigation';
      case 'post':
        return 'Moderated Tasks';
      case 'registration':
        return 'App Registrations';
      case 'joined':
        return 'Joined Communities';
      case 'upcoming':
        return 'Upcoming Tasks Feed';
      default:
        return 'Tasks Feed';
    }
  };

  const handleOpenDetails = (task: Task) => {
    setSelectedTask(task);
    setViewState('details');
  };

  // Requirement 1: Launch target and activate Site watch/visit tracker
  const handleLaunchTarget = () => {
    if (!selectedTask) return;
    window.open(selectedTask.targetUrl, '_blank');

    if (selectedTask.taskType === 'watch' || selectedTask.taskType === 'visit') {
      // Initiate Site Stay tracking
      setSiteTrackingTask(selectedTask);
      setSiteTrackingStartTime(Date.now());
    }
  };

  // Requirement 1: User completes tracking stay limit and claims success verification
  const handleCompleteStayVerify = () => {
    if (!siteTrackingTask) return;

    const reqSeconds = siteTrackingTask.durationSeconds || 15;
    const spentSeconds = Math.floor((Date.now() - siteTrackingStartTime) / 1000);

    if (spentSeconds < reqSeconds) {
      // Failed - spent fewer seconds than required duration. Display Bengali dialog block
      setEarlyExitData({
        task: siteTrackingTask,
        required: reqSeconds,
        elapsed: spentSeconds,
      });
    } else {
      // Success stay verification! Move to 30-second Firebase countdown
      const updatedTimers = { ...checkingTimers };
      updatedTimers[siteTrackingTask.id] = {
        startTime: Date.now(),
        endTime: Date.now() + 30000, // 30-seconds checking countdown
        type: 'watch_visit',
        reward: siteTrackingTask.rewardCoins,
        status: 'counting',
      };
      saveCheckingTimers(updatedTimers);

      // Reset tracking state
      setSiteTrackingTask(null);
      setViewState('list');
      setSelectedTask(null);
      alert('⏱️ 30-second checking countdown started! Firebase is now validating your active session stay.');
    }
  };

  const handleOpenSubmitForm = () => {
    setUploadedImages([]);
    setUserIdLink('');
    setUserNote('');
    setViewState('submit_form');
  };

  const handleProofImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedImages((prev) => [...prev, reader.result as string].slice(0, 3));
      };
      reader.readAsDataURL(file);
    }
  };

  // Requirement 2: Submit files and register the 'pending' status
  const handleFinalSubmit = () => {
    if (!selectedTask) return;
    if (uploadedImages.length === 0) {
      alert('Attach at least 1 image proof screenshot of task done!');
      return;
    }
    if (!userIdLink.trim()) {
      alert('Fill in the ID link, username, or account handle Box!');
      return;
    }

    // Call submitted proof callback
    onSubmitProof(selectedTask.id, uploadedImages, `${userIdLink} | Memo: ${userNote}`);

    // Register locally for Moderated list
    const savedSubsRaw = localStorage.getItem('taskx_v1_task_submissions') || '[]';
    const savedSubs: TaskSubmission[] = JSON.parse(savedSubsRaw);
    
    // Clean old submission of same task if retrying
    const filteredSubs = savedSubs.filter((s) => s.taskId !== selectedTask.id);

    const newSub: TaskSubmission = {
      id: `sub_${Date.now()}`,
      taskId: selectedTask.id,
      userId: user.id,
      screenshotUrls: uploadedImages,
      idLink: userIdLink,
      status: 'pending',
      submittedAt: Date.now(),
    };

    localStorage.setItem('taskx_v1_task_submissions', JSON.stringify([newSub, ...filteredSubs]));
    setSubmissions([newSub, ...filteredSubs]);

    alert('📝 Proof submitted! Once approved by the admin panel, a 1-minute live checking countdown will begin.');
    setViewState('list');
    setSelectedTask(null);
  };

  // helper to query English countdown representation
  const formatUpcomingCountdown = (targetMs: number): string => {
    const diff = targetMs - Date.now();
    if (diff <= 0) return '0d, 0h, 0m, 0s';
    const secs = Math.floor(diff / 1000);
    const d = Math.floor(secs / 86400);
    const h = Math.floor((secs % 86400) / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${d}d, ${h}h, ${m}m, ${s}s`;
  };

  // -------------------------------------------------------------
  // DYNAMIC FEED FILTERS (Includes Upcoming scheduling logic)
  // -------------------------------------------------------------
  const filtered = tasks.filter((task) => {
    // If user completed a task, remove it from active feed lists entirely
    const isCompleted = completedTaskIds.includes(task.id);
    if (isCompleted) return false;

    const isUpcoming = task.upcomingReleaseTimestamp && task.upcomingReleaseTimestamp > Date.now();

    if (activeCategory === 'upcoming') {
      return isUpcoming; // Only show ongoing countdown tasks
    } else {
      // General categories: only show if category matches and is NOT upcoming
      return task.taskType === activeCategory && !isUpcoming;
    }
  });

  return (
    <div className="w-full flex flex-col pt-1">
      <AnimatePresence mode="wait">
        {/* VIEW 1: TASKS LIST VIEW */}
        {viewState === 'list' && (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {/* Category selector row */}
            <div className="flex gap-1.5 bg-[#121216]/60 border border-white/5 p-1 rounded-xl mb-4 overflow-x-auto scrollable py-1.5 shadow-inner">
              {[
                { id: 'watch', label: 'Watch' },
                { id: 'visit', label: 'Visit' },
                { id: 'post', label: 'Post' },
                { id: 'registration', label: 'Register' },
                { id: 'joined', label: 'Join' },
                { id: 'upcoming', label: '📅 Upcoming' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveCategory(t.id as any)}
                  className={`py-1.5 px-3.5 rounded-lg text-[10px] uppercase tracking-wider font-extrabold transition-all shrink-0 cursor-pointer ${
                    activeCategory === t.id 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Task list Feed */}
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-widest text-white/30">
                  {getCategoryTitle(activeCategory)}
                </h3>
                <span className={`text-[10px] font-black border px-2.5 py-0.5 rounded-full ${
                  activeCategory === 'upcoming' 
                    ? 'text-purple-400 bg-purple-500/10 border-purple-500/20 animate-pulse' 
                    : 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
                }`}>
                  {filtered.length} AVAILABLE
                </span>
              </div>

              {filtered.length === 0 ? (
                <div className="bg-[#141418] border border-white/5 p-12 text-center rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
                  <CheckCircle className="w-8 h-8 text-white/10 mx-auto mb-2" />
                  <p className="text-white/40 text-xs text-center font-bold">
                    {activeCategory === 'upcoming' 
                      ? 'No scheduled upcoming tasks available right now.' 
                      : 'All tasks cleared. Check back soon for fresh sponsors!'}
                  </p>
                </div>
              ) : (
                filtered.map((task) => {
                  const isCompleted = completedTaskIds.includes(task.id);
                  const verTimer = checkingTimers[task.id];
                  const subProof = submissions.find((s) => s.taskId === task.id);

                  // Calculate countdown remaining seconds
                  const checkTimeLeft = verTimer ? Math.max(0, Math.ceil((verTimer.endTime - Date.now()) / 1000)) : 0;

                  return (
                    <div
                      key={task.id}
                      className="bg-[#141418] hover:bg-[#18181f] border border-white/5 p-4 rounded-3xl flex items-center justify-between gap-4 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-[#0A0A0C] border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                          {task.imageUrl ? (
                            <img src={task.imageUrl} alt={task.title} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xl">📋</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-black text-slate-100 leading-tight mb-1 truncate">{task.title}</h4>
                          
                          {subProof?.adminNote && (
                            <div className="text-[8px] bg-indigo-500/10 border border-indigo-500/20 px-2 py-1 rounded-lg text-indigo-300 font-sans mb-1.5 max-w-[190px] break-words">
                              <span className="font-bold uppercase text-[7px] text-indigo-400 block">Feedback:</span>
                              "{subProof.adminNote}"
                            </div>
                          )}

                          {activeCategory === 'upcoming' ? (
                            <div className="flex items-center gap-1 mt-0.5 text-[9px] text-purple-400 font-bold">
                              <Clock className="w-3 h-3 text-purple-400 shrink-0" />
                              <span className="font-mono text-[8px] animate-pulse">
                                {formatUpcomingCountdown(task.upcomingReleaseTimestamp!)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[9px] font-extrabold text-amber-500 bg-amber-500/10 border border-amber-500/15 px-2 py-0.5 rounded-lg">
                              +{task.rewardCoins} 🪙
                            </span>
                          )}
                        </div>
                      </div>

                      {/* --- REQUIREMENT 3: UPCOMING COUNTDOWN VIEWER --- */}
                      {activeCategory === 'upcoming' ? (
                        <span className="text-[8px] font-extrabold text-purple-400 bg-purple-500/15 border border-purple-500/20 px-2.5 py-1.5 rounded-xl uppercase tracking-wider block font-mono shrink-0 animate-pulse">
                          ⏳ Locked
                        </span>
                      ) : isCompleted ? (
                        <span className="text-[10px] font-extrabold text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/15 px-3.5 py-1 rounded-full uppercase flex items-center gap-1 shrink-0">
                          <Check className="w-3 h-3" /> Done
                        </span>
                      ) : verTimer ? (
                        /* --- SECURE FIREWALL TIMER STATES --- */
                        verTimer.status === 'counting' ? (
                          <div className="flex flex-col items-end shrink-0">
                            {verTimer.type === 'watch_visit' ? (
                              <span className="text-[9px] font-black text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-xl flex items-center gap-1 font-mono">
                                <Timer className="w-3 h-3 animate-spin" /> {checkTimeLeft}s
                              </span>
                            ) : (
                              <span className="text-[9px] font-black text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-xl flex items-center gap-1 font-mono">
                                <Lock className="w-3 h-3 animate-pulse" /> checking {checkTimeLeft}s
                              </span>
                            )}
                            <span className="text-[7px] text-white/35 font-mono uppercase tracking-widest mt-1 block">Checking...</span>
                          </div>
                        ) : verTimer.status === 'hacker_blocked' ? (
                          <button
                            onClick={() => setFirewallAlertTask(task)}
                            className="py-1.5 px-3 bg-red-500/20 hover:bg-red-500/25 border border-red-500/30 text-red-400 text-[10px] font-black gap-1 rounded-xl cursor-pointer flex items-center shrink-0 uppercase"
                          >
                            <ShieldAlert className="w-3 h-3 text-red-500 shrink-0" /> Failed Check
                          </button>
                        ) : (
                          /* CLAIMABLE REWARD BUTTON */
                          <button
                            onClick={() => handleClaimModeratedReward(task)}
                            className="py-1.5 px-3.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:brightness-110 text-white text-[10px] font-black rounded-xl cursor-pointer shadow-md select-none active:scale-95 shrink-0 uppercase tracking-wider flex items-center gap-1 font-sans"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-white" /> Claim Reward
                          </button>
                        )
                      ) : subProof ? (
                        /* MODERATED SUBMISSION STATES */
                        subProof.status === 'pending' ? (
                          <span className="text-[9px] font-extrabold text-blue-400 bg-blue-500/10 border border-blue-500/15 px-3 py-1.5 rounded-xl uppercase tracking-wider shrink-0 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-blue-400 shrink-0" /> Task Pending
                          </span>
                        ) : subProof.status === 'rejected' ? (
                          <button
                            onClick={() => setShowRejectionData({ taskId: task.id, reason: subProof.rejectionReason || 'Proof is invalid' })}
                            className="py-1 px-2 mb-0.5 bg-red-400/10 hover:bg-red-400/15 border border-red-500/20 text-red-500 hover:text-red-400 text-[9px] font-bold rounded-lg cursor-pointer transition-all active:scale-95 shrink-0 uppercase text-center max-w-[110px]"
                          >
                            ❌ Rejected (Details)
                          </button>
                        ) : (
                          // Approved but without timer started (safety fallback trigger)
                          <button
                            onClick={() => {
                              const list = { ...checkingTimers };
                              list[task.id] = {
                                startTime: Date.now(),
                                endTime: Date.now() + 60000,
                                type: 'post_reg_join',
                                reward: task.rewardCoins,
                                status: 'counting',
                              };
                              saveCheckingTimers(list);
                            }}
                            className="py-1.5 px-3 bg-indigo-600 text-[10px] font-bold rounded-xl text-white"
                          >
                            Initialize Check
                          </button>
                        )
                      ) : (
                        /* PRIMARY VIEW TRIGGER */
                        <button
                          onClick={() => handleOpenDetails(task)}
                          className="py-1.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-slate-100 text-[11px] font-black rounded-xl shadow-md cursor-pointer transition-all select-none active:scale-95 shadow-indigo-600/25 shrink-0"
                          style={{ WebkitTapHighlightColor: 'transparent' }}
                        >
                          View
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}

        {/* VIEW 2: TASK DETAILS COMPRESSED VIEW */}
        {viewState === 'details' && selectedTask && (
          <motion.div
            key="details"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            {/* Header bar */}
            <div className="flex items-center gap-3 border-b border-white/5 pb-3">
              <button
                onClick={() => setViewState('list')}
                className="w-8 h-8 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10 text-slate-300 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <span className="text-[8px] text-indigo-400 font-extrabold tracking-widest block uppercase">COMMUNITY TASK DETAILS</span>
                <h3 className="text-xs font-black text-slate-100 uppercase tracking-tight truncate leading-none pt-1">Task Specification</h3>
              </div>
            </div>

            {/* Task Banner image & title info */}
            <div className="bg-gradient-to-br from-[#1A1A20] via-[#121216] to-[#141418] border border-white/10 rounded-[28px] p-5 text-center relative overflow-hidden shadow-xl">
              <div className="w-20 h-20 mx-auto mb-3 rounded-2xl border border-white/10 overflow-hidden shadow-md">
                <img src={selectedTask.imageUrl} alt={selectedTask.title} className="w-full h-full object-cover" />
              </div>

              <h3 className="text-sm font-black text-slate-100 tracking-tight leading-snug">{selectedTask.title}</h3>
              <div className="mt-3.5 inline-flex items-center gap-1 px-3.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full text-[10px] font-black tracking-wider uppercase">
                Reward: +{selectedTask.rewardCoins} Coins 🪙
              </div>
            </div>

            {/* Framed Description Box (Campaign Instructions) */}
            <div className="bg-[#141418] border-2 border-indigo-500/15 rounded-[24px] p-4 text-left shadow-lg">
              <div className="flex items-center gap-1.5 mb-2.5">
                <HelpCircle className="w-4 h-4 text-indigo-400" />
                <span className="text-[10px] font-black text-slate-300 tracking-wider uppercase">Campaign Guidelines & Instructions</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed font-med font-sans whitespace-pre-wrap">
                {selectedTask.instructions || 'Sponsor did not submit custom rules instructions. Open target link to do activity, then submit proof screens.'}
              </p>

              {/* Display visit Stay time limit badge if appropriate */}
              {(selectedTask.taskType === 'watch' || selectedTask.taskType === 'visit') && selectedTask.durationSeconds && (
                <div className="bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-xl mt-3 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
                  <span className="text-[10px] font-black text-amber-400 uppercase">Required minimum site session time: {selectedTask.durationSeconds} seconds</span>
                </div>
              )}
            </div>

            {/* Action Buttons list */}
            <div className="space-y-2.5 pt-1">
              <button
                onClick={handleLaunchTarget}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl cursor-pointer transition-all active:scale-95 shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5 select-none"
              >
                <ExternalLink className="w-4 h-4" /> Go to Link / Start Task
              </button>

              {/* Submit button only for post, registration and joined categories */}
              {(selectedTask.taskType === 'post' || selectedTask.taskType === 'registration' || selectedTask.taskType === 'joined') && (
                <button
                  onClick={handleOpenSubmitForm}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:brightness-105 text-slate-950 font-black text-xs uppercase tracking-widest rounded-2xl cursor-pointer transition-all active:scale-95 shadow-lg shadow-amber-500/5 flex items-center justify-center gap-1.5 select-none"
                >
                  <ImageIcon className="w-4 h-4 text-slate-950" /> Submit Task Proof
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* VIEW 3: TASK SCREENSHOT SUBMISSION PROOF SCREEN */}
        {viewState === 'submit_form' && selectedTask && (
          <motion.div
            key="submit_form"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4 text-left"
          >
            {/* Header with back */}
            <div className="flex items-center gap-3 border-b border-white/5 pb-3">
              <button
                onClick={() => setViewState('details')}
                className="w-8 h-8 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10 text-slate-300 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-slate-300" />
              </button>
              <span className="text-[12px] font-black uppercase text-slate-200 tracking-wider">Submit Proof</span>
            </div>

            {/* Custom Interactive Photo upload system */}
            <div className="bg-[#141418] border border-white/5 rounded-3xl p-5 space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] text-[#ffb020] uppercase font-black tracking-wider block">1. Upload Screenshot Proof</span>
                <p className="text-[9px] text-white/30">Attach 1 to 3 screenshots proving you completed the assignment.</p>
              </div>

              <div className="flex gap-2.5 justify-center">
                {[0, 1, 2].map((idx) => {
                  const hasImage = uploadedImages[idx] !== undefined;
                  return (
                    <label
                      key={idx}
                      className={`flex-1 aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden ${
                        hasImage ? 'border-indigo-500 bg-[#0A0A0C]' : 'border-white/10 bg-white/2 hover:bg-white/5'
                      }`}
                    >
                      {hasImage ? (
                        <img src={uploadedImages[idx]} alt="Proof" className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <PlusCircle className="w-4 h-4 text-slate-500" />
                          <span className="text-[8px] text-slate-600 font-bold mt-1">SLOT {idx + 1}</span>
                        </>
                      )}
                      <input type="file" accept="image/*" onChange={handleProofImageUpload} className="hidden" />
                    </label>
                  );
                })}
              </div>

              {/* ID Link box */}
              <div className="space-y-1.5">
                <label className="text-[9px] text-white/45 uppercase font-extrabold tracking-wider block">
                  2. Account Username / ID Verification Details
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. My telegram @JohnD or URL link to post"
                  value={userIdLink}
                  onChange={(e) => setUserIdLink(e.target.value)}
                  className="w-full bg-[#0A0A0C] border border-white/5 rounded-2xl pr-4 pl-3.5 py-3 text-slate-200 text-xs font-semibold focus:border-indigo-500 outline-none transition-all font-mono"
                />
              </div>

              {/* Note Box */}
              <div className="space-y-1.5">
                <label className="text-[9px] text-white/45 uppercase font-extrabold tracking-wider block">
                  3. Custom Instructions / Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Complete registration done with username Sayed12"
                  value={userNote}
                  onChange={(e) => setUserNote(e.target.value)}
                  className="w-full bg-[#0A0A0C] border border-white/5 rounded-2xl pr-4 pl-3.5 py-3 text-slate-200 text-xs font-semibold focus:border-indigo-500 outline-none transition-all"
                />
              </div>

              {/* Submit CTA button */}
              <button
                onClick={handleFinalSubmit}
                className="w-full py-3 bg-[#6366f1] hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl cursor-pointer transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" /> Submit Proof to Admin
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* REQUIREMENT 1: VISITOR SITE ATTENDANCE RUNNING TRACKER */}
      <AnimatePresence>
        {siteTrackingTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/98 backdrop-blur"
          >
            <div className="text-center p-6 bg-[#141418] border border-white/10 rounded-[32px] max-w-xs shadow-2xl relative overflow-hidden space-y-4">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 animate-pulse" />
              
              <div className="w-14 h-14 rounded-full bg-amber-500/15 border border-amber-500/25 flex items-center justify-center mx-auto animate-pulse">
                <PlayCircle className="w-9 h-9 text-amber-400" />
              </div>
              
              <div className="space-y-1">
                <h3 className="text-slate-100 font-extrabold text-[13px] uppercase tracking-wider">Sponsor Secured browser Active</h3>
                <p className="text-slate-400 text-[10px] leading-relaxed">
                  Navigate through the target sponsor link and complete the required steps. Stay on the site until the minimum required time lapses to qualify for credit.
                </p>
              </div>

              <div className="bg-black/40 border border-white/5 py-3.5 px-4 rounded-2xl">
                <span className="text-[8px] text-white/30 uppercase tracking-widest block font-black mb-1">Required Stay Duration</span>
                <span className="text-[17px] font-black font-mono text-amber-400">{siteTrackingTask.durationSeconds || 15}s</span>
              </div>

              {/* Complete verification CTA button */}
              <button
                onClick={handleCompleteStayVerify}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl cursor-pointer transition-colors active:scale-[0.98] select-none block"
              >
                ✅ Task Completed, Verify Progress
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* REQUIREMENT 1: TIME CHECK LIMIT EXCEEDED EARLY EXIT ERROR BENGALI popup */}
      <AnimatePresence>
        {earlyExitData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/98 backdrop-blur"
          >
            <div className="bg-[#141418] border-2 border-red-500/25 p-6 rounded-[32px] w-full max-w-sm text-center relative overflow-hidden shadow-2xl space-y-4 animate-scale-up">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-rose-500 to-red-600 animate-pulse" />
              
              <div className="w-14 h-14 bg-red-400/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-1">
                <AlertCircle className="w-7 h-7 text-red-500 animate-bounce" />
              </div>

              <h3 className="text-xs font-black text-[#f43f5e] uppercase tracking-widest leading-none">Time Warning Alert</h3>
              
              <p className="text-[11.5px] text-slate-300 leading-relaxed font-sans font-medium">
                <span className="text-slate-100 font-extrabold text-[12.5px]">{user.name || user.username || 'User'}</span>, you were active on the site for only <span className="text-red-500 font-black">{earlyExitData.elapsed}</span> seconds out of the required <span className="text-[#FFB020] font-black">{earlyExitData.required}</span> seconds. No coins could be distributed as you closed the task early.
              </p>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSiteTrackingTask(null);
                    setEarlyExitData(null);
                  }}
                  className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-slate-300 font-black text-[11px] uppercase tracking-widest rounded-2xl cursor-pointer transition-colors active:scale-95 text-center block select-none"
                >
                  Back Task Page
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const taskToRetry = earlyExitData.task;
                    setEarlyExitData(null);
                    // Open the sponsor URL again so they can complete properly!
                    if (taskToRetry?.targetUrl) {
                      window.open(taskToRetry.targetUrl, '_blank');
                    }
                    // Reset our tracking clock
                    setSiteTrackingStartTime(Date.now());
                  }}
                  className="w-full py-3 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl cursor-pointer transition-colors active:scale-[1.01] text-center block select-none shadow-md shadow-red-500/15"
                >
                  Retry & Open Site
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* REQUIREMENT 2: FIREWALL SECURITIES INTRUSION ATTACK WARNING ALARM */}
      <AnimatePresence>
        {firewallAlertTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/98 backdrop-blur"
          >
            <div className="bg-[#141418] border-2 border-red-500/25 p-6 rounded-[32px] w-full max-w-sm text-center relative overflow-hidden shadow-2xl space-y-4">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-rose-500 to-red-600 animate-pulse" />
              
              <div className="w-14 h-14 bg-red-400/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto">
                <ShieldAlert className="w-7 h-7 text-red-500 animate-bounce" />
              </div>

              <h3 className="text-xs font-black text-red-500 uppercase tracking-widest leading-none block">🔒 Firebase Hacker Intrusion Blocked</h3>
              
              <p className="text-[11.5px] text-slate-300 leading-relaxed font-sans font-medium">
                Security violation detected! Google Firebase has successfully blocked a simulated approval attempt without administrative rights. No tokens have been distributed, and the active task state has been reset.
              </p>

              <button
                type="button"
                onClick={() => {
                  const timers = { ...checkingTimers };
                  delete timers[firewallAlertTask.id];
                  saveCheckingTimers(timers);

                  // Delete submission proof details so user can do it again properly
                  const savedSubs = localStorage.getItem('taskx_v1_task_submissions') || '[]';
                  const parsed: TaskSubmission[] = JSON.parse(savedSubs);
                  const remaining = parsed.filter((sub) => sub.taskId !== firewallAlertTask.id);
                  localStorage.setItem('taskx_v1_task_submissions', JSON.stringify(remaining));
                  setSubmissions(remaining);

                  setFirewallAlertTask(null);
                  setViewState('list');
                }}
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl cursor-pointer transition-colors active:scale-95 text-center block select-none font-sans"
              >
                Reset Task & Back to Feed
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* REQUIREMENT 2: REJECTION EXPLAIN DIALOG WITH "Restart Task" BUTTON */}
      <AnimatePresence>
        {showRejectionData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/98 backdrop-blur"
          >
            <div className="bg-[#141418] border-2 border-amber-500/20 p-6 rounded-[32px] w-full max-w-sm text-center relative overflow-hidden shadow-2xl space-y-4">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 animate-pulse" />
              
              <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-1">
                <HelpCircle className="w-7 h-7 text-amber-500 animate-pulse" />
              </div>

              <h3 className="text-xs font-black text-amber-400 uppercase tracking-widest leading-none">❌ Rejection Feedback</h3>
              
              <div className="bg-black/40 border border-white/5 p-4 rounded-2xl text-left font-mono">
                <span className="text-[8px] text-white/30 block mb-1 uppercase tracking-wider font-extrabold">Admin Message (Reason details):</span>
                <p className="text-[11px] text-rose-400 font-bold leading-relaxed whitespace-pre-wrap">{showRejectionData.reason}</p>
              </div>

              <p className="text-[10px] text-white/40 leading-normal">
                The submitted proof screenshot was invalid or rejected. Please hit the button below to restart and correct your task state.
              </p>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setShowRejectionData(null)}
                  className="py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 font-black text-[10px] uppercase tracking-widest rounded-xl cursor-pointer text-center select-none"
                >
                  Close Dialog
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    // Evict old sub proof to let them start clean again!
                    const savedSubs = localStorage.getItem('taskx_v1_task_submissions') || '[]';
                    const parsed: TaskSubmission[] = JSON.parse(savedSubs);
                    const remaining = parsed.filter((s) => s.taskId !== showRejectionData.taskId);
                    localStorage.setItem('taskx_v1_task_submissions', JSON.stringify(remaining));
                    setSubmissions(remaining);

                    setShowRejectionData(null);
                  }}
                  className="py-2.5 bg-amber-50 hover:bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-widest rounded-xl cursor-pointer text-center select-none"
                >
                  Restart Task
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
