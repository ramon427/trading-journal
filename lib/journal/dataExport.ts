import { Trade, JournalEntry } from '@/types/journal/trading';

export interface ExportData {
  version: string;
  exportDate: string;
  trades: Trade[];
  journalEntries: JournalEntry[];
}

export const exportToJSON = (trades: Trade[], journalEntries: JournalEntry[]): void => {
  const data: ExportData = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    trades,
    journalEntries,
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  if (typeof document === 'undefined') return;
  const link = document.createElement('a');
  link.href = url;
  link.download = `trading-journal-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportToCSV = (trades: Trade[]): void => {
  const headers = [
    'Date',
    'Symbol',
    'Type',
    'Entry Price',
    'Exit Price',
    'Quantity',
    'Commission',
    'P&L',
    'R:R',
    'Setup',
    'Tags',
    'Notes',
  ];

  const rows = trades.map(trade => [
    trade.date,
    trade.symbol,
    trade.type,
    trade.entryPrice.toString(),
    trade.exitPrice.toString(),
    trade.quantity.toString(),
    trade.commission.toString(),
    trade.pnl.toString(),
    trade.rr?.toString() || '',
    trade.setup || '',
    (trade.tags || []).join('; '),
    (trade.notes || '').replace(/"/g, '""'), // Escape quotes
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  if (typeof document === 'undefined') return;
  const link = document.createElement('a');
  link.href = url;
  link.download = `trading-journal-trades-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const importFromJSON = (file: File): Promise<ExportData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content) as ExportData;
        
        // Validate the data structure
        if (!data.trades || !Array.isArray(data.trades)) {
          throw new Error('Invalid data format: missing trades array');
        }
        if (!data.journalEntries || !Array.isArray(data.journalEntries)) {
          throw new Error('Invalid data format: missing journal entries array');
        }
        
        resolve(data);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
};

export const importFromCSV = (file: File): Promise<Trade[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const lines = content.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          throw new Error('CSV file is empty or invalid');
        }
        
        // Skip header row
        const dataLines = lines.slice(1);
        
        const trades: Trade[] = dataLines.map((line, index) => {
          // Simple CSV parsing (handles quoted fields)
          const matches = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g);
          if (!matches || matches.length < 8) {
            throw new Error(`Invalid CSV format at line ${index + 2}`);
          }
          
          const cleanValue = (val: string) => val.replace(/^"|"$/g, '').trim();
          
          const [
            date,
            symbol,
            type,
            entryPrice,
            exitPrice,
            quantity,
            commission,
            pnl,
            rr,
            setup,
            tags,
            notes,
          ] = matches.map(cleanValue);
          
          return {
            id: `trade-${Date.now()}-${Math.random()}-${index}`,
            date,
            symbol,
            type: type as 'long' | 'short',
            entryPrice: parseFloat(entryPrice),
            exitPrice: parseFloat(exitPrice),
            quantity: parseFloat(quantity),
            commission: parseFloat(commission),
            pnl: parseFloat(pnl),
            rr: rr ? parseFloat(rr) : undefined,
            setup: setup || '',
            tags: tags ? tags.split(';').map(t => t.trim()).filter(Boolean) : [],
            notes: notes || '',
          };
        });
        
        resolve(trades);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
};
