'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function CustomersListRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new customers location
    router.replace('/dashboard/customers');
  }, [router]);

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      Redirecting...
    </div>
  );
}