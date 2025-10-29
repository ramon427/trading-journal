import { useState } from 'react';
import { TradeTemplate } from '@/types/journal/trading';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card } from './ui/card';
import { Plus, Trash2, Edit, TrendingUp, TrendingDown, Star, Clock } from 'lucide-react';
import { toast } from 'sonner';
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

interface TemplateManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: TradeTemplate[];
  onAddTemplate: (template: Omit<TradeTemplate, 'id' | 'createdAt' | 'useCount'>) => void;
  onUpdateTemplate: (id: string, updates: Partial<TradeTemplate>) => void;
  onDeleteTemplate: (id: string) => void;
  existingSetups: string[];
  existingTags: string[];
}

export function TemplateManager({
  open,
  onOpenChange,
  templates,
  onAddTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
  existingSetups,
  existingTags,
}: TemplateManagerProps) {
  const [editingTemplate, setEditingTemplate] = useState<TradeTemplate | null>(null);
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    type: 'long' as 'long' | 'short',
    setup: '',
    tags: [] as string[],
    notes: '',
    stopLossPercent: '',
    targetPercent: '',
    defaultQuantity: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      symbol: '',
      type: 'long',
      setup: '',
      tags: [],
      notes: '',
      stopLossPercent: '',
      targetPercent: '',
      defaultQuantity: '',
    });
    setEditingTemplate(null);
  };

  const handleEdit = (template: TradeTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      symbol: template.symbol || '',
      type: template.type,
      setup: template.setup,
      tags: template.tags,
      notes: template.notes || '',
      stopLossPercent: template.stopLossPercent?.toString() || '',
      targetPercent: template.targetPercent?.toString() || '',
      defaultQuantity: template.defaultQuantity?.toString() || '',
    });
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error('Template name is required');
      return;
    }

    if (!formData.setup.trim()) {
      toast.error('Setup is required');
      return;
    }

    const templateData: Omit<TradeTemplate, 'id' | 'createdAt' | 'useCount'> = {
      name: formData.name.trim(),
      symbol: formData.symbol.trim() || undefined,
      type: formData.type,
      setup: formData.setup.trim(),
      tags: formData.tags,
      notes: formData.notes.trim() || undefined,
      stopLossPercent: formData.stopLossPercent ? parseFloat(formData.stopLossPercent) : undefined,
      targetPercent: formData.targetPercent ? parseFloat(formData.targetPercent) : undefined,
      defaultQuantity: formData.defaultQuantity ? parseInt(formData.defaultQuantity) : undefined,
      lastUsed: editingTemplate?.lastUsed,
    };

    if (editingTemplate) {
      onUpdateTemplate(editingTemplate.id, templateData);
      toast.success('Template updated');
    } else {
      onAddTemplate(templateData);
      toast.success('Template created');
    }

    resetForm();
  };

  const handleDelete = () => {
    if (deleteTemplateId) {
      onDeleteTemplate(deleteTemplateId);
      toast.success('Template deleted');
      setDeleteTemplateId(null);
    }
  };

  const addTag = (tag: string) => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData({ ...formData, tags: [...formData.tags, tag] });
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const sortedTemplates = [...templates].sort((a, b) => {
    // Sort by most recently used, then by use count
    if (a.lastUsed && b.lastUsed) {
      return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime();
    }
    if (a.lastUsed) return -1;
    if (b.lastUsed) return 1;
    return b.useCount - a.useCount;
  });

  return (
    <>
      <Dialog open={open} onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Trade Templates</DialogTitle>
            <DialogDescription>
              Save frequently used setups as templates for quick trade entry
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
            {/* Template List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm">Your Templates ({templates.length})</h3>
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                {sortedTemplates.length === 0 ? (
                  <Card className="p-6 text-center border-dashed">
                    <Star className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      No templates yet. Create your first template to speed up trade entry.
                    </p>
                  </Card>
                ) : (
                  sortedTemplates.map((template) => (
                    <Card key={template.id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium truncate">{template.name}</h4>
                            <Badge variant={template.type === 'long' ? 'default' : 'secondary'} className="text-xs">
                              {template.type === 'long' ? (
                                <TrendingUp className="h-3 w-3" />
                              ) : (
                                <TrendingDown className="h-3 w-3" />
                              )}
                            </Badge>
                          </div>
                          {template.symbol && (
                            <p className="text-sm text-muted-foreground">{template.symbol}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">{template.setup}</p>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(template)}
                            className="h-7 w-7 p-0"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteTemplateId(template.id)}
                            className="h-7 w-7 p-0 hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      {template.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {template.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-3 text-xs text-muted-foreground pt-2 border-t">
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          <span>Used {template.useCount} times</span>
                        </div>
                        {template.lastUsed && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>
                              {new Date(template.lastUsed).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>

            {/* Template Form */}
            <div className="space-y-4">
              <h3 className="text-sm">
                {editingTemplate ? 'Edit Template' : 'Create Template'}
              </h3>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="template-name">Template Name *</Label>
                  <Input
                    id="template-name"
                    placeholder="e.g., AAPL Breakout, SPY Reversal"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="template-symbol">Symbol (Optional)</Label>
                    <Input
                      id="template-symbol"
                      placeholder="AAPL"
                      value={formData.symbol}
                      onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="template-type">Type *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: 'long' | 'short') => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger id="template-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="long">Long</SelectItem>
                        <SelectItem value="short">Short</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template-setup">Setup *</Label>
                  <Input
                    id="template-setup"
                    placeholder="e.g., Breakout, Reversal, Momentum"
                    value={formData.setup}
                    onChange={(e) => setFormData({ ...formData, setup: e.target.value })}
                    list="existing-setups"
                  />
                  {existingSetups.length > 0 && (
                    <datalist id="existing-setups">
                      {existingSetups.map(setup => (
                        <option key={setup} value={setup} />
                      ))}
                    </datalist>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {formData.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:text-destructive"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <Input
                    placeholder="Add tag..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag(e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                    list="existing-tags"
                  />
                  {existingTags.length > 0 && (
                    <datalist id="existing-tags">
                      {existingTags.map(tag => (
                        <option key={tag} value={tag} />
                      ))}
                    </datalist>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="template-stop">Stop Loss %</Label>
                    <Input
                      id="template-stop"
                      type="number"
                      step="0.1"
                      placeholder="2.0"
                      value={formData.stopLossPercent}
                      onChange={(e) => setFormData({ ...formData, stopLossPercent: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="template-target">Target %</Label>
                    <Input
                      id="template-target"
                      type="number"
                      step="0.1"
                      placeholder="4.0"
                      value={formData.targetPercent}
                      onChange={(e) => setFormData({ ...formData, targetPercent: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="template-quantity">Quantity</Label>
                    <Input
                      id="template-quantity"
                      type="number"
                      placeholder="100"
                      value={formData.defaultQuantity}
                      onChange={(e) => setFormData({ ...formData, defaultQuantity: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template-notes">Notes Template</Label>
                  <Textarea
                    id="template-notes"
                    placeholder="Default notes for this setup..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    autoResize
                    maxHeight={200}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSave} className="flex-1">
                    <Plus className="h-4 w-4 mr-2" />
                    {editingTemplate ? 'Update Template' : 'Create Template'}
                  </Button>
                  {editingTemplate && (
                    <Button onClick={resetForm} variant="outline">
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteTemplateId !== null} onOpenChange={(open) => !open && setDeleteTemplateId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this template? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
