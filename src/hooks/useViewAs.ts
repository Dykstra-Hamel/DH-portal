'use client';

import { useCallback, useEffect, useState } from 'react';

// Lightweight "view-as" override used by global admins to preview the
// /field-sales/dashboard as if they were a different user. Only used as a
// UI override — it doesn't grant or revoke any data access.
export type ViewAsRole = 'admin' | 'manager' | 'inspector' | 'tech';

export interface ViewAsState {
  role: ViewAsRole;
  userId: string;
  userLabel: string;
  companyId: string;
}

const STORAGE_KEY = 'dh-view-as';
const EVENT_NAME = 'dh-view-as-change';

function readStored(): ViewAsState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      (parsed.role === 'admin' ||
        parsed.role === 'manager' ||
        parsed.role === 'inspector' ||
        parsed.role === 'tech') &&
      typeof parsed.userId === 'string' &&
      typeof parsed.companyId === 'string'
    ) {
      return parsed as ViewAsState;
    }
    return null;
  } catch {
    return null;
  }
}

function writeStored(state: ViewAsState | null) {
  if (typeof window === 'undefined') return;
  if (state === null) {
    window.localStorage.removeItem(STORAGE_KEY);
  } else {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
  // Custom event so other components in the same tab stay in sync; storage
  // events only fire across tabs.
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

export function useViewAs() {
  const [state, setState] = useState<ViewAsState | null>(null);

  useEffect(() => {
    setState(readStored());
    const onChange = () => setState(readStored());
    window.addEventListener(EVENT_NAME, onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener(EVENT_NAME, onChange);
      window.removeEventListener('storage', onChange);
    };
  }, []);

  const setViewAs = useCallback((next: ViewAsState | null) => {
    writeStored(next);
    setState(next);
  }, []);

  const clear = useCallback(() => {
    writeStored(null);
    setState(null);
  }, []);

  return { viewAs: state, setViewAs, clear };
}
