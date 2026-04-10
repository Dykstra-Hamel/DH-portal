'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { useUserDepartments } from '@/hooks/useUserDepartments';
import { TechLeadsHome } from '@/components/TechLeads/TechLeadsHome/TechLeadsHome';
import { FieldMapDashboard } from '@/components/FieldMap/FieldMapDashboard/FieldMapDashboard';
import { FieldOpsNav } from '@/components/FieldMap/FieldOpsNav/FieldOpsNav';
import styles from './dashboard.module.scss';

export default function FieldOpsDashboard() {
  const [userId, setUserId] = useState<string | null>(null);
  const { selectedCompany, isAdmin } = useCompany();
  const { departments } = useUserDepartments(userId ?? '', selectedCompany?.id ?? '');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  const isTechnician = isAdmin || departments.includes('technician');
  const isInspector = isAdmin || departments.includes('inspector');

  return (
    <div className={styles.wrapper}>
      {isInspector && (
        <div className={styles.section}>
          <FieldMapDashboard companyId={selectedCompany?.id ?? ''} />
        </div>
      )}
      {isTechnician && (
        <div className={styles.section}>
          <TechLeadsHome showNav={false} newPath="/field-ops/tech-leads/new" />
        </div>
      )}
      <FieldOpsNav />
    </div>
  );
}
