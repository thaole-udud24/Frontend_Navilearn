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
import {
  AlertTriangle,
  ArrowUpDown,
  Filter,
  Inbox,
  Menu,
  MoreHorizontal,
  RefreshCw,
  Search,
} from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';
import { pickVariants, staggerContainer } from '@/lib/motion';
import { Toolbar } from './Toolbar';
import { Pagination } from './Pagination';
import type { DataTablePageProps, FetchParams, RowAction } from './types';

// Column ids injected by DataTablePage itself; never part of the caller's columns.
const SELECT_COL = '__select';
const INDEX_COL = '__index';
const ACTIONS_COL = '__actions';
const SELECT_COL_WIDTH = 44;

/** Reusable 2-line clamp + native title tooltip for long cell text (spec 2.2). */
export function ClampLine({ text, lines = 2 }: { text: string; lines?: number }) {
  return (
    <span
      title={text}
      className={cn('block whitespace-normal', lines === 2 ? 'line-clamp-2' : 'line-clamp-3')}
    >
      {text}
    </span>
  );
}

/** Single compact trigger for the actions column — a wide icon row per action pushed every table
 * too wide, so this collapses back to one handle; hovering (not clicking) reveals the full list. */
/** Exported so a page with its own hand-rolled table (e.g. Account admin, which needs stats cards
 * driven by the same query and can't hand data-fetching over to DataTablePage) still gets the same
 * actions-menu look and behavior as every table that does use DataTablePage. */
