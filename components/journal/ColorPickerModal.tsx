import { useState, useEffect } from 'react';
import { Palette, Pipette, Hash, Eye, TrendingUp, TrendingDown, DollarSign, Calendar, Tag, Star } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Slider } from './ui/slider';
import { Card } from './ui/card';
import { Badge } from './ui/badge';

interface ColorPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onChange: (color: string) => void;
  title?: string;
  description?: string;
  colorKey?: string; // Key to determine which component preview to show
}

// Predefined color palettes
const COLOR_PALETTES = {
  neutral: [
    '#000000', '#171717', '#262626', '#404040', '#525252', '#737373',
    '#a3a3a3', '#d4d4d4', '#e5e5e5', '#f5f5f5', '#fafafa', '#ffffff',
  ],
  red: [
    '#7f1d1d', '#991b1b', '#b91c1c', '#dc2626', '#ef4444', '#f87171',
    '#fca5a5', '#fecaca', '#fee2e2', '#fef2f2',
  ],
  orange: [
    '#7c2d12', '#9a3412', '#c2410c', '#ea580c', '#f97316', '#fb923c',
    '#fdba74', '#fed7aa', '#ffedd5', '#fff7ed',
  ],
  amber: [
    '#78350f', '#92400e', '#b45309', '#d97706', '#f59e0b', '#fbbf24',
    '#fcd34d', '#fde68a', '#fef3c7', '#fffbeb',
  ],
  yellow: [
    '#713f12', '#854d0e', '#a16207', '#ca8a04', '#eab308', '#facc15',
    '#fde047', '#fef08a', '#fef9c3', '#fefce8',
  ],
  lime: [
    '#365314', '#3f6212', '#4d7c0f', '#65a30d', '#84cc16', '#a3e635',
    '#bef264', '#d9f99d', '#ecfccb', '#f7fee7',
  ],
  green: [
    '#14532d', '#166534', '#15803d', '#16a34a', '#22c55e', '#4ade80',
    '#86efac', '#bbf7d0', '#dcfce7', '#f0fdf4',
  ],
  emerald: [
    '#064e3b', '#065f46', '#047857', '#059669', '#10b981', '#34d399',
    '#6ee7b7', '#a7f3d0', '#d1fae5', '#ecfdf5',
  ],
  teal: [
    '#134e4a', '#115e59', '#0f766e', '#0d9488', '#14b8a6', '#2dd4bf',
    '#5eead4', '#99f6e4', '#ccfbf1', '#f0fdfa',
  ],
  cyan: [
    '#164e63', '#155e75', '#0e7490', '#0891b2', '#06b6d4', '#22d3ee',
    '#67e8f9', '#a5f3fc', '#cffafe', '#ecfeff',
  ],
  sky: [
    '#0c4a6e', '#075985', '#0369a1', '#0284c7', '#0ea5e9', '#38bdf8',
    '#7dd3fc', '#bae6fd', '#e0f2fe', '#f0f9ff',
  ],
  blue: [
    '#1e3a8a', '#1e40af', '#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa',
    '#93c5fd', '#bfdbfe', '#dbeafe', '#eff6ff',
  ],
  indigo: [
    '#312e81', '#3730a3', '#4338ca', '#4f46e5', '#6366f1', '#818cf8',
    '#a5b4fc', '#c7d2fe', '#e0e7ff', '#eef2ff',
  ],
  violet: [
    '#4c1d95', '#5b21b6', '#6d28d9', '#7c3aed', '#8b5cf6', '#a78bfa',
    '#c4b5fd', '#ddd6fe', '#ede9fe', '#f5f3ff',
  ],
  purple: [
    '#581c87', '#6b21a8', '#7e22ce', '#9333ea', '#a855f7', '#c084fc',
    '#d8b4fe', '#e9d5ff', '#f3e8ff', '#faf5ff',
  ],
  fuchsia: [
    '#701a75', '#86198f', '#a21caf', '#c026d3', '#d946ef', '#e879f9',
    '#f0abfc', '#f5d0fe', '#fae8ff', '#fdf4ff',
  ],
  pink: [
    '#831843', '#9f1239', '#be123c', '#e11d48', '#f43f5e', '#fb7185',
    '#fda4af', '#fecdd3', '#fce7f3', '#fdf2f8',
  ],
  rose: [
    '#881337', '#9f1239', '#be123c', '#e11d48', '#f43f5e', '#fb7185',
    '#fda4af', '#fecdd3', '#fce7f3', '#fff1f2',
  ],
};

// Convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

// Convert RGB to hex
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

// Convert hex to HSL
function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;

  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

// Convert HSL to hex
function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (0 <= h && h < 60) {
    r = c; g = x; b = 0;
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0;
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x;
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c;
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c;
  } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x;
  }

  const rHex = Math.round((r + m) * 255);
  const gHex = Math.round((g + m) * 255);
  const bHex = Math.round((b + m) * 255);

  return rgbToHex(rHex, gHex, bHex);
}

// Live preview components based on the color key being edited
function LivePreview({ colorKey, color }: { colorKey?: string; color: string }) {
  if (!colorKey) return null;

  // Apply color to CSS variable temporarily for preview
  const applyPreviewColor = (varName: string) => {
    const style: React.CSSProperties = {};
    style[`--preview-${varName}` as any] = color;
    return style;
  };

  // Determine which components to preview based on the color key
  if (colorKey === 'card' || colorKey === 'cardForeground') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-border/50">
          <Eye className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm uppercase tracking-wide">Live Preview</Label>
        </div>
        <div className="grid gap-3">
          <Card 
            className="p-4" 
            style={{ 
              backgroundColor: colorKey === 'card' ? color : undefined,
              color: colorKey === 'cardForeground' ? color : undefined
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm">Total P&L</span>
              <TrendingUp className="h-4 w-4" />
            </div>
            <div className="text-2xl">$12,450.00</div>
            <p className="text-xs mt-1 opacity-70">+15.3% this month</p>
          </Card>
          
          <Card 
            className="p-4"
            style={{ 
              backgroundColor: colorKey === 'card' ? color : undefined,
              color: colorKey === 'cardForeground' ? color : undefined
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm">Win Rate</span>
              <Star className="h-4 w-4" />
            </div>
            <div className="text-2xl">68.5%</div>
            <p className="text-xs mt-1 opacity-70">32 wins / 15 losses</p>
          </Card>
        </div>
      </div>
    );
  }

  if (colorKey === 'primary' || colorKey === 'primaryForeground') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-border/50">
          <Eye className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm uppercase tracking-wide">Live Preview</Label>
        </div>
        <div className="space-y-2">
          <Button 
            className="w-full"
            style={{
              backgroundColor: colorKey === 'primary' ? color : undefined,
              color: colorKey === 'primaryForeground' ? color : undefined
            }}
          >
            Add New Trade
          </Button>
          <Button 
            className="w-full"
            style={{
              backgroundColor: colorKey === 'primary' ? color : undefined,
              color: colorKey === 'primaryForeground' ? color : undefined
            }}
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Calculate P&L
          </Button>
        </div>
      </div>
    );
  }

  if (colorKey === 'accent' || colorKey === 'accentForeground') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-border/50">
          <Eye className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm uppercase tracking-wide">Live Preview</Label>
        </div>
        <Card className="p-4">
          <div 
            className="p-3 rounded-md mb-3"
            style={{
              backgroundColor: colorKey === 'accent' ? color : undefined,
              color: colorKey === 'accentForeground' ? color : undefined
            }}
          >
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">Selected Date: Jan 15, 2025</span>
            </div>
          </div>
          <div 
            className="p-3 rounded-md"
            style={{
              backgroundColor: colorKey === 'accent' ? color : undefined,
              color: colorKey === 'accentForeground' ? color : undefined
            }}
          >
            <span className="text-sm">Active Trading Session</span>
          </div>
        </Card>
      </div>
    );
  }

  if (colorKey === 'success' || colorKey === 'successForeground') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-border/50">
          <Eye className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm uppercase tracking-wide">Live Preview</Label>
        </div>
        <div className="space-y-2">
          <Badge 
            style={{
              backgroundColor: colorKey === 'success' ? color : undefined,
              color: colorKey === 'successForeground' ? color : undefined
            }}
          >
            <TrendingUp className="h-3 w-3 mr-1" />
            Win +$450.00
          </Badge>
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Winning Trade</span>
              <span 
                className="text-sm"
                style={{ color: colorKey === 'success' ? color : undefined }}
              >
                +$450.00
              </span>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (colorKey === 'destructive' || colorKey === 'destructiveForeground') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-border/50">
          <Eye className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm uppercase tracking-wide">Live Preview</Label>
        </div>
        <div className="space-y-2">
          <Badge 
            style={{
              backgroundColor: colorKey === 'destructive' ? color : undefined,
              color: colorKey === 'destructiveForeground' ? color : undefined
            }}
          >
            <TrendingDown className="h-3 w-3 mr-1" />
            Loss -$280.00
          </Badge>
          <Button 
            variant="destructive"
            className="w-full"
            style={{
              backgroundColor: colorKey === 'destructive' ? color : undefined,
              color: colorKey === 'destructiveForeground' ? color : undefined
            }}
          >
            Delete Trade
          </Button>
        </div>
      </div>
    );
  }

  if (colorKey.startsWith('chart')) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-border/50">
          <Eye className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm uppercase tracking-wide">Live Preview</Label>
        </div>
        <Card className="p-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div 
                className="h-8 w-8 rounded"
                style={{ backgroundColor: color }}
              />
              <span className="text-sm">Chart Data Series</span>
            </div>
            <div className="h-2 rounded-full" style={{ backgroundColor: color }} />
            <div className="flex gap-1">
              {[0.8, 0.6, 1, 0.4, 0.7, 0.9, 0.5].map((height, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm"
                  style={{ 
                    backgroundColor: color,
                    height: `${height * 40}px`,
                    opacity: 0.6 + (height * 0.4)
                  }}
                />
              ))}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Default preview for other colors
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-border/50">
        <Eye className="h-4 w-4 text-muted-foreground" />
        <Label className="text-sm uppercase tracking-wide">Live Preview</Label>
      </div>
      <Card className="p-4" style={{ borderColor: color }}>
        <div className="space-y-3">
          <div 
            className="h-12 rounded-md"
            style={{ backgroundColor: color }}
          />
          <div className="flex gap-2">
            <div 
              className="h-8 flex-1 rounded"
              style={{ backgroundColor: color, opacity: 0.8 }}
            />
            <div 
              className="h-8 flex-1 rounded"
              style={{ backgroundColor: color, opacity: 0.6 }}
            />
            <div 
              className="h-8 flex-1 rounded"
              style={{ backgroundColor: color, opacity: 0.4 }}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}

