import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Star, 
  StarOff, 
  Eye, 
  EyeOff, 
  Download, 
  Upload,
  Search,
  Copy,
  Check,
  X,
  Sparkles,
  FolderPlus,
  TrendingUp,
  TrendingDown,
  Hash,
  ArrowUpDown,
  Filter,
} from 'lucide-react';
import { useRouter } from '@/lib/journal/router';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Skeleton } from './ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from './ui/select';
import { Separator } from './ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from './ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import {
  CustomSetup,
  CustomTag,
  SetupCategory,
  TagCategory,
  loadCustomSetups,
  saveCustomSetups,
  loadCustomTags,
  saveCustomTags,
  loadSetupCategories,
  saveSetupCategories,
  loadTagCategories,
  saveTagCategories,
  calculateSetupStats,
  calculateTagStats,
  getSetupsByCategory,
  getTagsByCategory,
  exportCustomization,
  importCustomization,
  migrateFromTrades,
} from '@/lib/journal/customization';
import { Trade } from '@/types/journal/trading';
import { toast } from 'sonner';
import { ThemeCustomizerPage } from './ThemeCustomizerPage';
import { Theme } from '@/lib/journal/theme';

interface CustomizePageProps {
  trades: Trade[];
  onRefresh?: () => void;
  theme?: Theme;
}

type EditMode = 'create' | 'edit';
type ManagementTab = 'setups' | 'tags' | 'setup-categories' | 'tag-categories';
type SortOption = 'name' | 'usage' | 'created' | 'performance';
type FilterOption = 'all' | 'active' | 'archived' | 'favorites';

const PRESET_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#6366f1', '#ec4899',
  '#8b5cf6', '#14b8a6', '#f97316', '#a855f7', '#06b6d4',
  '#84cc16', '#f43f5e', '#64748b', '#ef4444', '#22c55e',
];

