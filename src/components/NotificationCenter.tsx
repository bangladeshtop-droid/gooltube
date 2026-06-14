import { motion } from 'motion/react';
import { Bell, ArrowLeft, Trash2, CheckCircle, Gamepad2, Landmark, RefreshCw, AlertCircle } from 'lucide-react';
import { AppNotification } from '../types';

interface NotificationCenterProps {
  notifications: AppNotification[];
  onClearAll: () => void;
  onBack: () => void;
}

export default function NotificationCenter({ notifications, onClearAll, onBack }: NotificationCenterProps) {
  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'task':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'game':
        return <Gamepad2 className="w-5 h-5 text-purple-400" />;
      case 'transfer':
        return <RefreshCw className="w-5 h-5 text-blue-400" />;
      case 'withdraw':
        return <Landmark className="w-5 h-5 text-amber-400" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getBG = (type: AppNotification['type']) => {
    switch (type) {
      case 'task':
        return 'bg-green-500/10 border-green-500/20';
      case 'game':
        return 'bg-purple-500/10 border-purple-500/20';
      case 'transfer':
        return 'bg-blue-500/10 border-blue-500/20';
      case 'withdraw':
        return 'bg-amber-500/10 border-amber-500/20';
      default:
        return 'bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <div className="w-full min-h-[80vh] flex flex-col pt-2 text-slate-100">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back</span>
        </button>
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]" />
          <h2 className="text-lg font-bold">Notifications</h2>
        </div>
        {notifications.length > 0 ? (
          <button
            onClick={onClearAll}
            className="text-red-400 hover:text-red-300 transition-colors p-1.5 rounded-lg hover:bg-red-500/10"
            title="Clear all notifications"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        ) : (
          <div className="w-7 h-7" />
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mb-4">
            <Bell className="w-8 h-8 text-slate-600" />
          </div>
          <h3 className="text-base font-semibold text-slate-300 mb-1">Inbox is empty</h3>
          <p className="text-slate-500 text-xs px-8 max-w-xs">
            Any updates on your tasks, games, and currency transactions will appear here in real-time.
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[70vh] overflow-y-auto scrollable pr-1">
          {notifications.map((notif) => (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              key={notif.id}
              className={`p-3.5 rounded-2xl border flex gap-3.5 transition-all ${getBG(notif.type)}`}
            >
              <div className="mt-0.5">{getIcon(notif.type)}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h4 className="text-slate-200 font-semibold text-sm leading-snug">{notif.title}</h4>
                  <span className="text-slate-500 text-[10px] whitespace-nowrap">{notif.timestamp}</span>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">{notif.description}</p>
                {notif.coinsChange !== undefined && (
                  <div className="mt-2.5 inline-flex items-center gap-1 bg-slate-950/40 py-1 px-2.5 rounded-lg border border-slate-800/50">
                    <span className="text-[10px] text-slate-400">Reward:</span>
                    <span
                      className={`text-xs font-bold ${
                        notif.coinsChange >= 0 ? 'text-yellow-400' : 'text-red-400'
                      }`}
                    >
                      {notif.coinsChange >= 0 ? '+' : ''}
                      {notif.coinsChange} 🪙
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
