'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ConnectionsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to tickets page which is now the main connections page
    router.replace('/connections/incoming');
  }, [router]);

  return null;
}
