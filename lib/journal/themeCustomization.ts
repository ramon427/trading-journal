export interface CustomThemeColors {
  // Background & Surface
  background?: string;
  foreground?: string;
  card?: string;
  cardForeground?: string;
  popover?: string;
  popoverForeground?: string;
  
  // Actions & Interaction
  primary?: string;
  primaryForeground?: string;
  secondary?: string;
  secondaryForeground?: string;
  muted?: string;
  mutedForeground?: string;
  accent?: string;
  accentForeground?: string;
  
  // Borders & Inputs
  border?: string;
  input?: string;
  inputBackground?: string;
  ring?: string;
  
  // Semantic Colors
  destructive?: string;
  destructiveForeground?: string;
  success?: string;
  successForeground?: string;
  warning?: string;
  warningForeground?: string;
  info?: string;
  infoForeground?: string;
  
  // Charts
  chart1?: string;
  chart2?: string;
  chart3?: string;
  chart4?: string;
  chart5?: string;
  
  // Sidebar
  sidebar?: string;
  sidebarForeground?: string;
  sidebarPrimary?: string;
  sidebarPrimaryForeground?: string;
  sidebarAccent?: string;
  sidebarAccentForeground?: string;
  sidebarBorder?: string;
  sidebarRing?: string;
}

export interface ThemeCustomization {
  light: CustomThemeColors;
  dark: CustomThemeColors;
}

const STORAGE_KEY = 'trading-journal-theme-customization';

// Default theme colors (from globals.css)
export const DEFAULT_LIGHT_COLORS: CustomThemeColors = {
  background: '#fafafa',
  foreground: '#171717',
  card: '#ffffff',
  cardForeground: '#171717',
  popover: '#ffffff',
  popoverForeground: '#171717',
  primary: '#171717',
  primaryForeground: '#fafafa',
  secondary: '#f5f5f5',
  secondaryForeground: '#171717',
  muted: '#f5f5f5',
  mutedForeground: '#737373',
  accent: '#f5f5f5',
  accentForeground: '#171717',
  destructive: '#dc2626',
  destructiveForeground: '#fafafa',
  border: '#e5e5e5',
  input: 'transparent',
  inputBackground: '#ffffff',
  ring: '#171717',
  chart1: '#171717',
  chart2: '#10b981',
  chart3: '#f59e0b',
  chart4: '#6366f1',
  chart5: '#ec4899',
  success: '#10b981',
  successForeground: '#ffffff',
  warning: '#f59e0b',
  warningForeground: '#ffffff',
  info: '#3b82f6',
  infoForeground: '#ffffff',
  sidebar: '#ffffff',
  sidebarForeground: '#171717',
  sidebarPrimary: '#171717',
  sidebarPrimaryForeground: '#fafafa',
  sidebarAccent: '#f5f5f5',
  sidebarAccentForeground: '#171717',
  sidebarBorder: '#e5e5e5',
  sidebarRing: '#171717',
};

export const DEFAULT_DARK_COLORS: CustomThemeColors = {
  background: '#0a0a0a',
  foreground: '#ededed',
  card: '#171717',
  cardForeground: '#ededed',
  popover: '#171717',
  popoverForeground: '#ededed',
  primary: '#fafafa',
  primaryForeground: '#171717',
  secondary: '#262626',
  secondaryForeground: '#ededed',
  muted: '#262626',
  mutedForeground: '#a3a3a3',
  accent: '#262626',
  accentForeground: '#ededed',
  destructive: '#dc2626',
  destructiveForeground: '#fafafa',
  border: '#262626',
  input: 'transparent',
  inputBackground: '#171717',
  ring: '#fafafa',
  chart1: '#fafafa',
  chart2: '#10b981',
  chart3: '#f59e0b',
  chart4: '#6366f1',
  chart5: '#ec4899',
  success: '#10b981',
  successForeground: '#ffffff',
  warning: '#f59e0b',
  warningForeground: '#ffffff',
  info: '#3b82f6',
  infoForeground: '#ffffff',
  sidebar: '#171717',
  sidebarForeground: '#ededed',
  sidebarPrimary: '#fafafa',
  sidebarPrimaryForeground: '#171717',
  sidebarAccent: '#262626',
  sidebarAccentForeground: '#ededed',
  sidebarBorder: '#262626',
  sidebarRing: '#fafafa',
};

export function loadThemeCustomization(): ThemeCustomization {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        light: { ...DEFAULT_LIGHT_COLORS, ...parsed.light },
        dark: { ...DEFAULT_DARK_COLORS, ...parsed.dark },
      };
    }
  } catch (error) {
    console.error('Failed to load theme customization:', error);
  }
  
  return {
    light: { ...DEFAULT_LIGHT_COLORS },
    dark: { ...DEFAULT_DARK_COLORS },
  };
}

export function saveThemeCustomization(customization: ThemeCustomization): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customization));
  } catch (error) {
    console.error('Failed to save theme customization:', error);
  }
}

export function resetThemeCustomization(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to reset theme customization:', error);
  }
}

// Apply custom theme colors to CSS variables
export function applyThemeColors(colors: CustomThemeColors, isDark: boolean): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  
  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  
  // Apply each color as a CSS variable
  const colorMap: Record<string, keyof CustomThemeColors> = {
    '--background': 'background',
    '--foreground': 'foreground',
    '--card': 'card',
    '--card-foreground': 'cardForeground',
    '--popover': 'popover',
    '--popover-foreground': 'popoverForeground',
    '--primary': 'primary',
    '--primary-foreground': 'primaryForeground',
    '--secondary': 'secondary',
    '--secondary-foreground': 'secondaryForeground',
    '--muted': 'muted',
    '--muted-foreground': 'mutedForeground',
    '--accent': 'accent',
    '--accent-foreground': 'accentForeground',
    '--border': 'border',
    '--input': 'input',
    '--input-background': 'inputBackground',
    '--ring': 'ring',
    '--destructive': 'destructive',
    '--destructive-foreground': 'destructiveForeground',
    '--success': 'success',
    '--success-foreground': 'successForeground',
    '--warning': 'warning',
    '--warning-foreground': 'warningForeground',
    '--info': 'info',
    '--info-foreground': 'infoForeground',
    '--chart-1': 'chart1',
    '--chart-2': 'chart2',
    '--chart-3': 'chart3',
    '--chart-4': 'chart4',
    '--chart-5': 'chart5',
    '--sidebar': 'sidebar',
    '--sidebar-foreground': 'sidebarForeground',
    '--sidebar-primary': 'sidebarPrimary',
    '--sidebar-primary-foreground': 'sidebarPrimaryForeground',
    '--sidebar-accent': 'sidebarAccent',
    '--sidebar-accent-foreground': 'sidebarAccentForeground',
    '--sidebar-border': 'sidebarBorder',
    '--sidebar-ring': 'sidebarRing',
  };
  
  Object.entries(colorMap).forEach(([cssVar, colorKey]) => {
    const value = colors[colorKey];
    if (value) {
      root.style.setProperty(cssVar, value);
    }
  });
}

export function exportTheme(customization: ThemeCustomization): string {
  return JSON.stringify(customization, null, 2);
}

export function importTheme(jsonString: string): ThemeCustomization | null {
  try {
    const parsed = JSON.parse(jsonString);
    
    // Validate structure
    if (!parsed.light || !parsed.dark) {
      return null;
    }
    
    return {
      light: { ...DEFAULT_LIGHT_COLORS, ...parsed.light },
      dark: { ...DEFAULT_DARK_COLORS, ...parsed.dark },
    };
  } catch (error) {
    console.error('Failed to import theme:', error);
    return null;
  }
}
