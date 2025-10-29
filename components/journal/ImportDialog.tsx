import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Button } from './ui/button';
import { Trade, JournalEntry } from '@/types/journal/trading';
import { importFromJSON, importFromCSV } from '@/lib/journal/dataExport';
import { Upload, FileJson, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  journalEntries: JournalEntry[];
  onImportData?: (trades: Trade[], journalEntries: JournalEntry[], mergeMode: 'replace' | 'merge') => void;
}

export function ImportDialog({ 
  open, 
  onOpenChange,
  journalEntries,
  onImportData,
}: ImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('merge');

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (file.name.endsWith('.json')) {
        const data = await importFromJSON(file);
        onImportData?.(data.trades, data.journalEntries, importMode);
        onOpenChange(false);
      } else if (file.name.endsWith('.csv')) {
        const importedTrades = await importFromCSV(file);
        onImportData?.(importedTrades, journalEntries, importMode);
        onOpenChange(false);
      } else {
        toast.error('Please select a JSON or CSV file');
      }
    } catch (error) {
      toast.error(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Import Data</DialogTitle>
          <DialogDescription>
            Import trades and journal entries from a backup file
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div>
            <h4 className="mb-2">Import Mode</h4>
            <p className="text-muted-foreground text-sm mb-4">
              Choose how to handle imported data
            </p>
            
            <RadioGroup value={importMode} onValueChange={(value) => setImportMode(value as 'replace' | 'merge')} className="space-y-3">
              <div className="flex items-start gap-3">
                <RadioGroupItem value="merge" id="merge" className="mt-0.5" />
                <div className="space-y-1 flex-1">
                  <Label htmlFor="merge" className="cursor-pointer text-sm">
                    Merge with Existing (Recommended)
                  </Label>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    Combine imported data with current trades. Duplicates will be updated while preserving other data.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <RadioGroupItem value="replace" id="replace" className="mt-0.5" />
                <div className="space-y-1 flex-1">
                  <Label htmlFor="replace" className="cursor-pointer text-sm">
                    Replace All Data
                  </Label>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    Delete all existing data and replace with imported data. This cannot be undone.
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>
          
          {importMode === 'merge' && (
            <div className="bg-muted border border-border rounded-md p-3">
              <p className="text-xs text-foreground leading-relaxed">
                <strong className="text-sm font-medium">How merging works:</strong><br />
                • New trades and journal entries will be added<br />
                • Existing trades with matching IDs will be updated<br />
                • Existing journal entries with matching dates will be updated<br />
                • Your current data will be preserved and combined
              </p>
            </div>
          )}

          {importMode === 'replace' && (
            <div className="bg-muted border border-destructive/50 rounded-md p-3">
              <p className="text-xs text-foreground leading-relaxed">
                <strong className="text-sm font-medium text-destructive">⚠️ Warning:</strong><br />
                This will permanently delete all your current trades and journal entries. Make sure you have a backup before proceeding.
              </p>
            </div>
          )}
          
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
            
            <Button 
              onClick={handleImportClick}
              className="w-full h-14"
              size="lg"
            >
              <Upload className="h-5 w-5 mr-2" />
              Select File to Import
            </Button>
            
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground leading-relaxed">
                <span className="flex items-center justify-center gap-2 mb-1">
                  <FileJson className="h-3.5 w-3.5" />
                  <strong className="font-medium">JSON files</strong>
                  <span className="text-muted-foreground">→</span>
                  Trades + Journal entries
                </span>
                <span className="flex items-center justify-center gap-2">
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  <strong className="font-medium">CSV files</strong>
                  <span className="text-muted-foreground">→</span>
                  Trades only
                </span>
              </p>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="min-h-10">
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
