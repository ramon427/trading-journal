import { useState, useEffect } from 'react';
import { loadGlobalSettings, type GlobalSettings } from './pagePreferences';

export function useGlobalSettings() {
  const [settings, setSettings] = useState<GlobalSettings>(loadGlobalSettings());

  useEffect(() => {
    // Listen for storage changes
    const handleStorageChange = () => {
      setSettings(loadGlobalSettings());
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events when settings change in the same tab
    const handleSettingsChange = () => {
      setSettings(loadGlobalSettings());
    };
    
    window.addEventListener('globalSettingsChanged', handleSettingsChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('globalSettingsChanged', handleSettingsChange);
    };
  }, []);

  return settings;
}
