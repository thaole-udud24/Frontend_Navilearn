import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useReducedMotion } from 'framer-motion';
import { toast } from 'sonner';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Download,
  Flame,
  Percent,
  Search,
  TrendingUp,
  Video,
  AlertTriangle,
} from 'lucide-react';

import { AppShell } from '@/layouts/AppShell';
import { SubjectFilterPill } from '@/components/GlobalSubjectFilter';
import { useAuthStore } from '@/hooks/useAuth';
import { useSelectedSubject } from '@/hooks/useSubjectStore';
import { PATHS } from '@/routes/paths';
import { studentMenu } from '@/config/menu.student';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toCsv } from '@/utils/csv';
import { listMasteries, exportMasteryReport } from '@/services/mastery';
import type { Mastery } from '@/services/mastery/types';
import { listPlans, listGoals, getDailyPlan } from '@/services/planning';
import { planningKeys } from '@/services/planning/queryKeys';
import { getCardStateStats } from '@/services/card-state';
import { checkReplan, getNextBestAction, startNextBestAction } from '@/services/adaptive';

const conceptName = (c: Mastery['concept']) => (!c ? 'Kiến thức' : typeof c === 'string' ? c : c.name);

const WEEKDAY_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const WEEKDAY_FULL = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
const PRACTICE_COLOR = '#8a5a14';
const STUDY_COLOR = 'var(--primary)';

interface WeeklySessionRow {
  id: string;
  subject: string;
  activity: string;
  date: string;
  progress: number;
  tone: 'done' | 'doing' | 'late' | 'other';
  statusLabel: string;
}

const SESSION_STATUS: Record<string, { tone: WeeklySessionRow['tone']; label: string }> = {
  done: { tone: 'done', label: 'Hoàn thành' },
  planned: { tone: 'doing', label: 'Đang thực hiện' },
  missed: { tone: 'late', label: 'Quá hạn' },
  cancelled: { tone: 'other', label: 'Đã hủy' },
};

const STATUS_PILL: Record<WeeklySessionRow['tone'], string> = {
  done: 'bg-primary-soft text-primary',
  doing: 'bg-muted text-foreground',
  late: 'bg-danger/15 text-danger',
  other: 'bg-muted text-muted-foreground',
};

const BAR_TONE: Record<WeeklySessionRow['tone'], string> = {
  done: 'bg-primary',
  doing: 'bg-primary',
  late: 'bg-danger',
  other: 'bg-muted-foreground/40',
};

const CARD = 'rounded-card border border-border bg-card p-5 shadow-card';

function StatTile({
  label,
  value,
  hint,
  hintTone = 'primary',
  icon: Icon,
  iconClass,
}: {
  label: string;
  value: string;
  hint: string;
  hintTone?: 'primary' | 'danger';
  icon: typeof Flame;
  iconClass: string;
}) {
  return (
    <div className={cn(CARD, 'flex h-full items-center justify-between gap-3')}>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
        <p className={cn('mt-0.5 text-xs font-medium', hintTone === 'danger' ? 'text-danger' : 'text-primary')}>
          {hint}
        </p>
      </div>
      <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-full', iconClass)}>
        <Icon className="h-5 w-5" />
      </span>
    </div>
  );
}

