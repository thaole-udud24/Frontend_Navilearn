import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Download, LineChart as LineChartIcon, Target } from 'lucide-react';

import { AppShell } from '@/layouts/AppShell';
import { useAuthStore } from '@/hooks/useAuth';
import { PATHS } from '@/routes/paths';
import { studentMenu } from '@/config/menu.student';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { exportMasteryReport, getMasteryTrend, listMasteries, setMasteryGoal } from '@/services/mastery';
import type { Mastery } from '@/services/mastery/types';

const LEVEL_LABEL: Record<Mastery['level'], string> = {
  novice: 'Mới bắt đầu',
  developing: 'Đang tiến bộ',
  proficient: 'Thành thạo',
  mastered: 'Xuất sắc',
};

const LEVEL_TONE: Record<Mastery['level'], string> = {
  novice: 'bg-muted-foreground/10 text-muted-foreground',
  developing: 'bg-warning/10 text-warning',
  proficient: 'bg-info/10 text-info',
  mastered: 'bg-success/10 text-success',
};

function conceptName(concept: Mastery['concept']) {
  return typeof concept === 'string' ? concept : concept.name;
}

export default function MasteryPage() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const [goalTarget, setGoalTarget] = useState<Mastery | null>(null);
  const [goalValue, setGoalValue] = useState('');
  const [trendTarget, setTrendTarget] = useState<Mastery | null>(null);

  const { data: trend } = useQuery({
    queryKey: ['mastery-trend', trendTarget?._id],
    queryFn: () => getMasteryTrend(trendTarget!._id),
    enabled: !!trendTarget,
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['mastery-list'],
    queryFn: () => listMasteries({ page: 1, limit: 50 }),
  });

  const items = data?.data ?? [];
  const chartData = items.map((m) => ({ name: conceptName(m.concept), score: m.score }));

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
      breadcrumb={['Trang chủ', 'Mastery']}
      userName={user?.fullName ?? ''}
      roleLabel="Sinh viên"
      compactHeader
      onLogout={() => {
        logout();
        navigate(PATHS.login);
      }}
    >
      <h1 className="mb-4 text-xl font-bold text-foreground">Mức độ thành thạo</h1>
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Tiến độ theo kiến thức</h3>
          <Button type="button" variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4" /> Xuất báo cáo
          </Button>
        </div>

        <div className="h-72 rounded-card border border-border bg-card p-4 shadow-card">
          <ResponsiveContainer>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="score" radius={[6, 6, 0, 0]} fill="var(--color-primary, #2563eb)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {isLoading && <p className="text-sm text-muted-foreground">Đang tải…</p>}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((m) => (
            <div
              key={m._id}
              className="flex flex-col gap-2 rounded-card border border-border bg-card p-4 shadow-card"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">{conceptName(m.concept)}</span>
                <span className={`rounded-badge px-2 py-1 text-xs font-semibold ${LEVEL_TONE[m.level]}`}>
                  {LEVEL_LABEL[m.level]}
                </span>
              </div>
              <div className="text-2xl font-bold text-foreground">{m.score}%</div>
              <div className="text-xs text-muted-foreground">
                {m.attemptsCount} lần làm • {m.correctCount} lần đúng
                {m.goalScore != null && ` • Mục tiêu: ${m.goalScore}%`}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="self-start"
                  onClick={() => {
                    setGoalTarget(m);
                    setGoalValue(String(m.goalScore ?? 80));
                  }}
                >
                  <Target className="h-3.5 w-3.5" /> Đặt mục tiêu
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="self-start"
                  onClick={() => setTrendTarget(m)}
                >
                  <LineChartIcon className="h-3.5 w-3.5" /> Xu hướng
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={!!goalTarget} onOpenChange={(v) => !v && setGoalTarget(null)}>
        <DialogContent className="tw-scope max-w-sm">
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
        <DialogContent className="tw-scope max-w-lg">
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
