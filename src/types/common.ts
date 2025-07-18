export type SortDirection = 'asc' | 'desc';

export interface SortConfig<T = any> {
  key: keyof T;
  direction: SortDirection;
}

export interface SearchFilters {
  search?: string;
  company_id?: string;
  sortBy?: string;
  sortOrder?: SortDirection;
}

export interface PaginationConfig {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  pagination?: PaginationConfig;
  filters?: SearchFilters;
}

export interface TableColumn<T = any> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (value: any, row: T) => React.ReactNode;
}

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

export interface SortableHeaderProps<T = any> {
  column: TableColumn<T>;
  currentSort?: SortConfig<T>;
  onSort: (key: keyof T) => void;
}

// Utility functions
export const toggleSortDirection = (current: SortDirection): SortDirection => {
  return current === 'asc' ? 'desc' : 'asc';
};

export const getSortIcon = (direction: SortDirection): string => {
  return direction === 'asc' ? '▲' : '▼';
};