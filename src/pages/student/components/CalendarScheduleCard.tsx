import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Video, FileClock, GraduationCap, ArrowRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { CalendarEventDay, ScheduleItem, ScheduleType } from '@/mocks/dashboardMocks';

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

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

/** Real month-grid math (not a hardcoded layout) for whichever month/year is passed, with mock
 * event dots overlaid — there's no calendar/scheduling backend module yet, so dates are mock data. */
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

  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-card border border-border bg-card p-5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="flex items-center gap-2 font-semibold text-foreground">Lịch học tập &amp; Hạn nộp bài</h3>
            <p className="text-xs text-muted-foreground">Quản lý các buổi học, bài tập và lịch thi tháng {viewDate.getMonth() + 1}/{viewDate.getFullYear()}</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary" /> Tiết học</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-danger" /> Deadline</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-success" /> Lịch thi</span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <button type="button" onClick={() => setOffset((o) => o - 1)} className="rounded-control p-1 text-muted-foreground hover:bg-muted">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold text-foreground">
            Tháng {viewDate.getMonth() + 1}, {viewDate.getFullYear()}
          </span>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setOffset(0)} className="rounded-control border border-border px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted">
              Hôm nay
            </button>
            <button type="button" onClick={() => setOffset((o) => o + 1)} className="rounded-control p-1 text-muted-foreground hover:bg-muted">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-muted-foreground">
          {WEEKDAYS.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {cells.map((cell, i) => {
            const dots = isCurrentMonth && cell.inMonth ? eventsByDay.get(cell.day) ?? [] : [];
            const isToday = isCurrentMonth && cell.inMonth && cell.day === today;
            return (
              <div key={i} className="flex flex-col items-center gap-0.5 py-1">
                <span
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full text-xs',
                    !cell.inMonth && 'text-muted-foreground/40',
                    cell.inMonth && !isToday && 'text-foreground',
                    isToday && 'bg-primary font-bold text-primary-foreground',
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
      </div>

      <div className="rounded-card border border-border bg-card p-5 shadow-card">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Lịch trình hôm nay &amp; sắp tới</h3>
          <button type="button" className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
            Thêm lời nhắc <ArrowRight className="h-3 w-3" />
          </button>
        </div>
        <div className="flex flex-col gap-2.5">
          {schedule.map((item) => {
            const Icon = TYPE_ICON[item.type];
            return (
              <div key={item.id} className={cn('flex items-start gap-3 rounded-control border p-3', TYPE_CARD[item.type])}>
                <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white', TYPE_DOT[item.type])}>
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
          })}
        </div>
      </div>
    </div>
  );
}
