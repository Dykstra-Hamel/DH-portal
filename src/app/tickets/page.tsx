'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TicketsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to tickets dashboard which is the main tickets page
    router.replace('/tickets/dashboard');
  }, [router]);

  return null;
}
