'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TicketsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to tickets page which is now the main tickets page
    router.replace('/tickets/new');
  }, [router]);

  return null;
}
