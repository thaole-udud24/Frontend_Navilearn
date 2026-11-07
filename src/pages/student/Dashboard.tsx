import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { motion, useReducedMotion } from 'framer-motion';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { BookOpenCheck, Flame, GraduationCap, Sparkles, Star } from 'lucide-react';

import { AppShell } from '@/layouts/AppShell';
import { studentMenu } from '@/config/menu.student';
import { StatCard } from '@/components/StatCard';
import { StatusBadge } from '@/components/StatusBadge';
import { DataTablePage } from '@/components/DataTablePage';
import { fadeUp, pickVariants, staggerContainer } from '@/lib/motion';
import { generateWeeklyPlan, studentMasteryByTopic, studentOverallProgress, type WeeklyPlanRow } from '@/mocks/dashboardMocks';

const mockUser = { name: 'Minh Anh' };

const DONUT_COLORS = ['#0b3a82', '#e6eaf2'];

export default function StudentDashboard() {
  const reduced = useReducedMotion();
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
      breadcrumb={['Trang chủ']}
      userName={mockUser.name}
      roleLabel="Học sinh"
      notificationCount={3}
    >
      <motion.div initial="hidden" animate="visible" variants={containerVariants} className="flex flex-col gap-6">
        <motion.div variants={itemVariants}>
          <h2 className="text-xl font-bold text-foreground">Xin chào, {mockUser.name}</h2>
          <p className="text-sm text-muted-foreground">Chào mừng quay lại</p>
        </motion.div>

        <motion.div variants={itemVariants} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={GraduationCap}
            label="Môn đang học"
            value={6}
            iconClassName="bg-gradient-to-br from-accent to-warning"
          />
          <StatCard icon={BookOpenCheck} label="Bài cần ôn hôm nay" value={4} sparkline={[2, 5, 3, 6, 4]} />
          <StatCard icon={Star} label="Điểm trung bình" value={8} sparkline={[7, 8, 7, 9, 8]} />
          <StatCard icon={Flame} label="Chuỗi ngày học" value={12} sparkline={[3, 5, 8, 10, 12]} />
        </motion.div>

        <motion.div variants={itemVariants} className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-card border border-border bg-card p-5 shadow-card lg:col-span-2">
            <h3 className="mb-4 font-semibold text-foreground">Mức độ thành thạo theo chủ đề</h3>
            <div className="flex flex-col gap-3">
              {studentMasteryByTopic.map((t, i) => (
                <div key={t.topic} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 truncate text-sm text-muted-foreground">{t.topic}</span>
                  <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${t.value}%` }}
                      transition={{ duration: 0.6, delay: i * 0.05 }}
                      className="h-full rounded-full bg-primary"
                    />
                  </div>
                  <span className="w-10 shrink-0 text-right text-sm font-semibold text-foreground">{t.value}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center justify-center rounded-card border border-border bg-card p-5 shadow-card">
            <h3 className="mb-2 self-start font-semibold text-foreground">Tiến độ tổng</h3>
            <div className="relative h-40 w-40">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={[{ value: studentOverallProgress }, { value: 100 - studentOverallProgress }]}
                    dataKey="value"
                    innerRadius="70%"
                    outerRadius="100%"
                    startAngle={90}
                    endAngle={-270}
                    isAnimationActive={!reduced}
                  >
                    {DONUT_COLORS.map((color) => (
                      <Cell key={color} fill={color} stroke="none" />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-foreground">
                {studentOverallProgress}%
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div>
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
          </div>

          <div className="hidden flex-col gap-4 lg:flex">
            <div className="rounded-card border border-border bg-card p-4 shadow-card">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {mockUser.name.charAt(0)}
                </span>
                <div>
                  <div className="text-sm font-semibold text-foreground">{mockUser.name}</div>
                  <div className="text-xs text-muted-foreground">Học sinh lớp 12A1</div>
                </div>
              </div>
            </div>

            <div className="rounded-card border border-border bg-card p-4 shadow-card">
              <h4 className="mb-2 text-sm font-semibold text-foreground">Nhắc việc</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Hoàn thành bài kiểm tra Toán trước 18h</li>
                <li>Ôn lại từ vựng tiếng Anh chương 5</li>
                <li>Nộp báo cáo thí nghiệm Hoá học</li>
              </ul>
            </div>

            <div className="rounded-card border border-border bg-card p-4 shadow-card">
              <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                <Sparkles className="h-4 w-4 text-primary" /> Trợ lý AI
              </h4>
              <div className="flex flex-col gap-2 text-sm">
                <div className="self-start rounded-control bg-muted px-3 py-2">Chào bạn, mình có thể giúp gì hôm nay?</div>
                <div className="self-end rounded-control bg-primary/10 px-3 py-2 text-primary">
                  Gợi ý kế hoạch ôn tập tuần này nhé.
                </div>
              </div>
              <input
                disabled
                placeholder="Nhập câu hỏi… (demo)"
                className="mt-3 h-10 w-full rounded-control border border-input bg-background px-3 text-sm text-muted-foreground"
              />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AppShell>
  );
}
