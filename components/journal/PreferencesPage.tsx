import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, Download, Upload, Copy, Check, Eye, EyeOff, LayoutDashboard, Target, Calendar, BarChart3, TrendingUp, Sparkles, Pipette } from 'lucide-react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import { Theme } from '@/lib/journal/theme';
import { ColorPickerModal } from './ColorPickerModal';
import {
  loadThemeCustomization,
  saveThemeCustomization,
  resetThemeCustomization,
  applyThemeColors,
  exportTheme,
  importTheme,
  DEFAULT_LIGHT_COLORS,
  DEFAULT_DARK_COLORS,
  type ThemeCustomization,
  type CustomThemeColors,
} from '@/lib/journal/themeCustomization';
import {
  loadPageFeatures,
  savePageFeatures,
  resetPageFeatures,
  loadGlobalSettings,
  saveGlobalSettings,
  resetGlobalSettings,
  FEATURE_LABELS,
  PAGE_LABELS,
  type PageFeatures,
  type GlobalSettings,
} from '@/lib/journal/pagePreferences';

interface PreferencesPageProps {
  theme: Theme;
}

type ColorSection = {
  title: string;
  description: string;
  colors: {
    key: keyof CustomThemeColors;
    label: string;
    description?: string;
  }[];
};

const COLOR_SECTIONS: ColorSection[] = [
  {
    title: 'Background & Surface',
    description: 'Main background colors and surface elements',
    colors: [
      { key: 'background', label: 'Background', description: 'Main app background' },
      { key: 'foreground', label: 'Foreground', description: 'Main text color' },
      { key: 'card', label: 'Card', description: 'Card background' },
      { key: 'cardForeground', label: 'Card Text', description: 'Text on cards' },
      { key: 'popover', label: 'Popover', description: 'Dropdown background' },
      { key: 'popoverForeground', label: 'Popover Text', description: 'Dropdown text' },
    ],
  },
  {
    title: 'Actions & Interaction',
    description: 'Button and interactive element colors',
    colors: [
      { key: 'primary', label: 'Primary', description: 'Main action color' },
      { key: 'primaryForeground', label: 'Primary Text' },
      { key: 'secondary', label: 'Secondary', description: 'Secondary action color' },
      { key: 'secondaryForeground', label: 'Secondary Text' },
      { key: 'accent', label: 'Accent', description: 'Hover and focus states' },
      { key: 'accentForeground', label: 'Accent Text' },
      { key: 'muted', label: 'Muted', description: 'Disabled elements' },
      { key: 'mutedForeground', label: 'Muted Text' },
    ],
  },
  {
    title: 'Borders & Inputs',
    description: 'Border colors and form elements',
    colors: [
      { key: 'border', label: 'Border', description: 'Default border color' },
      { key: 'input', label: 'Input', description: 'Input border color' },
      { key: 'inputBackground', label: 'Input Background' },
      { key: 'ring', label: 'Focus Ring', description: 'Focus outline color' },
    ],
  },
  {
    title: 'Semantic Colors',
    description: 'Status and notification colors',
    colors: [
      { key: 'destructive', label: 'Destructive', description: 'Error/delete actions' },
      { key: 'destructiveForeground', label: 'Destructive Text' },
      { key: 'success', label: 'Success', description: 'Positive outcomes' },
      { key: 'successForeground', label: 'Success Text' },
      { key: 'warning', label: 'Warning', description: 'Warning messages' },
      { key: 'warningForeground', label: 'Warning Text' },
      { key: 'info', label: 'Info', description: 'Informational messages' },
      { key: 'infoForeground', label: 'Info Text' },
    ],
  },
  {
    title: 'Charts',
    description: 'Chart and data visualization colors',
    colors: [
      { key: 'chart1', label: 'Chart Color 1' },
      { key: 'chart2', label: 'Chart Color 2' },
      { key: 'chart3', label: 'Chart Color 3' },
      { key: 'chart4', label: 'Chart Color 4' },
      { key: 'chart5', label: 'Chart Color 5' },
    ],
  },
  {
    title: 'Sidebar',
    description: 'Sidebar specific colors',
    colors: [
      { key: 'sidebarBackground', label: 'Sidebar Background' },
      { key: 'sidebarForeground', label: 'Sidebar Text' },
      { key: 'sidebarPrimary', label: 'Sidebar Primary' },
      { key: 'sidebarPrimaryForeground', label: 'Sidebar Primary Text' },
      { key: 'sidebarAccent', label: 'Sidebar Accent' },
      { key: 'sidebarAccentForeground', label: 'Sidebar Accent Text' },
      { key: 'sidebarBorder', label: 'Sidebar Border' },
    ],
  },
];