export function CustomizePage({ trades, onRefresh, theme = 'light' }: CustomizePageProps) {
  const { navigate, getCurrentRoute } = useRouter();
  const currentRoute = getCurrentRoute();
  const initialTab = (currentRoute.type === 'customize' && currentRoute.tab) ? currentRoute.tab as ManagementTab : 'setups';
  
  const [setups, setSetups] = useState<CustomSetup[]>([]);
  const [tags, setTags] = useState<CustomTag[]>([]);
  const [setupCategories, setSetupCategories] = useState<SetupCategory[]>([]);
  const [tagCategories, setTagCategories] = useState<TagCategory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<ManagementTab>(initialTab);
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [isTabLoading, setIsTabLoading] = useState(false);
  
  // Setup editing
  const [setupDialogOpen, setSetupDialogOpen] = useState(false);
  const [setupEditMode, setSetupEditMode] = useState<EditMode>('create');
  const [editingSetup, setEditingSetup] = useState<CustomSetup | null>(null);
  const [setupForm, setSetupForm] = useState({
    name: '',
    description: '',
    color: PRESET_COLORS[0],
    categoryId: '',
  });
  
  // Tag editing
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [tagEditMode, setTagEditMode] = useState<EditMode>('create');
  const [editingTag, setEditingTag] = useState<CustomTag | null>(null);
  const [tagForm, setTagForm] = useState({
    name: '',
    color: PRESET_COLORS[0],
    categoryId: '',
  });
  
  // Setup Category editing
  const [setupCategoryDialogOpen, setSetupCategoryDialogOpen] = useState(false);
  const [setupCategoryEditMode, setSetupCategoryEditMode] = useState<EditMode>('create');
  const [editingSetupCategory, setEditingSetupCategory] = useState<SetupCategory | null>(null);
  const [setupCategoryForm, setSetupCategoryForm] = useState({
    name: '',
    color: PRESET_COLORS[0],
  });
  
  // Tag Category editing
  const [tagCategoryDialogOpen, setTagCategoryDialogOpen] = useState(false);
  const [tagCategoryEditMode, setTagCategoryEditMode] = useState<EditMode>('create');
  const [editingTagCategory, setEditingTagCategory] = useState<TagCategory | null>(null);
  const [tagCategoryForm, setTagCategoryForm] = useState({
    name: '',
    color: PRESET_COLORS[0],
  });
  
  // Import/Export
  const [importDataDialogOpen, setImportDataDialogOpen] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportJson, setExportJson] = useState('');
  const [copied, setCopied] = useState(false);
  
  // Load data
  useEffect(() => {
    loadData();
    // Auto-migrate on mount
    migrateFromTrades(trades);
  }, [trades]);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      // N - New setup/tag based on active tab
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        if (activeTab === 'setups') {
          openCreateSetupDialog();
        } else if (activeTab === 'tags') {
          openCreateTagDialog();
        } else if (activeTab === 'setup-categories') {
          openCreateSetupCategoryDialog();
        } else if (activeTab === 'tag-categories') {
          openCreateTagCategoryDialog();
        }
      }
      
      // / - Focus search
      if (e.key === '/' && (activeTab === 'setups' || activeTab === 'tags')) {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder="Search..."]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }
      
      // 1-4 - Switch tabs
      if (e.key === '1') {
        e.preventDefault();
        setActiveTab('setups');
      } else if (e.key === '2') {
        e.preventDefault();
        setActiveTab('tags');
      } else if (e.key === '3') {
        e.preventDefault();
        setActiveTab('setup-categories');
      } else if (e.key === '4') {
        e.preventDefault();
        setActiveTab('tag-categories');
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab]);
  
  const loadData = () => {
    const loadedSetups = loadCustomSetups();
    const loadedTags = loadCustomTags();
    const loadedSetupCategories = loadSetupCategories();
    const loadedTagCategories = loadTagCategories();
    
    // Calculate fresh stats
    const setupsWithStats = loadedSetups.map(setup => calculateSetupStats(setup, trades));
    const tagsWithStats = loadedTags.map(tag => calculateTagStats(tag, trades));
    
    setSetups(setupsWithStats);
    setTags(tagsWithStats);
    setSetupCategories(loadedSetupCategories);
    setTagCategories(loadedTagCategories);
  };
  
  // Apply filters and sort
  const applyFiltersAndSort = <T extends CustomSetup | CustomTag>(items: T[]): T[] => {
    let filtered = items;
    
    // Apply filter
    if (filterBy === 'active') {
      filtered = filtered.filter(item => item.isActive);
    } else if (filterBy === 'archived') {
      filtered = filtered.filter(item => !item.isActive);
    } else if (filterBy === 'favorites') {
      filtered = filtered.filter(item => item.isFavorite);
    }
    
    // Apply sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'usage':
          return (b.usageCount || 0) - (a.usageCount || 0);
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'performance':
          if ('winRate' in a && 'winRate' in b) {
            return (b.winRate || 0) - (a.winRate || 0);
          }
          return 0;
        default:
          return 0;
      }
    });
    
    return sorted;
  };
  
  // Filter by search
  const searchFilteredSetups = useMemo(() => {
    return searchQuery.trim() 
      ? setups.filter(s => 
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.description?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : setups;
  }, [setups, searchQuery]);
  
  const searchFilteredTags = useMemo(() => {
    return searchQuery.trim()
      ? tags.filter(t => 
          t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.description?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : tags;
  }, [tags, searchQuery]);
  
  const filteredSetups = useMemo(() => {
    return applyFiltersAndSort(searchFilteredSetups);
  }, [searchFilteredSetups, sortBy, filterBy]);
  
  const filteredTags = useMemo(() => {
    return applyFiltersAndSort(searchFilteredTags);
  }, [searchFilteredTags, sortBy, filterBy]);
  
  // Calculate counts for filter buttons (based on search results)
  const setupFilterCounts = useMemo(() => ({
    all: searchFilteredSetups.length,
    active: searchFilteredSetups.filter(s => s.isActive).length,
    archived: searchFilteredSetups.filter(s => !s.isActive).length,
    favorites: searchFilteredSetups.filter(s => s.isFavorite).length,
  }), [searchFilteredSetups]);
  
  const tagFilterCounts = useMemo(() => ({
    all: searchFilteredTags.length,
    active: searchFilteredTags.filter(t => t.isActive).length,
    archived: searchFilteredTags.filter(t => !t.isActive).length,
    favorites: searchFilteredTags.filter(t => t.isFavorite).length,
  }), [searchFilteredTags]);
  
  const filteredSetupCategories = useMemo(() => {
    if (!searchQuery.trim()) return setupCategories;
    const query = searchQuery.toLowerCase();
    return setupCategories.filter(c => 
      c.name.toLowerCase().includes(query)
    );
  }, [setupCategories, searchQuery]);
  
  const filteredTagCategories = useMemo(() => {
    if (!searchQuery.trim()) return tagCategories;
    const query = searchQuery.toLowerCase();
    return tagCategories.filter(c => 
      c.name.toLowerCase().includes(query)
    );
  }, [tagCategories, searchQuery]);
  
  // Group by category
  const setupsByCategory = useMemo(() => getSetupsByCategory(filteredSetups, setupCategories), [filteredSetups, setupCategories]);
  const tagsByCategory = useMemo(() => getTagsByCategory(filteredTags, tagCategories), [filteredTags, tagCategories]);
  
  // Setup CRUD operations
  const handleCreateSetup = () => {
    if (!setupForm.name.trim()) {
      toast.error('Setup name is required');
      return;
    }
    
    const newSetup: CustomSetup = {
      id: `setup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: setupForm.name.trim(),
      description: setupForm.description.trim() || undefined,
      color: setupForm.color,
      categoryId: setupForm.categoryId && setupForm.categoryId !== 'none' ? setupForm.categoryId : undefined,
      isActive: true,
      isFavorite: false,
      createdAt: new Date().toISOString(),
      usageCount: 0,
    };
    
    const updated = [...setups, newSetup];
    setSetups(updated);
    saveCustomSetups(updated);
    
    setSetupDialogOpen(false);
    resetSetupForm();
    toast.success('Setup created');
  };
  
  const handleUpdateSetup = () => {
    if (!editingSetup || !setupForm.name.trim()) return;
    
    const updated = setups.map(s => 
      s.id === editingSetup.id
        ? {
            ...s,
            name: setupForm.name.trim(),
            description: setupForm.description.trim() || undefined,
            color: setupForm.color,
            categoryId: setupForm.categoryId && setupForm.categoryId !== 'none' ? setupForm.categoryId : undefined,
          }
        : s
    );
    
    setSetups(updated);
    saveCustomSetups(updated);
    
    setSetupDialogOpen(false);
    resetSetupForm();
    toast.success('Setup updated');
  };
  
  const handleDeleteSetup = (id: string) => {
    const setup = setups.find(s => s.id === id);
    if (!setup) return;
    
    if (setup.usageCount > 0) {
      if (!confirm(`This setup is used in ${setup.usageCount} trade${setup.usageCount !== 1 ? 's' : ''}. Archive instead of delete?`)) {
        return;
      }
      const updated = setups.map(s => s.id === id ? { ...s, isActive: false } : s);
      setSetups(updated);
      saveCustomSetups(updated);
      toast.success('Setup archived');
    } else {
      const updated = setups.filter(s => s.id !== id);
      setSetups(updated);
      saveCustomSetups(updated);
      toast.success('Setup deleted');
    }
  };
  
  const handleToggleFavoriteSetup = (id: string) => {
    const updated = setups.map(s => 
      s.id === id ? { ...s, isFavorite: !s.isFavorite } : s
    );
    setSetups(updated);
    saveCustomSetups(updated);
  };
  
  const handleToggleActiveSetup = (id: string) => {
    const updated = setups.map(s => 
      s.id === id ? { ...s, isActive: !s.isActive } : s
    );
    setSetups(updated);
    saveCustomSetups(updated);
    toast.success(updated.find(s => s.id === id)?.isActive ? 'Setup activated' : 'Setup archived');
  };
  
  const handleDuplicateSetup = (id: string) => {
    const setup = setups.find(s => s.id === id);
    if (!setup) return;
    
    const duplicate: CustomSetup = {
      ...setup,
      id: `setup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `${setup.name} (Copy)`,
      createdAt: new Date().toISOString(),
      usageCount: 0,
      winRate: undefined,
      avgRR: undefined,
      totalPnl: undefined,
    };
    
    const updated = [...setups, duplicate];
    setSetups(updated);
    saveCustomSetups(updated);
    toast.success('Setup duplicated');
  };
  
  const openCreateSetupDialog = () => {
    navigate('/customize/setup/new');
  };
  
  const openEditSetupDialog = (setup: CustomSetup) => {
    navigate(`/customize/setup/${setup.id}`);
  };
  
  const resetSetupForm = () => {
    setSetupForm({
      name: '',
      description: '',
      color: PRESET_COLORS[0],
      categoryId: 'none',
    });
    setEditingSetup(null);
  };
  
  // Tag CRUD operations
  const handleCreateTag = () => {
    if (!tagForm.name.trim()) {
      toast.error('Tag name is required');
      return;
    }
    
    const newTag: CustomTag = {
      id: `tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: tagForm.name.trim(),
      color: tagForm.color,
      categoryId: tagForm.categoryId && tagForm.categoryId !== 'none' ? tagForm.categoryId : undefined,
      isActive: true,
      isFavorite: false,
      createdAt: new Date().toISOString(),
      usageCount: 0,
    };
    
    const updated = [...tags, newTag];
    setTags(updated);
    saveCustomTags(updated);
    
    setTagDialogOpen(false);
    resetTagForm();
    toast.success('Tag created');
  };
  
  const handleUpdateTag = () => {
    if (!editingTag || !tagForm.name.trim()) return;
    
    const updated = tags.map(t => 
      t.id === editingTag.id
        ? {
            ...t,
            name: tagForm.name.trim(),
            color: tagForm.color,
            categoryId: tagForm.categoryId && tagForm.categoryId !== 'none' ? tagForm.categoryId : undefined,
          }
        : t
    );
    
    setTags(updated);
    saveCustomTags(updated);
    
    setTagDialogOpen(false);
    resetTagForm();
    toast.success('Tag updated');
  };
  
  const handleDeleteTag = (id: string) => {
    const tag = tags.find(t => t.id === id);
    if (!tag) return;
    
    if (tag.usageCount > 0) {
      if (!confirm(`This tag is used in ${tag.usageCount} trade${tag.usageCount !== 1 ? 's' : ''}. Archive instead of delete?`)) {
        return;
      }
      const updated = tags.map(t => t.id === id ? { ...t, isActive: false } : t);
      setTags(updated);
      saveCustomTags(updated);
      toast.success('Tag archived');
    } else {
      const updated = tags.filter(t => t.id !== id);
      setTags(updated);
      saveCustomTags(updated);
      toast.success('Tag deleted');
    }
  };
  
  const handleToggleFavoriteTag = (id: string) => {
    const updated = tags.map(t => 
      t.id === id ? { ...t, isFavorite: !t.isFavorite } : t
    );
    setTags(updated);
    saveCustomTags(updated);
  };
  
  const handleToggleActiveTag = (id: string) => {
    const updated = tags.map(t => 
      t.id === id ? { ...t, isActive: !t.isActive } : t
    );
    setTags(updated);
    saveCustomTags(updated);
    toast.success(updated.find(t => t.id === id)?.isActive ? 'Tag activated' : 'Tag archived');
  };
  
  const handleDuplicateTag = (id: string) => {
    const tag = tags.find(t => t.id === id);
    if (!tag) return;
    
    const duplicate: CustomTag = {
      ...tag,
      id: `tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `${tag.name} (Copy)`,
      createdAt: new Date().toISOString(),
      usageCount: 0,
    };
    
    const updated = [...tags, duplicate];
    setTags(updated);
    saveCustomTags(updated);
    toast.success('Tag duplicated');
  };
  
  const openCreateTagDialog = () => {
    navigate('/customize/tag/new');
  };
  
  const openEditTagDialog = (tag: CustomTag) => {
    navigate(`/customize/tag/${tag.id}`);
  };
  
  const resetTagForm = () => {
    setTagForm({
      name: '',
      color: PRESET_COLORS[0],
      categoryId: 'none',
    });
    setEditingTag(null);
  };
  
  // Setup Category CRUD
  const handleCreateSetupCategory = () => {
    if (!setupCategoryForm.name.trim()) {
      toast.error('Category name is required');
      return;
    }
    
    const newCategory: SetupCategory = {
      id: `setupcat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: setupCategoryForm.name.trim(),
      color: setupCategoryForm.color,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    
    const updated = [...setupCategories, newCategory];
    setSetupCategories(updated);
    saveSetupCategories(updated);
    
    setSetupCategoryDialogOpen(false);
    resetSetupCategoryForm();
    toast.success('Setup category created');
  };
  
  const handleUpdateSetupCategory = () => {
    if (!editingSetupCategory || !setupCategoryForm.name.trim()) return;
    
    const updated = setupCategories.map(c => 
      c.id === editingSetupCategory.id
        ? {
            ...c,
            name: setupCategoryForm.name.trim(),
            color: setupCategoryForm.color,
          }
        : c
    );
    
    setSetupCategories(updated);
    saveSetupCategories(updated);
    
    setSetupCategoryDialogOpen(false);
    resetSetupCategoryForm();
    toast.success('Setup category updated');
  };
  
  const handleDeleteSetupCategory = (id: string) => {
    const category = setupCategories.find(c => c.id === id);
    if (!category) return;
    
    const setupsInCategory = setups.filter(s => s.categoryId === id);
    if (setupsInCategory.length > 0) {
      if (!confirm(`This category contains ${setupsInCategory.length} setup${setupsInCategory.length !== 1 ? 's' : ''}. They will become uncategorized. Continue?`)) {
        return;
      }
      // Remove category from setups
      const updatedSetups = setups.map(s => 
        s.categoryId === id ? { ...s, categoryId: undefined } : s
      );
      setSetups(updatedSetups);
      saveCustomSetups(updatedSetups);
    }
    
    const updated = setupCategories.filter(c => c.id !== id);
    setSetupCategories(updated);
    saveSetupCategories(updated);
    toast.success('Setup category deleted');
  };
  
  const handleToggleActiveSetupCategory = (id: string) => {
    const updated = setupCategories.map(c => 
      c.id === id ? { ...c, isActive: !c.isActive } : c
    );
    setSetupCategories(updated);
    saveSetupCategories(updated);
    toast.success(updated.find(c => c.id === id)?.isActive ? 'Category activated' : 'Category archived');
  };
  
  const openCreateSetupCategoryDialog = () => {
    navigate('/customize/setup-category/new');
  };
  
  const openEditSetupCategoryDialog = (category: SetupCategory) => {
    navigate(`/customize/setup-category/${category.id}`);
  };
  
  const resetSetupCategoryForm = () => {
    setSetupCategoryForm({
      name: '',
      color: PRESET_COLORS[0],
    });
    setEditingSetupCategory(null);
  };
  
  // Tag Category CRUD
  const handleCreateTagCategory = () => {
    if (!tagCategoryForm.name.trim()) {
      toast.error('Category name is required');
      return;
    }
    
    const newCategory: TagCategory = {
      id: `tagcat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: tagCategoryForm.name.trim(),
      color: tagCategoryForm.color,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    
    const updated = [...tagCategories, newCategory];
    setTagCategories(updated);
    saveTagCategories(updated);
    
    setTagCategoryDialogOpen(false);
    resetTagCategoryForm();
    toast.success('Tag category created');
  };
  
  const handleUpdateTagCategory = () => {
    if (!editingTagCategory || !tagCategoryForm.name.trim()) return;
    
    const updated = tagCategories.map(c => 
      c.id === editingTagCategory.id
        ? {
            ...c,
            name: tagCategoryForm.name.trim(),
            color: tagCategoryForm.color,
          }
        : c
    );
    
    setTagCategories(updated);
    saveTagCategories(updated);
    
    setTagCategoryDialogOpen(false);
    resetTagCategoryForm();
    toast.success('Tag category updated');
  };
  
  const handleDeleteTagCategory = (id: string) => {
    const category = tagCategories.find(c => c.id === id);
    if (!category) return;
    
    const tagsInCategory = tags.filter(t => t.categoryId === id);
    if (tagsInCategory.length > 0) {
      if (!confirm(`This category contains ${tagsInCategory.length} tag${tagsInCategory.length !== 1 ? 's' : ''}. They will become uncategorized. Continue?`)) {
        return;
      }
      // Remove category from tags
      const updatedTags = tags.map(t => 
        t.categoryId === id ? { ...t, categoryId: undefined } : t
      );
      setTags(updatedTags);
      saveCustomTags(updatedTags);
    }
    
    const updated = tagCategories.filter(c => c.id !== id);
    setTagCategories(updated);
    saveTagCategories(updated);
    toast.success('Tag category deleted');
  };
  
  const handleToggleActiveTagCategory = (id: string) => {
    const updated = tagCategories.map(c => 
      c.id === id ? { ...c, isActive: !c.isActive } : c
    );
    setTagCategories(updated);
    saveTagCategories(updated);
    toast.success(updated.find(c => c.id === id)?.isActive ? 'Category activated' : 'Category archived');
  };
  
  const openCreateTagCategoryDialog = () => {
    navigate('/customize/tag-category/new');
  };
  
  const openEditTagCategoryDialog = (category: TagCategory) => {
    navigate(`/customize/tag-category/${category.id}`);
  };
  
  const resetTagCategoryForm = () => {
    setTagCategoryForm({
      name: '',
      color: PRESET_COLORS[0],
    });
    setEditingTagCategory(null);
  };
  
  // Import/Export
  const handleExport = () => {
    const json = exportCustomization();
    setExportJson(json);
    setExportDialogOpen(true);
  };
  
  const handleCopyExport = () => {
    navigator.clipboard.writeText(exportJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard');
  };
  
  const handleDownloadExport = () => {
    const blob = new Blob([exportJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trading-journal-customization-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Downloaded');
  };
  
  const handleImport = () => {
    try {
      const { setups: importedSetups, tags: importedTags, setupCategories: importedSetupCats, tagCategories: importedTagCats } = importCustomization(importJson);
      
      // Merge with existing
      const existingSetupNames = new Set(setups.map(s => s.name.toLowerCase()));
      const existingTagNames = new Set(tags.map(t => t.name.toLowerCase()));
      const existingSetupCatNames = new Set(setupCategories.map(c => c.name.toLowerCase()));
      const existingTagCatNames = new Set(tagCategories.map(c => c.name.toLowerCase()));
      
      const newSetups = importedSetups.filter(s => !existingSetupNames.has(s.name.toLowerCase()));
      const newTags = importedTags.filter(t => !existingTagNames.has(t.name.toLowerCase()));
      const newSetupCats = (importedSetupCats || []).filter(c => !existingSetupCatNames.has(c.name.toLowerCase()));
      const newTagCats = (importedTagCats || []).filter(c => !existingTagCatNames.has(c.name.toLowerCase()));
      
      if (newSetups.length === 0 && newTags.length === 0 && newSetupCats.length === 0 && newTagCats.length === 0) {
        toast.error('No new items to import');
        return;
      }
      
      const updatedSetups = [...setups, ...newSetups];
      const updatedTags = [...tags, ...newTags];
      const updatedSetupCats = [...setupCategories, ...newSetupCats];
      const updatedTagCats = [...tagCategories, ...newTagCats];
      
      setSetups(updatedSetups);
      setTags(updatedTags);
      setSetupCategories(updatedSetupCats);
      setTagCategories(updatedTagCats);
      saveCustomSetups(updatedSetups);
      saveCustomTags(updatedTags);
      saveSetupCategories(updatedSetupCats);
      saveTagCategories(updatedTagCats);
      
      setImportDataDialogOpen(false);
      setImportJson('');
      toast.success(`Imported ${newSetups.length} setups, ${newTags.length} tags, ${newSetupCats.length} setup categories, ${newTagCats.length} tag categories`);
    } catch (error) {
      toast.error('Failed to import: Invalid format');
    }
  };
  
  // Migration
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="mb-1">Setups & Tags</h1>
          <p className="text-sm text-muted-foreground">Manage your trade setups, tags, and categories</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button onClick={() => setImportDataDialogOpen(true)} variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => {
        const newTab = v as ManagementTab;
        if (newTab !== activeTab) {
          setIsTabLoading(true);
          setSearchQuery(''); // Clear search when switching tabs
          setTimeout(() => {
            setActiveTab(newTab);
            setTimeout(() => {
              setIsTabLoading(false);
            }, 200);
          }, 100);
        }
      }}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="setups">
            Setups ({setups.filter(s => s.isActive).length})
          </TabsTrigger>
          <TabsTrigger value="tags">
            Tags ({tags.filter(t => t.isActive).length})
          </TabsTrigger>
          <TabsTrigger value="setup-categories">
            Setup Categories ({setupCategories.filter(c => c.isActive).length})
          </TabsTrigger>
          <TabsTrigger value="tag-categories">
            Tag Categories ({tagCategories.filter(c => c.isActive).length})
          </TabsTrigger>
          <TabsTrigger value="theme">
            Theme
          </TabsTrigger>
        </TabsList>
        
        {/* Search and Filter Bar */}
        {(activeTab === 'setups' || activeTab === 'tags') && (
          <div className="space-y-3 mt-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    Sort
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                    <DropdownMenuRadioItem value="name">Name</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="usage">Usage Count</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="created">Date Created</DropdownMenuRadioItem>
                    {activeTab === 'setups' && (
                      <DropdownMenuRadioItem value="performance">Performance</DropdownMenuRadioItem>
                    )}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {/* Quick Filter Buttons */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground mr-1">Filter:</span>
              
              <Button
                variant={filterBy === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterBy('all')}
                className="h-8"
              >
                All
                <Badge variant={filterBy === 'all' ? 'secondary' : 'outline'} className="ml-2 h-5 px-1.5">
                  {activeTab === 'setups' ? setupFilterCounts.all : tagFilterCounts.all}
                </Badge>
              </Button>
              
              <Button
                variant={filterBy === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterBy('active')}
                className="h-8"
              >
                <Eye className="h-3.5 w-3.5 mr-1.5" />
                Active
                <Badge variant={filterBy === 'active' ? 'secondary' : 'outline'} className="ml-2 h-5 px-1.5">
                  {activeTab === 'setups' ? setupFilterCounts.active : tagFilterCounts.active}
                </Badge>
              </Button>
              
              <Button
                variant={filterBy === 'favorites' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterBy('favorites')}
                className="h-8"
              >
                <Star className="h-3.5 w-3.5 mr-1.5" />
                Favorites
                <Badge variant={filterBy === 'favorites' ? 'secondary' : 'outline'} className="ml-2 h-5 px-1.5">
                  {activeTab === 'setups' ? setupFilterCounts.favorites : tagFilterCounts.favorites}
                </Badge>
              </Button>
              
              <Button
                variant={filterBy === 'archived' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterBy('archived')}
                className="h-8"
              >
                <EyeOff className="h-3.5 w-3.5 mr-1.5" />
                Archived
                <Badge variant={filterBy === 'archived' ? 'secondary' : 'outline'} className="ml-2 h-5 px-1.5">
                  {activeTab === 'setups' ? setupFilterCounts.archived : tagFilterCounts.archived}
                </Badge>
              </Button>
            </div>
          </div>
        )}
        
        {/* Content */}
        <AnimatePresence mode="wait">
          {isTabLoading ? (
            <motion.div
              key="tab-loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="mt-6 space-y-4"
            >
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="p-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-12 w-12 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            >
              <TabsContent value="setups" className="mt-6">
                <SetupsList
                  setups={filteredSetups}
                  setupsByCategory={setupsByCategory}
                  filterBy={filterBy}
                  onCreateNew={openCreateSetupDialog}
                  onEdit={openEditSetupDialog}
                  onDelete={handleDeleteSetup}
                  onToggleFavorite={handleToggleFavoriteSetup}
                  onToggleActive={handleToggleActiveSetup}
                  onDuplicate={handleDuplicateSetup}
                />
              </TabsContent>
              
              <TabsContent value="tags" className="mt-6">
                <TagsList
                  tags={filteredTags}
                  tagsByCategory={tagsByCategory}
                  filterBy={filterBy}
                  onCreateNew={openCreateTagDialog}
                  onEdit={openEditTagDialog}
                  onDelete={handleDeleteTag}
                  onToggleFavorite={handleToggleFavoriteTag}
                  onToggleActive={handleToggleActiveTag}
                  onDuplicate={handleDuplicateTag}
                />
              </TabsContent>
              
              <TabsContent value="setup-categories" className="mt-6">
                <SetupCategoriesList
                  categories={filteredSetupCategories}
                  onCreateNew={openCreateSetupCategoryDialog}
                  onEdit={openEditSetupCategoryDialog}
                  onDelete={handleDeleteSetupCategory}
                  onToggleActive={handleToggleActiveSetupCategory}
                />
              </TabsContent>
              
              <TabsContent value="tag-categories" className="mt-6">
                <TagCategoriesList
                  categories={filteredTagCategories}
                  onCreateNew={openCreateTagCategoryDialog}
                  onEdit={openEditTagCategoryDialog}
                  onDelete={handleDeleteTagCategory}
                  onToggleActive={handleToggleActiveTagCategory}
                />
              </TabsContent>
              
              <TabsContent value="theme" className="mt-6">
                <ThemeCustomizerPage theme={theme} />
              </TabsContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Tabs>
      
      {/* Dialogs */}
      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        exportJson={exportJson}
        copied={copied}
        onCopy={handleCopyExport}
        onDownload={handleDownloadExport}
      />
      
      <CustomImportDialog
        open={importDataDialogOpen}
        onOpenChange={setImportDataDialogOpen}
        importJson={importJson}
        setImportJson={setImportJson}
        onImport={handleImport}
      />
    </div>
  );
}

// Sub-components for cleaner code
function SetupsList({ setups, setupsByCategory, filterBy, onCreateNew, onEdit, onDelete, onToggleFavorite, onToggleActive, onDuplicate }: any) {
  const getEmptyStateContent = () => {
    switch (filterBy) {
      case 'favorites':
        return {
          icon: Star,
          title: 'No favorite setups',
          description: 'Star your favorite setups to quickly access them here',
          showButton: false,
        };
      case 'archived':
        return {
          icon: EyeOff,
          title: 'No archived setups',
          description: 'Archived setups will appear here',
          showButton: false,
        };
      case 'active':
        return {
          icon: Eye,
          title: 'No active setups',
          description: 'Create a new setup or unarchive existing ones',
          showButton: true,
        };
      default:
        return {
          icon: Sparkles,
          title: 'No setups found',
          description: 'Create your first trading setup to start organizing your trades',
          showButton: true,
        };
    }
  };
  
  const emptyState = getEmptyStateContent();
  const EmptyIcon = emptyState.icon;
  
  return (
    <div className="space-y-6">
      <Button onClick={onCreateNew}>
        <Plus className="h-4 w-4 mr-2" />
        New Setup
      </Button>
      
      {setups.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-full bg-muted mx-auto flex items-center justify-center">
              <EmptyIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-muted-foreground">{emptyState.title}</h3>
            <p className="text-sm text-muted-foreground">
              {emptyState.description}
            </p>
            {emptyState.showButton && (
              <Button onClick={onCreateNew} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Setup
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(setupsByCategory).map(([categoryId, { category, setups: categorySetups }]: any) => (
            categorySetups.length > 0 && (
              <div key={categoryId}>
                <div className="flex items-center gap-2 mb-2">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: category.color }}
                  />
                  <h3 className="text-sm text-muted-foreground">{category.name}</h3>
                  <Badge variant="outline" className="h-5 px-1.5 text-xs">{categorySetups.length}</Badge>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                  {categorySetups.map((setup: CustomSetup) => (
                    <motion.div
                      key={setup.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Card 
                        className="p-3 hover:shadow-md hover:border-primary/20 transition-all cursor-pointer h-full"
                        onClick={() => onEdit(setup)}
                      >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-lg flex-shrink-0 shadow-sm flex items-center justify-center"
                          style={{ backgroundColor: setup.color }}
                        >
                          {setup.icon && (
                            <span className="text-lg text-white/90">{setup.icon}</span>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h4 className="font-medium truncate">{setup.name}</h4>
                            {!setup.isActive && (
                              <Badge variant="outline" className="text-xs flex-shrink-0">Archived</Badge>
                            )}
                            {setup.isFavorite && (
                              <Star className="h-3.5 w-3.5 fill-warning text-warning flex-shrink-0" />
                            )}
                          </div>
                          
                          {setup.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">{setup.description}</p>
                          )}
                        </div>
                        
                        <TooltipProvider>
                          <div className="flex items-center gap-0.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  onClick={() => onToggleFavorite(setup.id)}
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 hover:bg-warning/10 hover:text-warning"
                                  aria-label={setup.isFavorite ? "Remove from favorites" : "Add to favorites"}
                                >
                                  {setup.isFavorite ? (
                                    <StarOff className="h-3.5 w-3.5" />
                                  ) : (
                                    <Star className="h-3.5 w-3.5" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{setup.isFavorite ? 'Remove from favorites' : 'Add to favorites'}</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  onClick={() => onToggleActive(setup.id)}
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 hover:bg-accent"
                                  aria-label={setup.isActive ? "Archive" : "Activate"}
                                >
                                  {setup.isActive ? (
                                    <Eye className="h-3.5 w-3.5" />
                                  ) : (
                                    <EyeOff className="h-3.5 w-3.5" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{setup.isActive ? 'Archive' : 'Activate'}</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  onClick={() => onDuplicate(setup.id)}
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 hover:bg-accent"
                                  aria-label="Duplicate"
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Duplicate</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  onClick={() => onDelete(setup.id)}
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  aria-label="Delete"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Delete</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </TooltipProvider>
                      </div>
                    </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
}

function TagsList({ tags, tagsByCategory, filterBy, onCreateNew, onEdit, onDelete, onToggleFavorite, onToggleActive, onDuplicate }: any) {
  const getEmptyStateContent = () => {
    switch (filterBy) {
      case 'favorites':
        return {
          icon: Star,
          title: 'No favorite tags',
          description: 'Star your favorite tags to quickly access them here',
          showButton: false,
        };
      case 'archived':
        return {
          icon: EyeOff,
          title: 'No archived tags',
          description: 'Archived tags will appear here',
          showButton: false,
        };
      case 'active':
        return {
          icon: Eye,
          title: 'No active tags',
          description: 'Create a new tag or unarchive existing ones',
          showButton: true,
        };
      default:
        return {
          icon: Sparkles,
          title: 'No tags found',
          description: 'Create your first tag to start categorizing your trades',
          showButton: true,
        };
    }
  };
  
  const emptyState = getEmptyStateContent();
  const EmptyIcon = emptyState.icon;
  
  return (
    <div className="space-y-6">
      <Button onClick={onCreateNew}>
        <Plus className="h-4 w-4 mr-2" />
        New Tag
      </Button>
      
      {tags.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-full bg-muted mx-auto flex items-center justify-center">
              <EmptyIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-muted-foreground">{emptyState.title}</h3>
            <p className="text-sm text-muted-foreground">
              {emptyState.description}
            </p>
            {emptyState.showButton && (
              <Button onClick={onCreateNew} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Tag
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(tagsByCategory).map(([categoryId, { category, tags: categoryTags }]: any) => (
            categoryTags.length > 0 && (
              <div key={categoryId}>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-sm text-muted-foreground">{category.name}</h3>
                  <Badge variant="outline" className="h-5 px-1.5 text-xs">{categoryTags.length}</Badge>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                  {categoryTags.map((tag: CustomTag) => (
                    <motion.div
                      key={tag.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Card 
                        className="p-3 hover:shadow-md hover:border-primary/20 transition-all cursor-pointer h-full"
                        onClick={() => onEdit(tag)}
                      >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: tag.color }}
                        >
                          {tag.icon && (
                            <span className="text-sm text-white/90">{tag.icon}</span>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-medium truncate">{tag.name}</span>
                            {!tag.isActive && (
                              <Badge variant="outline" className="text-xs flex-shrink-0">Archived</Badge>
                            )}
                            {tag.isFavorite && (
                              <Star className="h-3.5 w-3.5 fill-warning text-warning flex-shrink-0" />
                            )}
                          </div>
                          {tag.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {tag.description}
                            </p>
                          )}
                        </div>
                        
                        <TooltipProvider>
                          <div className="flex items-center gap-0.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  onClick={() => onToggleFavorite(tag.id)}
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 hover:bg-warning/10 hover:text-warning"
                                  aria-label={tag.isFavorite ? "Remove from favorites" : "Add to favorites"}
                                >
                                  {tag.isFavorite ? (
                                    <StarOff className="h-3.5 w-3.5" />
                                  ) : (
                                    <Star className="h-3.5 w-3.5" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{tag.isFavorite ? 'Remove from favorites' : 'Add to favorites'}</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  onClick={() => onToggleActive(tag.id)}
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 hover:bg-accent"
                                  aria-label={tag.isActive ? "Archive" : "Activate"}
                                >
                                  {tag.isActive ? (
                                    <Eye className="h-3.5 w-3.5" />
                                  ) : (
                                    <EyeOff className="h-3.5 w-3.5" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{tag.isActive ? 'Archive' : 'Activate'}</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  onClick={() => onDuplicate(tag.id)}
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 hover:bg-accent"
                                  aria-label="Duplicate"
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Duplicate</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  onClick={() => onDelete(tag.id)}
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  aria-label="Delete"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Delete</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </TooltipProvider>
                      </div>
                    </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
}

function SetupCategoriesList({ categories, onCreateNew, onEdit, onDelete, onToggleActive }: any) {
  return (
    <div className="space-y-6">
      <Button onClick={onCreateNew}>
        <FolderPlus className="h-4 w-4 mr-2" />
        New Setup Category
      </Button>
      
      {categories.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-full bg-muted mx-auto flex items-center justify-center">
              <FolderPlus className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-muted-foreground">No setup categories found</h3>
            <p className="text-sm text-muted-foreground">
              Create categories to organize your trading setups
            </p>
            <Button onClick={onCreateNew} variant="outline" size="sm">
              <FolderPlus className="h-4 w-4 mr-2" />
              Create Category
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-3">
          {categories.map((category: SetupCategory) => (
            <Card key={category.id} className="p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded-lg flex-shrink-0"
                    style={{ backgroundColor: category.color }}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{category.name}</span>
                      {!category.isActive && (
                        <Badge variant="outline" className="text-xs">Archived</Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                <TooltipProvider>
                  <div className="flex items-center gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={() => onToggleActive(category.id)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          aria-label={category.isActive ? "Archive" : "Activate"}
                        >
                          {category.isActive ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{category.isActive ? 'Archive' : 'Activate'}</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={() => onEdit(category)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          aria-label="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Edit</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={() => onDelete(category.id)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Delete</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TooltipProvider>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function TagCategoriesList({ categories, onCreateNew, onEdit, onDelete, onToggleActive }: any) {
  return (
    <div className="space-y-6">
      <Button onClick={onCreateNew}>
        <FolderPlus className="h-4 w-4 mr-2" />
        New Tag Category
      </Button>
      
      {categories.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-full bg-muted mx-auto flex items-center justify-center">
              <FolderPlus className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-muted-foreground">No tag categories found</h3>
            <p className="text-sm text-muted-foreground">
              Create categories to organize your tags
            </p>
            <Button onClick={onCreateNew} variant="outline" size="sm">
              <FolderPlus className="h-4 w-4 mr-2" />
              Create Category
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-3">
          {categories.map((category: TagCategory) => (
            <Card key={category.id} className="p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: category.color }}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{category.name}</span>
                      {!category.isActive && (
                        <Badge variant="outline" className="text-xs">Archived</Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                <TooltipProvider>
                  <div className="flex items-center gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={() => onToggleActive(category.id)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          aria-label={category.isActive ? "Archive" : "Activate"}
                        >
                          {category.isActive ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{category.isActive ? 'Archive' : 'Activate'}</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={() => onEdit(category)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          aria-label="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Edit</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={() => onDelete(category.id)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Delete</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TooltipProvider>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Dialog components
function SetupDialog({ open, onOpenChange, mode, form, setForm, categories, onSave }: any) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      onSave();
    }
  };

  const selectedCategory = categories.find((c: SetupCategory) => c.id === form.categoryId);
  const isValid = form.name.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Create Setup' : 'Edit Setup'}</DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Add a new trading setup to your library' 
              : 'Update your trading setup'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-[1fr,240px] gap-6 overflow-y-auto pr-2" onKeyDown={handleKeyDown}>
          {/* Left Column - Form Fields */}
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
          
          {/* Right Column - Preview */}
          <div className="space-y-4">
            <div>
              <Label className="text-sm mb-3 block">Preview</Label>
              <Card className="p-4 bg-muted/30">
                <div className="space-y-4">
                  {/* Large Preview */}
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-14 h-14 rounded-lg flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: form.color }}
                    />
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
                        className="w-8 h-8 rounded-md flex-shrink-0"
                        style={{ backgroundColor: form.color }}
                      />
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
                      className="max-w-full"
                      style={{ 
                        backgroundColor: form.color + '20',
                        color: form.color,
                        borderColor: form.color + '40'
                      }}
                    >
                      <span className="truncate">{form.name || 'Setup Name'}</span>
                    </Badge>
                  </div>
                </div>
              </Card>
            </div>
            
            <Card className="p-3 bg-muted/20">
              <div className="space-y-2 text-xs text-muted-foreground">
                <p className="flex items-start gap-2">
                  <span className="text-primary">💡</span>
                  <span>Choose colors that help you quickly identify this setup</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-primary">⌨️</span>
                  <span>Press <kbd className="px-1 py-0.5 text-xs border rounded bg-background">⌘ Enter</kbd> to save</span>
                </p>
              </div>
            </Card>
          </div>
        </div>
        
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onSave} disabled={!isValid}>
            {mode === 'create' ? 'Create Setup' : 'Update Setup'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TagDialog({ open, onOpenChange, mode, form, setForm, categories, onSave }: any) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      onSave();
    }
  };

  const selectedCategory = categories.find((c: TagCategory) => c.id === form.categoryId);
  const isValid = form.name.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Create Tag' : 'Edit Tag'}</DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Add a new tag to organize your trades' 
              : 'Update your tag'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-[1fr,240px] gap-6 overflow-y-auto pr-2" onKeyDown={handleKeyDown}>
          {/* Left Column - Form Fields */}
          <div className="space-y-5">
            <div>
              <Label htmlFor="tag-name" className="text-sm mb-2 block">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="tag-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Tech, Large Cap, High Volume..."
                className={!isValid && form.name ? 'border-destructive' : ''}
                autoFocus
              />
              {!isValid && form.name && (
                <p className="text-xs text-destructive mt-1">Name is required</p>
              )}
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
              {selectedCategory && (
                <p className="text-xs text-muted-foreground mt-1">
                  Category: {selectedCategory.name}
                </p>
              )}
            </div>
            
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
          
          {/* Right Column - Preview */}
          <div className="space-y-4">
            <div>
              <Label className="text-sm mb-3 block">Preview</Label>
              <Card className="p-4 bg-muted/30">
                <div className="space-y-4">
                  {/* Large Preview */}
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: form.color }}
                    />
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
                  
                  {/* Small Preview (as it appears in lists) */}
                  <div className="pt-3 border-t">
                    <p className="text-xs text-muted-foreground mb-2">In lists:</p>
                    <div className="flex items-center gap-2 p-2 rounded-md bg-background">
                      <div 
                        className="w-6 h-6 rounded-md flex-shrink-0"
                        style={{ backgroundColor: form.color }}
                      />
                      <span className="text-sm truncate">
                        {form.name || 'Tag Name'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Badge Preview */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">As badge:</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge 
                        variant="secondary" 
                        className="max-w-full"
                        style={{ 
                          backgroundColor: form.color + '20',
                          color: form.color,
                          borderColor: form.color + '40'
                        }}
                      >
                        <span className="truncate">{form.name || 'Tag Name'}</span>
                      </Badge>
                      <Badge 
                        style={{ 
                          backgroundColor: form.color,
                          color: 'white'
                        }}
                      >
                        <span className="truncate">{form.name || 'Tag Name'}</span>
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
            
            <Card className="p-3 bg-muted/20">
              <div className="space-y-2 text-xs text-muted-foreground">
                <p className="flex items-start gap-2">
                  <span className="text-primary">💡</span>
                  <span>Tags help you filter and analyze trades by attributes</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-primary">⌨️</span>
                  <span>Press <kbd className="px-1 py-0.5 text-xs border rounded bg-background">⌘ Enter</kbd> to save</span>
                </p>
              </div>
            </Card>
          </div>
        </div>
        
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onSave} disabled={!isValid}>
            {mode === 'create' ? 'Create Tag' : 'Update Tag'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SetupCategoryDialog({ open, onOpenChange, mode, form, setForm, onSave }: any) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Create Setup Category' : 'Edit Setup Category'}</DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Create a new category for organizing setups' 
              : 'Update the category'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="cat-name">Name *</Label>
            <Input
              id="cat-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Momentum, Price Action..."
            />
          </div>
          
          <div>
            <Label>Color</Label>
            <div className="flex gap-2 flex-wrap mt-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setForm({ ...form, color })}
                  className={`w-8 h-8 rounded-md transition-all ${
                    form.color === color ? 'ring-2 ring-offset-2 ring-ring scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Select color ${color}`}
                />
              ))}
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onSave}>
            {mode === 'create' ? 'Create' : 'Update'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TagCategoryDialog({ open, onOpenChange, mode, form, setForm, onSave }: any) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Create Tag Category' : 'Edit Tag Category'}</DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Create a new category for organizing tags' 
              : 'Update the category'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="tag-cat-name">Name *</Label>
            <Input
              id="tag-cat-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Sector, Risk Level..."
            />
          </div>
          
          <div>
            <Label>Color</Label>
            <div className="flex gap-2 flex-wrap mt-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setForm({ ...form, color })}
                  className={`w-8 h-8 rounded-md transition-all ${
                    form.color === color ? 'ring-2 ring-offset-2 ring-ring scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Select color ${color}`}
                />
              ))}
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onSave}>
            {mode === 'create' ? 'Create' : 'Update'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ExportDialog({ open, onOpenChange, exportJson, copied, onCopy, onDownload }: any) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Export Setups, Tags & Categories</DialogTitle>
          <DialogDescription>
            Copy or download your customization settings
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Textarea
            value={exportJson}
            readOnly
            rows={12}
            className="font-mono text-xs"
          />
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button variant="outline" onClick={onCopy}>
            {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
            {copied ? 'Copied!' : 'Copy'}
          </Button>
          <Button onClick={onDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CustomImportDialog({ open, onOpenChange, importJson, setImportJson, onImport }: any) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Setups, Tags & Categories</DialogTitle>
          <DialogDescription>
            Paste exported JSON to import setups, tags, and categories
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Textarea
            value={importJson}
            onChange={(e) => setImportJson(e.target.value)}
            placeholder="Paste your exported JSON here..."
            rows={12}
            className="font-mono text-xs"
          />
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onImport} disabled={!importJson.trim()}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
