import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';

import { AppShell } from '@/layouts/AppShell';
import { useAuthStore } from '@/hooks/useAuth';
import { PATHS } from '@/routes/paths';
import { adminMenu } from '@/config/menu.admin';
import { ClampLine, DataTablePage } from '@/components/DataTablePage';
import { StatusBadge } from '@/components/StatusBadge';
import type { ApiSuccess } from '@/types/api.d';

export type ScaffoldItemStatus = 'open' | 'in_progress' | 'resolved';

export interface ScaffoldItem {
  _id: string;
  title: string;
  content: string;
  status: ScaffoldItemStatus;
  createdAt: string;
}

const STATUS_LABEL: Record<ScaffoldItemStatus, string> = {
  open: 'Mới',
  in_progress: 'Đang xử lý',
  resolved: 'Đã xử lý',
};

const NEXT_STATUS: Record<ScaffoldItemStatus, { key: ScaffoldItemStatus; label: string } | null> = {
  open: { key: 'in_progress', label: 'Bắt đầu xử lý' },
  in_progress: { key: 'resolved', label: 'Đánh dấu đã xử lý' },
  resolved: { key: 'open', label: 'Mở lại' },
};

interface GenericScaffoldAdminPageProps<T extends ScaffoldItem> {
  pageTitle: string;
  breadcrumb: string[];
  searchPlaceholder?: string;
  emptyLabel?: string;
  list: (filters: { page: number; limit: number; search?: string }) => Promise<ApiSuccess<T[]>>;
  updateStatus: (id: string, status: ScaffoldItemStatus) => Promise<T>;
}

/**
 * Shared list page for the still-pending generic modules (subject, data-retention, monitoring,
 * notification, report, risk, support): identical title/content/status shape, same admin
 * capability (view + change status), so one component keeps them all on the same design system
 * instead of each page re-implementing the same table.
 */
export function GenericScaffoldAdminPage<T extends ScaffoldItem>({
  pageTitle,
  breadcrumb,
  searchPlaceholder = 'Tìm theo tiêu đề…',
  emptyLabel = 'Chưa có dữ liệu',
  list,
  updateStatus,
}: GenericScaffoldAdminPageProps<T>) {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const [tableKey, setTableKey] = useState(0);
  const reload = () => setTableKey((k) => k + 1);

  const columns: ColumnDef<T>[] = [
    { accessorKey: 'title', header: 'Tiêu đề', meta: { enableColumnSearch: true } },
    { accessorKey: 'content', header: 'Nội dung', cell: ({ getValue }) => <ClampLine text={getValue<string>()} /> },
    {
      accessorKey: 'status',
      header: 'Trạng thái',
      meta: { filterOptions: ['open', 'in_progress', 'resolved'] },
      cell: ({ getValue }) => {
        const status = getValue<ScaffoldItemStatus>();
        const variant = status === 'resolved' ? 'success' : status === 'in_progress' ? 'info' : 'neutral';
        return <StatusBadge variant={variant}>{STATUS_LABEL[status]}</StatusBadge>;
      },
    },
  ];

  return (
    <AppShell
      menu={adminMenu}
      title={pageTitle}
      breadcrumb={breadcrumb}
      userName={user?.fullName ?? ''}
      roleLabel="Quản trị viên"
      compactHeader
      area="admin"
      onLogout={() => {
        logout();
        navigate(PATHS.login);
      }}
    >
      <h1 className="mb-4 text-xl font-bold text-foreground">{pageTitle}</h1>
      <DataTablePage<T>
        key={tableKey}
        columns={columns}
        getRowId={(r) => r._id}
        searchPlaceholder={searchPlaceholder}
        emptyLabel={emptyLabel}
        fetcher={async ({ page, pageSize, search }) => {
          const res = await list({ page, limit: pageSize, search: search || undefined });
          return { data: res.data, total: res.meta?.total ?? res.data.length };
        }}
        rowActions={(['open', 'in_progress', 'resolved'] as ScaffoldItemStatus[]).map((from) => ({
          key: `to-${NEXT_STATUS[from]?.key}`,
          label: NEXT_STATUS[from]?.label ?? '',
          hidden: (row: T) => row.status !== from,
          onSelect: async (row: T) => {
            const next = NEXT_STATUS[row.status];
            if (!next) return;
            await updateStatus(row._id, next.key);
            toast(`Đã chuyển trạng thái sang "${STATUS_LABEL[next.key]}"`);
            reload();
          },
        }))}
      />
    </AppShell>
  );
}
