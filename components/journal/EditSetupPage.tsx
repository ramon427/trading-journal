import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Trash2, Plus, X, BookOpen, CheckSquare, Save, Undo, Redo } from 'lucide-react';
import { useRouter } from '@/lib/journal/router';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { IconPicker } from './IconPicker';
import { 
  getCustomSetups, 
  saveCustomSetups, 
  getSetupCategories,
  type CustomSetup,
  type SetupCategory 
} from '@/lib/journal/customization';
import { toast } from 'sonner';
import { useUndoRedo } from '@/lib/journal/useUndoRedo';

const PRESET_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#6366f1', '#ec4899',
  '#8b5cf6', '#14b8a6', '#f97316', '#a855f7', '#06b6d4',
  '#84cc16', '#f43f5e', '#64748b', '#ef4444', '#22c55e',
];

export function EditSetupPage({ setupId }: { setupId: string }) {
  const { navigate } = useRouter();
  const isNew = setupId === 'new';
  
  const {
    state: form,
    set: setForm,
    undo,
    redo,
    canUndo,
    canRedo,
    reset: resetForm,
  } = useUndoRedo({
    name: '',
    description: '',
    color: PRESET_COLORS[0],
    icon: undefined as string | undefined,
    categoryId: 'none',
    // Playbook
    entryRules: [] as string[],
    exitRules: [] as string[],
    invalidationConditions: [] as string[],
    requiredChecklist: [] as string[],
    playbookNotes: '',
  });
  
  const [categories, setCategories] = useState<SetupCategory[]>([]);
  const [originalSetup, setOriginalSetup] = useState<CustomSetup | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialFormDataRef = useRef<string>('');

  useEffect(() => {
    setCategories(getSetupCategories());
    
    if (!isNew) {
      const setups = getCustomSetups();
      const setup = setups.find(s => s.id === setupId);
      if (setup) {
        setOriginalSetup(setup);
        const initialData = {
          name: setup.name,
          description: setup.description || '',
          color: setup.color || PRESET_COLORS[0],
          icon: setup.icon,
          categoryId: setup.categoryId || 'none',
          entryRules: setup.playbook?.entryRules || [],
          exitRules: setup.playbook?.exitRules || [],
          invalidationConditions: setup.playbook?.invalidationConditions || [],
          requiredChecklist: setup.playbook?.requiredChecklist || [],
          playbookNotes: setup.playbook?.notes || '',
        };
        resetForm(initialData);
        setTimeout(() => {
          initialFormDataRef.current = JSON.stringify(initialData);
        }, 0);
      } else {
        toast.error('Setup not found');
        navigate('/customize');
      }
    } else {
      // For new setups
      setTimeout(() => {
        initialFormDataRef.current = JSON.stringify(form);
      }, 0);
    }
  }, [setupId, isNew, navigate, resetForm]);
  
  // Auto-save for existing setups
  useEffect(() => {
    if (isNew) return; // Don't auto-save for new setups
    if (!initialFormDataRef.current) return;
    
    const currentFormData = JSON.stringify(form);
    
    if (currentFormData !== initialFormDataRef.current) {
      setHasUnsavedChanges(true);
      
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      autoSaveTimeoutRef.current = setTimeout(() => {
        performAutoSave();
      }, 500);
    } else {
      setHasUnsavedChanges(false);
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    }
    
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [form, isNew]);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC to close
      if (e.key === 'Escape') {
        if (hasUnsavedChanges && !isNew) {
          // Auto-save will handle it
          navigate('/customize');
        } else if (!hasUnsavedChanges) {
          navigate('/customize');
        }
        return;
      }
      
      // Ignore if typing in input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      // Ctrl/Cmd + Z for undo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) {
          undo();
        }
      }
      // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y for redo
      else if ((e.metaKey || e.ctrlKey) && (e.shiftKey && e.key === 'z' || e.key === 'y')) {
        e.preventDefault();
        if (canRedo) {
          redo();
        }
      }
      // Ctrl/Cmd + S to save (for new setups)
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (isNew) {
          handleSave();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasUnsavedChanges, isNew, canUndo, canRedo, undo, redo]);
  
  const performAutoSave = () => {
    if (!originalSetup) return;
    
    const setups = getCustomSetups();
    const hasPlaybook = form.entryRules.length > 0 || form.exitRules.length > 0 || 
                        form.invalidationConditions.length > 0 || form.requiredChecklist.length > 0 ||
                        form.playbookNotes.trim();
    
    const updated = setups.map(s => 
      s.id === originalSetup.id
        ? {
            ...s,
            name: form.name.trim(),
            description: form.description.trim() || undefined,
            color: form.color,
            icon: form.icon,
            categoryId: form.categoryId && form.categoryId !== 'none' ? form.categoryId : undefined,
            playbook: hasPlaybook ? {
              entryRules: form.entryRules.filter(r => r.trim()),
              exitRules: form.exitRules.filter(r => r.trim()),
              invalidationConditions: form.invalidationConditions.filter(c => c.trim()),
              requiredChecklist: form.requiredChecklist.filter(c => c.trim()),
              notes: form.playbookNotes.trim() || undefined,
            } : undefined,
          }
        : s
    );
    
    saveCustomSetups(updated);
    setHasUnsavedChanges(false);
    initialFormDataRef.current = JSON.stringify(form);
    
    toast.success('Saved', {
      duration: 1000,
    });
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error('Please enter a name');
      return;
    }

    const setups = getCustomSetups();

    const hasPlaybook = form.entryRules.length > 0 || form.exitRules.length > 0 || 
                        form.invalidationConditions.length > 0 || form.requiredChecklist.length > 0 ||
                        form.playbookNotes.trim();

    if (isNew) {
      const newSetup: CustomSetup = {
        id: `setup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        color: form.color,
        icon: form.icon,
        categoryId: form.categoryId && form.categoryId !== 'none' ? form.categoryId : undefined,
        isActive: true,
        isFavorite: false,
        createdAt: new Date().toISOString(),
        usageCount: 0,
        playbook: hasPlaybook ? {
          entryRules: form.entryRules,
          exitRules: form.exitRules,
          invalidationConditions: form.invalidationConditions,
          requiredChecklist: form.requiredChecklist,
          notes: form.playbookNotes.trim() || undefined,
        } : undefined,
      };
      saveCustomSetups([...setups, newSetup]);
      toast.success('Setup created');
    } else {
      const updated = setups.map(s => 
        s.id === setupId
          ? {
              ...s,
              name: form.name.trim(),
              description: form.description.trim() || undefined,
              color: form.color,
              icon: form.icon,
              categoryId: form.categoryId && form.categoryId !== 'none' ? form.categoryId : undefined,
              playbook: hasPlaybook ? {
                entryRules: form.entryRules,
                exitRules: form.exitRules,
                invalidationConditions: form.invalidationConditions,
                requiredChecklist: form.requiredChecklist,
                notes: form.playbookNotes.trim() || undefined,
              } : undefined,
            }
          : s
      );
      saveCustomSetups(updated);
      toast.success('Setup updated');
    }

    navigate('/customize');
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this setup?')) {
      const setups = getCustomSetups();
      const filtered = setups.filter(s => s.id !== setupId);
      saveCustomSetups(filtered);
      toast.success('Setup deleted');
      navigate('/customize');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  const selectedCategory = categories.find((c: SetupCategory) => c.id === form.categoryId);
  const isValid = form.name.trim().length > 0;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate('/customize')}
                variant="ghost"
                size="sm"
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl">{isNew ? 'Create Setup' : 'Edit Setup'}</h1>
                <p className="text-sm text-muted-foreground">
                  {isNew ? 'Add a new trading setup to your library' : 'Update your trading setup'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isNew && (
                <>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={undo}
                          disabled={!canUndo}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <Undo className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Undo (⌘Z)</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={redo}
                          disabled={!canRedo}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <Redo className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Redo (⌘⇧Z)</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  {hasUnsavedChanges && (
                    <Badge variant="secondary" className="gap-1">
                      <Save className="h-3 w-3" />
                      Auto-saving...
                    </Badge>
                  )}
                  {!hasUnsavedChanges && initialFormDataRef.current && (
                    <Badge variant="outline" className="gap-1 text-success border-success/50">
                      <Save className="h-3 w-3" />
                      Saved
                    </Badge>
                  )}
                  <Button
                    onClick={handleDelete}
                    variant="outline"
                    size="sm"
                    className="gap-2 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </>
              )}
              <Button onClick={() => navigate('/customize')} variant="outline" size="sm">
                {isNew ? 'Cancel' : 'Close (ESC)'}
              </Button>
              {isNew && (
                <Button onClick={handleSave} disabled={!isValid} size="sm">
                  Create Setup (⌘S)
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="grid grid-cols-[1fr,320px] gap-8" onKeyDown={handleKeyDown}>
            {/* Left Column - Form Fields */}
            <div className="space-y-6">
              <Card className="p-6">
                <div className="space-y-5">
                  <div>
                    <Label htmlFor="setup-name" className="text-sm mb-2 block">
                      Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="setup-name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g., Breakout, Reversal, VWAP Bounce..."
                      className={!isValid && form.name ? 'border-destructive' : ''}
                      autoFocus
                    />
                    {!isValid && form.name && (
                      <p className="text-xs text-destructive mt-1">Name is required</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="setup-description" className="text-sm mb-2 block">
                      Description
                    </Label>
                    <Textarea
                      id="setup-description"
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Describe the key characteristics, entry criteria, or when you typically use this setup..."
                      rows={4}
                      className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {form.description.length} characters
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="setup-category" className="text-sm mb-2 block">
                      Category
                    </Label>
                    <Select
                      value={form.categoryId}
                      onValueChange={(value) => setForm({ ...form, categoryId: value })}
                    >
                      <SelectTrigger id="setup-category">
                        <SelectValue placeholder="Select category..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          <span className="text-muted-foreground">Uncategorized</span>
                        </SelectItem>
                        {categories.filter((c: SetupCategory) => c.isActive).map((cat: SetupCategory) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="space-y-5">
                  <IconPicker
                    value={form.icon}
                    onChange={(icon) => setForm({ ...form, icon })}
                  />
                  
                  <Separator />
                  
                  <div>
                    <Label className="text-sm mb-3 block">Color</Label>
                    <div className="grid grid-cols-10 gap-2">
                      {PRESET_COLORS.map((color) => (
                        <TooltipProvider key={color}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => setForm({ ...form, color })}
                                className={`w-full aspect-square rounded-md transition-all hover:scale-110 ${
                                  form.color === color ? 'ring-2 ring-offset-2 ring-ring scale-110' : ''
                                }`}
                                style={{ backgroundColor: color }}
                                aria-label={`Select color ${color}`}
                              />
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                              <p className="text-xs">{color}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Playbook Section */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <h3 className="font-medium">Setup Playbook</h3>
                  <Badge variant="outline" className="ml-auto">Optional</Badge>
                </div>
                
                <Tabs defaultValue="rules" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="rules">Rules</TabsTrigger>
                    <TabsTrigger value="checklist">Checklist</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="rules" className="space-y-4 mt-4">
                    {/* Entry Rules */}
                    <div>
                      <Label className="text-sm mb-2 block">Entry Rules</Label>
                      <div className="space-y-2">
                        {form.entryRules.map((rule, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Input
                              value={rule}
                              onChange={(e) => {
                                const updated = [...form.entryRules];
                                updated[index] = e.target.value;
                                setForm({ ...form, entryRules: updated });
                              }}
                              placeholder="e.g., Price breaks above resistance with volume"
                              className="flex-1"
                            />
                            <Button
                              onClick={() => {
                                const updated = form.entryRules.filter((_, i) => i !== index);
                                setForm({ ...form, entryRules: updated });
                              }}
                              variant="ghost"
                              size="sm"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          onClick={() => setForm({ ...form, entryRules: [...form.entryRules, ''] })}
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Entry Rule
                        </Button>
                      </div>
                    </div>

                    {/* Exit Rules */}
                    <div>
                      <Label className="text-sm mb-2 block">Exit Rules</Label>
                      <div className="space-y-2">
                        {form.exitRules.map((rule, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Input
                              value={rule}
                              onChange={(e) => {
                                const updated = [...form.exitRules];
                                updated[index] = e.target.value;
                                setForm({ ...form, exitRules: updated });
                              }}
                              placeholder="e.g., Exit at 2R or trailing stop"
                              className="flex-1"
                            />
                            <Button
                              onClick={() => {
                                const updated = form.exitRules.filter((_, i) => i !== index);
                                setForm({ ...form, exitRules: updated });
                              }}
                              variant="ghost"
                              size="sm"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          onClick={() => setForm({ ...form, exitRules: [...form.exitRules, ''] })}
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Exit Rule
                        </Button>
                      </div>
                    </div>

                    {/* Invalidation Conditions */}
                    <div>
                      <Label className="text-sm mb-2 block">Invalidation Conditions</Label>
                      <div className="space-y-2">
                        {form.invalidationConditions.map((condition, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Input
                              value={condition}
                              onChange={(e) => {
                                const updated = [...form.invalidationConditions];
                                updated[index] = e.target.value;
                                setForm({ ...form, invalidationConditions: updated });
                              }}
                              placeholder="e.g., Price closes below support"
                              className="flex-1"
                            />
                            <Button
                              onClick={() => {
                                const updated = form.invalidationConditions.filter((_, i) => i !== index);
                                setForm({ ...form, invalidationConditions: updated });
                              }}
                              variant="ghost"
                              size="sm"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          onClick={() => setForm({ ...form, invalidationConditions: [...form.invalidationConditions, ''] })}
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Invalidation Condition
                        </Button>
                      </div>
                    </div>

                    {/* Playbook Notes */}
                    <div>
                      <Label htmlFor="playbook-notes" className="text-sm mb-2 block">Additional Notes</Label>
                      <Textarea
                        id="playbook-notes"
                        value={form.playbookNotes}
                        onChange={(e) => setForm({ ...form, playbookNotes: e.target.value })}
                        placeholder="General observations, things to watch for, recent learnings..."
                        rows={3}
                        className="resize-none"
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="checklist" className="space-y-4 mt-4">
                    <p className="text-sm text-muted-foreground">
                      Items you must verify before entering a trade with this setup
                    </p>
                    <div className="space-y-2">
                      {form.requiredChecklist.map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <CheckSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <Input
                            value={item}
                            onChange={(e) => {
                              const updated = [...form.requiredChecklist];
                              updated[index] = e.target.value;
                              setForm({ ...form, requiredChecklist: updated });
                            }}
                            placeholder="e.g., Confirm trend on higher timeframe"
                            className="flex-1"
                          />
                          <Button
                            onClick={() => {
                              const updated = form.requiredChecklist.filter((_, i) => i !== index);
                              setForm({ ...form, requiredChecklist: updated });
                            }}
                            variant="ghost"
                            size="sm"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        onClick={() => setForm({ ...form, requiredChecklist: [...form.requiredChecklist, ''] })}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Checklist Item
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </Card>

              <Card className="p-4 bg-muted/20">
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p className="flex items-start gap-2">
                    <span className="text-primary">💡</span>
                    <span>Use the playbook to document your strategy and enforce discipline</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-primary">⌨️</span>
                    <span>Press <kbd className="px-1 py-0.5 text-xs border rounded bg-background">⌘ Enter</kbd> to save</span>
                  </p>
                </div>
              </Card>
            </div>
            
            {/* Right Column - Preview */}
            <div className="space-y-6">
              <div>
                <Label className="text-sm mb-3 block">Preview</Label>
                <Card className="p-4 bg-muted/30">
                  <div className="space-y-4">
                    {/* Large Preview */}
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-14 h-14 rounded-lg flex-shrink-0 shadow-sm flex items-center justify-center"
                        style={{ backgroundColor: form.color }}
                      >
                        {form.icon && (
                          <span className="text-2xl text-white/90">{form.icon}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">
                          {form.name || 'Setup Name'}
                        </h4>
                        {selectedCategory && (
                          <p className="text-xs text-muted-foreground">
                            {selectedCategory.name}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {form.description && (
                      <div className="pt-3 border-t">
                        <p className="text-xs text-muted-foreground line-clamp-3">
                          {form.description}
                        </p>
                      </div>
                    )}
                    
                    {/* Small Preview (as it appears in lists) */}
                    <div className="pt-3 border-t">
                      <p className="text-xs text-muted-foreground mb-2">In lists:</p>
                      <div className="flex items-center gap-2 p-2 rounded-md bg-background">
                        <div 
                          className="w-8 h-8 rounded-md flex-shrink-0 flex items-center justify-center"
                          style={{ backgroundColor: form.color }}
                        >
                          {form.icon && (
                            <span className="text-sm text-white/90">{form.icon}</span>
                          )}
                        </div>
                        <span className="text-sm truncate">
                          {form.name || 'Setup Name'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Badge Preview */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">As badge:</p>
                      <Badge 
                        variant="secondary" 
                        className="max-w-full gap-1.5"
                        style={{ 
                          backgroundColor: form.color + '20',
                          color: form.color,
                          borderColor: form.color + '40'
                        }}
                      >
                        {form.icon && <span>{form.icon}</span>}
                        <span className="truncate">{form.name || 'Setup Name'}</span>
                      </Badge>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
