import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowDownRight, ArrowRight, ArrowUpRight, type LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

export type StatTone = 'blue' | 'peach' | 'mint';

const TONE_CARD: Record<StatTone, string> = {
  blue: 'bg-gradient-to-br from-primary-soft to-white border-primary/15',
  peach: 'bg-gradient-to-br from-accent-soft to-white border-accent/20',
  mint: 'bg-gradient-to-br from-mint/35 to-white border-mint-foreground/15',
};

const TONE_ICON: Record<StatTone, string> = {
  blue: 'text-primary',
  peach: 'text-accent',
  mint: 'text-mint-foreground',
};

// shortcut: no icon/pattern library ships a "diagonal corner accent" asset — this is plain CSS
// (a rotated square clipped by the card's own rounded corner), not a downloaded resource.
const TONE_CORNER: Record<StatTone, string> = {
  blue: 'bg-primary/10',
  peach: 'bg-accent/15',
  mint: 'bg-mint-foreground/15',
};

const TREND_CLASS: Record<'up' | 'down', string> = {
  up: 'text-success',
  down: 'text-danger',
};

/** Counts up from 0 to `value` over ~600ms on mount. Skips the animation under prefers-reduced-motion. */
function useCountUp(value: number, reduced: boolean) {
  const [display, setDisplay] = useState(reduced ? value : 0);
  const start = useRef<number | null>(null);

  useEffect(() => {
    if (reduced) {
      setDisplay(value);
      return;
    }
    let raf = 0;
    const duration = 600;
    const step = (ts: number) => {
      if (start.current === null) start.current = ts;
      const progress = Math.min((ts - start.current) / duration, 1);
      setDisplay(Math.round(value * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, reduced]);

  return display;
}

/** Tiny inline SVG sparkline — no chart dependency needed for a single polyline. */
function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * 100},${100 - ((v - min) / range) * 100}`)
    .join(' ');
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="mt-2 h-8 w-full">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth={4} className="text-primary/60" />
    </svg>
  );
}

interface StatCardProps {
  /** Either a lucide icon or an image source (e.g. a downloaded 3D icon) — give exactly one. */
  icon?: LucideIcon;
  iconSrc?: string;
  label: string;
  value: number;
  iconClassName?: string;
  sparkline?: number[];
  className?: string;
  /** Pastel gradient tone for the card itself. Omit to keep the plain white card. */
  tone?: StatTone;
  /** Small trend line under the value, e.g. "12% so với tuần trước". */
  trend?: { direction: 'up' | 'down'; label: string };
  /** Shows a small round arrow button in the top-right corner when provided. */
  onViewMore?: () => void;
}

export function StatCard({
  icon: Icon,
  iconSrc,
  label,
  value,
  iconClassName,
  sparkline,
  className,
  tone,
  trend,
  onViewMore,
}: StatCardProps) {
  const reduced = useReducedMotion();
  const display = useCountUp(value, !!reduced);
  const TrendIcon = trend?.direction === 'down' ? ArrowDownRight : ArrowUpRight;

  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: '0 12px 32px rgba(32, 59, 112, 0.12)' }}
      transition={{ duration: 0.2 }}
      className={cn(
        'relative overflow-hidden rounded-card border border-border bg-card p-5 shadow-card',
        tone && TONE_CARD[tone],
        className,
      )}
    >
      {tone && (
        <span
          className={cn('pointer-events-none absolute -right-8 -top-8 h-24 w-24 rotate-45', TONE_CORNER[tone])}
          aria-hidden
        />
      )}

      {onViewMore && (
        <button
          type="button"
          onClick={onViewMore}
          aria-label={`Xem chi tiết: ${label}`}
          className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-white text-foreground shadow-card transition-transform hover:translate-x-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      )}

      <div className="relative flex items-center gap-2.5">
        <span
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white shadow-card',
            TONE_ICON[tone ?? 'blue'],
            !iconSrc && iconClassName,
          )}
        >
          {iconSrc ? <img src={iconSrc} alt="" className="h-6 w-6" /> : Icon && <Icon className="h-4 w-4" />}
        </span>
        <span className="truncate text-sm font-medium text-foreground">{label}</span>
      </div>

      <div className="relative mt-3 text-[28px] font-bold leading-tight text-foreground">
        {display.toLocaleString('vi-VN')}
      </div>

      {trend && (
        <div className={cn('relative mt-1 flex items-center gap-1 text-xs font-semibold', TREND_CLASS[trend.direction])}>
          <TrendIcon className="h-3.5 w-3.5" />
          {trend.label}
        </div>
      )}
      {sparkline && sparkline.length > 1 && <Sparkline data={sparkline} />}
    </motion.div>
  );
}
