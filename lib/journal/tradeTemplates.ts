import { TradeTemplate, Trade } from '../types/trading';

const TEMPLATES_KEY = 'tradingJournal_templates';
const RECENT_SYMBOLS_KEY = 'tradingJournal_recentSymbols';

export function loadTemplates(): TradeTemplate[] {
  try {
    const stored = localStorage.getItem(TEMPLATES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading templates:', error);
    return [];
  }
}

export function saveTemplates(templates: TradeTemplate[]): void {
  try {
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
  } catch (error) {
    console.error('Error saving templates:', error);
  }
}

export function addTemplate(template: Omit<TradeTemplate, 'id' | 'createdAt' | 'useCount'>): TradeTemplate {
  const templates = loadTemplates();
  const newTemplate: TradeTemplate = {
    ...template,
    id: `template_${Date.now()}`,
    createdAt: new Date().toISOString(),
    useCount: 0,
  };
  
  templates.push(newTemplate);
  saveTemplates(templates);
  return newTemplate;
}

export function updateTemplate(id: string, updates: Partial<TradeTemplate>): void {
  const templates = loadTemplates();
  const index = templates.findIndex(t => t.id === id);
  
  if (index !== -1) {
    templates[index] = { ...templates[index], ...updates };
    saveTemplates(templates);
  }
}

export function deleteTemplate(id: string): void {
  const templates = loadTemplates();
  const filtered = templates.filter(t => t.id !== id);
  saveTemplates(filtered);
}

export function incrementTemplateUsage(id: string): void {
  const templates = loadTemplates();
  const index = templates.findIndex(t => t.id === id);
  
  if (index !== -1) {
    templates[index].useCount++;
    templates[index].lastUsed = new Date().toISOString();
    saveTemplates(templates);
  }
}

// Create a template from an existing trade
export function createTemplateFromTrade(trade: Trade, name: string): TradeTemplate {
  const template: Omit<TradeTemplate, 'id' | 'createdAt' | 'useCount'> = {
    name,
    symbol: trade.symbol,
    type: trade.type,
    setup: trade.setup,
    tags: [...trade.tags],
    notes: trade.notes || undefined,
    stopLossPercent: trade.stopLoss && trade.entryPrice 
      ? Math.abs((trade.stopLoss - trade.entryPrice) / trade.entryPrice) * 100 
      : undefined,
    targetPercent: trade.target && trade.entryPrice 
      ? Math.abs((trade.target - trade.entryPrice) / trade.entryPrice) * 100 
      : undefined,
  };
  
  return addTemplate(template);
}

// Recent Symbols Management
export function getRecentSymbols(limit: number = 10): string[] {
  try {
    const stored = localStorage.getItem(RECENT_SYMBOLS_KEY);
    const symbols = stored ? JSON.parse(stored) : [];
    return symbols.slice(0, limit);
  } catch (error) {
    console.error('Error loading recent symbols:', error);
    return [];
  }
}

export function addRecentSymbol(symbol: string): void {
  try {
    const symbols = getRecentSymbols(50); // Keep more in storage
    
    // Remove if already exists
    const filtered = symbols.filter(s => s !== symbol);
    
    // Add to front
    filtered.unshift(symbol);
    
    // Keep only the most recent
    const limited = filtered.slice(0, 20);
    
    localStorage.setItem(RECENT_SYMBOLS_KEY, JSON.stringify(limited));
  } catch (error) {
    console.error('Error saving recent symbol:', error);
  }
}

// Get all unique symbols from trades for autocomplete
export function getAllSymbols(trades: Trade[]): string[] {
  const symbols = new Set<string>();
  trades.forEach(trade => symbols.add(trade.symbol));
  return Array.from(symbols).sort();
}

// Get all unique setups from trades
export function getAllSetups(trades: Trade[]): string[] {
  const setups = new Set<string>();
  trades.forEach(trade => {
    if (trade.setup) setups.add(trade.setup);
  });
  return Array.from(setups).sort();
}

// Get all unique tags from trades
export function getAllTags(trades: Trade[]): string[] {
  const tags = new Set<string>();
  trades.forEach(trade => {
    trade.tags.forEach(tag => tags.add(tag));
  });
  return Array.from(tags).sort();
}
