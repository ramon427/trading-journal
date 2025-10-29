import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { DisplayMode } from '@/lib/journal/settings';
import { Trade, AccountSettings } from '@/types/journal/trading';
import { exportToJSON, exportToCSV } from '@/lib/journal/dataExport';
import { loadAccountSettings, saveAccountSettings, calculateCurrentBalance, calculateAccountGrowth } from '@/lib/journal/accountSettings';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { Trash2, FileJson, FileSpreadsheet, DollarSign, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from './ui/switch';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClearData?: () => void;
  trades: Trade[];
  totalPnl: number;
}

export function SettingsDialog({ 
  open, 
  onOpenChange, 
  onClearData,
  trades,
  totalPnl,
}: SettingsDialogProps) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [accountSettings, setAccountSettings] = useState<AccountSettings | null>(null);
  const [startingBalance, setStartingBalance] = useState<string>('');

  useEffect(() => {
    const settings = loadAccountSettings();
    if (settings) {
      setAccountSettings(settings);
      setStartingBalance(settings.startingBalance.toString());
    }
  }, [open]);

  const handleClearData = () => {
    if (deleteConfirmText === 'DELETE') {
      onClearData?.();
      setShowClearConfirm(false);
      setDeleteConfirmText('');
      onOpenChange(false);
    }
  };

  const handleExportJSON = () => {
    const journalEntries = JSON.parse(localStorage.getItem('journal-entries') || '[]');
    exportToJSON(trades, journalEntries);
    toast.success('Data exported successfully');
  };

  const handleExportCSV = () => {
    exportToCSV(trades);
    toast.success('Trades exported to CSV');
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] max-w-2xl">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>
              Configure your trading journal preferences
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4 overflow-y-auto max-h-[calc(90vh-200px)]">
            {/* Account Balance Section */}
            <div className="space-y-4">
              <div>
                <h4 className="mb-2">Account Balance Tracking</h4>
                <p className="text-muted-foreground text-sm mb-4">
                  Track your account balance and growth over time
                </p>
              </div>
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor="startingBalance" className="text-sm">Starting Balance</Label>
                  <div className="flex gap-2 mt-2">
                    <div className="relative flex-1">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="startingBalance"
                        type="number"
                        value={startingBalance}
                        onChange={(e) => setStartingBalance(e.target.value)}
                        placeholder="10000"
                        className="pl-9"
                      />
                    </div>
                    <Button 
                      size="sm"
                      onClick={() => {
                        const balance = parseFloat(startingBalance);
                        if (isNaN(balance) || balance <= 0) {
                          toast.error('Please enter a valid balance');
                          return;
                        }
                        const settings: AccountSettings = {
                          startingBalance: balance,
                          accountCreatedDate: new Date().toISOString().split('T')[0],
                        };
                        saveAccountSettings(settings);
                        setAccountSettings(settings);
                        toast.success('Starting balance saved');
                      }}
                    >
                      Save
                    </Button>
                  </div>
                </div>
                
                {accountSettings && (
                  <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Starting Balance:</span>
                      <span>${accountSettings.startingBalance.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total P&L:</span>
                      <span className={totalPnl >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}>
                        ${totalPnl.toLocaleString()}
                      </span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Current Balance:</span>
                      <span className="font-medium">
                        ${calculateCurrentBalance(accountSettings.startingBalance, totalPnl).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <TrendingUp className="h-3.5 w-3.5" />
                        Growth:
                      </span>
                      <span className={calculateAccountGrowth(accountSettings.startingBalance, calculateCurrentBalance(accountSettings.startingBalance, totalPnl)) >= 0 ? 'text-green-600 dark:text-green-500 font-medium' : 'text-red-600 dark:text-red-500 font-medium'}>
                        {calculateAccountGrowth(accountSettings.startingBalance, calculateCurrentBalance(accountSettings.startingBalance, totalPnl)).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Export Section */}
            <div className="space-y-4 pt-4 border-t">
              <div>
                <h4 className="mb-2">Export & Backup</h4>
                <p className="text-muted-foreground text-sm mb-4">
                  Download your trading data for backup or analysis
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={handleExportJSON}
                  disabled={trades.length === 0}
                >
                  <FileJson className="h-4 w-4 mr-2" />
                  Export JSON
                </Button>
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={handleExportCSV}
                  disabled={trades.length === 0}
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                JSON includes trades and journal entries. CSV exports trades only.
              </p>
            </div>

            {/* Data Management Section */}
            <div className="space-y-4 pt-4 border-t">
              <div>
                <h4 className="mb-2">Data Management</h4>
                <p className="text-muted-foreground text-sm mb-4">
                  Clear all trades and journal entries to start fresh
                </p>
              </div>
              
              <Button 
                variant="destructive"
                size="sm"
                onClick={() => setShowClearConfirm(true)}
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All Data
              </Button>
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)} className="w-full sm:w-auto min-h-10">Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear Data Confirmation */}
      <AlertDialog open={showClearConfirm} onOpenChange={(open) => {
        setShowClearConfirm(open);
        if (!open) setDeleteConfirmText('');
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Data</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                This will permanently delete <strong>{trades.length} trade{trades.length !== 1 ? 's' : ''}</strong> and all journal entries. This action cannot be undone.
              </p>
              <div className="space-y-2">
                <Label htmlFor="deleteConfirm" className="text-sm">
                  Type <span className="font-mono font-semibold">DELETE</span> to confirm:
                </Label>
                <Input
                  id="deleteConfirm"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="font-mono"
                  autoComplete="off"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmText('')}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleClearData}
              disabled={deleteConfirmText !== 'DELETE'}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear All Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
