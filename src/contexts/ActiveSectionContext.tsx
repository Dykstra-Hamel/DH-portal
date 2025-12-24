'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type SectionId = 'contact' | 'quote' | 'scheduling' | 'sidebar' | null;

interface ActiveSectionContextType {
  activeSection: SectionId;
  setActiveSection: (section: SectionId) => void;
}

const ActiveSectionContext = createContext<ActiveSectionContextType | undefined>(
  undefined
);

export function ActiveSectionProvider({ children }: { children: ReactNode }) {
  const [activeSection, setActiveSection] = useState<SectionId>(null);

  return (
    <ActiveSectionContext.Provider value={{ activeSection, setActiveSection }}>
      {children}
    </ActiveSectionContext.Provider>
  );
}

export function useActiveSection() {
  const context = useContext(ActiveSectionContext);
  if (context === undefined) {
    throw new Error(
      'useActiveSection must be used within an ActiveSectionProvider'
    );
  }
  return context;
}
