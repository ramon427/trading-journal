import { Trade } from '../types/trading';

export interface ValidationError {
  field: string;
  message: string;
}

export const validateTrade = (trade: Partial<Trade>): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  // Date validation
  if (!trade.date) {
    errors.push({ field: 'date', message: 'Date is required' });
  } else {
    const tradeDate = new Date(trade.date);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    
    if (tradeDate > today) {
      errors.push({ 
        field: 'date', 
        message: 'Cannot enter trades in the future' 
      });
    }
  }
  
  // Symbol validation
  if (!trade.symbol || trade.symbol.trim() === '') {
    errors.push({ field: 'symbol', message: 'Symbol is required' });
  }
  
  // Price validation
  if (!trade.entryPrice || trade.entryPrice <= 0) {
    errors.push({ field: 'entryPrice', message: 'Entry price must be greater than 0' });
  }
  
  // Exit price is optional for open trades
  if (trade.status === 'closed' && (!trade.exitPrice || trade.exitPrice <= 0)) {
    errors.push({ field: 'exitPrice', message: 'Exit price must be greater than 0' });
  }
  
  // Validate exitPrice if provided (even for open trades)
  if (trade.exitPrice && trade.exitPrice <= 0) {
    errors.push({ field: 'exitPrice', message: 'Exit price must be greater than 0' });
  }
  
  // Entry/Exit logic validation
  if (trade.type && trade.entryPrice && trade.exitPrice) {
    if (trade.type === 'long' && trade.exitPrice < trade.entryPrice) {
      const loss = ((trade.exitPrice - trade.entryPrice) / trade.entryPrice) * 100;
      if (Math.abs(loss) > 50) {
        errors.push({ 
          field: 'exitPrice', 
          message: `Unusually large loss (${loss.toFixed(1)}%) for a long trade. Please verify.` 
        });
      }
    } else if (trade.type === 'short' && trade.exitPrice > trade.entryPrice) {
      const loss = ((trade.entryPrice - trade.exitPrice) / trade.entryPrice) * 100;
      if (Math.abs(loss) > 50) {
        errors.push({ 
          field: 'exitPrice', 
          message: `Unusually large loss (${loss.toFixed(1)}%) for a short trade. Please verify.` 
        });
      }
    }
  }
  
  // P&L validation (warning for extreme values)
  if (trade.pnl !== undefined) {
    if (Math.abs(trade.pnl) > 100000) {
      errors.push({ 
        field: 'pnl', 
        message: `Unusually large P&L ($${Math.abs(trade.pnl).toLocaleString()}). Please verify.` 
      });
    }
  }
  
  // R:R validation (warning for extreme values)
  if (trade.rr !== undefined && trade.rr !== null) {
    if (Math.abs(trade.rr) > 20) {
      errors.push({ 
        field: 'rr', 
        message: `Unusually high R:R ratio (${trade.rr.toFixed(1)}R). Please verify.` 
      });
    }
  }
  
  return errors;
};

export const validateTradeWithWarnings = (trade: Partial<Trade>): {
  errors: ValidationError[];
  warnings: ValidationError[];
} => {
  const allIssues = validateTrade(trade);
  
  const errors = allIssues.filter(issue => 
    (issue.field === 'date' && issue.message.includes('future')) ||
    (issue.field === 'symbol') ||
    (issue.field === 'entryPrice' && issue.message.includes('required')) ||
    (issue.field === 'exitPrice' && issue.message.includes('required'))
  );
  
  const warnings = allIssues.filter(issue => !errors.includes(issue));
  
  return { errors, warnings };
};
