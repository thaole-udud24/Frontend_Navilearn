import { ArrowRight, CalendarClock } from 'lucide-react';

import clipboard3d from '@/assets/icons/clipboard-3d.png';

interface NextActionCardProps {
  topic: string;
  dueLabel: string;
  onStart?: () => void;
}

/** Compact peach card that sits beside GoalCard, matching the reference's "Việc tiếp theo" slot. */
export function NextActionCard({ topic, dueLabel, onStart }: NextActionCardProps) {
  return (
    <div className="relative flex flex-1 items-center gap-4 overflow-hidden rounded-card border border-accent/20 bg-accent-soft p-5 shadow-card">
      <span className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-accent/15" aria-hidden />

      <div className="relative min-w-0 flex-1">
        <h3 className="text-sm font-semibold text-accent">Việc tiếp theo</h3>
        <p className="mt-1 text-[15px] font-semibold leading-snug text-foreground">Ôn tập chủ đề {topic}</p>
        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <CalendarClock className="h-3.5 w-3.5" />
          Hạn: {dueLabel}
        </p>
        <button
          type="button"
          onClick={onStart}
          className="mt-3 inline-flex items-center gap-1.5 rounded-control bg-accent px-3.5 py-2 text-xs font-semibold text-accent-foreground transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Bắt đầu học
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <span className="relative hidden h-16 w-16 shrink-0 items-center justify-center sm:flex" aria-hidden>
        <img src={clipboard3d} alt="" className="h-16 w-16 drop-shadow-md" />
      </span>
    </div>
  );
}
