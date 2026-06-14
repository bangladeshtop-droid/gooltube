import { motion } from 'motion/react';
import { Gamepad2, ClipboardList, Home, Trophy, User } from 'lucide-react';

interface BottomNavBarProps {
  currentTab: string;
  onChangeTab: (tab: string) => void;
}

export default function BottomNavBar({ currentTab, onChangeTab }: BottomNavBarProps) {
  const tabs = [
    { id: 'game', name: 'Game', icon: Gamepad2, activeClass: 'text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]', glowBg: 'bg-rose-500/15', glowBorder: 'border-rose-500/25', defaultClass: 'text-slate-400 hover:text-rose-200' },
    { id: 'tasks', name: 'Task', icon: ClipboardList, activeClass: 'text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]', glowBg: 'bg-emerald-500/15', glowBorder: 'border-emerald-500/25', defaultClass: 'text-slate-400 hover:text-emerald-200' },
    { id: 'home', name: 'Home', icon: Home, activeClass: 'text-sky-400 drop-shadow-[0_0_8px_rgba(14,165,233,0.6)]', glowBg: 'bg-sky-500/15', glowBorder: 'border-sky-500/25', defaultClass: 'text-slate-400 hover:text-sky-200' },
    { id: 'leaderboard', name: 'Rank', icon: Trophy, activeClass: 'text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]', glowBg: 'bg-amber-500/15', glowBorder: 'border-amber-500/25', defaultClass: 'text-slate-400 hover:text-amber-200' },
    { id: 'profile', name: 'Profile', icon: User, activeClass: 'text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]', glowBg: 'bg-purple-500/15', glowBorder: 'border-purple-500/25', defaultClass: 'text-slate-400 hover:text-purple-200' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-gradient-to-b from-[#151322]/95 to-[#090812]/98 border-t border-t-purple-500/30 backdrop-blur-2xl px-3 pt-2.5 pb-6.5 z-40 shadow-[0_-15px_40px_rgba(168,85,247,0.18)] rounded-t-[26px]">
      <div className="flex justify-around items-center">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              id={`nav_btn_${tab.id}`}
              onClick={() => onChangeTab(tab.id)}
              className="relative flex flex-col items-center gap-1 py-1.5 px-3 rounded-2xl cursor-pointer select-none transition-all duration-250 active:scale-90"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabGlow"
                  className={`absolute inset-0 ${tab.glowBg} rounded-2xl shadow-[0_0_25px_rgba(168,85,247,0.15)] border ${tab.glowBorder}`}
                  transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                />
              )}
              <div
                className={`z-10 flex flex-col items-center ${isActive ? tab.activeClass : tab.defaultClass}`}
              >
                <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-115' : 'scale-100'}`} />
                <span className="text-[10px] font-extrabold mt-1 tracking-wider uppercase">{tab.name}</span>
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
