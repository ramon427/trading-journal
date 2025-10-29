'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getSidebarState, setSidebarState } from '@/lib/journal/sidebarState';

interface SidebarContextType {
  sidebarVisible: boolean;
  toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  // Default to true (visible) for dashboard
  // getSidebarState() returns false by default, but for dashboard we want true
  const [sidebarVisible, setSidebarVisible] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem('trading-journal-sidebar-visible');
    // Default to true (visible) for dashboard if nothing stored
    return stored !== null ? stored === 'true' : true;
  });

  const toggleSidebar = () => {
    const newState = !sidebarVisible;
    setSidebarVisible(newState);
    setSidebarState(newState);
  };

  return (
    <SidebarContext.Provider value={{ sidebarVisible, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}
