export type DisplayMode = 'pnl' | 'rr';

export interface AppSettings {
  displayMode: DisplayMode;
  showWeekends: boolean;
}

const SETTINGS_KEY = 'trading_journal_settings';

const defaultSettings: AppSettings = {
  displayMode: 'pnl',
  showWeekends: true,
};

export const loadSettings = (): AppSettings => {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
  return defaultSettings;
};

export const saveSettings = (settings: AppSettings): void => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving settings:', error);
    // Note: Don't import toast here to avoid circular dependencies
    // Parent components should handle error toasts
  }
};
