import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Calendar, ChevronLeft, ChevronRight, Clock, ListChecks } from 'lucide-react';

import { AppShell } from '@/layouts/AppShell';
import { SubjectFilterPill } from '@/components/GlobalSubjectFilter';
import { useAuthStore } from '@/hooks/useAuth';
import { useSelectedSubject } from '@/hooks/useSubjectStore';
import { PATHS } from '@/routes/paths';
import { studentMenu } from '@/config/menu.student';
import { Button } from '@/components/ui/button';
import { ListSkeleton } from '@/components/ui/skeleton';
import { getDailyPlan, updateSession } from '@/services/planning';
import { planningKeys } from '@/services/planning/queryKeys';
import { accountKeys } from '@/services/account';
import type { DailyTask } from '@/services/planning/types';
import { SessionQuizDialog } from './components/SessionQuizDialog';
import { STATUS_STYLE } from './components/RoadmapTree';
import type { ApiError } from '@/services/apiError';

// ISO date (YYYY-MM-DD) in the server's day convention (UTC midnight — see planning.service.dayRange).
const toDateParam = (d: Date) => d.toISOString().slice(0, 10);

/** B8 "Hôm nay": a focused checklist of today's tasks, derived from the active plan(s)' sessions —
 * same execution actions as "Lộ trình & kế hoạch", just grouped by calendar day instead of by plan. */
export default function TodayPage() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const { selectedSubjectId } = useSelectedSubject();
  const [dayOffset, setDayOffset] = useState(0);
  const [quizTask, setQuizTask] = useState<DailyTask | null>(null);

  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  const dateParam = toDateParam(date);

  const { data: daily, isLoading } = useQuery({
    queryKey: [...planningKeys.daily(dateParam), selectedSubjectId ?? 'all'],
    queryFn: () => getDailyPlan(dateParam, selectedSubjectId ?? undefined),
  });
  const tasks = daily?.tasks ?? [];

  const actionMutation = useMutation({
    mutationFn: (action: { task: DailyTask; status: 'done' | 'cancelled' }) =>
      updateSession(action.task.planId, action.task.sessionId, { status: action.status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planningKeys.all });
      queryClient.invalidateQueries({ queryKey: accountKeys.streak });
    },
    onError: (err) => toast.error((err as ApiError).message || 'Cập nhật buổi học thất bại'),
  });

  return (
    <AppShell
      menu={studentMenu}
      title="Hôm nay"
      breadcrumb={['Trang chủ', 'Hôm nay']}
      userName={user?.fullName ?? ''}
      roleLabel="Sinh viên"
      compactHeader
      onLogout={() => {
        logout();
        navigate(PATHS.login);
      }}
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Hôm nay — {date.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' })}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Hoàn thành các phiên học trong ngày để giữ vững chuỗi học tập.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <SubjectFilterPill />
          <Button type="button" variant="outline" size="sm" onClick={() => navigate(PATHS.student.planner)}>
            <Calendar className="h-4 w-4 text-primary" /> Xem toàn bộ kế hoạch
          </Button>
          <div className="inline-flex items-center gap-1 rounded-control border border-border bg-card p-1 shadow-sm">
          <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setDayOffset((d) => d - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-3 font-medium"
            onClick={() => setDayOffset(0)}
            disabled={dayOffset === 0}
          >
            Hôm nay
          </Button>
          <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setDayOffset((d) => d + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          </div>
        </div>
      </div>

      {isLoading && <ListSkeleton rows={4} />}
      {!isLoading && tasks.length > 0 && (
        <div className="mb-4 rounded-card border border-border bg-card p-4 shadow-card">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Clock className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">Tiến độ ngày</p>
                <p className="text-xs text-muted-foreground">{tasks.length} phiên học được lên lịch hôm nay</p>
              </div>
            </div>
            <span className="text-base font-bold text-foreground">
              {daily?.completedMinutes ?? 0} / {daily?.totalMinutes ?? 0} phút
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{
                width: `${
                  daily?.totalMinutes
                    ? Math.round(((daily.completedMinutes ?? 0) / daily.totalMinutes) * 100)
                    : 0
                }%`,
              }}
            />
          </div>
        </div>
      )}
      {!isLoading && tasks.length === 0 && (
        <div className="rounded-card border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Không có buổi học nào được xếp cho ngày này.
        </div>
      )}

      <div className="flex flex-col gap-3">
        {tasks.map((t) => {
          const style = STATUS_STYLE[t.status];
          const Icon = style.icon;
          const start = new Date(t.startAt);
          return (
            <div key={t.sessionId} className="rounded-card border border-border bg-card p-4 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <Icon className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" />
                  <div>
                    <div className="mb-1 flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-semibold text-primary">
                        {style.label}
                      </span>
                      <span className="text-muted-foreground">
                        {start.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} · {t.durationMin} phút
                      </span>
                    </div>
                    <p className="text-base font-bold text-foreground">{t.title ?? 'Buổi học'}</p>
                    {t.chapterTitle && <p className="text-xs text-muted-foreground">{t.chapterTitle}</p>}
                    {(t.breakdown?.length ?? 0) > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {t.breakdown!.map((b, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 rounded-md border border-border/70 bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-foreground"
                          >
                            {b.label} · {b.minutes}p
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {t.status === 'planned' && (
                  <div className="flex shrink-0 items-center gap-2">
                    {t.hasQuiz && !t.quizPassed ? (
                      <Button type="button" size="sm" onClick={() => setQuizTask(t)}>
                        <ListChecks className="h-3.5 w-3.5" /> Làm trắc nghiệm
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => actionMutation.mutate({ task: t, status: 'done' })}
                      >
                        Hoàn thành
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => actionMutation.mutate({ task: t, status: 'cancelled' })}
                    >
                      Hủy
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <SessionQuizDialog
        planId={quizTask?.planId ?? ''}
        sessionId={quizTask?.sessionId ?? null}
        questionIds={quizTask?.questions ?? []}
        onClose={() => setQuizTask(null)}
        onPassed={() => {
          queryClient.invalidateQueries({ queryKey: planningKeys.all });
          queryClient.invalidateQueries({ queryKey: accountKeys.streak });
          setQuizTask(null);
        }}
      />
    </AppShell>
  );
}
