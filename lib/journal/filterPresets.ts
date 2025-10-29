import { AdvancedTradeFilters, FilterPreset } from '../components/AdvancedFilters';

const PRESETS_KEY = 'tradingJournal_filterPresets';

export function loadFilterPresets(): FilterPreset[] {
  try {
    const stored = localStorage.getItem(PRESETS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading filter presets:', error);
    return [];
  }
}

export function saveFilterPresets(presets: FilterPreset[]): void {
  try {
    localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
  } catch (error) {
    console.error('Error saving filter presets:', error);
  }
}

export function addFilterPreset(name: string, filters: AdvancedTradeFilters): FilterPreset {
  const presets = loadFilterPresets();
  const newPreset: FilterPreset = {
    id: `preset_${Date.now()}`,
    name,
    filters,
    createdAt: new Date().toISOString(),
  };
  
  presets.push(newPreset);
  saveFilterPresets(presets);
  return newPreset;
}

export function deleteFilterPreset(id: string): void {
  const presets = loadFilterPresets();
  const filtered = presets.filter(p => p.id !== id);
  saveFilterPresets(filtered);
}

export function updateFilterPreset(id: string, updates: Partial<FilterPreset>): void {
  const presets = loadFilterPresets();
  const index = presets.findIndex(p => p.id === id);
  
  if (index !== -1) {
    presets[index] = { ...presets[index], ...updates };
    saveFilterPresets(presets);
  }
}