export function ActionsMenu<T>({
  actions,
  row,
  onDelete,
}: {
  actions: RowAction<T>[];
  row: T;
  onDelete: (row: T) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Thao tác"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          className="flex h-9 w-9 items-center justify-center rounded-control text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Menu className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="tw-scope w-56 p-1"
      >
        {actions.map((action) => (
          <button
            key={action.key}
            type="button"
            onClick={() => {
              setOpen(false);
              action.key === 'delete' ? onDelete(row) : action.onSelect(row);
            }}
            className={cn(
              'flex w-full items-center gap-2 rounded-control px-2 py-1.5 text-left text-sm text-foreground hover:bg-muted [&_svg]:h-4 [&_svg]:w-4',
              action.danger && 'text-danger hover:bg-danger/10',
            )}
          >
            {action.icon ?? <MoreHorizontal className="h-4 w-4" />}
            {action.label}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

function filterFnWithChrome(
  row: { getValue: (id: string) => unknown },
  columnId: string,
  filterValue: { search?: string; values?: string[] },
) {
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
  searchPlaceholder = 'Tìm theo: Mã, Tên…',
  emptyLabel = 'Không có dữ liệu',
  onDataChange,
  rowClassName,
}: DataTablePageProps<T>) {
  const reduced = useReducedMotion();
  const isManual = !!fetcher;

  // Paging/sorting/search/filters are plain component state, not reflected in the URL — keeps the
  // address bar clean (no page/pageSize/sortBy/search query params for list screens).
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});
  const [userColumnOrder, setUserColumnOrder] = useState<string[]>(() =>
    columns.map((c) => String(c.id ?? (c as { accessorKey?: string }).accessorKey)),
  );
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  // Per-table column widths, remembered per browser (searchPlaceholder is already a distinct label
  // every caller passes, so it doubles as a cheap storage key without adding a required prop).
  const columnSizingKey = `dtp:colsize:${searchPlaceholder}`;
  const [columnSizing, setColumnSizing] = useState<Record<string, number>>(() => {
    try {
      return JSON.parse(localStorage.getItem(columnSizingKey) ?? '{}');
    } catch {
      return {};
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(columnSizingKey, JSON.stringify(columnSizing));
    } catch {
      // ignore (private browsing / storage full)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnSizing]);
  const [scrolledRight, setScrolledRight] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<T | null>(null);

  const debouncedSearch = useDebounce(globalFilter, 300);

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
        onDataChange?.(res.data, { total: res.total });
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
  }, [
    fetcher,
    pagination.pageIndex,
    pagination.pageSize,
    debouncedSearch,
    sorting,
    columnFilters,
    reloadToken.current,
  ]);

  const fullColumnOrder = useMemo(
    () => [SELECT_COL, INDEX_COL, ...userColumnOrder, ACTIONS_COL],
    [userColumnOrder],
  );

  const tableColumns = useMemo<ColumnDef<T>[]>(() => {
    const wrapped = columns.map((col) => {
      const label = typeof col.header === 'string' ? col.header : undefined;
      const meta = col.meta as { enableColumnSearch?: boolean; filterOptions?: string[] } | undefined;
      const hasChrome = !!meta?.enableColumnSearch || !!meta?.filterOptions?.length;
      // A caller that doesn't size its column (most don't) used to get a flat 200px regardless of
      // whether the header says "Vai trò" or "Đăng nhập gần nhất" — estimate from the label's own
      // length instead, so a short column starts short and a long one starts with room to breathe.
      // Chrome (sort/search/filter icons) needs its own ~70px regardless of label length.
      const estimatedSize = label ? Math.round(label.length * 8.5) + (hasChrome ? 80 : 48) : undefined;
      return {
        ...col,
        size: col.size ?? (estimatedSize ? Math.max(90, Math.min(320, estimatedSize)) : undefined),
        minSize:
          col.minSize ?? (estimatedSize ? Math.max(72, Math.min(160, estimatedSize * 0.7)) : undefined),
        filterFn: hasChrome ? filterFnWithChrome : col.filterFn,
        header: label
          ? (ctx: {
              column: {
                id: string;
                getCanSort: () => boolean;
                getIsSorted: () => false | 'asc' | 'desc';
                toggleSorting: (desc?: boolean) => void;
                getFilterValue: () => unknown;
                setFilterValue: (v: unknown) => void;
              };
            }) => <ColumnHeaderCell label={label} column={ctx.column} meta={meta} />
          : col.header,
      } as ColumnDef<T>;
    });

    const selectCol: ColumnDef<T> = {
      id: SELECT_COL,
      // minSize/maxSize must be declared too — left unset, they fall back to defaultColumn's
      // minSize (120), which *clamps* this column's rendered width up from 44 regardless of
      // `size`. That mismatch between the declared 44 and the actually-rendered ~120 is what threw
      // off every sticky-column offset calculated against SELECT_COL_WIDTH.
      size: SELECT_COL_WIDTH,
      minSize: SELECT_COL_WIDTH,
      maxSize: SELECT_COL_WIDTH,
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
      minSize: 48,
      maxSize: 60,
      cell: ({ row, table }) =>
        (isManual ? table.getState().pagination.pageIndex * table.getState().pagination.pageSize : 0) +
        row.index +
        1,
      enableSorting: false,
    };

    const actionsCol: ColumnDef<T> = {
      id: ACTIONS_COL,
      header: 'Thao tác',
      size: 56,
      minSize: 48,
      maxSize: 60,
      enableSorting: false,
      cell: ({ row }) => {
        const visible = rowActions?.filter((a) => !a.hidden?.(row.original)) ?? [];
        if (!visible.length) return null;
        return <ActionsMenu actions={visible} row={row.original} onDelete={setDeleteTarget} />;
      },
    };

    return [selectCol, indexCol, ...wrapped, actionsCol];
  }, [columns, rowActions, isManual]);

  const tableData = isManual ? remoteRows : (staticData ?? []);

  const table = useReactTable({
    data: tableData,
    columns: tableColumns,
    // A column with no explicit size would otherwise default to 150 — too narrow for a short label
    // plus its sort/search/filter icons, which is what forced text to wrap mid-word. minSize only
    // floors manual resize-drag; keep it low; a short, legitimately-narrow column (e.g. a badge or
    // the fixed system columns below) must not get silently widened by it the way 120 just did.
    defaultColumn: { size: 200, minSize: 60 },
    columnResizeMode: 'onChange',
    getRowId: (row) => getRowId(row),
    state: {
      pagination,
      sorting,
      globalFilter: debouncedSearch,
      columnFilters,
      columnVisibility,
      columnOrder: fullColumnOrder,
      rowSelection,
      columnSizing,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onColumnSizingChange: setColumnSizing,
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
    setColumnSizing({});
  };

  const containerVariants = pickVariants(!!reduced, staggerContainer);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-w-0 rounded-card border border-border bg-card shadow-card"
    >
      <div className="p-3">
        <Toolbar
          columns={columnMetaList}
          order={userColumnOrder}
          hidden={
            new Set(
              Object.entries(columnVisibility)
                .filter(([, v]) => v === false)
                .map(([k]) => k),
            )
          }
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
          <colgroup>
            {table
              .getHeaderGroups()[0]
              ?.headers.map((header) => (
                <col
                  key={header.id}
                  style={{ width: header.getSize(), minWidth: header.column.columnDef.minSize }}
                />
              ))}
          </colgroup>
          <TableHeader className="sticky top-0 z-20 bg-muted">
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="border-b border-border">
                {hg.headers.map((header) => {
                  const isFixedCol =
                    header.column.id === SELECT_COL ||
                    header.column.id === INDEX_COL ||
                    header.column.id === ACTIONS_COL;
                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        'relative h-14 whitespace-nowrap border-r border-border/70 text-[14px] font-semibold text-foreground last:border-r-0',
                        header.column.id === SELECT_COL && 'sticky left-0 z-30 bg-muted',
                        header.column.id === INDEX_COL && `sticky z-30 bg-muted`,
                        header.column.id === ACTIONS_COL &&
                          cn(
                            'sticky right-0 z-30 bg-muted',
                            scrolledRight && 'shadow-[-6px_0_8px_-4px_rgba(15,40,90,0.15)]',
                          ),
                      )}
                      style={header.column.id === INDEX_COL ? { left: SELECT_COL_WIDTH } : undefined}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                      {!isFixedCol && (
                        <div
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          onDoubleClick={() => header.column.resetSize()}
                          title="Kéo để đổi độ rộng — nhấp đúp để khôi phục mặc định"
                          className="group/resize absolute right-0 top-0 z-10 flex h-full w-2.5 cursor-col-resize touch-none select-none items-center justify-center"
                        >
                          <div
                            className={cn(
                              'h-2/5 w-[3px] rounded-full bg-border/80 transition-colors group-hover/resize:h-3/5 group-hover/resize:bg-primary',
                              header.column.getIsResizing() && 'h-3/5 bg-primary',
                            )}
                          />
                        </div>
                      )}
                    </TableHead>
                  );
                })}
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
                <TableRow
                  key={row.id}
                  className={cn('group h-14 border-b border-border hover:bg-muted/40', rowClassName?.(row.original))}
                  data-state={row.getIsSelected() ? 'selected' : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        'whitespace-nowrap py-2 align-middle',
                        cell.column.id === SELECT_COL && 'sticky left-0 z-10 bg-card group-hover:bg-muted/40',
                        cell.column.id === INDEX_COL && 'sticky z-10 bg-card group-hover:bg-muted/40',
                        cell.column.id === ACTIONS_COL &&
                          cn(
                            'sticky right-0 z-10 bg-card group-hover:bg-muted/40',
                            scrolledRight && 'shadow-[-6px_0_8px_-4px_rgba(15,40,90,0.15)]',
                          ),
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
            <button
              type="button"
              aria-label={`Tìm trong ${label}`}
              className="rounded-badge p-0.5 hover:bg-border/60"
            >
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
            <button
              type="button"
              aria-label={`Lọc theo ${label}`}
              className={cn(
                'rounded-badge p-0.5 hover:bg-border/60',
                filterValue.values?.length && 'text-primary',
              )}
            >
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
