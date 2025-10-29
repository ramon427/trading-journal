export interface Trade {
  id: string;
  name?: string; // Optional name/title for the trade
  date: string; // Entry date
  entryTime?: string; // Entry time (HH:MM format)
  symbol: string;
  type: 'long' | 'short';
  entryPrice: number;
  exitPrice: number | null; // null if trade is still open
  pnl: number;
  rr?: number; // Risk to Reward multiple - the reward amount (e.g., 2.5 means 1:2.5 risk to reward)
  notes: string;
  tags: string[];
  setup: string;
  // Optional fields for open trades
  stopLoss?: number;
  target?: number;
  exitDate?: string; // Date when trade was closed
  exitTime?: string; // Exit time (HH:MM format)
  status?: 'open' | 'closed'; // Track if trade is open or closed
  entryMode?: 'detailed' | 'simple'; // Track which entry mode was used for this trade
  // Screenshots - can be URLs or data URIs from uploaded files
  screenshotBefore?: string; // Entry screenshot
  screenshotAfter?: string; // Exit screenshot
  // Missed trade tracking - for opportunity cost analysis
  missedTrade?: boolean; // True if this was a trade opportunity that wasn't taken
  potentialPnl?: number; // Estimated P&L if the trade had been taken
  potentialRR?: number; // Estimated R:R if the trade had been taken
}

export interface NewsEvent {
  name: string;
  time: string; // HH:MM AM/PM format
}

export interface JournalEntry {
  date: string;
  name?: string; // Optional name/title for the journal entry (defaults to date)
  mood: 'excellent' | 'good' | 'neutral' | 'poor' | 'terrible';
  notes: string;
  lessonsLearned: string;
  marketConditions: string;
  didTrade: boolean;
  followedSystem: boolean;
  isNewsDay: boolean;
  newsEvents?: NewsEvent[]; // Optional array of news/economic events for this day
}

export interface DailyData {
  date: string;
  trades: Trade[];
  journalEntry?: JournalEntry;
  totalPnl: number;
}

export interface Statistics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalPnl: number;
  totalRR?: number;
  avgWin: number;
  avgWinRR?: number;
  avgLoss: number;
  avgLossRR?: number;
  avgRR?: number; // Average R per trade (total RR / total trades)
  bestRR?: number; // Best R:R trade
  largestWin: number;
  largestWinRR?: number;
  largestLoss: number;
  largestLossRR?: number;
  profitFactor: number;
  profitFactorRR?: number;
  avgDailyPnl: number;
  avgDailyRR?: number;
  bestDay: number;
  bestDayRR?: number;
  worstDay: number;
  worstDayRR?: number;
  currentStreak: number;
  longestWinStreak: number;
  longestLoseStreak: number;
  // Advanced metrics
  expectancy: number; // Average $ per trade
  expectancyRR?: number; // Average R per trade
  maxDrawdown: number; // Largest peak-to-trough decline
  maxDrawdownRR?: number;
  maxDrawdownDuration: number; // Days in drawdown
  recoveryTime: number; // Average days to recover from losses
  performanceByDay: { [key: string]: { trades: number; pnl: number; rr: number; winRate: number } };
  performanceBySetup: { [key: string]: { trades: number; pnl: number; rr: number; winRate: number } };
}

export interface AccountSettings {
  startingBalance: number;
  currentBalance?: number;
  accountCreatedDate: string;
}

export interface TradeTemplate {
  id: string;
  name: string;
  symbol?: string; // Optional - can be filled when using template
  type: 'long' | 'short';
  setup: string;
  tags: string[];
  notes?: string; // Template notes that can be customized
  stopLossPercent?: number; // % from entry
  targetPercent?: number; // % from entry
  defaultQuantity?: number;
  createdAt: string;
  lastUsed?: string;
  useCount: number;
}
