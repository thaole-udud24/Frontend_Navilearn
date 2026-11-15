import { useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

interface GoalCardSegment {
  value: number;
  color: string;
}

interface GoalCardProps {
  title: string;
  description: string;
  percent: number;
  segments: GoalCardSegment[];
  onViewDetail?: () => void;
}

const RADIUS = 34;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Blue goal card with an SVG ring (not a static image) showing progress toward the month's plan. */
export function GoalCard({ title, description, percent, segments, onViewDetail }: GoalCardProps) {
  const reduced = useReducedMotion();
  const clamped = Math.min(100, Math.max(0, percent));

  const total = segments.reduce((sum, s) => sum + s.value, 0) || 100;
  let cumulativeLength = 0;
  const arcs = segments.map((seg) => {
    const length = (seg.value / total) * CIRCUMFERENCE;
    const offset = -cumulativeLength;
    cumulativeLength += length;
    return { ...seg, length, offset };
  });

  return (
    <div className="relative flex flex-1 items-center gap-5 overflow-hidden rounded-card bg-gradient-to-br from-primary to-primary-hover p-5 text-white shadow-card">
      <span className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full bg-white/10" aria-hidden />
      <span className="pointer-events-none absolute -bottom-8 right-10 h-20 w-20 rotate-12 rounded-2xl bg-white/10" aria-hidden />

      <div className="relative min-w-0 flex-1">
        <h3 className="text-sm font-semibold text-white/80">{title}</h3>
        <p className="mt-1 text-[15px] font-semibold leading-snug">{description}</p>
        <button
          type="button"
          onClick={onViewDetail}
          className="mt-4 inline-flex items-center gap-1.5 rounded-control bg-white px-3.5 py-2 text-xs font-semibold text-primary transition-colors hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          Xem chi tiết
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="relative h-20 w-20 shrink-0">
        <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
          {arcs.map((arc, i) => (
            <circle
              key={i}
              cx="40"
              cy="40"
              r={RADIUS}
              fill="none"
              stroke={arc.color}
              strokeWidth="8"
              strokeDasharray={`${arc.length} ${CIRCUMFERENCE - arc.length}`}
              strokeDashoffset={arc.offset}
              style={reduced ? undefined : { transition: 'stroke-dasharray 700ms ease-out' }}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-lg font-bold">{clamped}%</div>
      </div>
    </div>
  );
}
