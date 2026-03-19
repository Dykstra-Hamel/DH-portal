'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface WizardContextValue {
  wizardTitle: string | null;
  setWizardTitle: (title: string | null) => void;
  backInterceptor: (() => void) | null;
  setBackInterceptor: (fn: (() => void) | null) => void;
}

const WizardContext = createContext<WizardContextValue>({
  wizardTitle: null,
  setWizardTitle: () => {},
  backInterceptor: null,
  setBackInterceptor: () => {},
});

export function WizardProvider({ children }: { children: ReactNode }) {
  const [wizardTitle, setWizardTitle] = useState<string | null>(null);
  const [backInterceptor, setBackInterceptorState] = useState<(() => void) | null>(null);

  // Wrap in useCallback so the setter is stable; use function form to avoid
  // useState treating a function value as an initializer
  const setBackInterceptor = useCallback((fn: (() => void) | null) => {
    setBackInterceptorState(fn ? () => fn : null);
  }, []);

  return (
    <WizardContext.Provider value={{ wizardTitle, setWizardTitle, backInterceptor, setBackInterceptor }}>
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  return useContext(WizardContext);
}
