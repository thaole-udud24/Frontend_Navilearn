import { useState } from 'react';
import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

/** Builds a condensed page list like 1 2 3 … 9 (null = ellipsis). */
function buildPageRange(current: number, totalPages: number): (number | null)[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages = new Set([1, totalPages, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const result: (number | null)[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) result.push(null);
    result.push(p);
  });
  return result;
}

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function Pagination({ page, pageSize, total, onPageChange, onPageSizeChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const [jumpValue, setJumpValue] = useState('');

  const goTo = (p: number) => onPageChange(Math.min(Math.max(1, p), totalPages));

  const handleJump = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    const n = Number(jumpValue);
    if (Number.isFinite(n) && n > 0) goTo(n);
    setJumpValue('');
  };

  return (
    <div className="flex h-14 flex-col items-center justify-between gap-2 border-t border-border px-4 py-2 text-sm sm:flex-row">
      <div className="hidden text-muted-foreground sm:block">
        Hiển thị {start}–{end} / {total} bản ghi
      </div>

      <div className="hidden items-center gap-2 sm:flex">
        <span className="text-muted-foreground">Số dòng/trang</span>
        <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
          <SelectTrigger className="h-9 w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="tw-scope">
            {PAGE_SIZE_OPTIONS.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Responsive <768px: collapsed "‹ 2 / 9 ›" form */}
      <div className="flex items-center gap-1 sm:hidden">
        <button
          type="button"
          aria-label="Trang trước"
          disabled={page <= 1}
          onClick={() => goTo(page - 1)}
          className="rounded-control px-2 py-1 disabled:pointer-events-none disabled:opacity-40"
        >
          ‹
        </button>
        <span>
          {page} / {totalPages}
        </span>
        <button
          type="button"
          aria-label="Trang sau"
          disabled={page >= totalPages}
          onClick={() => goTo(page + 1)}
          className="rounded-control px-2 py-1 disabled:pointer-events-none disabled:opacity-40"
        >
          ›
        </button>
      </div>

      <div className="hidden items-center gap-1 sm:flex">
        <button
          type="button"
          onClick={() => goTo(page - 1)}
          disabled={page <= 1}
          className="rounded-control px-2 py-1.5 text-sm text-foreground hover:bg-muted disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          ‹ Trước
        </button>
        {buildPageRange(page, totalPages).map((p, i) =>
          p === null ? (
            <span key={`e${i}`} className="px-1 text-muted-foreground">
              …
            </span>
          ) : (
            <motion.button
              key={p}
              type="button"
              onClick={() => goTo(p)}
              layout
              transition={{ duration: 0.15 }}
              className={cn(
                'min-w-[32px] rounded-control px-2 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                p === page ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted',
              )}
            >
              {p}
            </motion.button>
          ),
        )}
        <button
          type="button"
          onClick={() => goTo(page + 1)}
          disabled={page >= totalPages}
          className="rounded-control px-2 py-1.5 text-sm text-foreground hover:bg-muted disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          Sau ›
        </button>
        <input
          type="number"
          min={1}
          max={totalPages}
          value={jumpValue}
          onChange={(e) => setJumpValue(e.target.value)}
          onKeyDown={handleJump}
          placeholder="Đến trang"
          aria-label="Đến trang"
          className="ml-2 h-9 w-20 rounded-control border border-input bg-card px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
      </div>
    </div>
  );
}
