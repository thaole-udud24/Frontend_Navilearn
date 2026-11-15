import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
import {
  classWeeklyStats,
  generateWeeklyPlan,
  novemberEventDays,
  studentCourses,
  studentGoalBreakdown,
  studentOverallProgress,
  studentRecentActivity,
  upcomingSchedule,
  weeklyActivitySeries,
  type WeeklyPlanRow,
} from '@/mocks/dashboardMocks';

import { HeroBanner } from './components/HeroBanner';
import { ActivityChartCard } from './components/ActivityChartCard';
import { CourseCard } from './components/CourseCard';
import { ClassStatsCard } from './components/ClassStatsCard';
import { RecentActivityCard } from './components/RecentActivityCard';
import { CalendarScheduleCard } from './components/CalendarScheduleCard';

const mockUser = { name: 'Minh Anh' };

export default function StudentDashboard() {
  const reduced = useReducedMotion();
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const weeklyPlan = useMemo(() => generateWeeklyPlan(16), []);

  const columns: ColumnDef<WeeklyPlanRow>[] = useMemo(
    () => [
      { accessorKey: 'subject', header: 'Môn/Chủ đề', meta: { enableColumnSearch: true } },
      { accessorKey: 'activity', header: 'Hoạt động' },
      { accessorKey: 'deadline', header: 'Hạn' },
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
        meta: { filterOptions: ['Hoàn thành', 'Đang thực hiện', 'Sắp đến hạn', 'Quá hạn'] },
        cell: ({ row }) => <StatusBadge variant={row.original.status}>{row.original.statusLabel}</StatusBadge>,
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
      userName={mockUser.name}
      roleLabel="Sinh viên năm 2"
      notificationCount={3}
      tagline="Explore. Learn. Master."
      compactHeader
      onLogout={() => {
        logout();
        navigate(PATHS.login);
      }}
    >
      <motion.div initial="hidden" animate="visible" variants={containerVariants} className="flex flex-col gap-5">
        <motion.div variants={itemVariants}>
          <HeroBanner name={mockUser.name} onStart={() => navigate(PATHS.student.courses)} />
        </motion.div>

        <motion.div variants={itemVariants} className="grid gap-4 sm:grid-cols-3">
          <StatCard
            icon={Sun}
            label="Đang học"
            value={11}
            tone="blue"
            trend={{ direction: 'up', label: '12% so với tuần trước' }}
            onViewMore={() => navigate(PATHS.student.courses)}
          />
          <StatCard
            icon={Award}
            label="Cần ôn lại"
            value={3}
            tone="peach"
            trend={{ direction: 'down', label: '24% so với tuần trước' }}
            onViewMore={() => navigate(PATHS.student.planner)}
          />
          <StatCard
            icon={CheckCircle2}
            label="Đã hoàn thành"
            value={8}
            tone="mint"
            trend={{ direction: 'up', label: '12% so với tuần trước' }}
            onViewMore={() => navigate(PATHS.student.courses)}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <CalendarScheduleCard
            year={2026}
            month={10}
            today={11}
            events={novemberEventDays}
            schedule={upcomingSchedule}
          />
        </motion.div>

        <motion.div variants={itemVariants} className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Môn học gần đây ({studentCourses.length})</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {studentCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </div>
          <ClassStatsCard
            data={classWeeklyStats}
            total={126}
            changePercent={15}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <RecentActivityCard items={studentRecentActivity} />
        </motion.div>

        <motion.div variants={itemVariants}>
          <h3 className="mb-3 font-semibold text-foreground">Kế hoạch học tuần này</h3>
          <DataTablePage
            columns={columns}
            data={weeklyPlan}
            getRowId={(r) => r.id}
            queryKeyPrefix="plan_"
            searchPlaceholder="Tìm theo: Môn, Hoạt động…"
            rowActions={[
              { key: 'view', label: 'Xem chi tiết', onSelect: (r) => console.log('view', r) },
              { key: 'edit', label: 'Chỉnh sửa', onSelect: (r) => console.log('edit', r) },
              { key: 'duplicate', label: 'Nhân bản', onSelect: (r) => console.log('duplicate', r) },
              { key: 'delete', label: 'Xoá', danger: true, onSelect: (r) => console.log('delete', r) },
            ]}
          />
        </motion.div>

        <motion.div variants={itemVariants} className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ActivityChartCard data={weeklyActivitySeries} />
          </div>

          <div className="flex flex-col items-center justify-center rounded-card border border-border bg-card p-5 shadow-card">
            <h3 className="mb-2 self-start font-semibold text-foreground">Tiến độ tổng</h3>
            <div className="relative h-40 w-40">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={studentGoalBreakdown}
                    dataKey="value"
                    innerRadius="70%"
                    outerRadius="100%"
                    startAngle={90}
                    endAngle={-270}
                    isAnimationActive={!reduced}
                  >
                    {studentGoalBreakdown.map((seg) => (
                      <Cell key={seg.label} fill={seg.color} stroke="none" />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-foreground">
                {studentOverallProgress}%
              </div>
            </div>

            <div className="mt-4 flex w-full flex-col gap-1.5">
              {studentGoalBreakdown.map((seg) => (
                <div key={seg.label} className="flex items-center justify-between text-xs text-muted-foreground">
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
      </motion.div>
    </AppShell>
  );
}
