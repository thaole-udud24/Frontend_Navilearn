import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Download, FileCheck, LineChart as LineChartIcon, Route, Target, TrendingUp } from 'lucide-react';

import { AppShell } from '@/layouts/AppShell';
import { SubjectFilterPill } from '@/components/GlobalSubjectFilter';
import { useAuthStore } from '@/hooks/useAuth';
import { useSelectedSubject } from '@/hooks/useSubjectStore';
import { PATHS } from '@/routes/paths';
import { studentMenu } from '@/config/menu.student';
import { Button } from '@/components/ui/button';
import { CardGridSkeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { exportMasteryReport, getMasteryTrend, listMasteries, setMasteryGoal } from '@/services/mastery';
import type { Mastery } from '@/services/mastery/types';
import { listGoals } from '@/services/planning';
import { useExamReadiness } from './components/ExamReadinessCard';

const LEVEL_LABEL: Record<Mastery['level'], string> = {
  novice: 'Mới bắt đầu',
  developing: 'Đang tiến bộ',
  proficient: 'Thành thạo',
  mastered: 'Xuất sắc',
};

const LEVEL_TONE: Record<Mastery['level'], string> = {
  novice: 'bg-muted text-muted-foreground',
  developing: 'bg-primary-soft text-primary',
  proficient: 'bg-info/15 text-info',
  mastered: 'bg-primary text-primary-foreground',
};

function conceptName(concept: Mastery['concept']) {
  if (!concept) return 'Kiến thức đã xoá';
  return typeof concept === 'string' ? concept : concept.name;
}

function shortConceptName(name: string) {
  return name.length > 18 ? `${name.slice(0, 16)}…` : name;
}

export default function MasteryPage() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const { selectedSubjectId } = useSelectedSubject();
  const [goalTarget, setGoalTarget] = useState<Mastery | null>(null);
  const [goalValue, setGoalValue] = useState('');
  const [trendTarget, setTrendTarget] = useState<Mastery | null>(null);

  const { data: trend } = useQuery({
    queryKey: ['mastery-trend', trendTarget?._id],
    queryFn: () => getMasteryTrend(trendTarget!._id),
    enabled: !!trendTarget,
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['mastery-list', selectedSubjectId ?? 'all'],
    queryFn: () => listMasteries({ page: 1, limit: 50, subjectId: selectedSubjectId ?? undefined }),
  });

  const { data: goalsRes } = useQuery({
    queryKey: ['mastery-goals', selectedSubjectId ?? 'all'],
    queryFn: () => listGoals({ limit: 50, subjectId: selectedSubjectId ?? undefined }),
  });
  const activeGoals = (goalsRes?.data ?? []).filter((g) => g.status === 'active');
  const primaryGoal = activeGoals[0] ?? null;
  const readiness = useExamReadiness(primaryGoal?._id);

  const items = useMemo(() => data?.data ?? [], [data]);
  const avgMastery = useMemo(() => {
    if (items.length === 0) return readiness.overallMastery ?? 0;
    return Math.round(items.reduce((sum, m) => sum + m.score, 0) / items.length);
  }, [items, readiness.overallMastery]);

  const chartData = useMemo(
    () =>
      items.map((m) => {
        const fullName = conceptName(m.concept);
        return { name: shortConceptName(fullName), fullName, score: m.score };
      }),
    [items],
  );

  const submitGoal = async () => {
    if (!goalTarget) return;
    const value = Number(goalValue);
    if (Number.isNaN(value) || value < 0 || value > 100) {
      toast('Mục tiêu phải là số từ 0 đến 100');
      return;
    }
    await setMasteryGoal(goalTarget._id, value);
    toast('Đã đặt mục tiêu Mastery');
    setGoalTarget(null);
    refetch();
  };

  const handleExport = async () => {
    const report = await exportMasteryReport({});
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bao-cao-mastery.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell
      menu={studentMenu}
      title="Mức độ thành thạo"
      breadcrumb={['Trang chủ', 'Mức độ thành thạo']}
      userName={user?.fullName ?? ''}
      roleLabel="Sinh viên"
      compactHeader
      onLogout={() => {
        logout();
        navigate(PATHS.login);
      }}
    >
      {/* Header row with compact subject filter & export button */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Mức độ thành thạo</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {primaryGoal
              ? `Mục tiêu: ${primaryGoal.title}${primaryGoal.examName ? ` — ${primaryGoal.examName}` : ''}.`
              : 'Theo dõi mức độ nắm vững kiến thức và độ sẵn sàng cho kỳ thi theo từng môn học.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SubjectFilterPill />
          <Button type="button" variant="outline" onClick={handleExport} className="bg-card">
            <Download className="h-4 w-4" /> Xuất báo cáo
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        {/* Mức sẵn sàng thi */}
        <section className="rounded-card border border-border bg-card p-5 shadow-card">
          <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-foreground">Mức sẵn sàng thi</h2>
            <p className="text-xs text-muted-foreground">
              Ba chỉ số riêng biệt — không phải điểm dự đoán kết quả thi thật.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="flex items-center justify-between rounded-xl border border-border bg-muted/20 px-4 py-3.5">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Tiến độ lộ trình</p>
                <p className="mt-1 text-2xl font-bold text-foreground">
                  {readiness.progressPercent != null ? `${readiness.progressPercent}%` : '0%'}
                </p>
              </div>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Route className="h-4 w-4" />
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-primary/40 bg-primary-soft/25 px-4 py-3.5">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Thành thạo (Mastery)</p>
                <p className="mt-1 text-2xl font-bold text-primary">
                  {avgMastery}%
                </p>
              </div>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-primary">
                <TrendingUp className="h-4 w-4" />
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border bg-muted/20 px-4 py-3.5">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Kết quả thi thử</p>
                <p className="mt-1 text-2xl font-bold text-foreground">
                  {readiness.latestMockScore != null ? `${readiness.latestMockScore}%` : 'Chưa có'}
                </p>
              </div>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <FileCheck className="h-4 w-4" />
              </span>
            </div>
          </div>
        </section>

        {/* Tiến độ theo kiến thức */}
        <section className="rounded-card border border-border bg-card p-5 shadow-card">
          <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-foreground">Tiến độ theo kiến thức</h2>
            <span className="text-xs font-medium text-muted-foreground">
              {items.length} chủ đề · Trung bình {avgMastery}%
            </span>
          </div>
          {chartData.length > 0 ? (
            <div className="h-72 rounded-xl border border-border/60 bg-muted/20 p-4">
              <ResponsiveContainer>
                <BarChart data={chartData} margin={{ top: 20, right: 12, left: -12, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                  />
                  <YAxis hide domain={[0, 105]} />
                  <Tooltip
                    formatter={(val) => [`${val ?? 0}%`, 'Thành thạo']}
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName ?? ''}
                  />
                  <Bar
                    dataKey="score"
                    radius={[8, 8, 0, 0]}
                    maxBarSize={48}
                    fill="var(--color-primary, #1d57bd)"
                  >
                    <LabelList
                      dataKey="score"
                      position="top"
                      formatter={(v) => `${v ?? 0}%`}
                      style={{ fontSize: 12, fill: '#475569', fontWeight: 600 }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-44 items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 text-sm text-muted-foreground">
              Chưa có dữ liệu thành thạo cho môn học này.
            </div>
          )}
        </section>

        {isLoading && <CardGridSkeleton count={6} />}

        {/* Grid thẻ chi tiết kiến thức */}
        {!isLoading && items.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((m) => (
              <div
                key={m._id}
                className="flex flex-col gap-2.5 rounded-card border border-border bg-card p-4 shadow-card transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="line-clamp-1 font-semibold text-foreground">
                    {conceptName(m.concept)}
                  </span>
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
                      LEVEL_TONE[m.level],
                    )}
                  >
                    {LEVEL_LABEL[m.level]}
                  </span>
                </div>

                <div
                  className={cn(
                    'text-2xl font-bold',
                    m.score >= 60 ? 'text-primary' : 'text-foreground',
                  )}
                >
                  {m.score}%
                </div>

                <div className="text-xs text-muted-foreground">
                  {m.attemptsCount} lần làm · {m.correctCount} lần đúng
                  {m.goalScore != null && ` · Mục tiêu: ${m.goalScore}%`}
                </div>

                <div className="mt-1 flex items-center gap-3 border-t border-border/60 pt-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setGoalTarget(m);
                      setGoalValue(String(m.goalScore ?? 80));
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground hover:text-primary"
                  >
                    <Target className="h-3.5 w-3.5 text-primary" /> Đặt mục tiêu
                  </button>
                  <button
                    type="button"
                    onClick={() => setTrendTarget(m)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                  >
                    <LineChartIcon className="h-3.5 w-3.5" /> Xu hướng
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!goalTarget} onOpenChange={(v) => !v && setGoalTarget(null)}>
        <DialogContent size="sm" className="tw-scope">
          <DialogHeader>
            <DialogTitle>Đặt mục tiêu Mastery — {goalTarget && conceptName(goalTarget.concept)}</DialogTitle>
          </DialogHeader>
          <Input
            type="number"
            min={0}
            max={100}
            value={goalValue}
            onChange={(e) => setGoalValue(e.target.value)}
            placeholder="Mục tiêu (%)"
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setGoalTarget(null)}>
              Hủy
            </Button>
            <Button type="button" onClick={submitGoal}>
              Lưu mục tiêu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!trendTarget} onOpenChange={(v) => !v && setTrendTarget(null)}>
        <DialogContent size="md" className="tw-scope">
          <DialogHeader>
            <DialogTitle>Xu hướng Mastery — {trendTarget && conceptName(trendTarget.concept)}</DialogTitle>
          </DialogHeader>
          {trend && trend.points.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart
                  data={trend.points.map((p, i) => ({
                    index: i + 1,
                    score: p.score,
                    date: p.at ? new Date(p.at).toLocaleDateString('vi-VN') : `#${i + 1}`,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" stroke="#4e88d9" strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Chưa có đủ dữ liệu lịch sử để vẽ xu hướng.</p>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
