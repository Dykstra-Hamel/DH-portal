'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';

export type PrimaryNavItem =
  | 'dashboard'
  | 'tickets'
  | 'campaigns'
  | 'customers'
  | 'tasks'
  | 'brand'
  | 'project-management';

interface NavigationContextType {
  activePrimaryNav: PrimaryNavItem;
  setActivePrimaryNav: (nav: PrimaryNavItem) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(
  undefined
);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [activePrimaryNav, setActivePrimaryNav] =
    useState<PrimaryNavItem>('dashboard');
  const pathname = usePathname();

  // Update active nav based on current route
  useEffect(() => {
    if (pathname.startsWith('/tickets')) {
      setActivePrimaryNav('tickets');
    } else if (pathname.startsWith('/conversations')) {
      // Legacy /conversations route should activate tickets
      setActivePrimaryNav('tickets');
    } else if (pathname.startsWith('/leads')) {
      // Legacy /leads route should also activate tickets
      setActivePrimaryNav('tickets');
    } else if (pathname.startsWith('/campaigns')) {
      setActivePrimaryNav('campaigns');
    } else if (pathname.startsWith('/customers')) {
      setActivePrimaryNav('customers');
    } else if (pathname.startsWith('/brand')) {
      setActivePrimaryNav('brand');
    } else if (pathname.startsWith('/project-management') || pathname.startsWith('/admin/project-management')) {
      setActivePrimaryNav('project-management');
    } else if (pathname.startsWith('/dashboard')) {
      setActivePrimaryNav('dashboard');
    } else {
      // Default to dashboard for other routes
      setActivePrimaryNav('dashboard');
    }
  }, [pathname]);

  return (
    <NavigationContext.Provider
      value={{ activePrimaryNav, setActivePrimaryNav }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}
