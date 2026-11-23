import { Sparkles, UploadCloud, UserRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RecordSource } from '@/types/api.d';

const SOURCE_STYLE: Record<RecordSource, { label: string; icon: typeof UserRound; className: string }> = {
  manual: { label: 'Thủ công', icon: UserRound, className: 'bg-muted-foreground/10 text-muted-foreground' },
  ai: { label: 'AI sinh', icon: Sparkles, className: 'bg-primary/10 text-primary' },
  import: { label: 'Nhập liệu', icon: UploadCloud, className: 'bg-info/10 text-info' },
};

/** Who/what produced a record — shown next to admin-editable content everywhere it can come from
 * more than one path (manual form, AI draft, bulk import), so the source is never ambiguous. */
export function SourceBadge({ source }: { source?: RecordSource }) {
  const style = SOURCE_STYLE[source ?? 'manual'];
  const Icon = style.icon;
  return (
    <span
      className={cn(
        'inline-flex w-fit items-center gap-1 whitespace-nowrap rounded-badge px-2 py-1 text-xs font-semibold',
        style.className,
      )}
    >
      <Icon className="h-3 w-3" /> {style.label}
    </span>
  );
}
