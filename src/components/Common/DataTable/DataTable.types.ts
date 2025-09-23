import { ReactNode, ComponentType } from 'react';

// Generic column definition for any data type
export interface ColumnDefinition<T> {
  key: string;
  title: string;
  width?: string;
  sortable?: boolean;
  sortKey?: keyof T | string;
  render?: (item: T, value: any) => ReactNode;
  align?: 'left' | 'center' | 'right';
}

// Tab configuration for filtering data
export interface TabDefinition<T> {
  key: string;
  label: string;
  filter: (items: T[]) => T[];
  getCount: (items: T[]) => number;
}

// Sort configuration
export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

// Generic data table props
export interface DataTableProps<T> {
  // Data
  data: T[];
  loading?: boolean;

  // Configuration
  title: string;
  columns: ColumnDefinition<T>[];
  tabs: TabDefinition<T>[];

  // Behavior
  onItemAction?: (action: string, item: T) => void;
  onDataUpdated?: () => void;

  // Infinite scroll
  infiniteScrollEnabled?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  loadingMore?: boolean;


  // Custom components
  customComponents?: {
    itemRow?: ComponentType<{ item: T; onAction?: (action: string, item: T) => void }>;
    liveBar?: ComponentType<{ data: T[] }>;
    actionModal?: ComponentType<{
      item: T | null;
      isOpen: boolean;
      onClose: () => void;
      onAction: (action: string, item: T) => void;
    }>;
  };

  // Styling
  className?: string;
  emptyStateMessage?: string;
  tableType?: 'tickets' | 'supportCases' | 'leads' | 'calls' | 'customers' | 'customersWithCompany'; // Determines column layout

  // Toast integration
  onShowToast?: (message: string) => void;
}

// Default item row props for simple rendering
export interface DefaultItemRowProps<T> {
  item: T;
  columns: ColumnDefinition<T>[];
  onAction?: (action: string, item: T) => void;
}

// Generic action button configuration
export interface ActionButtonConfig {
  key: string;
  label: string;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'danger';
  condition?: (item: any) => boolean;
}