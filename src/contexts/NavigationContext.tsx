'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePathname } from 'next/navigation';

export type PrimaryNavItem = 'dashboard' | 'conversations' | 'tasks' | 'brand';

interface NavigationContextType {
  activePrimaryNav: PrimaryNavItem;
  setActivePrimaryNav: (nav: PrimaryNavItem) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [activePrimaryNav, setActivePrimaryNav] = useState<PrimaryNavItem>('dashboard');
  const pathname = usePathname();

  // Update active nav based on current route
  useEffect(() => {
    if (pathname.startsWith('/conversations')) {
      setActivePrimaryNav('conversations');
    } else if (pathname.startsWith('/leads')) {
      // Legacy /leads route should also activate conversations
      setActivePrimaryNav('conversations');
    } else if (pathname.startsWith('/tickets')) {
      setActivePrimaryNav('tasks');
    } else if (pathname.startsWith('/brand')) {
      setActivePrimaryNav('brand');
    } else if (pathname.startsWith('/dashboard')) {
      setActivePrimaryNav('dashboard');
    } else {
      // Default to dashboard for other routes
      setActivePrimaryNav('dashboard');
    }
  }, [pathname]);

  return (
    <NavigationContext.Provider value={{ activePrimaryNav, setActivePrimaryNav }}>
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