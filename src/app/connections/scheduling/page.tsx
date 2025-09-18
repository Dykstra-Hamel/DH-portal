'use client';

import { PageAccessGuard } from '@/components/Common/AccessControl';

export default function SchedulingPage() {
  return (
    <PageAccessGuard pageType="scheduling">
      <div style={{ padding: '40px' }}>
        <h1>Scheduling</h1>
        <p>Scheduling functionality will be implemented here.</p>
      </div>
    </PageAccessGuard>
  );
}