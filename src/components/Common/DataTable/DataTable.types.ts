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

  // Search
  searchEnabled?: boolean; // Enable/disable search (default: true)
  searchPlaceholder?: string; // Placeholder text for search input

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
  tableType?: 'tickets' | 'supportCases' | 'leads' | 'calls' | 'customers' | 'customersWithCompany' | 'tasks' | 'form_submissions'; // Determines column layout
  customColumnWidths?: string; // Custom CSS grid template columns (e.g., "1fr 120px 100px 200px")

  // Sorting
  defaultSort?: SortConfig; // Default sort configuration

  // Toast integration
  onShowToast?: (message: string) => void;

  // Callbacks for parent to handle data fetching
  onTabChange?: (tab: string) => void; // Called when user changes tab
  onSortChange?: (field: string, order: 'asc' | 'desc') => void; // Called when user changes sort
  onSearchChange?: (query: string) => void; // Called when user searches
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