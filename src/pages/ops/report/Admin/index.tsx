import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Download, Target, TrendingUp, Users } from 'lucide-react';
import { toast } from 'sonner';

import { AppShell } from '@/layouts/AppShell';
import { useAuthStore } from '@/hooks/useAuth';
import { PATHS } from '@/routes/paths';
import { adminMenu } from '@/config/menu.admin';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatCard } from '@/components/StatCard';
import { saveBlob } from '@/utils/download';
import {
  exportReport,
  getLearningEffectiveness,
  getTopMissedQuestions,
  getVolumeReport,
  listReportSubjects,
} from '@/services/admin-insights';
import type { ReportKind } from '@/services/admin-insights/types';

const REPORT_LABEL: Record<ReportKind, string> = {
  'learning-effectiveness': 'Hiệu quả học tập',
  volume: 'Khối lượng luyện tập/kiểm tra',
  'top-missed': 'Câu hỏi bị sai nhiều nhất',
};

export default function AdminReportItemsPage() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  const [reportKind, setReportKind] = useState<ReportKind>('learning-effectiveness');
  const [subjectId, setSubjectId] = useState<string>('all');
  const [days, setDays] = useState(30);
  const [exporting, setExporting] = useState(false);

  const subjectsQuery = useQuery({ queryKey: ['admin-insights', 'subjects'], queryFn: listReportSubjects });

  const effectivenessQuery = useQuery({
    queryKey: ['admin-insights', 'learning-effectiveness', subjectId],
    queryFn: () => getLearningEffectiveness(subjectId === 'all' ? undefined : subjectId),
    enabled: reportKind === 'learning-effectiveness',
  });

  const volumeQuery = useQuery({
    queryKey: ['admin-insights', 'volume', days],
    queryFn: () => getVolumeReport(days),
    enabled: reportKind === 'volume',
  });

  const topMissedQuery = useQuery({
    queryKey: ['admin-insights', 'top-missed'],
    queryFn: () => getTopMissedQuestions(20),
    enabled: reportKind === 'top-missed',
  });

  const chartData = useMemo(
    () =>
      (effectivenessQuery.data?.bySubject ?? []).map((s) => ({
        name: s.subjectName,
        'Mastery TB': s.avgScore,
        learners: s.learnerCount,
      })),
    [effectivenessQuery.data],
  );

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await exportReport(reportKind, {
        subjectId: reportKind === 'learning-effectiveness' && subjectId !== 'all' ? subjectId : undefined,
        days: reportKind === 'volume' ? days : undefined,
        limit: reportKind === 'top-missed' ? 20 : undefined,
      });
      saveBlob(blob, `bao-cao-${reportKind}-${new Date().toISOString().slice(0, 10)}.csv`);
      toast.success('Đã xuất báo cáo thành công');
    } catch {
      toast.error('Xuất báo cáo thất bại');
    } finally {
      setExporting(false);
    }
  };

  return (
    <AppShell
      menu={adminMenu}
      title="Báo cáo"
      breadcrumb={['Trang chủ', 'Vận hành hệ thống', 'Báo cáo']}
      userName={user?.fullName ?? ''}
      roleLabel="Quản trị viên"
      compactHeader
      area="admin"
      onLogout={() => {
        logout();
        navigate(PATHS.login);
      }}
    >
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Báo cáo</h1>
        <Button type="button" variant="outline" onClick={handleExport} disabled={exporting}>
          <Download className="h-4 w-4" /> {exporting ? 'Đang xuất…' : 'Xuất Excel'}
        </Button>
      </div>

      <Card className="mb-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex min-w-[220px] flex-1 flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground">Báo cáo</span>
            <Select value={reportKind} onValueChange={(v) => setReportKind(v as ReportKind)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="tw-scope">
                {Object.entries(REPORT_LABEL).map(([v, label]) => (
                  <SelectItem key={v} value={v}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          {reportKind === 'learning-effectiveness' && (
            <label className="flex min-w-[180px] flex-1 flex-col gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">Môn</span>
              <Select value={subjectId} onValueChange={setSubjectId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="tw-scope">
                  <SelectItem value="all">Tất cả</SelectItem>
                  {(subjectsQuery.data ?? []).map((s) => (
                    <SelectItem key={s._id} value={s._id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
          )}

          {reportKind === 'volume' && (
            <label className="flex min-w-[160px] flex-1 flex-col gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">Kỳ</span>
              <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="tw-scope">
                  <SelectItem value="7">7 ngày</SelectItem>
                  <SelectItem value="30">30 ngày</SelectItem>
                  <SelectItem value="90">90 ngày</SelectItem>
                </SelectContent>
              </Select>
            </label>
          )}
        </div>
      </Card>

      {reportKind === 'learning-effectiveness' && (
        <>
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard
              icon={Target}
              tone="mint"
              label="Hoàn thành mục tiêu"
              value={effectivenessQuery.data?.summary.goalCompletionRate ?? 0}
              suffix="%"
            />
            <StatCard
              icon={TrendingUp}
              tone="blue"
              label="Mastery trung bình"
              value={effectivenessQuery.data?.summary.avgMasteryScore ?? 0}
              suffix="%"
            />
            <StatCard
              icon={Users}
              tone="amber"
              label="Giữ chân 7 ngày"
              value={effectivenessQuery.data?.summary.retention7dRate ?? 0}
              suffix="%"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Mastery trung bình theo môn học</CardTitle>
            </CardHeader>
            {chartData.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Chưa có đủ dữ liệu Mastery để tổng hợp theo môn.
              </p>
            ) : (
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 16, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="Mastery TB" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </>
      )}

      {reportKind === 'volume' && (
        <>
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <StatCard icon={TrendingUp} tone="blue" label="Tổng lượt làm bài" value={volumeQuery.data?.totalAttempts ?? 0} />
            <StatCard icon={Target} tone="mint" label="Tỉ lệ đạt chung" value={volumeQuery.data?.overallPassRate ?? 0} suffix="%" />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Lượt làm bài theo ngày (UTC)</CardTitle>
            </CardHeader>
            {(volumeQuery.data?.byDay.length ?? 0) === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">Chưa có lượt làm bài nào trong kỳ đã chọn.</p>
            ) : (
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={volumeQuery.data?.byDay} margin={{ top: 16, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="attempts" name="Lượt làm bài" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </>
      )}

      {reportKind === 'top-missed' && (
        <Card className="p-0">
          <div className="grid grid-cols-[1fr_180px_120px_140px] gap-2 border-b border-border bg-muted p-3 text-xs font-semibold">
            <span>Câu hỏi</span>
            <span>Chủ đề</span>
            <span>Tổng lượt sai</span>
            <span>Số học viên từng sai</span>
          </div>
          {(topMissedQuery.data ?? []).length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Chưa có câu hỏi nào bị học viên làm sai (hoặc dữ liệu đã được xử lý hết).
            </p>
          ) : (
            (topMissedQuery.data ?? []).map((q) => (
              <div
                key={q.questionId}
                className="grid grid-cols-[1fr_180px_120px_140px] gap-2 border-b border-border p-3 text-xs last:border-b-0"
              >
                <span className="truncate" title={q.questionText}>
                  {q.questionText}
                </span>
                <span className="text-muted-foreground">{q.conceptName ?? '—'}</span>
                <span className="font-semibold text-foreground">{q.totalWrongCount}</span>
                <span>{q.studentCount}</span>
              </div>
            ))
          )}
        </Card>
      )}
    </AppShell>
  );
}
