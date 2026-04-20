'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { useUserDepartments } from '@/hooks/useUserDepartments';
import { useUser } from '@/hooks/useUser';
import { usePageActions } from '@/contexts/PageActionsContext';
import { FieldSalesNav } from '@/components/FieldMap/FieldSalesNav/FieldSalesNav';
import { FieldSalesReports } from '@/components/FieldMap/FieldSalesReports/FieldSalesReports';

export default function FieldSalesReportsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const { selectedCompany, isAdmin } = useCompany();
  const { profile } = useUser();
  const { setPageHeader } = usePageActions();
  const { departments } = useUserDepartments(
    userId ?? '',
    selectedCompany?.id ?? ''
  );

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  useEffect(() => {
    setPageHeader({ title: 'Reports', description: '' });
    return () => setPageHeader(null);
  }, [setPageHeader]);

  const isTechnician = departments.includes('technician');
  const isInspector = departments.includes('inspector');

  const showInspector = isAdmin || isInspector;
  const showTechLeads = isAdmin || isTechnician;

  return (
    <>
      <FieldSalesReports
        companyId={selectedCompany?.id ?? ''}
        showInspector={showInspector}
        showTechLeads={showTechLeads}
        greetingName={profile?.first_name ?? undefined}
      />
      <FieldSalesNav />
    </>
  );
}
