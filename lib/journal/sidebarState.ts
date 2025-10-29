// Manages the sidebar visibility state for full-page views

const SIDEBAR_STATE_KEY = 'trading-journal-sidebar-visible';

export function getSidebarState(): boolean {
  const stored = localStorage.getItem(SIDEBAR_STATE_KEY);
  return stored === 'true'; // Default to false (hidden) if not set
}

export function setSidebarState(visible: boolean): void {
  localStorage.setItem(SIDEBAR_STATE_KEY, visible.toString());
}

export function toggleSidebarState(): boolean {
  const current = getSidebarState();
  const newState = !current;
  setSidebarState(newState);
  return newState;
}