export function ColorPickerModal({
  open,
  onOpenChange,
  value,
  onChange,
  title = 'Pick a Color',
  description = 'Choose from palettes or enter a custom color',
  colorKey,
}: ColorPickerModalProps) {
  const [hexInput, setHexInput] = useState(value || '#000000');
  const [rgb, setRgb] = useState(hexToRgb(value || '#000000') || { r: 0, g: 0, b: 0 });
  const [hsl, setHsl] = useState(hexToHsl(value || '#000000') || { h: 0, s: 0, l: 0 });
  const [recentColors, setRecentColors] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('recentColors');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (value && value !== hexInput) {
      setHexInput(value);
      const newRgb = hexToRgb(value);
      const newHsl = hexToHsl(value);
      if (newRgb) setRgb(newRgb);
      if (newHsl) setHsl(newHsl);
    }
  }, [value]);

  const handleColorSelect = (color: string) => {
    setHexInput(color);
    const newRgb = hexToRgb(color);
    const newHsl = hexToHsl(color);
    if (newRgb) setRgb(newRgb);
    if (newHsl) setHsl(newHsl);
    onChange(color);
    
    // Add to recent colors
    const updated = [color, ...recentColors.filter(c => c !== color)].slice(0, 12);
    setRecentColors(updated);
    localStorage.setItem('recentColors', JSON.stringify(updated));
  };

  const handleHexChange = (hex: string) => {
    setHexInput(hex);
    if (/^#[0-9A-F]{6}$/i.test(hex)) {
      const newRgb = hexToRgb(hex);
      const newHsl = hexToHsl(hex);
      if (newRgb) setRgb(newRgb);
      if (newHsl) setHsl(newHsl);
      onChange(hex);
    }
  };

  const handleRgbChange = (channel: 'r' | 'g' | 'b', value: number) => {
    const newRgb = { ...rgb, [channel]: value };
    setRgb(newRgb);
    const hex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    setHexInput(hex);
    const newHsl = hexToHsl(hex);
    if (newHsl) setHsl(newHsl);
    onChange(hex);
  };

  const handleHslChange = (channel: 'h' | 's' | 'l', value: number) => {
    const newHsl = { ...hsl, [channel]: value };
    setHsl(newHsl);
    const hex = hslToHex(newHsl.h, newHsl.s, newHsl.l);
    setHexInput(hex);
    const newRgb = hexToRgb(hex);
    if (newRgb) setRgb(newRgb);
    onChange(hex);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0 flex flex-col gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 min-h-0">
          {/* Left side - Color Picker */}
          <div className="flex-[3] flex flex-col px-6 py-6 overflow-hidden border-r border-border">
            {/* Color Preview */}
            <div className="flex items-center gap-4 mb-6 flex-shrink-0 p-4 bg-muted/30 rounded-lg border border-border/50">
              <div
                className="h-24 w-24 flex-shrink-0 rounded-lg border-2 border-border shadow-lg"
                style={{ backgroundColor: hexInput }}
              />
              <div className="flex-1 space-y-2">
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Current Color</Label>
                  <p className="font-mono text-lg mt-0.5">{hexInput.toUpperCase()}</p>
                </div>
                <div className="flex gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">RGB:</span>
                    <span className="font-mono font-medium">{rgb.r}, {rgb.g}, {rgb.b}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">HSL:</span>
                    <span className="font-mono font-medium">{hsl.h}°, {hsl.s}%, {hsl.l}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs for different input methods */}
            <Tabs defaultValue="palettes" className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
                <TabsTrigger value="palettes" className="text-sm">
                  <Palette className="h-3.5 w-3.5 mr-1.5" />
                  Palettes
                </TabsTrigger>
                <TabsTrigger value="sliders" className="text-sm">
                  <Pipette className="h-3.5 w-3.5 mr-1.5" />
                  Sliders
                </TabsTrigger>
                <TabsTrigger value="hex" className="text-sm">
                  <Hash className="h-3.5 w-3.5 mr-1.5" />
                  Hex
                </TabsTrigger>
              </TabsList>

              {/* Palettes Tab */}
              <TabsContent value="palettes" className="flex-1 overflow-y-auto mt-0 pt-5 space-y-5 pr-2">
                {recentColors.length > 0 && (
                  <div className="space-y-2.5">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Recent Colors</Label>
                    <div className="grid grid-cols-8 gap-2">
                      {recentColors.map((color, index) => (
                        <button
                          key={`${color}-${index}`}
                          onClick={() => handleColorSelect(color)}
                          className="aspect-square rounded-lg border-2 border-border hover:border-ring transition-all hover:scale-110 hover:shadow-md relative group"
                          style={{ backgroundColor: color }}
                          title={color}
                        >
                          <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/75 backdrop-blur-sm rounded-lg text-white text-[10px] font-mono transition-all">
                            {color.slice(0, 7)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-5">
                  {Object.entries(COLOR_PALETTES).map(([name, colors]) => (
                    <div key={name} className="space-y-2.5">
                      <Label className="text-xs text-muted-foreground capitalize uppercase tracking-wide">
                        {name}
                      </Label>
                      <div className="grid grid-cols-8 gap-2">
                        {colors.map((color) => (
                          <button
                            key={color}
                            onClick={() => handleColorSelect(color)}
                            className="aspect-square rounded-lg border-2 border-border hover:border-ring transition-all hover:scale-110 hover:shadow-md relative group"
                            style={{ backgroundColor: color }}
                            title={color}
                          >
                            <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/75 backdrop-blur-sm rounded-lg text-white text-[10px] font-mono transition-all">
                              {color.slice(0, 7)}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Sliders Tab */}
              <TabsContent value="sliders" className="flex-1 overflow-y-auto mt-0 pt-5 space-y-6 pr-2">
                {/* RGB Sliders */}
                <div className="space-y-3">
                  <Label className="text-sm uppercase tracking-wide">RGB</Label>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-muted-foreground">Red</Label>
                        <span className="text-xs font-mono">{rgb.r}</span>
                      </div>
                      <Slider
                        value={[rgb.r]}
                        onValueChange={([value]) => handleRgbChange('r', value)}
                        max={255}
                        step={1}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-muted-foreground">Green</Label>
                        <span className="text-xs font-mono">{rgb.g}</span>
                      </div>
                      <Slider
                        value={[rgb.g]}
                        onValueChange={([value]) => handleRgbChange('g', value)}
                        max={255}
                        step={1}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-muted-foreground">Blue</Label>
                        <span className="text-xs font-mono">{rgb.b}</span>
                      </div>
                      <Slider
                        value={[rgb.b]}
                        onValueChange={([value]) => handleRgbChange('b', value)}
                        max={255}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* HSL Sliders */}
                <div className="space-y-3">
                  <Label className="text-sm uppercase tracking-wide">HSL</Label>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-muted-foreground">Hue</Label>
                        <span className="text-xs font-mono">{hsl.h}°</span>
                      </div>
                      <Slider
                        value={[hsl.h]}
                        onValueChange={([value]) => handleHslChange('h', value)}
                        max={360}
                        step={1}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-muted-foreground">Saturation</Label>
                        <span className="text-xs font-mono">{hsl.s}%</span>
                      </div>
                      <Slider
                        value={[hsl.s]}
                        onValueChange={([value]) => handleHslChange('s', value)}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-muted-foreground">Lightness</Label>
                        <span className="text-xs font-mono">{hsl.l}%</span>
                      </div>
                      <Slider
                        value={[hsl.l]}
                        onValueChange={([value]) => handleHslChange('l', value)}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Hex Input Tab */}
              <TabsContent value="hex" className="flex-1 overflow-y-auto mt-0 pt-5 space-y-5 pr-2">
                <div className="space-y-2">
                  <Label className="uppercase tracking-wide">Hex Color</Label>
                  <Input
                    value={hexInput}
                    onChange={(e) => handleHexChange(e.target.value.toUpperCase())}
                    placeholder="#000000"
                    className="font-mono"
                    maxLength={7}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter a 6-digit hex color code (e.g., #FF5733)
                  </p>
                </div>

                {/* Color format info */}
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">HEX</span>
                    <span className="text-xs font-mono">{hexInput.toUpperCase()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">RGB</span>
                    <span className="text-xs font-mono">
                      rgb({rgb.r}, {rgb.g}, {rgb.b})
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">HSL</span>
                    <span className="text-xs font-mono">
                      hsl({hsl.h}°, {hsl.s}%, {hsl.l}%)
                    </span>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right side - Live Preview */}
          <div className="flex-[2] flex flex-col bg-muted/20 overflow-hidden">
            <div className="px-6 py-6 overflow-y-auto">
              <div className="sticky top-0">
                <LivePreview colorKey={colorKey} color={hexInput} />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
