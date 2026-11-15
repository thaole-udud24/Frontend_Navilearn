import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type CourseTone = 'blue' | 'peach' | 'mint';

const TONE_BG: Record<CourseTone, string> = {
  blue: 'bg-gradient-to-br from-primary-soft to-primary/30',
  peach: 'bg-gradient-to-br from-accent-soft to-accent/40',
  mint: 'bg-gradient-to-br from-mint/30 to-mint/70',
};

const TONE_SHAPE: Record<CourseTone, string> = {
  blue: 'bg-primary/70',
  peach: 'bg-accent',
  mint: 'bg-mint-foreground/60',
};

const TONE_ICON: Record<CourseTone, string> = {
  blue: 'text-primary',
  peach: 'text-accent',
  mint: 'text-mint-foreground',
};

/** Small abstract illustration for a course card: a soft tinted field with a couple of
 * overlapping organic shapes plus the subject's icon — not a plain solid-color rectangle. */
export function CourseThumb({ tone, icon: Icon }: { tone: CourseTone; icon: LucideIcon }) {
  return (
    <div className={cn('relative h-20 w-full overflow-hidden rounded-control', TONE_BG[tone])} aria-hidden>
      <span className={cn('absolute -right-4 -top-5 h-16 w-16 rounded-full opacity-50', TONE_SHAPE[tone])} />
      <span className={cn('absolute -bottom-6 -left-3 h-14 w-14 rounded-full opacity-30', TONE_SHAPE[tone])} />
      <span
        className={cn(
          'absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/80 shadow-sm',
          TONE_ICON[tone],
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
    </div>
  );
}
