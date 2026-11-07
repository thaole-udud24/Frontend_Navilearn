import { useEffect, useMemo, useRef, useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
} from '@tanstack/react-table';
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle, ArrowUpDown, Filter, Inbox, Menu, RefreshCw, Search } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';
import { pickVariants, staggerContainer } from '@/lib/motion';
import { Toolbar } from './Toolbar';
import { Pagination } from './Pagination';
import type { DataTablePageProps, FetchParams } from './types';

// Column ids injected by DataTablePage itself; never part of the caller's columns.
const SELECT_COL = '__select';
const INDEX_COL = '__index';
const ACTIONS_COL = '__actions';
const SELECT_COL_WIDTH = 44;

/** Reusable 2-line clamp + native title tooltip for long cell text (spec 2.2). */
export function ClampLine({ text, lines = 2 }: { text: string; lines?: number }) {
  return (
    <span title={text} className={cn('block', lines === 2 ? 'line-clamp-2' : 'line-clamp-3')}>
      {text}
    </span>
  );
}

function filterFnWithChrome(row: { getValue: (id: string) => unknown }, columnId: string, filterValue: { search?: string; values?: string[] }) {
  const raw = row.getValue(columnId);
  const cell = String(raw ?? '').toLowerCase();
  if (filterValue?.search && !cell.includes(filterValue.search.toLowerCase())) return false;
  if (filterValue?.values?.length && !filterValue.values.includes(String(raw))) return false;
  return true;
}

