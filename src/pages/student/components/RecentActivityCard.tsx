import { CheckCircle2, Sparkles, TrendingUp } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { StatusBadge } from '@/components/StatusBadge';
import type { StudentActivityEntry } from '@/mocks/dashboardMocks';

const ICON: Record<StudentActivityEntry['status'], LucideIcon> = {
  success: CheckCircle2,
  info: TrendingUp,
  ai: Sparkles,
};

const ICON_BG: Record<StudentActivityEntry['status'], string> = {
  success: 'bg-success/15 text-success',
  info: 'bg-primary/15 text-primary',
  ai: 'bg-accent/20 text-accent',
};

const BADGE_VARIANT: Record<StudentActivityEntry['status'], 'success' | 'info' | 'warning'> = {
  success: 'success',
  info: 'info',
  ai: 'warning',
};

export function RecentActivityCard({ items }: { items: StudentActivityEntry[] }) {
  return (
    <div className="rounded-card border border-border bg-card p-5 shadow-card">
      <h3 className="mb-3 font-semibold text-foreground">Hoạt động gần đây</h3>
      <ul className="divide-y divide-border">
        {items.map((entry) => {
          const Icon = ICON[entry.status];
          return (
            <li key={entry.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
              <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-control', ICON_BG[entry.status])}>
                <Icon className="h-4.5 w-4.5" />
              </span>
              <p className="min-w-0 flex-1 truncate text-sm text-foreground">{entry.text}</p>
              <span className="shrink-0 text-xs text-muted-foreground">{entry.time}</span>
              <StatusBadge variant={BADGE_VARIANT[entry.status]} className="shrink-0">
                {entry.statusLabel}
              </StatusBadge>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
