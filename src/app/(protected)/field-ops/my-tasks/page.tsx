'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { useCompany } from '@/contexts/CompanyContext';
import { usePageActions } from '@/contexts/PageActionsContext';
import ActionsAutomationsPanel from '@/components/Tasks/ActionsAutomationsPanel/ActionsAutomationsPanel';
import AdditionalTasksPanel from '@/components/Tasks/AdditionalTasksPanel/AdditionalTasksPanel';
import { FieldOpsNav } from '@/components/FieldMap/FieldOpsNav/FieldOpsNav';
import styles from './page.module.scss';

export default function FieldOpsMyTasksPage() {
  const [createTrigger, setCreateTrigger] = useState(0);
  const { user } = useUser();
  const { selectedCompany } = useCompany();
  const { registerPageAction, unregisterPageAction } = usePageActions();

  useEffect(() => {
    registerPageAction('add', () => setCreateTrigger(prev => prev + 1));
    return () => unregisterPageAction('add');
  }, [registerPageAction, unregisterPageAction]);

  if (!user || !selectedCompany) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.empty}>
          <p>Please select a company to view your tasks.</p>
        </div>
        <FieldOpsNav />
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.content}>
        <div className={styles.layout}>
          <ActionsAutomationsPanel
            companyId={selectedCompany.id}
            userId={user.id}
          />
          <AdditionalTasksPanel
            companyId={selectedCompany.id}
            userId={user.id}
            externalCreateTrigger={createTrigger}
          />
        </div>
      </div>
      <FieldOpsNav />
    </div>
  );
}
