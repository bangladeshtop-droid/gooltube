export type GameID =
  | 'crash'
  | 'ad'
  | 'mining'
  | 'plinko'
  | 'coinflip'
  | 'spinwheel'
  | 'slot'
  | 'color'
  | 'quiz'
  | 'ttt'
  | 'memory'
  | 'luckybox'
  | 'match3';

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  picture: string;
  coins: number;
  joinedAt: string;
  status: string;
  cvp: string;
  cardNumber: string;
  miningStartTime: number; // timestamp, 0 if not active
  phone?: string;
  telegramMobile?: string;
  password?: string;
}

export interface Task {
  id: string;
  title: string;
  taskType: 'watch' | 'visit' | 'post' | 'registration' | 'joined';
  instructions: string;
  rewardCoins: number;
  imageUrl: string;
  targetUrl: string;
  buttonLabel: string;
  upcomingTime?: string | null; // e.g. "3h" or "10m"
  createdAt?: number;
  durationSeconds?: number;
  upcomingReleaseTimestamp?: number;
}

export interface TaskSubmission {
  id: string;
  taskId: string;
  userId: string;
  screenshotUrls: string[];
  idLink: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: number;
  approvedAt?: number;
  approvedBy?: string;
  rejectionReason?: string;
  adminNote?: string; // Optional note from admin informing users of approval or rejection details
}

export interface AppNotification {
  id: string;
  type: 'task' | 'game' | 'transfer' | 'withdraw' | 'system';
  title: string;
  description: string;
  timestamp: string;
  coinsChange?: number;
}

export interface Transaction {
  id: string;
  type: 'transfer_send' | 'transfer_recv' | 'withdraw';
  amount: number;
  targetName: string;
  targetDetails: string;
  status: 'pending' | 'completed' | 'rejected';
  timestamp: string;
}

export interface PaymentMethodValue {
  id: string;
  parentId: string;
  name: string;
  photoUrl: string;
  coinValue: string;
  currency: string;
  minCoins: number;
  number: string;
}
