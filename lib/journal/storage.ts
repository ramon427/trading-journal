/**
 * Safe localStorage wrapper with error handling
 */

export class StorageError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'StorageError';
  }
}

/**
 * Safely get an item from localStorage
 */
export const safeGetItem = function<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    return JSON.parse(item) as T;
  } catch (error) {
    console.error(`Error reading from localStorage (key: ${key}):`, error);
    return defaultValue;
  }
};

/**
 * Safely set an item in localStorage
 */
export const safeSetItem = (key: string, value: any): boolean => {
  if (typeof window === 'undefined') return false;
  
  try {
    const serialized = JSON.stringify(value);
    
    // Check if we're approaching quota
    const estimatedSize = new Blob([serialized]).size;
    if (estimatedSize > 4 * 1024 * 1024) { // 4MB warning threshold
      console.warn(`Large data being saved to localStorage (${(estimatedSize / 1024 / 1024).toFixed(2)}MB)`);
    }
    
    localStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    if (error instanceof Error) {
      // Check for quota exceeded error
      if (
        error.name === 'QuotaExceededError' ||
        error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
      ) {
        console.error('localStorage quota exceeded. Consider clearing old data.');
        throw new StorageError('Storage quota exceeded. Please clear some data.', error);
      }
    }
    console.error(`Error writing to localStorage (key: ${key}):`, error);
    throw new StorageError('Failed to save data', error instanceof Error ? error : undefined);
  }
};

/**
 * Safely remove an item from localStorage
 */
export const safeRemoveItem = (key: string): boolean => {
  if (typeof window === 'undefined') return false;
  
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing from localStorage (key: ${key}):`, error);
    return false;
  }
};

/**
 * Get localStorage usage information
 */
export const getStorageInfo = (): { used: number; available: number; percentage: number } | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    let used = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key) || '';
        used += key.length + value.length;
      }
    }
    
    // Most browsers have 5-10MB limit, we'll use 5MB as conservative estimate
    const available = 5 * 1024 * 1024; // 5MB in bytes
    const percentage = (used / available) * 100;
    
    return { used, available, percentage };
  } catch (error) {
    console.error('Error getting storage info:', error);
    return null;
  }
};

/**
 * Clear all app data from localStorage
 */
export const clearAllAppData = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  try {
    // Get all keys that belong to our app
    const appKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('trading_journal_')) {
        appKeys.push(key);
      }
    }
    
    // Remove each key
    appKeys.forEach(key => localStorage.removeItem(key));
    return true;
  } catch (error) {
    console.error('Error clearing app data:', error);
    return false;
  }
};
