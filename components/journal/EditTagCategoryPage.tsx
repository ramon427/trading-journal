import { useState, useEffect } from 'react';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { useRouter } from '@/lib/journal/router';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { 
  getTagCategories, 
  saveTagCategories,
  type TagCategory 
} from '@/lib/journal/customization';
import { toast } from 'sonner';

const PRESET_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#6366f1', '#ec4899',
  '#8b5cf6', '#14b8a6', '#f97316', '#a855f7', '#06b6d4',
  '#84cc16', '#f43f5e', '#64748b', '#ef4444', '#22c55e',
];

export function EditTagCategoryPage({ categoryId }: { categoryId: string }) {
  const { navigate } = useRouter();
  const isNew = categoryId === 'new';
  
  const [form, setForm] = useState({
    name: '',
    color: PRESET_COLORS[0],
  });

  useEffect(() => {
    if (!isNew) {
      const categories = getTagCategories();
      const category = categories.find(c => c.id === categoryId);
      if (category) {
        setForm({
          name: category.name,
          color: category.color || PRESET_COLORS[0],
        });
      } else {
        toast.error('Category not found');
        navigate('/customize?tab=tag-categories');
      }
    }
  }, [categoryId, isNew, navigate]);

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error('Please enter a name');
      return;
    }

    const categories = getTagCategories();

    if (isNew) {
      const newCategory: TagCategory = {
        id: `tagcat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: form.name.trim(),
        color: form.color,
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      saveTagCategories([...categories, newCategory]);
      toast.success('Category created');
    } else {
      const updated = categories.map(c => 
        c.id === categoryId
          ? {
              ...c,
              name: form.name.trim(),
              color: form.color,
            }
          : c
      );
      saveTagCategories(updated);
      toast.success('Category updated');
    }

    navigate('/customize?tab=tag-categories');
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this category? Tags in this category will become uncategorized.')) {
      const categories = getTagCategories();
      const filtered = categories.filter(c => c.id !== categoryId);
      saveTagCategories(filtered);
      toast.success('Category deleted');
      navigate('/customize?tab=tag-categories');
    }
  };

  const isValid = form.name.trim().length > 0;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate('/customize?tab=tag-categories')}
                variant="ghost"
                size="sm"
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl">{isNew ? 'Create Tag Category' : 'Edit Tag Category'}</h1>
                <p className="text-sm text-muted-foreground">
                  {isNew ? 'Create a new category for organizing tags' : 'Update the category'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isNew && (
                <Button
                  onClick={handleDelete}
                  variant="outline"
                  size="sm"
                  className="gap-2 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              )}
              <Button onClick={() => navigate('/customize?tab=tag-categories')} variant="outline" size="sm">
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!isValid} size="sm">
                {isNew ? 'Create' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <Label htmlFor="cat-name" className="text-sm mb-2 block">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="cat-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Sector, Risk Level..."
                  className={!isValid && form.name ? 'border-destructive' : ''}
                  autoFocus
                />
                {!isValid && form.name && (
                  <p className="text-xs text-destructive mt-1">Name is required</p>
                )}
              </div>
              
              <div>
                <Label className="text-sm mb-3 block">Color</Label>
                <div className="flex gap-2 flex-wrap">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setForm({ ...form, color })}
                      className={`w-10 h-10 rounded-md transition-all ${
                        form.color === color ? 'ring-2 ring-offset-2 ring-ring scale-110' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                      aria-label={`Select color ${color}`}
                    />
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="pt-4 border-t">
                <Label className="text-sm mb-3 block">Preview</Label>
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex-shrink-0"
                    style={{ backgroundColor: form.color }}
                  />
                  <span className="font-medium">{form.name || 'Category Name'}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
