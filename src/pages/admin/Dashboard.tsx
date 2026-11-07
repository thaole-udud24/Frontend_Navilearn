import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { motion, useReducedMotion } from 'framer-motion';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from 'recharts';
import { AlertTriangle, UserPlus, Users, FileCheck2 } from 'lucide-react';

import { AppShell } from '@/layouts/AppShell';
import { adminMenu } from '@/config/menu.admin';
import { StatCard } from '@/components/StatCard';
import { StatusBadge } from '@/components/StatusBadge';
import { DataTablePage } from '@/components/DataTablePage';
import { fadeUp, pickVariants, staggerContainer } from '@/lib/motion';
import { generateUsers, masteryDistribution, recentActivityLog, systemActivity30Days, type MockUser } from '@/mocks/dashboardMocks';

export default function AdminDashboard() {
  const reduced = useReducedMotion();
  const users = useMemo(() => generateUsers(81), []);

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
        cell: ({ row }) => <StatusBadge variant={row.original.status}>{row.original.statusLabel}</StatusBadge>,
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
      notificationCount={5}
    >
      <motion.div initial="hidden" animate="visible" variants={containerVariants} className="flex flex-col gap-6">
        <motion.div variants={itemVariants}>
          <h2 className="text-xl font-bold text-foreground">Xin chào, Administrator</h2>
          <p className="text-sm text-muted-foreground">Tổng quan hệ thống NaviLearn</p>
        </motion.div>

        <motion.div variants={itemVariants} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Users} label="Tổng người dùng" value={2480} />
          <StatCard icon={UserPlus} label="Tài khoản mới 7 ngày" value={57} sparkline={[10, 18, 14, 22, 20, 26, 31]} />
          <StatCard icon={FileCheck2} label="Bài đánh giá đang mở" value={16} />
          <StatCard icon={AlertTriangle} label="Cảnh báo rủi ro" value={9} iconClassName="bg-gradient-to-br from-danger to-warning" />
        </motion.div>

        <motion.div variants={itemVariants} className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-card border border-border bg-card p-5 shadow-card">
            <h3 className="mb-4 font-semibold text-foreground">Hoạt động hệ thống 30 ngày</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={systemActivity30Days}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} interval={4} />
                <YAxis tick={{ fontSize: 11 }} />
                <RTooltip />
                <Line type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={2} dot={false} isAnimationActive={!reduced} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-card border border-border bg-card p-5 shadow-card">
            <h3 className="mb-4 font-semibold text-foreground">Phân bố mức thành thạo</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={masteryDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="level" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <RTooltip />
                <Bar dataKey="value" fill="var(--primary)" radius={[6, 6, 0, 0]} isAnimationActive={!reduced} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <h3 className="mb-3 font-semibold text-foreground">Người dùng mới nhất</h3>
          <DataTablePage
            columns={columns}
            data={users}
            getRowId={(r) => r.id}
            queryKeyPrefix="users_"
            searchPlaceholder="Tìm theo: Mã, Tên…"
            rowActions={[
              { key: 'view', label: 'Xem chi tiết', onSelect: (r) => console.log('view', r) },
              { key: 'edit', label: 'Chỉnh sửa', onSelect: (r) => console.log('edit', r) },
              { key: 'duplicate', label: 'Nhân bản', onSelect: (r) => console.log('duplicate', r) },
              { key: 'delete', label: 'Xoá', danger: true, onSelect: (r) => console.log('delete', r) },
            ]}
            bulkActions={[
              { key: 'lock', label: 'Khoá tài khoản', onSelect: (rows) => console.log('lock', rows) },
              { key: 'delete', label: 'Xoá đã chọn', danger: true, onSelect: (rows) => console.log('delete many', rows) },
            ]}
            toolbarActions={[
              { key: 'create', label: 'Thêm mới', onSelect: () => console.log('create user') },
              { key: 'import', label: 'Nhập dữ liệu', onSelect: () => console.log('import users') },
              { key: 'print', label: 'In', onSelect: () => console.log('print users') },
            ]}
          />
        </motion.div>

        <motion.div variants={itemVariants} className="rounded-card border border-border bg-card p-5 shadow-card">
          <h3 className="mb-4 font-semibold text-foreground">Nhật ký hoạt động gần đây</h3>
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
        </motion.div>
      </motion.div>
    </AppShell>
  );
}
