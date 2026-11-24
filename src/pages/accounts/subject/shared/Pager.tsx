import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { ApiMeta } from '@/types/api.d';

interface PagerProps {
  meta: ApiMeta | undefined;
  onPage: (page: number) => void;
}

/** Previous/next pager; renders nothing when everything fits on one page. */
export function Pager({ meta, onPage }: PagerProps) {
  if (!meta || meta.totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
      <span>
        Trang {meta.page}/{meta.totalPages} · {meta.total} mục
      </span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}>
          <ChevronLeft />
          Trước
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={meta.page >= meta.totalPages}
          onClick={() => onPage(meta.page + 1)}
        >
          Sau
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
