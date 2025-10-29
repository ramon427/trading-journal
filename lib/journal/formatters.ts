/**
 * Centralized formatting utilities to ensure consistency across the app
 */

/**
 * Format currency values consistently
 */
export const formatCurrency = (value: number, options?: {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: options?.minimumFractionDigits ?? 2,
    maximumFractionDigits: options?.maximumFractionDigits ?? 2,
  }).format(value);
};

/**
 * Format R:R multiples consistently
 */
export const formatRR = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '0.0R';
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}R`;
};

/**
 * Format percentage values
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
};

/**
 * Format date consistently
 */
export const formatDate = (date: string | Date, options?: Intl.DateTimeFormatOptions): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', options || {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

/**
 * Get today's date in YYYY-MM-DD format (timezone-safe)
 */
export const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Check if a trade is truly open (handles legacy data)
 */
export const isTradeOpen = (trade: { status?: 'open' | 'closed'; exitPrice: number | null }): boolean => {
  // If status is explicitly set, use it
  if (trade.status !== undefined) {
    return trade.status === 'open';
  }
  // Fallback for legacy trades: check if exitPrice is set
  return trade.exitPrice === null || trade.exitPrice === undefined;
};

/**
 * Check if a trade is closed (handles legacy data and zero exitPrice)
 */
export const isTradeClosed = (trade: { status?: 'open' | 'closed'; exitPrice: number | null }): boolean => {
  // If status is explicitly set, use it
  if (trade.status !== undefined) {
    return trade.status === 'closed';
  }
  // Fallback for legacy trades: check if exitPrice is set (including 0 for breakeven)
  return trade.exitPrice !== null && trade.exitPrice !== undefined;
};
