import { AnimatePresence, motion } from 'framer-motion';
import { RefreshCw, Search, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { ColumnVisibilityPopover, type ColumnMeta } from './ColumnVisibilityPopover';
import type { BulkAction, ToolbarAction } from './types';

interface ToolbarProps<T> {
  columns: ColumnMeta[];
  order: string[];
  hidden: Set<string>;
  onToggleColumn: (id: string) => void;
  onMoveColumn: (id: string, direction: 'up' | 'down') => void;
  onResetColumns: () => void;
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  total: number;
  isFetching: boolean;
  onRefresh: () => void;
  toolbarActions?: ToolbarAction[];
  selectedRows: T[];
  bulkActions?: BulkAction<T>[];
  onClearSelection: () => void;
}

const EXPORT_FORMATS = ['Excel', 'CSV', 'PDF'] as const;

export function Toolbar<T>({
  columns,
  order,
  hidden,
  onToggleColumn,
  onMoveColumn,
  onResetColumns,
  search,
  onSearchChange,
  searchPlaceholder,
  total,
  isFetching,
  onRefresh,
  toolbarActions,
  selectedRows,
  bulkActions,
  onClearSelection,
}: ToolbarProps<T>) {
  const visibleToolbarActions = toolbarActions?.filter((a) => !a.hidden) ?? [];

  return (
    <div className="relative">
      <div className="flex h-12 items-center gap-2">
        <ColumnVisibilityPopover
          columns={columns}
          order={order}
          hidden={hidden}
          onToggle={onToggleColumn}
          onMove={onMoveColumn}
          onReset={onResetColumns}
        />

        <div className="relative w-[280px] shrink-0">
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-11 w-full rounded-control border border-input bg-card pl-3 pr-16 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
          {search && (
            <button
              type="button"
              aria-label="Xoá tìm kiếm"
              onClick={() => onSearchChange('')}
              className="absolute right-8 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>

        <div className="hidden shrink-0 items-center gap-1 text-sm sm:flex">
          <span className="text-muted-foreground">Tổng số:</span>
          <span className="font-bold text-accent">{total}</span>
        </div>

        <div className="flex-1" />

        <Button
          variant="outline"
          size="icon"
          className="h-11 w-11 shrink-0"
          aria-label="Làm mới dữ liệu"
          onClick={onRefresh}
        >
          <RefreshCw className={cn('h-5 w-5', isFetching && 'animate-spin')} />
        </Button>

        {visibleToolbarActions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="shrink-0 whitespace-nowrap uppercase">
                Chức năng
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="tw-scope">
              {visibleToolbarActions.map((action) => (
                <DropdownMenuItem key={action.key} onSelect={action.onSelect}>
                  {action.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="shrink-0 whitespace-nowrap uppercase">
              Xuất dữ liệu
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="tw-scope">
            {/* shortcut: export actions are stubs for the demo, per spec */}
            {EXPORT_FORMATS.map((format) => (
              <DropdownMenuItem key={format} onSelect={() => console.log(`Xuất dữ liệu (${format})`)}>
                Xuất {format}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AnimatePresence>
        {selectedRows.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="absolute left-0 top-0 z-10 flex h-12 w-full items-center gap-3 rounded-control bg-primary px-3 text-primary-foreground shadow-card"
          >
            <span className="text-sm font-medium">Đã chọn {selectedRows.length} dòng</span>
            <div className="flex-1" />
            {bulkActions?.map((action) => (
              <Button
                key={action.key}
                size="sm"
                variant={action.danger ? 'destructive' : 'secondary'}
                onClick={() => action.onSelect(selectedRows)}
              >
                {action.label}
              </Button>
            ))}
            <Button size="sm" variant="ghost" className="text-primary-foreground hover:bg-white/10" onClick={onClearSelection}>
              Bỏ chọn
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
