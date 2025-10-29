import { AccountSettings } from '../types/trading';

const ACCOUNT_SETTINGS_KEY = 'trading_journal_account_settings';

export const loadAccountSettings = (): AccountSettings | null => {
  try {
    const stored = localStorage.getItem(ACCOUNT_SETTINGS_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export const saveAccountSettings = (settings: AccountSettings): void => {
  localStorage.setItem(ACCOUNT_SETTINGS_KEY, JSON.stringify(settings));
};

export const calculateCurrentBalance = (startingBalance: number, totalPnl: number): number => {
  return startingBalance + totalPnl;
};

export const calculateAccountGrowth = (startingBalance: number, currentBalance: number): number => {
  if (startingBalance === 0) return 0;
  return ((currentBalance - startingBalance) / startingBalance) * 100;
};
