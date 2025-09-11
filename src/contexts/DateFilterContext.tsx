'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';

export type DateFilterOption = 'Past 7 Days' | 'Past 30 Days' | 'Past 90 Days' | 'All Time';

interface DateRange {
  startDate: Date | null;
  endDate: Date;
}

interface DateFilterContextType {
  selectedFilter: DateFilterOption;
  setSelectedFilter: (filter: DateFilterOption) => void;
  getDateRange: () => DateRange;
  getDaysCount: () => number | null;
  getApiDateParams: () => { dateFrom?: string; dateTo?: string };
}

const DateFilterContext = createContext<DateFilterContextType | undefined>(undefined);

interface DateFilterProviderProps {
  children: ReactNode;
}

const DATE_FILTER_STORAGE_KEY = 'selectedDateFilter';

export function DateFilterProvider({ children }: DateFilterProviderProps) {
  const [selectedFilter, setSelectedFilterState] = useState<DateFilterOption>('Past 7 Days');

  // Initialize filter from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(DATE_FILTER_STORAGE_KEY);
    if (stored && ['Past 7 Days', 'Past 30 Days', 'Past 90 Days', 'All Time'].includes(stored)) {
      setSelectedFilterState(stored as DateFilterOption);
    }
  }, []);

  const setSelectedFilter = (filter: DateFilterOption) => {
    setSelectedFilterState(filter);
    localStorage.setItem(DATE_FILTER_STORAGE_KEY, filter);
  };

  const getDateRange = useCallback((): DateRange => {
    const endDate = new Date();
    let startDate: Date | null = null;

    switch (selectedFilter) {
      case 'Past 7 Days':
        startDate = new Date();
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'Past 30 Days':
        startDate = new Date();
        startDate.setDate(endDate.getDate() - 30);
        break;
      case 'Past 90 Days':
        startDate = new Date();
        startDate.setDate(endDate.getDate() - 90);
        break;
      case 'All Time':
        startDate = null; // No start date limit
        break;
    }

    return { startDate, endDate };
  }, [selectedFilter]);

  const getDaysCount = useCallback((): number | null => {
    switch (selectedFilter) {
      case 'Past 7 Days':
        return 7;
      case 'Past 30 Days':
        return 30;
      case 'Past 90 Days':
        return 90;
      case 'All Time':
        return null; // Unlimited
    }
  }, [selectedFilter]);

  const getApiDateParams = useCallback((): { dateFrom?: string; dateTo?: string } => {
    const { startDate, endDate } = getDateRange();
    
    if (!startDate) {
      // All Time - no date filtering
      return {};
    }

    return {
      dateFrom: startDate.toISOString().split('T')[0], // YYYY-MM-DD format
      dateTo: endDate.toISOString().split('T')[0],
    };
  }, [getDateRange]);

  const value = useMemo((): DateFilterContextType => ({
    selectedFilter,
    setSelectedFilter,
    getDateRange,
    getDaysCount,
    getApiDateParams,
  }), [selectedFilter, setSelectedFilter, getDateRange, getDaysCount, getApiDateParams]);

  return (
    <DateFilterContext.Provider value={value}>
      {children}
    </DateFilterContext.Provider>
  );
}

export function useDateFilter() {
  const context = useContext(DateFilterContext);
  if (context === undefined) {
    throw new Error('useDateFilter must be used within a DateFilterProvider');
  }
  return context;
}