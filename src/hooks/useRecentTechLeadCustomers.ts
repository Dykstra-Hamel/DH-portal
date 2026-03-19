'use client';

import { useState, useCallback } from 'react';

const MAX_RECENT = 10;

export interface RecentCustomer {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  pestpac_client_id?: string | null;
  primaryAddress: {
    street_address: string;
    city: string;
    state: string;
    zip_code: string;
  } | null;
}

function storageKey(companyId: string) {
  return `techleads_recent_customers_${companyId}`;
}

function readRecent(companyId: string): RecentCustomer[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(storageKey(companyId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeRecent(companyId: string, customers: RecentCustomer[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(storageKey(companyId), JSON.stringify(customers));
  } catch {
    // Ignore storage errors (e.g. private browsing quota)
  }
}

export function useRecentTechLeadCustomers(companyId: string) {
  const [recentCustomers, setRecentCustomers] = useState<RecentCustomer[]>(() =>
    readRecent(companyId)
  );

  const addRecent = useCallback(
    (customer: RecentCustomer) => {
      setRecentCustomers(prev => {
        const filtered = prev.filter(c => c.id !== customer.id);
        const next = [customer, ...filtered].slice(0, MAX_RECENT);
        writeRecent(companyId, next);
        return next;
      });
    },
    [companyId]
  );

  return { recentCustomers, addRecent };
}
