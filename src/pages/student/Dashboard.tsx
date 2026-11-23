import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { motion, useReducedMotion } from 'framer-motion';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { Award, CheckCircle2, Sun } from 'lucide-react';

import { AppShell } from '@/layouts/AppShell';
import { useAuthStore } from '@/hooks/useAuth';
import { PATHS } from '@/routes/paths';
import { studentMenu } from '@/config/menu.student';
import { StatCard } from '@/components/StatCard';
import { StatusBadge } from '@/components/StatusBadge';
import { DataTablePage } from '@/components/DataTablePage';
import { fadeUp, pickVariants, staggerContainer } from '@/lib/motion';
import { listMasteries, exportMasteryReport } from '@/services/mastery';
import type { Mastery } from '@/services/mastery/types';
import { listPlans, listGoals } from '@/services/planning';

import { HeroBanner } from './components/HeroBanner';
import { NextBestActionCard } from './components/NextBestActionCard';
import { ActivityChartCard, type ActivityPoint } from './components/ActivityChartCard';
import { RecentActivityCard, type StudentActivityEntry } from './components/RecentActivityCard';
import { CalendarScheduleCard, type ScheduleItem } from './components/CalendarScheduleCard';

const conceptName = (c: Mastery['concept']) => (typeof c === 'string' ? c : c.name);

const WEEKDAY_LABEL = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

interface WeeklySessionRow {
  id: string;
  subject: string;
  activity: string;
  deadline: string;
  progress: number;
  status: 'success' | 'warning' | 'danger' | 'info';
  statusLabel: string;
}

const SESSION_STATUS_LABEL: Record<string, { status: WeeklySessionRow['status']; label: string }> = {
  done: { status: 'success', label: 'Hoàn thành' },
  planned: { status: 'info', label: 'Đang thực hiện' },
  missed: { status: 'danger', label: 'Quá hạn' },
  cancelled: { status: 'warning', label: 'Đã hủy' },
};