const PAGE_ICONS: Record<keyof PageFeatures, typeof LayoutDashboard> = {
  home: LayoutDashboard,
  benchmarks: Target,
  trades: Calendar,
  analytics: BarChart3,
  projections: TrendingUp,
};

export function PreferencesPage({ theme }: PreferencesPageProps) {
  const router = useRouter();
  const [themeCustomization, setThemeCustomization] = useState<ThemeCustomization | null>(null);
  const [currentColors, setCurrentColors] = useState<CustomThemeColors>(
    theme === 'light' ? DEFAULT_LIGHT_COLORS : DEFAULT_DARK_COLORS
  );
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [exportJson, setExportJson] = useState('');
  const [importJson, setImportJson] = useState('');
  const [copied, setCopied] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [selectedColorKey, setSelectedColorKey] = useState<keyof CustomThemeColors | null>(null);
  const [selectedColorLabel, setSelectedColorLabel] = useState<string>('');

  // Page features state
  const [pageFeatures, setPageFeatures] = useState<PageFeatures>(loadPageFeatures());
  const [selectedPage, setSelectedPage] = useState<keyof PageFeatures>('home');
  
  // Global settings state
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>(loadGlobalSettings());

  // Load theme customization on mount
  useEffect(() => {
    const customization = loadThemeCustomization();
    setThemeCustomization(customization);
    
    if (customization.enabled) {
      setCurrentColors(customization.colors[theme]);
    } else {
      setCurrentColors(theme === 'light' ? DEFAULT_LIGHT_COLORS : DEFAULT_DARK_COLORS);
    }
  }, [theme]);

  const handleColorChange = (key: keyof CustomThemeColors, value: string) => {
    const newColors = { ...currentColors, [key]: value };
    setCurrentColors(newColors);

    if (themeCustomization) {
      const updated: ThemeCustomization = {
        ...themeCustomization,
        colors: {
          ...themeCustomization.colors,
          [theme]: newColors,
        },
      };
      setThemeCustomization(updated);
      saveThemeCustomization(updated);
      applyThemeColors(newColors);
      toast.success('Color updated');
    }
  };

  const openColorPicker = (key: keyof CustomThemeColors, label: string) => {
    setSelectedColorKey(key);
    setSelectedColorLabel(label);
    setColorPickerOpen(true);
  };

  const handleColorPickerChange = (color: string) => {
    if (selectedColorKey) {
      handleColorChange(selectedColorKey, color);
    }
  };

  const handleReset = () => {
    const defaultColors = theme === 'light' ? DEFAULT_LIGHT_COLORS : DEFAULT_DARK_COLORS;
    setCurrentColors(defaultColors);
    
    const updated: ThemeCustomization = {
      enabled: true,
      colors: {
        light: theme === 'light' ? defaultColors : themeCustomization?.colors.light || DEFAULT_LIGHT_COLORS,
        dark: theme === 'dark' ? defaultColors : themeCustomization?.colors.dark || DEFAULT_DARK_COLORS,
      },
    };
    
    setThemeCustomization(updated);
    saveThemeCustomization(updated);
    applyThemeColors(defaultColors);
    toast.success('Theme reset to defaults');
  };

  const handleExport = () => {
    if (!themeCustomization) return;
    const json = exportTheme(themeCustomization);
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
    a.download = `trading-journal-theme-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Theme exported');
  };

  const handleImport = () => {
    try {
      const imported = importTheme(importJson);
      setThemeCustomization(imported);
      saveThemeCustomization(imported);
      setCurrentColors(imported.colors[theme]);
      applyThemeColors(imported.colors[theme]);
      setImportDialogOpen(false);
      setImportJson('');
      toast.success('Theme imported successfully');
    } catch (e) {
      toast.error('Failed to import theme. Please check the format.');
    }
  };

  // Global settings handlers
  const handleGlobalSettingToggle = (key: keyof GlobalSettings) => {
    const updated = {
      ...globalSettings,
      [key]: !globalSettings[key],
    };
    setGlobalSettings(updated);
    saveGlobalSettings(updated);
    toast.success('Setting updated');
    
    // Trigger a soft refresh to apply the change
    setTimeout(() => {
      router.refresh();
    }, 300);
  };

  // Page feature handlers
  const handleFeatureToggle = (page: keyof PageFeatures, feature: string) => {
    const updated = {
      ...pageFeatures,
      [page]: {
        ...pageFeatures[page],
        [feature]: !pageFeatures[page][feature as keyof typeof pageFeatures[typeof page]],
      },
    };
    setPageFeatures(updated);
    savePageFeatures(updated);
    toast.success('Feature visibility updated');
  };

  const handleResetFeatures = () => {
    const defaults = resetPageFeatures();
    setPageFeatures(defaults);
    toast.success('All features reset to defaults');
  };

  const handleResetAllSettings = () => {
    const defaultGlobal = resetGlobalSettings();
    const defaultFeatures = resetPageFeatures();
    setGlobalSettings(defaultGlobal);
    setPageFeatures(defaultFeatures);
    toast.success('All settings reset to defaults');
    
    setTimeout(() => {
      router.refresh();
    }, 300);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="mb-2">Preferences</h1>
        <p className="text-muted-foreground">
          Customize your theme colors and control which features are visible on each page
        </p>
      </div>

      <Tabs defaultValue="features" className="space-y-6">
        <TabsList>
          <TabsTrigger value="features">Page Features</TabsTrigger>
          <TabsTrigger value="theme">Theme Colors</TabsTrigger>
        </TabsList>

        {/* Page Features Tab */}
        <TabsContent value="features" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="mb-1">Visibility Settings</h2>
              <p className="text-sm text-muted-foreground">
                Show or hide specific features on each page
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleResetFeatures}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset Features
              </Button>
              <Button variant="outline" size="sm" onClick={handleResetAllSettings}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset All
              </Button>
            </div>
          </div>

          {/* Global Settings */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3>Global Settings</h3>
            </div>
            <Separator className="mb-4" />
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  {globalSettings.showHeroSections ? (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  )}
                  <div>
                    <Label htmlFor="show-hero-sections" className="cursor-pointer">
                      Show Hero Sections
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Display decorative hero sections at the top of each page. When disabled, pages will show simple text headers instead.
                    </p>
                  </div>
                </div>
                <Switch
                  id="show-hero-sections"
                  checked={globalSettings.showHeroSections}
                  onCheckedChange={() => handleGlobalSettingToggle('showHeroSections')}
                />
              </div>
            </div>
          </Card>

          {/* Page Selector */}
          <Card className="p-4">
            <Label className="mb-3 block">Select Page</Label>
            <Select value={selectedPage} onValueChange={(value) => setSelectedPage(value as keyof PageFeatures)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(PAGE_LABELS) as Array<keyof PageFeatures>).map((page) => {
                  const Icon = PAGE_ICONS[page];
                  return (
                    <SelectItem key={page} value={page}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {PAGE_LABELS[page]}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </Card>

          {/* Feature Toggles */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              {(() => {
                const Icon = PAGE_ICONS[selectedPage];
                return <Icon className="h-5 w-5" />;
              })()}
              <h3>{PAGE_LABELS[selectedPage]} Features</h3>
            </div>
            <Separator className="mb-4" />
            <div className="space-y-4">
              {Object.entries(pageFeatures[selectedPage]).map(([feature, enabled]) => (
                <div key={feature} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    {enabled ? (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div>
                      <Label htmlFor={`feature-${feature}`} className="cursor-pointer">
                        {FEATURE_LABELS[selectedPage][feature] || feature}
                      </Label>
                      {!enabled && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          Hidden
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Switch
                    id={`feature-${feature}`}
                    checked={enabled}
                    onCheckedChange={() => handleFeatureToggle(selectedPage, feature)}
                  />
                </div>
              ))}
            </div>
          </Card>

          <div className="p-4 bg-muted/50 rounded-lg border border-border">
            <p className="text-sm text-muted-foreground">
              💡 <strong>Tip:</strong> Hidden features won't appear on their respective pages, giving you a cleaner, more focused interface tailored to your workflow. Changes apply immediately.
            </p>
          </div>
        </TabsContent>

        {/* Theme Colors Tab */}
        <TabsContent value="theme" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="mb-1">Theme Colors</h2>
              <p className="text-sm text-muted-foreground">
                Customize colors for {theme === 'light' ? 'light' : 'dark'} mode
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button variant="outline" size="sm" onClick={() => setImportDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          <div className="grid gap-6">
            {COLOR_SECTIONS.map((section) => (
              <Card key={section.title} className="p-6">
                <div className="mb-4">
                  <h3 className="mb-1">{section.title}</h3>
                  <p className="text-sm text-muted-foreground">{section.description}</p>
                </div>
                <Separator className="mb-4" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {section.colors.map((color) => {
                    const value = currentColors[color.key] || '#000000';
                    
                    return (
                      <div key={color.key} className="space-y-2">
                        <Label htmlFor={color.key} className="text-sm">
                          {color.label}
                          {color.description && (
                            <span className="text-muted-foreground ml-2 text-xs">
                              {color.description}
                            </span>
                          )}
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            type="text"
                            value={value}
                            onChange={(e) => handleColorChange(color.key, e.target.value)}
                            className="flex-1 font-mono text-sm"
                            autoComplete="off"
                            data-lpignore="true"
                            data-form-type="other"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              openColorPicker(color.key, color.label);
                            }}
                            className="flex-shrink-0 h-10 w-10 rounded border-2 border-border hover:border-ring transition-all hover:scale-105 shadow-sm cursor-pointer"
                            style={{ backgroundColor: value.startsWith('#') ? value : '#000000' }}
                            title="Open color picker"
                          >
                            <Pipette className="h-4 w-4 mx-auto text-white drop-shadow-sm" style={{ 
                              filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5))',
                              mixBlendMode: 'difference'
                            }} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            ))}
          </div>

          <div className="p-4 bg-muted/50 rounded-lg border border-border">
            <p className="text-sm text-muted-foreground">
              💡 <strong>Tip:</strong> Theme colors are saved separately for light and dark modes. Switch themes to customize each mode independently.
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Export Theme</DialogTitle>
            <DialogDescription>
              Copy the theme configuration below or download it as a JSON file
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={exportJson}
              readOnly
              className="font-mono text-xs h-64"
            />
            <div className="flex gap-2">
              <Button onClick={handleCopyExport} variant="outline" className="flex-1">
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy to Clipboard
                  </>
                )}
              </Button>
              <Button onClick={handleDownloadExport} variant="outline" className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Download JSON
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Theme</DialogTitle>
            <DialogDescription>
              Paste a theme configuration JSON below to import it
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              placeholder="Paste theme JSON here..."
              className="font-mono text-xs h-64"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleImport}>Import Theme</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Color Picker Modal */}
      {selectedColorKey && (
        <ColorPickerModal
          open={colorPickerOpen}
          onOpenChange={setColorPickerOpen}
          value={currentColors[selectedColorKey] || '#000000'}
          onChange={handleColorPickerChange}
          title={`Pick ${selectedColorLabel} Color`}
          description={`Choose a color for ${selectedColorLabel.toLowerCase()} in ${theme} mode`}
          colorKey={selectedColorKey}
        />
      )}
    </div>
  );
}
