import { useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Video,
  FileClock,
  GraduationCap,
  ArrowRight,
  CalendarDays,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Card, CardTitle } from '@/components/ui/card';

export type ScheduleType = 'class' | 'deadline' | 'exam';

export interface CalendarEventDay {
  day: number;
  type: ScheduleType;
}

export interface ScheduleItem {
  id: string;
  type: ScheduleType;
  title: string;
  subtitle: string;
  time: string;
  meta: string;
}

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

const TYPE_LABEL: Record<ScheduleType, string> = {
  class: 'Tiết học',
  deadline: 'Deadline',
  exam: 'Lịch thi',
};

const TYPE_DOT: Record<ScheduleType, string> = {
  class: 'bg-primary',
  deadline: 'bg-danger',
  exam: 'bg-success',
};

const TYPE_ICON: Record<ScheduleType, LucideIcon> = {
  class: Video,
  deadline: FileClock,
  exam: GraduationCap,
};

const TYPE_CARD: Record<ScheduleType, string> = {
  class: 'border-primary/20 bg-primary/5',
  deadline: 'border-danger/20 bg-danger/5',
  exam: 'border-success/20 bg-success/5',
};

/** Real month-grid math (not a hardcoded layout) for whichever month/year is passed. */
function buildMonthGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells: { day: number; inMonth: boolean }[] = [];
  for (let i = startOffset; i > 0; i--) cells.push({ day: daysInPrevMonth - i + 1, inMonth: false });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, inMonth: true });
  while (cells.length % 7 !== 0) cells.push({ day: cells.length, inMonth: false });
  return cells;
}

interface CalendarScheduleCardProps {
  year: number;
  month: number; // 0-indexed
  today: number;
  events: CalendarEventDay[];
  schedule: ScheduleItem[];
}

function ScheduleRow({ item }: { item: ScheduleItem }) {
  const Icon = TYPE_ICON[item.type];
  return (
    <div className={cn('flex items-start gap-3 rounded-control border p-3', TYPE_CARD[item.type])}>
      <span
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white',
          TYPE_DOT[item.type],
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold text-foreground">{item.title}</p>
          <span className="shrink-0 text-[11px] font-bold text-muted-foreground">{item.time}</span>
        </div>
        <p className="truncate text-xs text-foreground/80">{item.subtitle}</p>
        <p className="truncate text-[11px] text-muted-foreground">{item.meta}</p>
      </div>
    </div>
  );
}

function ScheduleGroup({ label, items }: { label: string; items: ScheduleItem[] }) {
  if (!items.length) return null;
  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      {items.map((item) => (
        <ScheduleRow key={item.id} item={item} />
      ))}
    </div>
  );
}

export function CalendarScheduleCard({ year, month, today, events, schedule }: CalendarScheduleCardProps) {
  const [offset, setOffset] = useState(0);
  const viewDate = useMemo(() => new Date(year, month + offset, 1), [year, month, offset]);
  const cells = useMemo(() => buildMonthGrid(viewDate.getFullYear(), viewDate.getMonth()), [viewDate]);

  const eventsByDay = useMemo(() => {
    const map = new Map<number, ScheduleType[]>();
    events.forEach((e) => map.set(e.day, [...(map.get(e.day) ?? []), e.type]));
    return map;
  }, [events]);

  const isCurrentMonth = viewDate.getFullYear() === year && viewDate.getMonth() === month;

  // Same-day items carry "H.NAY"/"HẠN" in their time label; anything else is a dated future entry.
  const todayItems = schedule.filter((s) => s.time.startsWith('H.NAY') || s.time.startsWith('HẠN'));
  const upcomingItems = schedule.filter((s) => !todayItems.includes(s));

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[1.3fr_1fr]">
      <Card>
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-primary-soft text-primary">
            <CalendarDays className="h-4.5 w-4.5" />
          </span>
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground">Lịch học tập &amp; Hạn nộp bài</h3>
            <p className="truncate text-xs text-muted-foreground">
              Các buổi học, bài tập và lịch thi trong tháng
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
          {(['class', 'deadline', 'exam'] as const).map((t) => (
            <span key={t} className="flex items-center gap-1.5">
              <span className={cn('h-2 w-2 rounded-full', TYPE_DOT[t])} /> {TYPE_LABEL[t]}
            </span>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setOffset((o) => o - 1)}
            aria-label="Tháng trước"
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold text-foreground">
            Tháng {viewDate.getMonth() + 1}, {viewDate.getFullYear()}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setOffset(0)}
              className="rounded-control border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Hôm nay
            </button>
            <button
              type="button"
              onClick={() => setOffset((o) => o + 1)}
              aria-label="Tháng sau"
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-y-2 text-center text-[11px] font-semibold text-muted-foreground">
          {WEEKDAYS.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-2">
          {cells.map((cell, i) => {
            const dots = isCurrentMonth && cell.inMonth ? (eventsByDay.get(cell.day) ?? []) : [];
            const isToday = isCurrentMonth && cell.inMonth && cell.day === today;
            return (
              <div key={i} className="flex flex-col items-center gap-1 py-0.5">
                <span
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-full text-sm transition-colors',
                    !cell.inMonth && 'text-muted-foreground/35',
                    cell.inMonth && !isToday && 'text-foreground hover:bg-muted',
                    isToday &&
                      'bg-primary font-bold text-primary-foreground shadow-[0_4px_12px_-2px_rgba(78,136,217,0.5)]',
                  )}
                >
                  {cell.day}
                </span>
                <span className="flex h-1.5 gap-0.5">
                  {dots.map((t, j) => (
                    <span key={j} className={cn('h-1.5 w-1.5 rounded-full', TYPE_DOT[t])} />
                  ))}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <CardTitle>Hôm nay &amp; sắp tới</CardTitle>
          <button
            type="button"
            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            Thêm lời nhắc <ArrowRight className="h-3 w-3" />
          </button>
        </div>
        <div className="flex flex-col gap-5">
          <ScheduleGroup label="Hôm nay" items={todayItems} />
          <ScheduleGroup label="Sắp tới" items={upcomingItems} />
          {schedule.length === 0 && <p className="text-sm text-muted-foreground">Chưa có lịch trình nào.</p>}
        </div>
      </Card>
    </div>
  );
}
