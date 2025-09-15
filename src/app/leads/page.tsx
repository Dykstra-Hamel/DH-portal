'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LeadsListRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new leads location
    router.replace('/connections/leads');
  }, [router]);

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      Redirecting...
    </div>
  );
}