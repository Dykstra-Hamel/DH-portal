'use client';

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from 'react';

interface AssignableUser {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string | null;
  departments: string[];
}

interface AssignedUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string | null;
}

interface LeadAssignmentControls {
  leadType: string;
  leadStatus: string;
  assignedTo?: string;
  assignedScheduler?: string;
  assignedUser?: AssignedUser | null;
  schedulerUser?: AssignedUser | null;
  assignableUsers: AssignableUser[];
  currentUser: { id: string; name: string; email: string; avatar?: string };
  onLeadTypeChange: (type: string) => void;
  onLeadTypeChangeWithModal?: (type: string) => void;
  onAssigneeChange: (id: string) => void;
  onSchedulerChange: (id: string) => void;
  onStatusChange: (status: string) => void;
}

interface SupportCaseAssignmentControls {
  caseStatus: string;
  assignedTo?: string;
  assignedUser?: AssignedUser | null;
  assignableUsers: AssignableUser[];
  currentUser: { id: string; name: string; email: string; avatar?: string };
  onAssigneeChange: (id: string) => void;
  onStatusChange: (status: string) => void;
}

interface ProjectFilterControls {
  selectedCompanyId?: string | null;
  selectedAssignedTo?: string | null | undefined;
  companies: Array<{ id: string; name: string }>;
  assignableUsers: AssignableUser[];
  currentUser: { id: string; name: string; email: string; avatar?: string };
  onCompanyChange: (companyId: string | null) => void;
  onAssignedToChange: (userId: string | null) => void;
}

interface PageHeaderConfig {
  title: string;
  description: string;
  leadAssignmentControls?: LeadAssignmentControls;
  supportCaseAssignmentControls?: SupportCaseAssignmentControls;
  projectFilterControls?: ProjectFilterControls;
  customActions?: ReactNode;
}

interface PageActionsContextType {
  registerPageAction: (actionType: string, handler: () => void) => void;
  unregisterPageAction: (actionType: string) => void;
  getPageAction: (actionType: string) => (() => void) | null;
  setPageHeader: (config: PageHeaderConfig | null) => void;
  pageHeader: PageHeaderConfig | null;
}

const PageActionsContext = createContext<PageActionsContextType | undefined>(
  undefined
);

export function PageActionsProvider({ children }: { children: ReactNode }) {
  const [pageActions, setPageActions] = useState<{ [key: string]: () => void }>(
    {}
  );
  const [pageHeader, setPageHeader] = useState<PageHeaderConfig | null>(null);

  const registerPageAction = useCallback(
    (actionType: string, handler: () => void) => {
      setPageActions(prev => ({
        ...prev,
        [actionType]: handler,
      }));
    },
    []
  );

  const unregisterPageAction = useCallback((actionType: string) => {
    setPageActions(prev => {
      const newActions = { ...prev };
      delete newActions[actionType];
      return newActions;
    });
  }, []);

  const getPageAction = useCallback(
    (actionType: string) => {
      return pageActions[actionType] || null;
    },
    [pageActions]
  );

  return (
    <PageActionsContext.Provider
      value={{
        registerPageAction,
        unregisterPageAction,
        getPageAction,
        setPageHeader,
        pageHeader,
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
