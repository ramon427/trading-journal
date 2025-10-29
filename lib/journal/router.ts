// Simple router types and Next.js adapter hook
export type Route = 
  | { type: 'overview' }
  | { type: 'benchmarks' }
  | { type: 'trades' }
  | { type: 'analytics' }
  | { type: 'projections' }
  | { type: 'customize'; tab?: string }
  | { type: 'preferences' }
  | { type: 'edit-setup'; setupId: string }
  | { type: 'edit-tag'; tagId: string }
  | { type: 'edit-setup-category'; categoryId: string }
  | { type: 'edit-tag-category'; categoryId: string }
  | { type: 'trade-detail'; tradeId: string }
  | { type: 'journal-detail'; date: string }
  | { type: 'quick-add-trade'; date?: string }
  | { type: 'add-trade'; tradeId?: string; date?: string }
  | { type: 'add-journal'; date?: string };

// Store the previous route for back navigation
const PREVIOUS_ROUTE_KEY = 'trading-journal-previous-route';

const setPreviousRoute = (route: Route) => {
  try {
    localStorage.setItem(PREVIOUS_ROUTE_KEY, JSON.stringify(route));
  } catch (e) {
    // Silently fail if localStorage is unavailable
  }
};

const getPreviousRoute = (): Route | null => {
  try {
    const stored = localStorage.getItem(PREVIOUS_ROUTE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    return null;
  }
};

import { useRouter as useNextRouter, usePathname, useSearchParams } from 'next/navigation';
export const getCurrentRoute = (): Route => ({ type: 'overview' });

const routeToPath = (route: Route): string => {
  switch (route.type) {
    case 'overview':
      return '/dashboard';
    case 'benchmarks':
      return '/dashboard/benchmarks';
    case 'trades':
      return '/dashboard/trades';
    case 'analytics':
      return '/dashboard/analytics';
    case 'projections':
      return '/dashboard/projections';
    case 'customize':
      return `/dashboard/customize${route.tab ? `?tab=${encodeURIComponent(route.tab)}` : ''}`;
    case 'preferences':
      return '/dashboard/preferences';
    case 'trade-detail':
      return `/dashboard/trades/${encodeURIComponent(route.tradeId)}`;
    case 'quick-add-trade':
      return `/dashboard/trades/quick-add${route.date ? `?date=${encodeURIComponent(route.date)}` : ''}`;
    case 'add-trade':
      return route.tradeId
        ? `/dashboard/trades/${encodeURIComponent(route.tradeId)}`
        : `/dashboard/trades/add${route.date ? `?date=${encodeURIComponent(route.date)}` : ''}`;
    case 'add-journal':
      return `/dashboard/journal/add${route.date ? `?date=${encodeURIComponent(route.date)}` : ''}`;
  }
};
export const navigateTo = (route: Route) => {
  if (typeof window === 'undefined') return;
  const path = routeToPath(route);
  window.location.href = path; // basic fallback; prefer hook below in components
};

export const goBack = () => { if (typeof window !== 'undefined') history.back(); };

// Simple navigation helper for direct path-based navigation
export const navigate = (path: string) => { if (typeof window !== 'undefined') window.location.href = path; };

// React hook for router
export const useRouter = () => {
  const router = useNextRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const getCurrentRouteFromPath = (): Route => {
    if (!pathname) return { type: 'overview' };
    if (pathname.startsWith('/dashboard/benchmarks')) return { type: 'benchmarks' };
    if (pathname.startsWith('/dashboard/analytics')) return { type: 'analytics' };
    if (pathname.startsWith('/dashboard/projections')) return { type: 'projections' };
    if (pathname.startsWith('/dashboard/customize')) {
      const tab = searchParams.get('tab') || undefined;
      return { type: 'customize', tab };
    }
    if (pathname.startsWith('/dashboard/preferences')) return { type: 'preferences' };
    if (pathname.startsWith('/dashboard/trades/quick-add')) {
      const date = searchParams.get('date') || undefined;
      return { type: 'quick-add-trade', date };
    }
    if (pathname.startsWith('/dashboard/trades/add')) {
      const date = searchParams.get('date') || undefined;
      return { type: 'add-trade', date };
    }
    if (pathname.startsWith('/dashboard/trades/')) {
      const parts = pathname.split('/');
      const tradeId = parts[parts.length - 1];
      return { type: 'trade-detail', tradeId };
    }
    if (pathname.startsWith('/dashboard/trades')) return { type: 'trades' };
    if (pathname.startsWith('/dashboard/journal/add')) {
      const date = searchParams.get('date') || undefined;
      return { type: 'add-journal', date };
    }
    if (pathname.startsWith('/dashboard')) return { type: 'overview' };
    return { type: 'overview' };
  };

  return {
    navigate: (path: string) => router.push(path),
    navigateTo: (route: Route) => router.push(routeToPath(route)),
    goBack: () => router.back(),
    getCurrentRoute: getCurrentRouteFromPath,
  };
};