export function DataTablePage<T>({
  columns,
  fetcher,
  data: staticData,
  getRowId,
  rowActions,
  toolbarActions,
  bulkActions,
  queryKeyPrefix = '',
  searchPlaceholder = 'Tìm theo: Mã, Tên…',
  emptyLabel = 'Không có dữ liệu',
}: DataTablePageProps<T>) {
  const reduced = useReducedMotion();
  const isManual = !!fetcher;
  const p = (key: string) => `${queryKeyPrefix}${key}`;

  const [searchParams, setSearchParams] = useSearchParams();
  const [pagination, setPagination] = useState({
    pageIndex: Number(searchParams.get(p('page')) ?? 1) - 1,
    pageSize: Number(searchParams.get(p('pageSize')) ?? 10),
  });
  const [sorting, setSorting] = useState<SortingState>(() => {
    const sortBy = searchParams.get(p('sortBy'));
    const sortDir = searchParams.get(p('sortDir'));
    return sortBy ? [{ id: sortBy, desc: sortDir === 'desc' }] : [];
  });
  const [globalFilter, setGlobalFilter] = useState(searchParams.get(p('search')) ?? '');
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(() => {
    const raw = searchParams.get(p('filters'));
    if (!raw) return [];
    try {
      return JSON.parse(raw) as ColumnFiltersState;
    } catch {
      return [];
    }
  });
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});
  const [userColumnOrder, setUserColumnOrder] = useState<string[]>(() => columns.map((c) => String(c.id ?? (c as { accessorKey?: string }).accessorKey)));
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [scrolledRight, setScrolledRight] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<T | null>(null);

  const debouncedSearch = useDebounce(globalFilter, 300);

  // --- keep page/pageSize/sort/search/filters in the URL so F5 preserves state ---
  useEffect(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set(p('page'), String(pagination.pageIndex + 1));
        next.set(p('pageSize'), String(pagination.pageSize));
        if (debouncedSearch) next.set(p('search'), debouncedSearch);
        else next.delete(p('search'));
        if (sorting[0]) {
          next.set(p('sortBy'), sorting[0].id);
          next.set(p('sortDir'), sorting[0].desc ? 'desc' : 'asc');
        } else {
          next.delete(p('sortBy'));
          next.delete(p('sortDir'));
        }
        if (columnFilters.length) next.set(p('filters'), JSON.stringify(columnFilters));
        else next.delete(p('filters'));
        return next;
      },
      { replace: true },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.pageIndex, pagination.pageSize, debouncedSearch, sorting, columnFilters]);

  // --- fetcher-backed data (server/async path) ---
  const [remoteRows, setRemoteRows] = useState<T[]>([]);
  const [remoteTotal, setRemoteTotal] = useState(0);
  const [isFetching, setIsFetching] = useState(isManual);
  const [error, setError] = useState<string | null>(null);
  const reloadToken = useRef(0);

  useEffect(() => {
    if (!fetcher) return;
    let cancelled = false;
    setIsFetching(true);
    setError(null);
    const filtersRecord: Record<string, string[]> = {};
    columnFilters.forEach((f) => {
      const v = f.value as { search?: string; values?: string[] };
      if (v?.search) filtersRecord[`${f.id}:search`] = [v.search];
      if (v?.values?.length) filtersRecord[f.id] = v.values;
    });
    const params: FetchParams = {
      page: pagination.pageIndex + 1,
      pageSize: pagination.pageSize,
      search: debouncedSearch,
      sortBy: sorting[0]?.id,
      sortDir: sorting[0] ? (sorting[0].desc ? 'desc' : 'asc') : undefined,
      filters: filtersRecord,
    };
    fetcher(params)
      .then((res) => {
        if (cancelled) return;
        setRemoteRows(res.data);
        setRemoteTotal(res.total);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi khi tải dữ liệu');
      })
      .finally(() => {
        if (!cancelled) setIsFetching(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher, pagination.pageIndex, pagination.pageSize, debouncedSearch, sorting, columnFilters, reloadToken.current]);

  const fullColumnOrder = useMemo(
    () => [SELECT_COL, INDEX_COL, ...userColumnOrder, ACTIONS_COL],
    [userColumnOrder],
  );

  const tableColumns = useMemo<ColumnDef<T>[]>(() => {
    const wrapped = columns.map((col) => {
      const label = typeof col.header === 'string' ? col.header : undefined;
      const meta = col.meta as { enableColumnSearch?: boolean; filterOptions?: string[] } | undefined;
      const hasChrome = !!meta?.enableColumnSearch || !!meta?.filterOptions?.length;
      return {
        ...col,
        filterFn: hasChrome ? filterFnWithChrome : col.filterFn,
        header: label
          ? (ctx: { column: { id: string; getCanSort: () => boolean; getIsSorted: () => false | 'asc' | 'desc'; toggleSorting: (desc?: boolean) => void; getFilterValue: () => unknown; setFilterValue: (v: unknown) => void } }) => (
              <ColumnHeaderCell label={label} column={ctx.column} meta={meta} />
            )
          : col.header,
      } as ColumnDef<T>;
    });

    const selectCol: ColumnDef<T> = {
      id: SELECT_COL,
      size: SELECT_COL_WIDTH,
      header: ({ table }) => (
        <Checkbox
          aria-label="Chọn tất cả"
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label="Chọn dòng"
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
        />
      ),
      enableSorting: false,
    };

    const indexCol: ColumnDef<T> = {
      id: INDEX_COL,
      header: 'TT',
      size: 56,
      cell: ({ row, table }) =>
        (isManual ? table.getState().pagination.pageIndex * table.getState().pagination.pageSize : 0) +
        row.index +
        1,
      enableSorting: false,
    };

    const actionsCol: ColumnDef<T> = {
      id: ACTIONS_COL,
      header: 'Thao tác',
      size: 64,
      enableSorting: false,
      cell: ({ row }) => {
        const visible = rowActions?.filter((a) => !a.hidden?.(row.original)) ?? [];
        if (!visible.length) return null;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Thao tác"
                className="flex h-10 w-10 items-center justify-center rounded-control bg-primary/10 text-primary hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Menu className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="tw-scope w-[200px]" align="end">
              {visible.map((action, idx) => {
                const isDelete = action.key === 'delete';
                const prevDanger = visible[idx - 1]?.danger;
                return (
                  <DropdownMenuItem
                    key={action.key}
                    className={cn(action.danger && 'text-danger', action.danger && !prevDanger && 'mt-1 border-t border-border pt-2')}
                    onSelect={() => (isDelete ? setDeleteTarget(row.original) : action.onSelect(row.original))}
                  >
                    {action.icon}
                    {action.label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    };

    return [selectCol, indexCol, ...wrapped, actionsCol];
  }, [columns, rowActions, isManual]);

  const tableData = isManual ? remoteRows : staticData ?? [];

  const table = useReactTable({
    data: tableData,
    columns: tableColumns,
    columnResizeMode: 'onChange',
    getRowId: (row) => getRowId(row),
    state: { pagination, sorting, globalFilter: debouncedSearch, columnFilters, columnVisibility, columnOrder: fullColumnOrder, rowSelection },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    manualPagination: isManual,
    manualSorting: isManual,
    manualFiltering: isManual,
    pageCount: isManual ? Math.max(1, Math.ceil(remoteTotal / pagination.pageSize)) : undefined,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: isManual ? undefined : getFilteredRowModel(),
    getSortedRowModel: isManual ? undefined : getSortedRowModel(),
    getPaginationRowModel: isManual ? undefined : getPaginationRowModel(),
  });

  const rows = table.getRowModel().rows;
  const total = isManual ? remoteTotal : table.getFilteredRowModel().rows.length;
  const selectedRows = table.getSelectedRowModel().rows.map((r) => r.original);
  const scrollRef = useRef<HTMLDivElement>(null);

  const reload = () => {
    reloadToken.current += 1;
    setError(null);
  };

  const columnMetaList = columns.map((c) => ({
    id: String(c.id ?? (c as { accessorKey?: string }).accessorKey),
    label: typeof c.header === 'string' ? c.header : String(c.id ?? ''),
  }));

  const moveColumn = (id: string, direction: 'up' | 'down') => {
    setUserColumnOrder((prev) => {
      const idx = prev.indexOf(id);
      const swapWith = direction === 'up' ? idx - 1 : idx + 1;
      if (swapWith < 0 || swapWith >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[swapWith]] = [next[swapWith], next[idx]];
      return next;
    });
  };

  const resetColumns = () => {
    setUserColumnOrder(columns.map((c) => String(c.id ?? (c as { accessorKey?: string }).accessorKey)));
    setColumnVisibility({});
  };

  const containerVariants = pickVariants(!!reduced, staggerContainer);

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="rounded-card border border-border bg-card shadow-card">
      <div className="p-3">
        <Toolbar
          columns={columnMetaList}
          order={userColumnOrder}
          hidden={new Set(Object.entries(columnVisibility).filter(([, v]) => v === false).map(([k]) => k))}
          onToggleColumn={(id) => setColumnVisibility((prev) => ({ ...prev, [id]: prev[id] === false }))}
          onMoveColumn={moveColumn}
          onResetColumns={resetColumns}
          search={globalFilter}
          onSearchChange={setGlobalFilter}
          searchPlaceholder={searchPlaceholder}
          total={total}
          isFetching={isFetching}
          onRefresh={reload}
          toolbarActions={toolbarActions}
          selectedRows={selectedRows}
          bulkActions={bulkActions}
          onClearSelection={() => setRowSelection({})}
        />
      </div>

      <div
        ref={scrollRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          setScrolledRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
        }}
        className="max-h-[560px] overflow-auto [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-border"
      >
        <Table>
          <TableHeader className="sticky top-0 z-20 bg-muted">
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="border-b border-border">
                {hg.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      'h-14 border-r border-border/70 text-[14px] font-semibold text-foreground last:border-r-0',
                      header.column.id === SELECT_COL && 'sticky left-0 z-30 bg-muted',
                      header.column.id === INDEX_COL && `sticky z-30 bg-muted`,
                      header.column.id === ACTIONS_COL && cn('sticky right-0 z-30 bg-muted', scrolledRight && 'shadow-[-6px_0_8px_-4px_rgba(15,40,90,0.15)]'),
                    )}
                    style={header.column.id === INDEX_COL ? { left: SELECT_COL_WIDTH } : undefined}
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {error ? (
              <TableRow>
                <TableCell colSpan={tableColumns.length} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <AlertTriangle className="h-10 w-10 text-danger" />
                    <p className="text-sm text-muted-foreground">{error}</p>
                    <Button variant="outline" onClick={reload}>
                      <RefreshCw className="h-4 w-4" /> Thử lại
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : isFetching && isManual && rows.length === 0 ? (
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={`sk-${i}`}>
                  {tableColumns.map((_col, ci) => (
                    <TableCell key={ci}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={tableColumns.length} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <Inbox className="h-10 w-10 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">{emptyLabel}</p>
                    <Button variant="outline" onClick={reload}>
                      <RefreshCw className="h-4 w-4" /> Làm mới
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id} className="min-h-[72px] border-b border-border hover:bg-muted/40" data-state={row.getIsSelected() ? 'selected' : undefined}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        'h-[72px] py-2',
                        cell.column.id === SELECT_COL && 'sticky left-0 z-10 bg-card',
                        cell.column.id === INDEX_COL && 'sticky z-10 bg-card',
                        cell.column.id === ACTIONS_COL && cn('sticky right-0 z-10 bg-card', scrolledRight && 'shadow-[-6px_0_8px_-4px_rgba(15,40,90,0.15)]'),
                      )}
                      style={cell.column.id === INDEX_COL ? { left: SELECT_COL_WIDTH } : undefined}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination
        page={pagination.pageIndex + 1}
        pageSize={pagination.pageSize}
        total={total}
        onPageChange={(page) => setPagination((prev) => ({ ...prev, pageIndex: page - 1 }))}
        onPageSizeChange={(size) => setPagination({ pageIndex: 0, pageSize: size })}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) rowActions?.find((a) => a.key === 'delete')?.onSelect(deleteTarget);
        }}
      />
    </motion.div>
  );
}

interface ColumnHeaderCellColumn {
  id: string;
  getCanSort: () => boolean;
  getIsSorted: () => false | 'asc' | 'desc';
  toggleSorting: (desc?: boolean) => void;
  getFilterValue: () => unknown;
  setFilterValue: (updater: unknown) => void;
}

function ColumnHeaderCell({
  label,
  column,
  meta,
}: {
  label: string;
  column: ColumnHeaderCellColumn;
  meta?: { enableColumnSearch?: boolean; filterOptions?: string[] };
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const filterValue = (column.getFilterValue() as { search?: string; values?: string[] }) ?? {};

  return (
    <div className="flex items-center gap-1.5">
      <span>{label}</span>
      {column.getCanSort() && (
        <button
          type="button"
          aria-label={`Sắp xếp theo ${label}`}
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className={cn('rounded-badge p-0.5 hover:bg-border/60', column.getIsSorted() && 'text-primary')}
        >
          <ArrowUpDown className="h-3.5 w-3.5" />
        </button>
      )}
      {meta?.enableColumnSearch && (
        <Popover open={searchOpen} onOpenChange={setSearchOpen}>
          <PopoverTrigger asChild>
            <button type="button" aria-label={`Tìm trong ${label}`} className="rounded-badge p-0.5 hover:bg-border/60">
              <Search className="h-3.5 w-3.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="tw-scope w-56" align="start">
            <input
              autoFocus
              value={filterValue.search ?? ''}
              onChange={(e) => column.setFilterValue({ ...filterValue, search: e.target.value })}
              placeholder={`Tìm trong ${label}…`}
              className="h-9 w-full rounded-control border border-input bg-card px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </PopoverContent>
        </Popover>
      )}
      {!!meta?.filterOptions?.length && (
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" aria-label={`Lọc theo ${label}`} className={cn('rounded-badge p-0.5 hover:bg-border/60', filterValue.values?.length && 'text-primary')}>
              <Filter className="h-3.5 w-3.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="tw-scope w-56" align="start">
            <ul className="space-y-1">
              {meta.filterOptions.map((opt) => {
                const checked = filterValue.values?.includes(opt) ?? false;
                return (
                  <li key={opt} className="flex items-center gap-2">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(v) => {
                        const current = filterValue.values ?? [];
                        const values = v ? [...current, opt] : current.filter((x) => x !== opt);
                        column.setFilterValue({ ...filterValue, values });
                      }}
                    />
                    <span className="text-sm">{opt}</span>
                  </li>
                );
              })}
            </ul>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
