'use client';

import { useEffect, useState } from 'react';
import { PreferencesPage } from '@/components/journal/PreferencesPage';
import { loadTheme, Theme } from '@/lib/journal/theme';

export default function Preferences() {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    setTheme(loadTheme());
  }, []);

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      <PreferencesPage theme={theme} />
    </div>
  );
}