export default function StudentDashboard() {
  const reduced = useReducedMotion();
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const { selectedSubjectId } = useSelectedSubject();
  const [activityRange, setActivityRange] = useState<'7' | '30'>('7');
  const [planSearch, setPlanSearch] = useState('');

  const { data: masteryRes } = useQuery({
    queryKey: ['dashboard-mastery', selectedSubjectId ?? 'all'],
    queryFn: () => listMasteries({ page: 1, limit: 100, subjectId: selectedSubjectId ?? undefined }),
  });
  const masteries = useMemo(() => masteryRes?.data ?? [], [masteryRes]);

  const { data: reportEntries } = useQuery({
    queryKey: ['dashboard-mastery-report', selectedSubjectId ?? 'all'],
    queryFn: () => exportMasteryReport(selectedSubjectId ? { concept: selectedSubjectId } : {}),
  });

  const { data: plansRes } = useQuery({
    queryKey: ['dashboard-plans', 'active', selectedSubjectId ?? 'all'],
    queryFn: () => listPlans({ status: 'active', limit: 20, subjectId: selectedSubjectId ?? undefined }),
  });
  const activePlan = plansRes?.data?.[0];

  const { data: goalsRes } = useQuery({
    queryKey: ['dashboard-goals', selectedSubjectId ?? 'all'],
    queryFn: () => listGoals({ limit: 20, subjectId: selectedSubjectId ?? undefined }),
  });
  const goals = useMemo(() => goalsRes?.data ?? [], [goalsRes]);

  const { data: cardStats } = useQuery({
    queryKey: ['dashboard-card-state-stats', selectedSubjectId ?? 'all'],
    queryFn: () => getCardStateStats(undefined, selectedSubjectId ?? undefined),
  });

  const { data: dailyPlan } = useQuery({
    queryKey: [...planningKeys.daily(), selectedSubjectId ?? 'all'],
    queryFn: () => getDailyPlan(undefined, selectedSubjectId ?? undefined),
  });
  const todayTasks = dailyPlan?.tasks ?? [];
  const todayDone = todayTasks.filter((t) => t.status === 'done').length;

  const { data: replanCheck } = useQuery({
    queryKey: ['dashboard-replan-check', activePlan?._id],
    queryFn: () => checkReplan(activePlan!._id),
    enabled: !!activePlan,
  });

  const { data: nextAction } = useQuery({
    queryKey: ['adaptive', 'next-best-action'],
    queryFn: getNextBestAction,
  });
  const startNextMutation = useMutation({
    mutationFn: startNextBestAction,
    onSuccess: () => {
      toast.success('Đã bắt đầu hoạt động được gợi ý');
      navigate(PATHS.student.practice);
    },
    onError: () => toast.error('Không thể bắt đầu hoạt động này'),
  });

  const { currentStreak, bestStreak } = useMemo(() => {
    const dayMs = 24 * 60 * 60 * 1000;
    const days = new Map<string, number>();
    (reportEntries ?? []).forEach((entry) =>
      entry.history.forEach((h) => {
        if (!h.at) return;
        const d = new Date(h.at);
        d.setHours(0, 0, 0, 0);
        days.set(d.toDateString(), d.getTime());
      }),
    );
    const sorted = [...days.values()].sort((a, b) => a - b);
    if (!sorted.length) return { currentStreak: 0, bestStreak: 0 };
    let best = 1;
    let run = 1;
    for (let i = 1; i < sorted.length; i++) {
      run = sorted[i] - sorted[i - 1] === dayMs ? run + 1 : 1;
      best = Math.max(best, run);
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const last = sorted[sorted.length - 1];
    let current = 0;
    if (today.getTime() - last <= dayMs) {
      current = 1;
      for (let i = sorted.length - 1; i > 0; i--) {
        if (sorted[i] - sorted[i - 1] === dayMs) current++;
        else break;
      }
    }
    return { currentStreak: current, bestStreak: best };
  }, [reportEntries]);

  const masteryDelta = useMemo(() => {
    if (!reportEntries?.length) return null;
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    let nowSum = 0;
    let beforeSum = 0;
    let n = 0;
    reportEntries.forEach((entry) => {
      const sorted = entry.history
        .filter((h): h is typeof h & { at: string } => !!h.at)
        .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
      if (!sorted.length) return;
      let beforeScore = sorted[0].score;
      for (const h of sorted) {
        if (new Date(h.at).getTime() <= cutoff) beforeScore = h.score;
        else break;
      }
      nowSum += entry.score;
      beforeSum += beforeScore;
      n += 1;
    });
    return n ? Math.round(nowSum / n - beforeSum / n) : null;
  }, [reportEntries]);

  const primaryGoal = useMemo(
    () => goals.find((g) => g._id === activePlan?.goal) ?? goals[0],
    [goals, activePlan],
  );
  const primaryGoalDaysLeft = primaryGoal
    ? Math.ceil((new Date(primaryGoal.deadline).getTime() - Date.now()) / (24 * 60 * 60 * 1000))
    : null;

  const studying = masteries.filter((m) => m.learningState === 'LEARNING' || m.learningState === 'PRACTICING').length;
  const needsReview = masteries.filter((m) => m.learningState === 'DECAY_RISK').length;
  const completed = masteries.filter(
    (m) => m.learningState === 'UNDERSTOOD' || m.learningState === 'APPLIED',
  ).length;

  const overallProgress = masteries.length
    ? Math.round(masteries.reduce((sum, m) => sum + m.score, 0) / masteries.length)
    : 0;

  const levelBreakdown = useMemo(() => {
    const mastered = masteries.filter((m) => m.level === 'mastered').length;
    const inProgress = masteries.filter((m) => m.level === 'developing' || m.level === 'proficient').length;
    const notStarted = masteries.filter((m) => m.level === 'novice').length;
    const total = mastered + inProgress + notStarted || 1;
    return [
      { label: 'Hoàn thành', value: Math.round((mastered / total) * 100), color: 'var(--primary)' },
      { label: 'Đang học', value: Math.round((inProgress / total) * 100), color: '#4b5b82' },
      { label: 'Chưa vững', value: Math.round((notStarted / total) * 100), color: PRACTICE_COLOR },
    ];
  }, [masteries]);

  const activitySeries = useMemo(() => {
    const span = Number(activityRange);
    const days = Array.from({ length: span }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (span - 1 - i));
      d.setHours(0, 0, 0, 0);
      return d;
    });
    const buckets = days.map((d) => ({
      day: span === 7 ? WEEKDAY_SHORT[d.getDay()] : `${d.getDate()}/${d.getMonth() + 1}`,
      full: WEEKDAY_FULL[d.getDay()],
      studied: 0,
      practiced: 0,
      key: d.getTime(),
    }));
    (reportEntries ?? []).forEach((entry) => {
      entry.history.forEach((h) => {
        if (!h.at) return;
        const at = new Date(h.at);
        at.setHours(0, 0, 0, 0);
        const bucket = buckets.find((b) => b.key === at.getTime());
        if (!bucket) return;
        if (h.reason === 'content_completed') bucket.studied += 1;
        else bucket.practiced += 1;
      });
    });
    return buckets;
  }, [reportEntries, activityRange]);

  const peak = useMemo(() => {
    if (!activitySeries.length) return null;
    const best = activitySeries.reduce((acc, p) => (p.practiced > acc.practiced ? p : acc), activitySeries[0]);
    return best.practiced > 0 ? best : null;
  }, [activitySeries]);

  const recentActivity = useMemo(() => {
    const events: { text: string; at: Date; label: string }[] = [];
    (reportEntries ?? []).forEach((entry) => {
      entry.history.forEach((h) => {
        if (!h.at) return;
        if (h.reason === 'initial_grading' || h.reason === 'regrade') {
          events.push({
            text: `Làm bài ${conceptName(entry.concept)} — đạt ${h.score}%`,
            at: new Date(h.at),
            label: `${h.score}%`,
          });
        } else if (h.reason === 'content_completed') {
          events.push({
            text: `Hoàn thành nội dung ${conceptName(entry.concept)}`,
            at: new Date(h.at),
            label: 'Xong',
          });
        }
      });
    });
    return events.sort((a, b) => b.at.getTime() - a.at.getTime())[0] ?? null;
  }, [reportEntries]);

  const upcomingItems = useMemo(() => {
    const now = Date.now();
    const sessions = (activePlan?.sessions ?? [])
      .filter((s) => s.status === 'planned' && new Date(s.startAt).getTime() >= now)
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
      .slice(0, 1)
      .map((s) => ({
        id: s._id,
        icon: Video,
        tone: 'primary' as const,
        title: s.title ? `Buổi học ${s.title}` : `Buổi học ${activePlan?.title ?? ''}`,
        sub: `${s.durationMin} phút · ${new Date(s.startAt).toLocaleDateString('vi-VN')}`,
        badge: 'Sắp tới',
      }));
    const exams = [...goals]
      .filter((g) => new Date(g.deadline).getTime() >= now)
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
      .slice(0, 1)
      .map((g) => ({
        id: g._id,
        icon: CalendarCheck,
        tone: 'danger' as const,
        title: `${g.examName || g.title}${g.targetScore != null ? ` (${g.targetScore}đ)` : ''}`,
        sub: `Ưu tiên ${g.importance}/5 · ${new Date(g.deadline).toLocaleDateString('vi-VN')}`,
        badge: 'Lịch thi',
      }));
    const recent = recentActivity
      ? [
          {
            id: 'recent',
            icon: TrendingUp,
            tone: 'info' as const,
            title: recentActivity.text,
            sub: `Hoạt động gần đây · ${recentActivity.at.toLocaleDateString('vi-VN')}`,
            badge: recentActivity.label,
          },
        ]
      : [];
    return [...sessions, ...exams, ...recent];
  }, [activePlan, goals, recentActivity]);

  const weeklySessions = useMemo<WeeklySessionRow[]>(() => {
    if (!activePlan) return [];
    const monday = new Date();
    monday.setHours(0, 0, 0, 0);
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 7);
    return activePlan.sessions
      .filter((s) => {
        const t = new Date(s.startAt).getTime();
        return t >= monday.getTime() && t < sunday.getTime();
      })
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
      .map((s) => {
        const meta = SESSION_STATUS[s.status] ?? SESSION_STATUS.planned;
        return {
          id: s._id,
          subject: activePlan.title,
          activity: `Buổi học (${s.durationMin} phút)`,
          date: new Date(s.startAt).toLocaleDateString('vi-VN'),
          progress: s.status === 'done' ? 100 : s.status === 'planned' ? 25 : s.status === 'missed' ? 50 : 0,
          tone: meta.tone,
          statusLabel: meta.label,
        };
      });
  }, [activePlan]);

  const filteredWeekly = useMemo(() => {
    const q = planSearch.trim().toLowerCase();
    if (!q) return weeklySessions;
    return weeklySessions.filter(
      (r) => r.subject.toLowerCase().includes(q) || r.activity.toLowerCase().includes(q),
    );
  }, [weeklySessions, planSearch]);

  const handleExport = () => {
    const csv = toCsv(filteredWeekly, [
      { header: 'Kế hoạch', value: (r) => r.subject },
      { header: 'Hoạt động', value: (r) => r.activity },
      { header: 'Ngày', value: (r) => r.date },
      { header: 'Tiến độ (%)', value: (r) => r.progress },
      { header: 'Trạng thái', value: (r) => r.statusLabel },
    ]);
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ke-hoach-hoc-tuan-nay.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell
      menu={studentMenu}
      title="Trang chủ"
      breadcrumb={['Trang chủ', 'Tổng quan']}
      userName={user?.fullName ?? ''}
      roleLabel="Sinh viên"
      notificationCount={0}
      compactHeader
      onLogout={() => {
        logout();
        navigate(PATHS.login);
      }}
    >
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-foreground">Tổng quan học tập</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Chào {user?.fullName ?? 'bạn'} — theo dõi tiến độ, thẻ đến hạn và lịch học hôm nay.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <SubjectFilterPill />
            <Button type="button" onClick={() => navigate(PATHS.student.today)}>
              Bắt đầu học ngay <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Row 1 — 4 equal stat tiles */}
        <div className="grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile
            label="Chuỗi ngày học"
            value={`${currentStreak} ngày`}
            hint={`Kỷ lục ${bestStreak} ngày`}
            icon={Flame}
            iconClass="bg-primary-soft text-primary"
          />
          <StatTile
            label="Mastery trung bình"
            value={`${overallProgress}%`}
            hint={
              masteryDelta !== null ? `${masteryDelta >= 0 ? '+' : ''}${masteryDelta}% tuần này` : 'Chưa đủ dữ liệu tuần'
            }
            icon={Percent}
            iconClass="bg-primary-soft text-primary"
          />
          <StatTile
            label="Thẻ đến hạn"
            value={`${cardStats?.due ?? 0} thẻ`}
            hint={(cardStats?.due ?? 0) > 0 ? 'Cần ôn ngay' : 'Đã ôn xong'}
            hintTone={(cardStats?.due ?? 0) > 0 ? 'danger' : 'primary'}
            icon={Clock}
            iconClass="bg-danger/10 text-danger"
          />
          <div className={cn(CARD, 'h-full')}>
            <p className="text-xs text-muted-foreground">Trạng thái chủ đề ({masteries.length})</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {[
                { label: 'Đang học', value: studying, cls: 'text-primary' },
                { label: 'Ôn lại', value: needsReview, cls: 'text-[#8a5a14]' },
                { label: 'Xong', value: completed, cls: 'text-foreground' },
              ].map((t) => (
                <div key={t.label} className="rounded-lg bg-muted/50 px-2 py-2 text-center">
                  <p className={cn('text-lg font-bold leading-none', t.cls)}>{t.value}</p>
                  <p className="mt-1 text-[11px] leading-tight text-muted-foreground">{t.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2 — Today + Goal */}
        <div className="grid items-stretch gap-4 lg:grid-cols-[1fr_1.3fr]">
          <div className={cn(CARD, 'flex h-full flex-col gap-4')}>
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-bold text-foreground">
                Hôm nay ({todayDone}/{todayTasks.length})
              </h3>
              <div className="flex items-center gap-1.5">
                <Button type="button" size="sm" onClick={() => navigate(PATHS.student.today)}>
                  Vào Hôm nay
                </Button>
                <Button type="button" size="sm" variant="secondary" onClick={() => navigate(PATHS.student.practice)}>
                  Luyện nhanh
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-xl border border-[#8a5a14]/40 bg-[#fbf3e6] p-4">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wide text-[#8a5a14]">Việc tiếp theo nên làm</p>
                {nextAction ? (
                  <>
                    <p className="mt-1 text-sm font-semibold text-foreground">Ôn tập chủ đề {nextAction.concept.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{nextAction.reason}</p>
                  </>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Chưa có đủ dữ liệu để gợi ý — hãy làm vài bài luyện tập trước.
                  </p>
                )}
              </div>
              {nextAction && (
                <button
                  type="button"
                  onClick={() => startNextMutation.mutate()}
                  disabled={startNextMutation.isPending}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-control bg-[#8a5a14] px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {startNextMutation.isPending ? 'Đang bắt đầu…' : 'Bắt đầu'} <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="mt-auto border-t border-border pt-3 text-sm text-muted-foreground">
              {replanCheck?.needed ? (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />
                    Cảnh báo rủi ro: {replanCheck.missedCount} phiên học đã quá hạn.
                  </span>
                  <Button type="button" size="sm" variant="outline" onClick={() => navigate(PATHS.student.planner)}>
                    Xem đề xuất
                  </Button>
                </div>
              ) : (
                <span className="flex items-start gap-1.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  Cảnh báo rủi ro: Không có cảnh báo nào — bạn đang theo đúng kế hoạch.
                </span>
              )}
            </div>
          </div>

          <div className={cn(CARD, 'flex h-full flex-col gap-3')}>
            {primaryGoal ? (
              <>
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-bold uppercase tracking-wide text-muted-foreground">Mục tiêu đang ôn</span>
                  <span className="text-muted-foreground">
                    {activePlan?.coverage ? `Đã phủ ${activePlan.coverage.percent}%` : 'Chưa có dữ liệu phạm vi'}
                    {primaryGoalDaysLeft === null
                      ? ''
                      : primaryGoalDaysLeft >= 0
                        ? ` · còn ${primaryGoalDaysLeft} ngày`
                        : ' · đã quá hạn'}
                  </span>
                </div>
                <h3 className="text-base font-bold text-foreground">{primaryGoal.title}</h3>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${activePlan?.coverage?.percent ?? 0}%` }}
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {goals.slice(0, 4).map((g) => (
                    <button
                      key={g._id}
                      type="button"
                      onClick={() => navigate(PATHS.student.planner)}
                      className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                    >
                      {conceptName(g.concept)}
                    </button>
                  ))}
                </div>

                <div className="mt-auto border-t border-border pt-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">Tiến độ tổng các chủ đề</span>
                    <span className="font-semibold text-primary">{overallProgress}% đạt chuẩn</span>
                  </div>
                  <div className="mt-2 flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
                    {levelBreakdown.map((seg) => (
                      <div key={seg.label} style={{ width: `${seg.value}%`, background: seg.color }} />
                    ))}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                    {levelBreakdown.map((seg) => (
                      <span key={seg.label} className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full" style={{ background: seg.color }} />
                        {seg.label} {seg.value}%
                      </span>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
                <p className="text-sm text-muted-foreground">Bạn chưa có mục tiêu ôn thi nào đang chạy.</p>
                <Button type="button" size="sm" onClick={() => navigate(PATHS.student.planner)}>
                  Thiết lập mục tiêu
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Row 3 — Activity + Upcoming */}
        <div className="grid items-stretch gap-4 lg:grid-cols-[1.35fr_1fr]">
          <div className={cn(CARD, 'flex h-full flex-col')}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="font-bold text-foreground">Hoạt động học tập</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {peak ? `Cao điểm: ${peak.practiced} lượt luyện tập vào ${peak.full}` : 'Chưa có hoạt động trong khoảng này'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-primary" /> Đã học
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ background: PRACTICE_COLOR }} /> Luyện tập
                  </span>
                </div>
                <Select value={activityRange} onValueChange={(v) => setActivityRange(v as '7' | '30')}>
                  <SelectTrigger className="h-8 w-[104px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="tw-scope">
                    <SelectItem value="7">7 ngày</SelectItem>
                    <SelectItem value="30">30 ngày</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-3 min-h-[230px] flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activitySeries} margin={{ top: 12, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                    axisLine={false}
                    tickLine={false}
                    interval={activityRange === '30' ? 4 : 0}
                  />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="studied"
                    name="Đã học"
                    stroke={STUDY_COLOR}
                    strokeWidth={2.5}
                    dot={false}
                    isAnimationActive={!reduced}
                  />
                  <Line
                    type="monotone"
                    dataKey="practiced"
                    name="Luyện tập"
                    stroke={PRACTICE_COLOR}
                    strokeWidth={2.5}
                    dot={false}
                    isAnimationActive={!reduced}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={cn(CARD, 'flex h-full flex-col gap-3')}>
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-bold text-foreground">Lịch sắp tới & gần đây</h3>
              <button
                type="button"
                onClick={() => navigate(PATHS.student.planner)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                Xem lịch tháng <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
            {upcomingItems.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">Chưa có lịch trình nào.</p>
            )}
            <div className="flex flex-1 flex-col gap-2.5">
              {upcomingItems.map((it) => {
                const Icon = it.icon;
                return (
                  <div
                    key={it.id}
                    className={cn(
                      'flex flex-1 items-center gap-3 rounded-xl border px-3.5 py-3',
                      it.tone === 'danger' ? 'border-danger/20 bg-danger/5' : 'border-border bg-muted/40',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                        it.tone === 'danger' ? 'bg-danger/10 text-danger' : 'bg-primary-soft text-primary',
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{it.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{it.sub}</p>
                    </div>
                    <span
                      className={cn(
                        'shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold',
                        it.tone === 'danger'
                          ? 'bg-danger/15 text-danger'
                          : it.tone === 'info'
                            ? 'text-primary'
                            : 'bg-primary-soft text-primary',
                      )}
                    >
                      {it.badge}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Row 4 — Weekly plan table */}
        <div className={cn(CARD, 'p-0')}>
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            <div className="flex items-baseline gap-2">
              <h3 className="font-bold text-foreground">Kế hoạch học tuần này</h3>
              <span className="text-xs text-muted-foreground">Tổng số: {weeklySessions.length}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="relative">
                <span className="sr-only">Tìm kế hoạch</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={planSearch}
                  onChange={(e) => setPlanSearch(e.target.value)}
                  placeholder="Tìm kế hoạch, hoạt động..."
                  className="h-9 w-60 rounded-control border border-input bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </label>
              <Button type="button" variant="outline" size="sm" onClick={handleExport} disabled={filteredWeekly.length === 0}>
                <Download className="h-4 w-4" /> Xuất dữ liệu
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="bg-muted/60 text-left text-xs font-bold text-foreground">
                  <th className="px-5 py-2.5">Kế hoạch</th>
                  <th className="px-3 py-2.5">Hoạt động</th>
                  <th className="px-3 py-2.5">Ngày</th>
                  <th className="px-3 py-2.5">Tiến độ</th>
                  <th className="px-3 py-2.5">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {filteredWeekly.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-sm text-muted-foreground">
                      {activePlan ? 'Chưa có buổi học nào trong tuần này' : 'Chưa có kế hoạch học tập — hãy tạo một kế hoạch mới'}
                    </td>
                  </tr>
                )}
                {filteredWeekly.map((r) => (
                  <tr key={r.id} className="border-t border-border/70">
                    <td className="px-5 py-3.5 font-medium text-foreground">{r.subject}</td>
                    <td className="px-3 py-3.5 text-muted-foreground">{r.activity}</td>
                    <td className="px-3 py-3.5 font-mono text-xs text-muted-foreground">{r.date}</td>
                    <td className="px-3 py-3.5">
                      <div className="h-2 w-32 overflow-hidden rounded-full bg-muted">
                        <div className={cn('h-full rounded-full', BAR_TONE[r.tone])} style={{ width: `${r.progress}%` }} />
                      </div>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', STATUS_PILL[r.tone])}>
                        {r.statusLabel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
