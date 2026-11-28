import { useEffect, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AlertTriangle, BrainCircuit, FileWarning, Sparkles, Users } from 'lucide-react';

import { AppShell } from '@/layouts/AppShell';
import { adminMenu } from '@/config/menu.admin';
import { StatCard } from '@/components/StatCard';
import { Card, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/StatusBadge';
import { DataTablePage } from '@/components/DataTablePage';
import { fadeUp, pickVariants, staggerContainer } from '@/lib/motion';
import { listUsers } from '@/services/account';
import type { AdminUser } from '@/services/account/account.admin.types';
import { listIssueReports } from '@/services/question-bank';
import { getVolumeReport, getLearningEffectiveness, getTopMissedQuestions } from '@/services/admin-insights';
import type { TopMissedQuestion, VolumeReport } from '@/services/admin-insights/types';
import { getAiAssistAdminOverview } from '@/services/ai-assist';
import type { AiAssistOverviewRecentItem } from '@/services/ai-assist/types';

const ROLE_LABEL: Record<string, string> = {
  student: 'Học sinh',
  admin: 'Quản trị viên',
};

const KIND_LABEL: Record<string, string> = {
  generate_question: 'sinh câu hỏi',
  practice_question: 'luyện tập',
  grade_essay: 'chấm tự luận',
  qa: 'hỏi đáp',
  explain_wrong: 'giải thích câu sai',
  essay_feedback: 'nhận xét tự luận',
  generate_plan: 'sinh lộ trình',
  generate_concept: 'sinh khái niệm',
  generate_template: 'sinh mẫu lộ trình',
};

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.round(diffMs / 60000);
  if (min < 1) return 'Vừa xong';
  if (min < 60) return `${min} phút trước`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} giờ trước`;
  return `${Math.round(hr / 24)} ngày trước`;
}

export default function AdminDashboard() {
  const reduced = useReducedMotion();

  // Re-triggers the entrance animation every few seconds instead of once-on-mount, so the charts
  // visibly keep "running" rather than drawing once and sitting static.
  const [replayTick, setReplayTick] = useState(0);
  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => setReplayTick((t) => t + 1), 6000);
    return () => clearInterval(id);
  }, [reduced]);

  // Real aggregates only, reusing the exact services other admin screens already use — no mock
  // data generator (see the removed src/mocks/dashboardMocks.ts).
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [openIssueReports, setOpenIssueReports] = useState<number | null>(null);
  const [avgMastery, setAvgMastery] = useState<number | null>(null);
  const [aiRequests24h, setAiRequests24h] = useState<number | null>(null);
  const [volume, setVolume] = useState<VolumeReport | null>(null);
  const [topMissed, setTopMissed] = useState<TopMissedQuestion[]>([]);
  const [recentAi, setRecentAi] = useState<AiAssistOverviewRecentItem[]>([]);

  useEffect(() => {
    listUsers({ page: 1, limit: 1 }).then((res) => setTotalUsers(res.meta?.total ?? 0));
    listIssueReports({ status: 'open', page: 1, limit: 1 }).then((res) =>
      setOpenIssueReports(res.meta?.total ?? 0),
    );
    getLearningEffectiveness().then((r) => setAvgMastery(r.summary.avgMasteryScore));
    getVolumeReport(30).then(setVolume);
    getTopMissedQuestions(5).then(setTopMissed);
    getAiAssistAdminOverview().then((o) => {
      setAiRequests24h(o.aiRequests.totalLast24h);
      setRecentAi(o.aiRequests.recent);
    });
  }, []);

  const volumeChartData = useMemo(
    () => (volume?.byDay ?? []).map((d) => ({ day: d.date.slice(5), value: d.attempts })),
    [volume],
  );
  const topMissedChartData = useMemo(
    () =>
      topMissed.map((q) => ({
        label: q.questionText.length > 24 ? `${q.questionText.slice(0, 24)}…` : q.questionText,
        value: q.totalWrongCount,
      })),
    [topMissed],
  );

  const columns: ColumnDef<AdminUser>[] = useMemo(
    () => [
      {
        accessorKey: 'email',
        header: 'Email',
        meta: { enableColumnSearch: true },
      },
      { accessorKey: 'fullName', header: 'Tên', meta: { enableColumnSearch: true } },
      {
        accessorKey: 'role',
        header: 'Vai trò',
        cell: ({ getValue }) => ROLE_LABEL[getValue<string>()] ?? getValue<string>(),
      },
      {
        id: 'status',
        header: 'Trạng thái',
        cell: ({ row }) =>
          !row.original.isActive ? (
            <StatusBadge variant="danger">Đã khoá</StatusBadge>
          ) : !row.original.emailVerified ? (
            <StatusBadge variant="warning">Chờ xác minh</StatusBadge>
          ) : (
            <StatusBadge variant="success">Đang hoạt động</StatusBadge>
          ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Ngày tạo',
        cell: ({ getValue }) => new Date(getValue<string>()).toLocaleDateString('vi-VN'),
      },
    ],
    [],
  );

  const containerVariants = pickVariants(!!reduced, staggerContainer);
  const itemVariants = pickVariants(!!reduced, fadeUp);

  return (
    <AppShell
      menu={adminMenu}
      title="Trang chủ"
      breadcrumb={['Trang chủ']}
      userName="Administrator"
      roleLabel="Quản trị viên"
      compactHeader
      notificationCount={openIssueReports ?? 0}
      area="admin"
    >
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="flex flex-col gap-6"
      >
        <motion.div variants={itemVariants}>
          <h2 className="text-xl font-bold text-foreground">Xin chào, Administrator</h2>
          <p className="text-sm text-muted-foreground">Tổng quan hệ thống NaviLearn</p>
        </motion.div>

        <motion.div variants={itemVariants} className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardTitle className="mb-4">Lượt làm bài 30 ngày qua</CardTitle>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart key={`activity-${replayTick}`} data={volumeChartData}>
                <defs>
                  <linearGradient id="adminActivityFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} interval={4} />
                <YAxis tick={{ fontSize: 11 }} />
                <RTooltip />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  fill="url(#adminActivityFill)"
                  dot={false}
                  isAnimationActive={!reduced}
                  animationDuration={1800}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <CardTitle className="mb-4">Câu hỏi bị làm sai nhiều nhất</CardTitle>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart key={`topmissed-${replayTick}`} data={topMissedChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={0} />
                <YAxis tick={{ fontSize: 11 }} />
                <RTooltip />
                <Bar
                  dataKey="value"
                  fill="var(--primary)"
                  radius={[6, 6, 0, 0]}
                  isAnimationActive={!reduced}
                  animationDuration={1200}
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Users} label="Tổng người dùng" value={totalUsers ?? 0} tone="blue" />
          <StatCard
            icon={FileWarning}
            label="Báo lỗi câu hỏi đang mở"
            value={openIssueReports ?? 0}
            tone="peach"
          />
          <StatCard icon={BrainCircuit} label="Mastery trung bình" value={avgMastery ?? 0} suffix="%" tone="mint" />
          <StatCard
            icon={Sparkles}
            label="Yêu cầu AI (24h qua)"
            value={aiRequests24h ?? 0}
            iconClassName="bg-gradient-to-br from-primary to-primary-hover"
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <h3 className="mb-3 font-semibold text-foreground">Người dùng mới nhất</h3>
          <DataTablePage
            columns={columns}
            getRowId={(r) => r.id}
            searchPlaceholder="Tìm theo: Email, Tên…"
            fetcher={async ({ page, pageSize }) => {
              const res = await listUsers({ page, limit: pageSize });
              return { data: res.data, total: res.meta?.total ?? res.data.length };
            }}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardTitle className="mb-4">Hoạt động AI gần đây</CardTitle>
            {recentAi.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có hoạt động AI nào được ghi nhận</p>
            ) : (
              <ul className="relative space-y-5 pl-4">
                {recentAi.map((entry, i) => (
                  <li key={entry._id} className="relative pl-4">
                    {i < recentAi.length - 1 && (
                      <span className="absolute left-[3px] top-3 h-full w-px bg-border" />
                    )}
                    <span className="absolute left-0 top-1.5 h-2 w-2 rounded-full bg-primary" />
                    <p className="flex items-center gap-2 text-sm text-foreground">
                      {entry.owner?.fullName ?? entry.owner?.email ?? 'Người dùng'} —{' '}
                      {KIND_LABEL[entry.kind] ?? entry.kind}
                      {entry.concept?.name ? ` (${entry.concept.name})` : ''}
                      {!entry.valid && <AlertTriangle className="h-3.5 w-3.5 text-warning" />}
                    </p>
                    <p className="text-xs text-muted-foreground">{timeAgo(entry.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </motion.div>
      </motion.div>
    </AppShell>
  );
}
