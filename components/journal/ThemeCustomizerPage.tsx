import { useState, useEffect } from 'react';
import { RefreshCw, Download, Upload, Palette, Sun, Moon, Copy, Check, Pipette } from 'lucide-react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Textarea } from './ui/textarea';
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

interface ThemeCustomizerPageProps {
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
    description: 'Sidebar navigation colors',
    colors: [
      { key: 'sidebar', label: 'Sidebar Background' },
      { key: 'sidebarForeground', label: 'Sidebar Text' },
      { key: 'sidebarPrimary', label: 'Sidebar Primary' },
      { key: 'sidebarPrimaryForeground', label: 'Sidebar Primary Text' },
      { key: 'sidebarAccent', label: 'Sidebar Accent' },
      { key: 'sidebarAccentForeground', label: 'Sidebar Accent Text' },
      { key: 'sidebarBorder', label: 'Sidebar Border' },
      { key: 'sidebarRing', label: 'Sidebar Focus' },
    ],
  },
];

export function ThemeCustomizerPage({ theme }: ThemeCustomizerPageProps) {
  const [customization, setCustomization] = useState<ThemeCustomization>(loadThemeCustomization());
  const [previewMode, setPreviewMode] = useState<'light' | 'dark'>(theme === 'dark' ? 'dark' : 'light');
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [exportJson, setExportJson] = useState('');
  const [importJson, setImportJson] = useState('');
  const [copied, setCopied] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [selectedColorKey, setSelectedColorKey] = useState<keyof CustomThemeColors | null>(null);
  const [selectedColorLabel, setSelectedColorLabel] = useState<string>('');
  
  // Apply theme colors on mount and when customization changes
  useEffect(() => {
    const colors = previewMode === 'dark' ? customization.dark : customization.light;
    applyThemeColors(colors, previewMode === 'dark');
  }, [customization, previewMode]);
  
  const handleColorChange = (key: keyof CustomThemeColors, value: string) => {
    const newCustomization = { ...customization };
    if (previewMode === 'dark') {
      newCustomization.dark = { ...newCustomization.dark, [key]: value };
    } else {
      newCustomization.light = { ...newCustomization.light, [key]: value };
    }
    setCustomization(newCustomization);
    saveThemeCustomization(newCustomization);
    
    // Apply immediately for live preview
    const colors = previewMode === 'dark' ? newCustomization.dark : newCustomization.light;
    applyThemeColors(colors, previewMode === 'dark');
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
    const defaultCustomization = {
      light: { ...DEFAULT_LIGHT_COLORS },
      dark: { ...DEFAULT_DARK_COLORS },
    };
    setCustomization(defaultCustomization);
    saveThemeCustomization(defaultCustomization);
    
    // Apply default colors
    const colors = previewMode === 'dark' ? defaultCustomization.dark : defaultCustomization.light;
    applyThemeColors(colors, previewMode === 'dark');
    
    toast.success('Theme reset to defaults');
  };
  
  const handleExport = () => {
    const json = exportTheme(customization);
    setExportJson(json);
    setExportDialogOpen(true);
  };
  
  const handleCopyExport = () => {
    navigator.clipboard.writeText(exportJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Theme copied to clipboard');
  };
  
  const handleImport = () => {
    const imported = importTheme(importJson);
    if (imported) {
      setCustomization(imported);
      saveThemeCustomization(imported);
      
      // Apply imported colors
      const colors = previewMode === 'dark' ? imported.dark : imported.light;
      applyThemeColors(colors, previewMode === 'dark');
      
      toast.success('Theme imported successfully');
      setImportDialogOpen(false);
      setImportJson('');
    } else {
      toast.error('Invalid theme JSON');
    }
  };
  
  const currentColors = previewMode === 'dark' ? customization.dark : customization.light;
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Palette className="h-5 w-5" />
          <div>
            <h2 className="text-xl">Theme Customizer</h2>
            <p className="text-sm text-muted-foreground">
              Customize all colors and appearance
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setPreviewMode(previewMode === 'dark' ? 'light' : 'dark')}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            {previewMode === 'dark' ? (
              <>
                <Moon className="h-4 w-4" />
                Dark Preview
              </>
            ) : (
              <>
                <Sun className="h-4 w-4" />
                Light Preview
              </>
            )}
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Button
            onClick={() => setImportDialogOpen(true)}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            Import
          </Button>
          <Button
            onClick={handleExport}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Reset to Default
          </Button>
        </div>
      </div>
      
      {/* Content */}
      {COLOR_SECTIONS.map((section) => (
        <Card key={section.title} className="p-6">
          <div className="mb-5">
            <h3 className="text-lg mb-1">{section.title}</h3>
            <p className="text-sm text-muted-foreground">{section.description}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {section.colors.map((color) => {
              const value = currentColors[color.key] || '';
              
              return (
                <div key={color.key} className="space-y-2">
                  <Label htmlFor={`color-${color.key}`} className="text-sm">
                    {color.label}
                    {color.description && (
                      <span className="text-xs text-muted-foreground ml-2">
                        {color.description}
                      </span>
                    )}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id={`color-${color.key}`}
                      type="text"
                      value={value}
                      onChange={(e) => handleColorChange(color.key, e.target.value)}
                      placeholder="#000000"
                      className="flex-1 font-mono"
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
      
      {/* Preview Card */}
      <Card className="p-6">
        <h3 className="text-lg mb-4">Preview</h3>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button>Primary Button</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
          </div>
          
          <div className="flex gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
          </div>
          
          <Card className="p-4">
            <h4 className="mb-2">Card Example</h4>
            <p className="text-sm text-muted-foreground">
              This is how cards will look with your custom theme colors.
            </p>
          </Card>
          
          <div className="space-y-2">
            <Label>Input Example</Label>
            <Input placeholder="Type something..." />
          </div>
        </div>
      </Card>
      
      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Export Theme</DialogTitle>
            <DialogDescription>
              Copy this JSON to share your theme or import it later
            </DialogDescription>
          </DialogHeader>
          
          <Textarea
            value={exportJson}
            readOnly
            className="font-mono text-xs h-96"
          />
          
          <DialogFooter>
            <Button onClick={() => setExportDialogOpen(false)} variant="outline">
              Close
            </Button>
            <Button onClick={handleCopyExport} className="gap-2">
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy to Clipboard
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Theme</DialogTitle>
            <DialogDescription>
              Paste theme JSON to import custom colors
            </DialogDescription>
          </DialogHeader>
          
          <Textarea
            value={importJson}
            onChange={(e) => setImportJson(e.target.value)}
            placeholder="Paste theme JSON here..."
            className="font-mono text-xs h-96"
          />
          
          <DialogFooter>
            <Button onClick={() => setImportDialogOpen(false)} variant="outline">
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={!importJson.trim()}>
              Import Theme
            </Button>
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
          description={`Choose a color for ${selectedColorLabel.toLowerCase()} in ${previewMode} mode`}
          colorKey={selectedColorKey}
        />
      )}
    </div>
  );
}
