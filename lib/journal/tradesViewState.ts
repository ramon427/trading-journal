// Persist Trades view state (selected date, etc.)

const TRADES_VIEW_STATE_KEY = 'trading-journal-trades-view-state';

export interface TradesViewState {
  selectedDate: string | null;
  highlightedDate: string | null;
}

const DEFAULT_STATE: TradesViewState = {
  selectedDate: null,
  highlightedDate: null,
};

export function getTradesViewState(): TradesViewState {
  try {
    const stored = localStorage.getItem(TRADES_VIEW_STATE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load trades view state:', error);
  }
  return DEFAULT_STATE;
}

export function saveTradesViewState(state: Partial<TradesViewState>): void {
  try {
    const current = getTradesViewState();
    const updated = { ...current, ...state };
    localStorage.setItem(TRADES_VIEW_STATE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save trades view state:', error);
  }
}

export function clearTradesViewState(): void {
  try {
    localStorage.removeItem(TRADES_VIEW_STATE_KEY);
  } catch (error) {
    console.error('Failed to clear trades view state:', error);
  }
}
