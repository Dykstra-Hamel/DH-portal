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

// Card view — renders one card per item at narrow breakpoints instead of a
// grid row. Every field is a render function so each consumer decides how its
// own data maps into the card shape (e.g. leads show Format/Source, tasks
// show Due Date/Priority).
export interface CardViewConfig<T> {
  // Row of up to five label/value pairs across the top of the card.
  // `width` is a grid track value (e.g. '60px', 'minmax(120px, 1fr)'); defaults
  // to `minmax(0, 1fr)` so unset fields share space equally.
  topFields: {
    key: string;
    label: string;
    width?: string;
    render: (item: T) => ReactNode;
  }[];
  // Below topFields — short descriptive line (e.g. Lead Comments).
  summary?: { label?: string; render: (item: T) => ReactNode };
  // Small assignee avatar shown on the bottom-right row.
  avatar?: (item: T) => ReactNode;
  // Status progress bar + label shown between avatar and primary action.
  statusBar?: (item: T) => ReactNode;
  // Primary action button (e.g. "Review Lead"). Usually a link.
  primaryAction?: (item: T) => ReactNode;
  // Returns true when the row should render with the "unread" highlight
  // (blue border + blue-25 background). Used by inbox-style views.
  unread?: (item: T) => boolean;
}

// Generic data table props
export interface DataTableProps<T> {
  // Data
  data: T[];
  loading?: boolean;

  // Configuration
  title: string;
  columns: ColumnDefinition<T>[];
  tabs?: TabDefinition<T>[];

  // Behavior
  onItemAction?: (action: string, item: T) => void;
  onDataUpdated?: () => void;

  // Infinite scroll
  infiniteScrollEnabled?: boolean;
  visibleCount?: number; // Optional client-side visible row limit applied after sorting
  hasMore?: boolean;
  onLoadMore?: () => void;
  loadingMore?: boolean;
  preserveWindowScrollAnchor?: boolean;

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

  // Card view — when provided, the table renders as cards at viewport widths
  // ≤ `cardBreakpoint` (default 1280). Desktop view is unchanged.
  cardView?: CardViewConfig<T>;
  cardBreakpoint?: number;

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
  rowKey?: string;
}

// Generic action button configuration
export interface ActionButtonConfig {
  key: string;
  label: string;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'danger';
  condition?: (item: any) => boolean;
}