export default function StudentDashboard() {
  const reduced = useReducedMotion();
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  const { data: masteryRes } = useQuery({
    queryKey: ['dashboard-mastery'],
    queryFn: () => listMasteries({ page: 1, limit: 100 }),
  });
  const masteries = useMemo(() => masteryRes?.data ?? [], [masteryRes]);

  const { data: reportEntries } = useQuery({
    queryKey: ['dashboard-mastery-report'],
    queryFn: () => exportMasteryReport({}),
  });

  const { data: plansRes } = useQuery({
    queryKey: ['dashboard-plans', 'active'],
    queryFn: () => listPlans({ status: 'active', limit: 20 }),
  });
  const activePlan = plansRes?.data?.[0];

  const { data: goalsRes } = useQuery({
    queryKey: ['dashboard-goals'],
    queryFn: () => listGoals({ limit: 20 }),
  });
  const goals = useMemo(() => goalsRes?.data ?? [], [goalsRes]);

  const studying = masteries.filter(
    (m) => m.learningState === 'LEARNING' || m.learningState === 'PRACTICING',
  ).length;
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
      { label: 'Hoàn thành', value: Math.round((mastered / total) * 100), color: 'var(--success)' },
      { label: 'Đang học', value: Math.round((inProgress / total) * 100), color: 'var(--primary)' },
      { label: 'Chưa vững', value: Math.round((notStarted / total) * 100), color: 'var(--warning)' },
    ];
  }, [masteries]);

  // Mastery history across all concepts, last 7 days: "Đã học" = nội dung hoàn thành, "Luyện tập" = lượt làm bài.
  const activitySeries = useMemo<ActivityPoint[]>(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      d.setHours(0, 0, 0, 0);
      return d;
    });
    const buckets = days.map((d) => ({
      day: WEEKDAY_LABEL[d.getDay()],
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
    return buckets.map(({ day, studied, practiced }) => ({ day, studied, practiced }));
  }, [reportEntries]);

  const recentActivity = useMemo<StudentActivityEntry[]>(() => {
    const events: { text: string; at: Date; status: StudentActivityEntry['status']; label: string }[] = [];
    (reportEntries ?? []).forEach((entry) => {
      entry.history.forEach((h) => {
        if (!h.at) return;
        if (h.reason === 'content_completed') {
          events.push({
            text: `Hoàn thành nội dung ${conceptName(entry.concept)}`,
            at: new Date(h.at),
            status: 'success',
            label: 'Hoàn thành',
          });
        } else if (h.reason === 'initial_grading' || h.reason === 'regrade') {
          events.push({
            text: `Làm bài ${conceptName(entry.concept)} — đạt ${h.score}%`,
            at: new Date(h.at),
            status: 'info',
            label: 'Cập nhật',
          });
        }
      });
    });
    return events
      .sort((a, b) => b.at.getTime() - a.at.getTime())
      .slice(0, 6)
      .map((e, i) => ({
        id: String(i),
        text: e.text,
        time: e.at.toLocaleDateString('vi-VN'),
        status: e.status,
        statusLabel: e.label,
      }));
  }, [reportEntries]);

  const scheduleItems = useMemo<ScheduleItem[]>(() => {
    const now = new Date();
    const sessionItems: ScheduleItem[] = (activePlan?.sessions ?? [])
      .filter((s) => s.status === 'planned')
      .map((s) => {
        const start = new Date(s.startAt);
        const isToday = start.toDateString() === now.toDateString();
        return {
          id: s._id,
          type: 'class' as const,
          title: 'Buổi học',
          subtitle: activePlan?.title ?? '',
          time: isToday
            ? `H.NAY ${start.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
            : start.toLocaleString('vi-VN'),
          meta: `${s.durationMin} phút`,
        };
      });
    const goalItems: ScheduleItem[] = goals.map((g) => {
      const deadline = new Date(g.deadline);
      const isToday = deadline.toDateString() === now.toDateString();
      return {
        id: g._id,
        type: 'deadline' as const,
        title: g.title,
        subtitle: typeof g.concept === 'string' ? g.concept : g.concept.name,
        time: isToday
          ? `HẠN ${deadline.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
          : deadline.toLocaleDateString('vi-VN'),
        meta: `Mức quan trọng: ${g.importance}/5`,
      };
    });
    return [...sessionItems, ...goalItems].sort((a, b) => a.time.localeCompare(b.time));
  }, [activePlan, goals]);

  const calendarEvents = useMemo(
    () => [
      ...(activePlan?.sessions ?? []).map((s) => ({
        day: new Date(s.startAt).getDate(),
        type: 'class' as const,
      })),
      ...goals.map((g) => ({ day: new Date(g.deadline).getDate(), type: 'deadline' as const })),
    ],
    [activePlan, goals],
  );

  const weeklySessions = useMemo<WeeklySessionRow[]>(() => {
    if (!activePlan) return [];
    return activePlan.sessions.map((s) => {
      const meta = SESSION_STATUS_LABEL[s.status] ?? SESSION_STATUS_LABEL.planned;
      return {
        id: s._id,
        subject: activePlan.title,
        activity: `Buổi học (${s.durationMin} phút)`,
        deadline: new Date(s.startAt).toLocaleDateString('vi-VN'),
        progress: s.status === 'done' ? 100 : s.status === 'planned' ? 0 : 50,
        status: meta.status,
        statusLabel: meta.label,
      };
    });
  }, [activePlan]);

  const columns: ColumnDef<WeeklySessionRow>[] = useMemo(
    () => [
      { accessorKey: 'subject', header: 'Kế hoạch', meta: { enableColumnSearch: true } },
      { accessorKey: 'activity', header: 'Hoạt động' },
      { accessorKey: 'deadline', header: 'Ngày' },
      {
        accessorKey: 'progress',
        header: 'Tiến độ',
        cell: ({ getValue }) => (
          <div className="h-2 w-28 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${getValue<number>()}%` }} />
          </div>
        ),
      },
      {
        accessorKey: 'statusLabel',
        header: 'Trạng thái',
        meta: { filterOptions: ['Hoàn thành', 'Đang thực hiện', 'Sắp đến hạn', 'Quá hạn', 'Đã hủy'] },
        cell: ({ row }) => (
          <StatusBadge variant={row.original.status}>{row.original.statusLabel}</StatusBadge>
        ),
      },
    ],
    [],
  );

  const containerVariants = pickVariants(!!reduced, staggerContainer);
  const itemVariants = pickVariants(!!reduced, fadeUp);

  return (
    <AppShell
      menu={studentMenu}
      title="Trang chủ"
      breadcrumb={['Trang chủ', 'Tổng quan']}
      userName={user?.fullName ?? ''}
      roleLabel="Sinh viên"
      notificationCount={0}
      tagline="Explore. Learn. Master."
      compactHeader
      onLogout={() => {
        logout();
        navigate(PATHS.login);
      }}
    >
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="flex flex-col gap-5"
      >
        <motion.div variants={itemVariants}>
          <HeroBanner name={user?.fullName ?? ''} onStart={() => navigate(PATHS.student.planner)} />
        </motion.div>

        <motion.div variants={itemVariants}>
          <NextBestActionCard />
        </motion.div>

        <motion.div variants={itemVariants} className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ActivityChartCard data={activitySeries} />
          </div>

          <div className="flex flex-col items-center justify-center rounded-card border border-border bg-card p-5 shadow-card">
            <h3 className="mb-2 self-start font-semibold text-foreground">Tiến độ tổng</h3>
            <div className="relative h-40 w-40">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={levelBreakdown}
                    dataKey="value"
                    innerRadius="70%"
                    outerRadius="100%"
                    startAngle={90}
                    endAngle={-270}
                    isAnimationActive={!reduced}
                  >
                    {levelBreakdown.map((seg) => (
                      <Cell key={seg.label} fill={seg.color} stroke="none" />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-foreground">
                {overallProgress}%
              </div>
            </div>

            <div className="mt-4 flex w-full flex-col gap-1.5">
              {levelBreakdown.map((seg) => (
                <div
                  key={seg.label}
                  className="flex items-center justify-between text-xs text-muted-foreground"
                >
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ background: seg.color }} />
                    {seg.label}
                  </span>
                  <span className="font-semibold text-foreground">{seg.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="grid gap-4 sm:grid-cols-3">
          <StatCard
            icon={Sun}
            label="Đang học"
            value={studying}
            tone="blue"
            onViewMore={() => navigate(PATHS.student.mastery)}
          />
          <StatCard
            icon={Award}
            label="Cần ôn lại"
            value={needsReview}
            tone="peach"
            onViewMore={() => navigate(PATHS.student.mastery)}
          />
          <StatCard
            icon={CheckCircle2}
            label="Đã hoàn thành"
            value={completed}
            tone="mint"
            onViewMore={() => navigate(PATHS.student.mastery)}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <CalendarScheduleCard
            year={new Date().getFullYear()}
            month={new Date().getMonth()}
            today={new Date().getDate()}
            events={calendarEvents}
            schedule={scheduleItems}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <RecentActivityCard items={recentActivity} />
        </motion.div>

        <motion.div variants={itemVariants}>
          <h3 className="mb-3 font-semibold text-foreground">Kế hoạch học tuần này</h3>
          <DataTablePage
            columns={columns}
            data={weeklySessions}
            getRowId={(r) => r.id}
            searchPlaceholder="Tìm theo: Kế hoạch, Hoạt động…"
            emptyLabel={
              activePlan ? 'Chưa có buổi học nào' : 'Chưa có kế hoạch học tập — hãy tạo một kế hoạch mới'
            }
          />
        </motion.div>
      </motion.div>
    </AppShell>
  );
}
