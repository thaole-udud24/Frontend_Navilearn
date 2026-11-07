import { ArrowDown, ArrowUp, Settings2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export interface ColumnMeta {
  id: string;
  label: string;
}

interface ColumnVisibilityPopoverProps {
  columns: ColumnMeta[];
  order: string[];
  hidden: Set<string>;
  onToggle: (id: string) => void;
  onMove: (id: string, direction: 'up' | 'down') => void;
  onReset: () => void;
}

/**
 * shortcut: column reordering uses up/down buttons instead of real drag-and-drop
 * (spec explicitly allows this fallback instead of pulling in @dnd-kit). Upgrade
 * to @dnd-kit/core + @dnd-kit/sortable if true drag reordering becomes a requirement.
 */
export function ColumnVisibilityPopover({
  columns,
  order,
  hidden,
  onToggle,
  onMove,
  onReset,
}: ColumnVisibilityPopoverProps) {
  const byId = new Map(columns.map((c) => [c.id, c]));
  const ordered = order.map((id) => byId.get(id)).filter((c): c is ColumnMeta => !!c);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-11 w-11 shrink-0"
          aria-label="Cấu hình cột"
        >
          <Settings2 className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="tw-scope w-64" align="start">
        <div className="mb-2 text-sm font-semibold text-foreground">Hiển thị &amp; thứ tự cột</div>
        <ul className="max-h-72 space-y-1 overflow-auto">
          {ordered.map((col, idx) => (
            <li key={col.id} className="flex items-center gap-2 rounded-control px-1 py-1.5 hover:bg-muted">
              <Checkbox
                checked={!hidden.has(col.id)}
                onCheckedChange={() => onToggle(col.id)}
                aria-label={`Hiện/ẩn cột ${col.label}`}
              />
              <span className="flex-1 truncate text-sm">{col.label}</span>
              <button
                type="button"
                aria-label={`Đưa cột ${col.label} lên`}
                disabled={idx === 0}
                onClick={() => onMove(col.id, 'up')}
                className="rounded-badge p-1 text-muted-foreground hover:bg-muted disabled:pointer-events-none disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                aria-label={`Đưa cột ${col.label} xuống`}
                disabled={idx === ordered.length - 1}
                onClick={() => onMove(col.id, 'down')}
                className="rounded-badge p-1 text-muted-foreground hover:bg-muted disabled:pointer-events-none disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
        <Button variant="outline" size="sm" className="mt-2 w-full" onClick={onReset}>
          Đặt lại
        </Button>
      </PopoverContent>
    </Popover>
  );
}
