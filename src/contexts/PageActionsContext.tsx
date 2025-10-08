'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface PageHeaderConfig {
  title: string;
  description: string;
}

interface PageActionsContextType {
  registerPageAction: (actionType: string, handler: () => void) => void;
  unregisterPageAction: (actionType: string) => void;
  getPageAction: (actionType: string) => (() => void) | null;
  setPageHeader: (config: PageHeaderConfig | null) => void;
  pageHeader: PageHeaderConfig | null;
}

const PageActionsContext = createContext<PageActionsContextType | undefined>(undefined);

export function PageActionsProvider({ children }: { children: ReactNode }) {
  const [pageActions, setPageActions] = useState<{ [key: string]: () => void }>({});
  const [pageHeader, setPageHeader] = useState<PageHeaderConfig | null>(null);

  const registerPageAction = useCallback((actionType: string, handler: () => void) => {
    setPageActions(prev => ({
      ...prev,
      [actionType]: handler,
    }));
  }, []);

  const unregisterPageAction = useCallback((actionType: string) => {
    setPageActions(prev => {
      const newActions = { ...prev };
      delete newActions[actionType];
      return newActions;
    });
  }, []);

  const getPageAction = useCallback((actionType: string) => {
    return pageActions[actionType] || null;
  }, [pageActions]);

  return (
    <PageActionsContext.Provider
      value={{
        registerPageAction,
        unregisterPageAction,
        getPageAction,
        setPageHeader,
        pageHeader
      }}
    >
      {children}
    </PageActionsContext.Provider>
  );
}

export function usePageActions() {
  const context = useContext(PageActionsContext);
  if (context === undefined) {
    throw new Error('usePageActions must be used within a PageActionsProvider');
  }
  return context;
}