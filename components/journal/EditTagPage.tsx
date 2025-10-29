import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Trash2, Plus, X, Link2, AlertCircle, CheckSquare, Save, Undo, Redo } from 'lucide-react';
import { useRouter } from '@/lib/journal/router';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Textarea } from './ui/textarea';
import { IconPicker } from './IconPicker';
import { 
  getCustomTags, 
  saveCustomTags, 
  getTagCategories,
  type CustomTag,
  type TagCategory 
} from '@/lib/journal/customization';
import { toast } from 'sonner';
import { useUndoRedo } from '@/lib/journal/useUndoRedo';

const PRESET_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#6366f1', '#ec4899',
  '#8b5cf6', '#14b8a6', '#f97316', '#a855f7', '#06b6d4',
  '#84cc16', '#f43f5e', '#64748b', '#ef4444', '#22c55e',
];

export function EditTagPage({ tagId }: { tagId: string }) {
  const { navigate } = useRouter();
  const isNew = tagId === 'new';
  
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
    // Relationships
    mutuallyExclusiveWith: [] as string[],
    suggestedWith: [] as string[],
    requiredWith: [] as string[],
  });
  
  const [categories, setCategories] = useState<TagCategory[]>([]);
  const [allTags, setAllTags] = useState<CustomTag[]>([]);
  const [originalTag, setOriginalTag] = useState<CustomTag | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialFormDataRef = useRef<string>('');

  useEffect(() => {
    setCategories(getTagCategories());
    setAllTags(getCustomTags());
    
    if (!isNew) {
      const tags = getCustomTags();
      const tag = tags.find(t => t.id === tagId);
      if (tag) {
        setOriginalTag(tag);
        const initialData = {
          name: tag.name,
          description: tag.description || '',
          color: tag.color || PRESET_COLORS[0],
          icon: tag.icon,
          categoryId: tag.categoryId || 'none',
          mutuallyExclusiveWith: tag.relationships?.mutuallyExclusiveWith || [],
          suggestedWith: tag.relationships?.suggestedWith || [],
          requiredWith: tag.relationships?.requiredWith || [],
        };
        resetForm(initialData);
        setTimeout(() => {
          initialFormDataRef.current = JSON.stringify(initialData);
        }, 0);
      } else {
        toast.error('Tag not found');
        navigate('/customize?tab=tags');
      }
    } else {
      setTimeout(() => {
        initialFormDataRef.current = JSON.stringify(form);
      }, 0);
    }
  }, [tagId, isNew, navigate, resetForm]);
  
  // Auto-save for existing tags
  useEffect(() => {
    if (isNew) return;
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
          navigate('/customize?tab=tags');
        } else if (!hasUnsavedChanges) {
          navigate('/customize?tab=tags');
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
      // Ctrl/Cmd + S to save (for new tags)
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
    if (!originalTag) return;
    
    const tags = getCustomTags();
    const hasRelationships = form.mutuallyExclusiveWith.length > 0 || 
                            form.suggestedWith.length > 0 || 
                            form.requiredWith.length > 0;
    
    const updated = tags.map(t => 
      t.id === originalTag.id
        ? {
            ...t,
            name: form.name.trim(),
            description: form.description.trim() || undefined,
            color: form.color,
            icon: form.icon,
            categoryId: form.categoryId && form.categoryId !== 'none' ? form.categoryId : undefined,
            relationships: hasRelationships ? {
              mutuallyExclusiveWith: form.mutuallyExclusiveWith,
              suggestedWith: form.suggestedWith,
              requiredWith: form.requiredWith,
            } : undefined,
          }
        : t
    );
    
    saveCustomTags(updated);
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

    const tags = getCustomTags();
    
    const hasRelationships = form.mutuallyExclusiveWith.length > 0 || 
                            form.suggestedWith.length > 0 || 
                            form.requiredWith.length > 0;

    if (isNew) {
      const newTag: CustomTag = {
        id: `tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        color: form.color,
        icon: form.icon,
        categoryId: form.categoryId && form.categoryId !== 'none' ? form.categoryId : undefined,
        isActive: true,
        isFavorite: false,
        createdAt: new Date().toISOString(),
        usageCount: 0,
        relationships: hasRelationships ? {
          mutuallyExclusiveWith: form.mutuallyExclusiveWith,
          suggestedWith: form.suggestedWith,
          requiredWith: form.requiredWith,
        } : undefined,
      };
      saveCustomTags([...tags, newTag]);
      toast.success('Tag created');
    } else {
      const updated = tags.map(t => 
        t.id === tagId
          ? {
              ...t,
              name: form.name.trim(),
              description: form.description.trim() || undefined,
              color: form.color,
              icon: form.icon,
              categoryId: form.categoryId && form.categoryId !== 'none' ? form.categoryId : undefined,
              relationships: hasRelationships ? {
                mutuallyExclusiveWith: form.mutuallyExclusiveWith,
                suggestedWith: form.suggestedWith,
                requiredWith: form.requiredWith,
              } : undefined,
            }
          : t
      );
      saveCustomTags(updated);
      toast.success('Tag updated');
    }

    navigate('/customize?tab=tags');
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this tag?')) {
      const tags = getCustomTags();
      const filtered = tags.filter(t => t.id !== tagId);
      saveCustomTags(filtered);
      toast.success('Tag deleted');
      navigate('/customize?tab=tags');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  const selectedCategory = categories.find((c: TagCategory) => c.id === form.categoryId);
  const isValid = form.name.trim().length > 0;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate('/customize?tab=tags')}
                variant="ghost"
                size="sm"
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl">{isNew ? 'Create Tag' : 'Edit Tag'}</h1>
                <p className="text-sm text-muted-foreground">
                  {isNew ? 'Add a new tag to organize your trades' : 'Update your tag'}
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
              <Button onClick={() => navigate('/customize?tab=tags')} variant="outline" size="sm">
                {isNew ? 'Cancel' : 'Close (ESC)'}
              </Button>
              {isNew && (
                <Button onClick={handleSave} disabled={!isValid} size="sm">
                  Create Tag (⌘S)
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
                    <Label htmlFor="tag-name" className="text-sm mb-2 block">
                      Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="tag-name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g., Revenge Trading, FOMO, Overtrading..."
                      className={!isValid && form.name ? 'border-destructive' : ''}
                      autoFocus
                    />
                    {!isValid && form.name && (
                      <p className="text-xs text-destructive mt-1">Name is required</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="tag-description" className="text-sm mb-2 block">
                      Description
                    </Label>
                    <Input
                      id="tag-description"
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="e.g., Why this is significant, what to watch for..."
                      className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {form.description.length} characters
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="tag-category" className="text-sm mb-2 block">
                      Category
                    </Label>
                    <Select
                      value={form.categoryId}
                      onValueChange={(value) => setForm({ ...form, categoryId: value })}
                    >
                      <SelectTrigger id="tag-category">
                        <SelectValue placeholder="Select category..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          <span className="text-muted-foreground">Uncategorized</span>
                        </SelectItem>
                        {categories.filter((c: TagCategory) => c.isActive).map((cat: TagCategory) => (
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

              {/* Tag Relationships Section */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Link2 className="h-5 w-5 text-primary" />
                  <h3 className="font-medium">Tag Relationships</h3>
                  <Badge variant="outline" className="ml-auto">Optional</Badge>
                </div>
                
                <div className="space-y-4">
                  {/* Mutually Exclusive */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                      <Label className="text-sm">Mutually Exclusive With</Label>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Tags that cannot be used together with this tag
                    </p>
                    <Select
                      value=""
                      onValueChange={(value) => {
                        if (!form.mutuallyExclusiveWith.includes(value)) {
                          setForm({ 
                            ...form, 
                            mutuallyExclusiveWith: [...form.mutuallyExclusiveWith, value] 
                          });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select tags..." />
                      </SelectTrigger>
                      <SelectContent>
                        {allTags
                          .filter(t => t.id !== tagId && t.isActive && !form.mutuallyExclusiveWith.includes(t.id))
                          .map(tag => (
                            <SelectItem key={tag.id} value={tag.id}>
                              {tag.name}
                            </SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                    {form.mutuallyExclusiveWith.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {form.mutuallyExclusiveWith.map(id => {
                          const tag = allTags.find(t => t.id === id);
                          return tag ? (
                            <Badge key={id} variant="outline" className="gap-1">
                              {tag.name}
                              <button
                                onClick={() => {
                                  setForm({
                                    ...form,
                                    mutuallyExclusiveWith: form.mutuallyExclusiveWith.filter(tid => tid !== id)
                                  });
                                }}
                                className="ml-1"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Suggested With */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Plus className="h-4 w-4 text-blue-500" />
                      <Label className="text-sm">Suggested With</Label>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Tags to suggest when this tag is used
                    </p>
                    <Select
                      value=""
                      onValueChange={(value) => {
                        if (!form.suggestedWith.includes(value)) {
                          setForm({ 
                            ...form, 
                            suggestedWith: [...form.suggestedWith, value] 
                          });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select tags..." />
                      </SelectTrigger>
                      <SelectContent>
                        {allTags
                          .filter(t => t.id !== tagId && t.isActive && !form.suggestedWith.includes(t.id))
                          .map(tag => (
                            <SelectItem key={tag.id} value={tag.id}>
                              {tag.name}
                            </SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                    {form.suggestedWith.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {form.suggestedWith.map(id => {
                          const tag = allTags.find(t => t.id === id);
                          return tag ? (
                            <Badge key={id} variant="outline" className="gap-1">
                              {tag.name}
                              <button
                                onClick={() => {
                                  setForm({
                                    ...form,
                                    suggestedWith: form.suggestedWith.filter(tid => tid !== id)
                                  });
                                }}
                                className="ml-1"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Required With */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <CheckSquare className="h-4 w-4 text-green-500" />
                      <Label className="text-sm">Required With</Label>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Tags that should be used together with this tag
                    </p>
                    <Select
                      value=""
                      onValueChange={(value) => {
                        if (!form.requiredWith.includes(value)) {
                          setForm({ 
                            ...form, 
                            requiredWith: [...form.requiredWith, value] 
                          });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select tags..." />
                      </SelectTrigger>
                      <SelectContent>
                        {allTags
                          .filter(t => t.id !== tagId && t.isActive && !form.requiredWith.includes(t.id))
                          .map(tag => (
                            <SelectItem key={tag.id} value={tag.id}>
                              {tag.name}
                            </SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                    {form.requiredWith.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {form.requiredWith.map(id => {
                          const tag = allTags.find(t => t.id === id);
                          return tag ? (
                            <Badge key={id} variant="outline" className="gap-1">
                              {tag.name}
                              <button
                                onClick={() => {
                                  setForm({
                                    ...form,
                                    requiredWith: form.requiredWith.filter(tid => tid !== id)
                                  });
                                }}
                                className="ml-1"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-muted/20">
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p className="flex items-start gap-2">
                    <span className="text-primary">💡</span>
                    <span>Use relationships to create smart tag suggestions and prevent conflicts</span>
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
                        className="w-10 h-10 rounded-md flex-shrink-0 flex items-center justify-center"
                        style={{ backgroundColor: form.color }}
                      >
                        {form.icon && (
                          <span className="text-lg text-white/90">{form.icon}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">
                          {form.name || 'Tag Name'}
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
                        <p className="text-xs text-muted-foreground">
                          {form.description}
                        </p>
                      </div>
                    )}
                    
                    {/* Badge Previews */}
                    <div className="pt-3 border-t">
                      <p className="text-xs text-muted-foreground mb-2">As badges:</p>
                      <div className="flex flex-wrap gap-2">
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
                          <span className="truncate">{form.name || 'Tag Name'}</span>
                        </Badge>
                        <Badge 
                          className="gap-1.5"
                          style={{ 
                            backgroundColor: form.color,
                            color: 'white'
                          }}
                        >
                          {form.icon && <span>{form.icon}</span>}
                          <span className="truncate">{form.name || 'Tag Name'}</span>
                        </Badge>
                      </div>
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
