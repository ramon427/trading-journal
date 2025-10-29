/**
 * Smart Defaults System
 * Remembers last used values to speed up data entry
 */

const SMART_DEFAULTS_KEY = 'trading-journal-smart-defaults';

export interface SmartDefaults {
  lastSetup: string;
  lastTags: string[];
  lastType: 'long' | 'short';
  lastSymbol: string;
}

const defaultDefaults: SmartDefaults = {
  lastSetup: '',
  lastTags: [],
  lastType: 'long',
  lastSymbol: '',
};

export function loadSmartDefaults(): SmartDefaults {
  try {
    const stored = localStorage.getItem(SMART_DEFAULTS_KEY);
    if (stored) {
      return { ...defaultDefaults, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Failed to load smart defaults:', error);
  }
  return defaultDefaults;
}

export function saveSmartDefaults(defaults: Partial<SmartDefaults>): void {
  try {
    const current = loadSmartDefaults();
    const updated = { ...current, ...defaults };
    localStorage.setItem(SMART_DEFAULTS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save smart defaults:', error);
  }
}

export function updateFromTrade(trade: {
  setup: string;
  tags: string[];
  type: 'long' | 'short';
  commission: number;
  symbol: string;
}): void {
  saveSmartDefaults({
    lastSetup: trade.setup,
    lastTags: trade.tags,
    lastType: trade.type,
    lastCommission: trade.commission,
    lastSymbol: trade.symbol,
  });
}
