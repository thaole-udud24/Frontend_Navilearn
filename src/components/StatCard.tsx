import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

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
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-8 w-20">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth={4} className="text-primary/60" />
    </svg>
  );
}

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  iconClassName?: string;
  sparkline?: number[];
  className?: string;
}

export function StatCard({ icon: Icon, label, value, iconClassName, sparkline, className }: StatCardProps) {
  const reduced = useReducedMotion();
  const display = useCountUp(value, !!reduced);

  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: '0 12px 32px rgba(15, 40, 90, 0.12)' }}
      transition={{ duration: 0.2 }}
      className={cn(
        'flex items-center gap-4 rounded-card border border-border bg-card p-5 shadow-card',
        className,
      )}
    >
      <div
        className={cn(
          'flex h-12 w-12 shrink-0 items-center justify-center rounded-control bg-gradient-to-br from-primary to-primary-hover text-primary-foreground',
          iconClassName,
        )}
      >
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[28px] font-bold leading-tight text-foreground">{display.toLocaleString('vi-VN')}</div>
        <div className="truncate text-sm text-muted-foreground">{label}</div>
      </div>
      {sparkline && sparkline.length > 1 && <Sparkline data={sparkline} />}
    </motion.div>
  );
}
