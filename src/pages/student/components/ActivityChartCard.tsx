import { useReducedMotion } from 'framer-motion';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';

export interface ActivityPoint {
  day: string;
  studied: number;
  practiced: number;
}

interface ChartTooltipEntry {
  dataKey?: string;
  name?: string;
  value?: number;
  color?: string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: ChartTooltipEntry[];
  label?: string;
}

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-control border border-border bg-card px-3 py-2 text-xs shadow-card">
      <div className="mb-1 font-semibold text-foreground">{label}</div>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-1.5" style={{ color: entry.color }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: entry.color }} />
          {entry.name}: <span className="font-semibold">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

interface ActivityChartCardProps {
  data: ActivityPoint[];
}

/** Real, data-driven two-line chart (not a chart screenshot) for weekly learning activity. */
export function ActivityChartCard({ data }: ActivityChartCardProps) {
  const reduced = useReducedMotion();
  const peak = data.length ? data.reduce((best, p, i) => (p.studied > data[best].studied ? i : best), 0) : -1;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hoạt động học tập</CardTitle>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-primary" /> Đã học
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-success" /> Luyện tập
            </span>
          </div>
          <Select defaultValue="7">
            <SelectTrigger className="h-8 w-[110px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="tw-scope">
              <SelectItem value="7">7 ngày</SelectItem>
              <SelectItem value="30">30 ngày</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <div className="mt-2 h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 24, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<ChartTooltip />} />
            <Line
              type="monotone"
              dataKey="studied"
              name="Đã học"
              stroke="var(--primary)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5 }}
              isAnimationActive={!reduced}
            />
            <Line
              type="monotone"
              dataKey="practiced"
              name="Luyện tập"
              stroke="var(--success)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5 }}
              isAnimationActive={!reduced}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {peak >= 0 && (
        <p className="text-center text-xs text-muted-foreground">
          Cao điểm: <span className="font-semibold text-foreground">{data[peak].studied} lượt</span> vào{' '}
          {data[peak].day}
        </p>
      )}
    </Card>
  );
}
