'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface WizardContextValue {
  wizardTitle: string | null;
  setWizardTitle: (title: string | null) => void;
}

const WizardContext = createContext<WizardContextValue>({
  wizardTitle: null,
  setWizardTitle: () => {},
});

export function WizardProvider({ children }: { children: ReactNode }) {
  const [wizardTitle, setWizardTitle] = useState<string | null>(null);
  return (
    <WizardContext.Provider value={{ wizardTitle, setWizardTitle }}>
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  return useContext(WizardContext);
}
