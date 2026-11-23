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
import { AlertTriangle, Copy, Eye, Pencil, Trash2, UserPlus, Users, FileCheck2 } from 'lucide-react';

import { AppShell } from '@/layouts/AppShell';
import { adminMenu } from '@/config/menu.admin';
import { StatCard } from '@/components/StatCard';
import { Card, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/StatusBadge';
import { DataTablePage } from '@/components/DataTablePage';
import { fadeUp, pickVariants, staggerContainer } from '@/lib/motion';
import {
  generateUsers,
  masteryDistribution,
  recentActivityLog,
  systemActivity30Days,
  type MockUser,
} from '@/mocks/dashboardMocks';

export default function AdminDashboard() {
  const reduced = useReducedMotion();
  const users = useMemo(() => generateUsers(81), []);

  // Re-triggers the entrance animation every few seconds instead of once-on-mount, so the charts
  // visibly keep "running" rather than drawing once and sitting static.
  const [replayTick, setReplayTick] = useState(0);
  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => setReplayTick((t) => t + 1), 6000);
    return () => clearInterval(id);
  }, [reduced]);

  const columns: ColumnDef<MockUser>[] = useMemo(
    () => [
      { accessorKey: 'code', header: 'Mã', meta: { enableColumnSearch: true } },
      { accessorKey: 'name', header: 'Tên', meta: { enableColumnSearch: true } },
      {
        accessorKey: 'role',
        header: 'Vai trò',
        meta: { filterOptions: ['Học sinh', 'Giáo viên', 'Quản trị viên'] },
      },
      {
        accessorKey: 'statusLabel',
        header: 'Trạng thái',
        meta: { filterOptions: ['Đang hoạt động', 'Chờ xác minh', 'Đã khoá'] },
        cell: ({ row }) => (
          <StatusBadge variant={row.original.status}>{row.original.statusLabel}</StatusBadge>
        ),
      },
      { accessorKey: 'createdAt', header: 'Ngày tạo' },
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
      notificationCount={5}
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
            <CardTitle className="mb-4">Hoạt động hệ thống 30 ngày</CardTitle>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart key={`activity-${replayTick}`} data={systemActivity30Days}>
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
            <CardTitle className="mb-4">Phân bố mức thành thạo</CardTitle>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart key={`mastery-${replayTick}`} data={masteryDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="level" tick={{ fontSize: 11 }} />
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
          <StatCard
            icon={Users}
            label="Tổng người dùng"
            value={2480}
            tone="blue"
            trend={{ direction: 'up', label: '8% so với tháng trước' }}
          />
          <StatCard
            icon={UserPlus}
            label="Tài khoản mới 7 ngày"
            value={57}
            tone="mint"
            trend={{ direction: 'up', label: '12% so với tuần trước' }}
          />
          <StatCard
            icon={FileCheck2}
            label="Bài đánh giá đang mở"
            value={16}
            tone="peach"
            trend={{ direction: 'up', label: '3 bài so với hôm qua' }}
          />
          <StatCard
            icon={AlertTriangle}
            label="Cảnh báo rủi ro"
            value={9}
            iconClassName="bg-gradient-to-br from-danger to-warning"
            trend={{ direction: 'down', label: '2 cảnh báo so với hôm qua' }}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <h3 className="mb-3 font-semibold text-foreground">Người dùng mới nhất</h3>
          <DataTablePage
            columns={columns}
            data={users}
            getRowId={(r) => r.id}
            searchPlaceholder="Tìm theo: Mã, Tên…"
            rowActions={[
              { key: 'view', label: 'Xem chi tiết', icon: <Eye />, onSelect: (r) => console.log('view', r) },
              { key: 'edit', label: 'Chỉnh sửa', icon: <Pencil />, onSelect: (r) => console.log('edit', r) },
              {
                key: 'duplicate',
                label: 'Nhân bản',
                icon: <Copy />,
                onSelect: (r) => console.log('duplicate', r),
              },
              {
                key: 'delete',
                label: 'Xoá',
                icon: <Trash2 />,
                danger: true,
                onSelect: (r) => console.log('delete', r),
              },
            ]}
            bulkActions={[
              { key: 'lock', label: 'Khoá tài khoản', onSelect: (rows) => console.log('lock', rows) },
              {
                key: 'delete',
                label: 'Xoá đã chọn',
                danger: true,
                onSelect: (rows) => console.log('delete many', rows),
              },
            ]}
            toolbarActions={[
              { key: 'create', label: 'Thêm mới', onSelect: () => console.log('create user') },
              { key: 'import', label: 'Nhập dữ liệu', onSelect: () => console.log('import users') },
              { key: 'print', label: 'In', onSelect: () => console.log('print users') },
            ]}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardTitle className="mb-4">Nhật ký hoạt động gần đây</CardTitle>
            <ul className="relative space-y-5 pl-4">
              {recentActivityLog.map((entry, i) => (
                <li key={entry.id} className="relative pl-4">
                  {i < recentActivityLog.length - 1 && (
                    <span className="absolute left-[3px] top-3 h-full w-px bg-border" />
                  )}
                  <span className="absolute left-0 top-1.5 h-2 w-2 rounded-full bg-primary" />
                  <p className="text-sm text-foreground">{entry.text}</p>
                  <p className="text-xs text-muted-foreground">{entry.time}</p>
                </li>
              ))}
            </ul>
          </Card>
        </motion.div>
      </motion.div>
    </AppShell>
  );
}
