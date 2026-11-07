import type { ColumnDef } from '@tanstack/react-table';
import type { ReactNode } from 'react';

// Lets caller columns declare the header search/filter chrome from spec 2.2
// via `meta` without an `as` cast at every call site.
declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    enableColumnSearch?: boolean;
    filterOptions?: string[];
  }
}

export interface FetchParams {
  page: number;
  pageSize: number;
  search: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  /** columnId -> selected values, for the header "Filter" popovers */
  filters: Record<string, string[]>;
}

export interface FetchResult<T> {
  data: T[];
  total: number;
}

export type Fetcher<T> = (params: FetchParams) => Promise<FetchResult<T>>;

export interface RowAction<T> {
  key: string;
  label: string;
  icon?: ReactNode;
  danger?: boolean;
  /** Hide this action for a given row (e.g. no permission). */
  hidden?: (row: T) => boolean;
  onSelect: (row: T) => void;
}

export interface ToolbarAction {
  key: string;
  label: string;
  onSelect: () => void;
  hidden?: boolean;
}

export interface BulkAction<T> {
  key: string;
  label: string;
  danger?: boolean;
  onSelect: (rows: T[]) => void;
}

export interface DataTablePageProps<T> {
  columns: ColumnDef<T>[];
  fetcher?: Fetcher<T>;
  /** Static data for demos — used when `fetcher` is not provided. Paging/sorting/search run client-side. */
  data?: T[];
  getRowId: (row: T) => string;
  rowActions?: RowAction<T>[];
  toolbarActions?: ToolbarAction[];
  bulkActions?: BulkAction<T>[];
  /** Namespaces the query-string keys so multiple tables on one page don't collide. */
  queryKeyPrefix?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
}
