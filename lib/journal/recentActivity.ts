const RECENT_ACTIVITY_KEY = 'trading-journal-dismissed-recents';

export interface DismissedRecents {
  tradeIds: string[];
  journalDates: string[];
  dismissedAt: number;
}

export function getDismissedRecents(): DismissedRecents {
  try {
    const stored = localStorage.getItem(RECENT_ACTIVITY_KEY);
    if (!stored) {
      return { tradeIds: [], journalDates: [], dismissedAt: 0 };
    }
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to load dismissed recents:', error);
    return { tradeIds: [], journalDates: [], dismissedAt: 0 };
  }
}

export function dismissCurrentRecents(tradeIds: string[], journalDates: string[]): void {
  try {
    const dismissed: DismissedRecents = {
      tradeIds,
      journalDates,
      dismissedAt: Date.now(),
    };
    localStorage.setItem(RECENT_ACTIVITY_KEY, JSON.stringify(dismissed));
  } catch (error) {
    console.error('Failed to save dismissed recents:', error);
  }
}

export function clearDismissedRecents(): void {
  try {
    localStorage.removeItem(RECENT_ACTIVITY_KEY);
  } catch (error) {
    console.error('Failed to clear dismissed recents:', error);
  }
}
