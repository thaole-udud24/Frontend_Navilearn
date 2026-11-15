import { Bar, BarChart, Cell, ResponsiveContainer } from 'recharts';
import { useReducedMotion } from 'framer-motion';

import type { ClassWeekStat } from '@/mocks/dashboardMocks';

interface ClassStatsCardProps {
  data: ClassWeekStat[];
  total: number;
  changePercent: number;
}

/** Varied, non-monochrome palette so the mini bar chart doesn't read as a single flat color. */
const BAR_COLORS = ['var(--primary)', 'var(--mint)', 'var(--accent)', 'var(--warning)', 'var(--primary-hover)'];

/** Compact "class statistics" panel: headline number, % change, small bar chart with the
 * current week highlighted. */
export function ClassStatsCard({ data, total, changePercent }: ClassStatsCardProps) {
  const reduced = useReducedMotion();
  const activeIndex = data.length - 2; // matches the reference's highlighted (not-last) bar

  return (
    <div className="flex h-full flex-col rounded-card border border-border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Thống kê nhóm lớp</h3>
        <span className="text-xs font-bold text-success">+{changePercent.toFixed(1)}%</span>
      </div>
      <div className="mt-2 text-2xl font-bold text-foreground">
        {total} <span className="text-sm font-semibold text-muted-foreground">câu · 26 ngày</span>
      </div>

      <div className="mt-3 h-16">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <Bar dataKey="value" radius={[6, 6, 0, 0]} isAnimationActive={!reduced}>
              {data.map((_, i) => (
                <Cell
                  key={i}
                  fill={BAR_COLORS[i % BAR_COLORS.length]}
                  opacity={i === activeIndex ? 1 : 0.55}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
        {data.map((d) => (
          <span key={d.week}>{d.week}</span>
        ))}
      </div>
    </div>
  );
}
