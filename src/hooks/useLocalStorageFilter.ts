'use client';

import { useState, useEffect, useCallback } from 'react';

type FilterValue = string | null;

function readFromStorage(key: string, defaultValue: FilterValue): FilterValue {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const stored = localStorage.getItem(key);
    if (stored === null) return defaultValue;
    return stored === '__null__' ? null : stored;
  } catch {
    return defaultValue;
  }
}

function writeToStorage(key: string, value: FilterValue): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, value === null ? '__null__' : value);
  } catch {
    // Ignore storage errors (e.g. private browsing quota)
  }
}

/**
 * Works exactly like useState<string | null> but persists the value to
 * localStorage under `storageKey`.  Pass `defaultValue` for the initial
 * render before localStorage has been read.
 */
export function useLocalStorageFilter(
  storageKey: string,
  defaultValue: FilterValue = null
): [FilterValue, (value: FilterValue) => void] {
  const [value, setValue] = useState<FilterValue>(() =>
    readFromStorage(storageKey, defaultValue)
  );

  // Keep storage in sync whenever the value changes.
  useEffect(() => {
    writeToStorage(storageKey, value);
  }, [storageKey, value]);

  const setter = useCallback((next: FilterValue) => {
    setValue(next);
  }, []);

  return [value, setter];
}
