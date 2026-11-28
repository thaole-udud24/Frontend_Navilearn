import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import { Eye } from 'lucide-react';

import { AppShell } from '@/layouts/AppShell';
import { useAuthStore } from '@/hooks/useAuth';
import { PATHS } from '@/routes/paths';
import { adminMenu } from '@/config/menu.admin';
import { ClampLine, DataTablePage } from '@/components/DataTablePage';
import { getReviewStats, listReviewItems, updateReviewItemStatus } from '@/services/review';
import type { ReviewCategory, ReviewItem, ReviewStats } from '@/services/review/types';

const CATEGORY_LABEL: Record<ReviewCategory, string> = {
  lo_trinh: 'Lộ trình',
  luyen_tap: 'Luyện tập',
  noi_dung: 'Nội dung',
  he_thong: 'Hệ thống',
  khac: 'Khác',
};

function ownerEmail(owner: ReviewItem['owner']): string {
  return typeof owner === 'string' ? owner : owner.email;
}

/**
 * B11 — real admin view of student feedback (ReviewItem, "Đánh giá từ sinh viên"), the same
 * module students submit to via "Góp ý của tôi" (review.model.js). Stat tiles and per-category
 * averages come from a real aggregate query (review.service.js stats()), not invented numbers.
 * Filter by "Về" (category) and điểm (rating) are server-side via the header filter popovers.
 */
export default function ReviewItemsAdminPage() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const [tableKey, setTableKey] = useState(0);
  const [stats, setStats] = useState<ReviewStats | null>(null);

  const loadStats = () => {
    getReviewStats()
      .then(setStats)
      .catch(() => setStats(null));
  };
  useEffect(loadStats, []);

  const markSeen = async (row: ReviewItem) => {
    await updateReviewItemStatus(row._id, 'in_progress');
    toast.success('Đã đánh dấu là đã xem');
    setTableKey((k) => k + 1);
    loadStats();
  };

  const columns: ColumnDef<ReviewItem>[] = [
    {
      accessorKey: 'createdAt',
      header: 'Ngày',
      cell: ({ getValue }) => new Date(getValue<string>()).toLocaleDateString('vi-VN'),
    },
    { id: 'owner', header: 'SV', cell: ({ row }) => ownerEmail(row.original.owner) },
    {
      accessorKey: 'category',
      header: 'Về',
      meta: { filterOptions: Object.keys(CATEGORY_LABEL) },
      cell: ({ getValue }) => CATEGORY_LABEL[getValue<ReviewCategory>()],
    },
    {
      accessorKey: 'rating',
      header: 'Điểm',
      meta: { filterOptions: ['1', '2', '3', '4', '5'] },
      cell: ({ getValue }) => `${getValue<number>()}★`,
    },
    {
      accessorKey: 'content',
      header: 'Nội dung',
      cell: ({ getValue }) => <ClampLine text={getValue<string>()} />,
    },
  ];

  return (
    <AppShell
      menu={adminMenu}
      title="Đánh giá từ sinh viên"
      breadcrumb={['Trang chủ', 'Hỗ trợ', 'Đánh giá từ sinh viên']}
      userName={user?.fullName ?? ''}
      roleLabel="Quản trị viên"
      compactHeader
      area="admin"
      onLogout={() => {
        logout();
        navigate(PATHS.login);
      }}
    >
      <h1 className="mb-4 text-xl font-bold text-foreground">Hỗ trợ › Đánh giá từ sinh viên</h1>

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <div className="rounded-card border border-border bg-card p-4 shadow-card">
          <p className="text-sm text-muted-foreground">Điểm TB</p>
          <p className="text-xl font-bold text-foreground">{stats ? `${stats.avgRating.toFixed(1)}/5` : '—'}</p>
        </div>
        <div className="rounded-card border border-border bg-card p-4 shadow-card">
          <p className="text-sm text-muted-foreground">Số đánh giá</p>
          <p className="text-xl font-bold text-foreground">{stats?.total ?? '—'}</p>
        </div>
        <div className="rounded-card border border-border bg-card p-4 shadow-card">
          <p className="text-sm text-muted-foreground">Chưa xem</p>
          <p className="text-xl font-bold text-foreground">{stats?.unseen ?? '—'}</p>
        </div>
      </div>

      {!!stats?.byCategory.length && (
        <div className="mb-4 flex flex-wrap gap-2 text-sm text-muted-foreground">
          {stats.byCategory.map((c) => (
            <span key={c.category} className="rounded-full border border-border bg-card px-3 py-1">
              {CATEGORY_LABEL[c.category]}: {c.avgRating.toFixed(1)}★ ({c.total})
            </span>
          ))}
        </div>
      )}

      <DataTablePage<ReviewItem>
        key={tableKey}
        columns={columns}
        getRowId={(r) => r._id}
        searchPlaceholder="Tìm theo tiêu đề…"
        emptyLabel="Chưa có đánh giá nào"
        fetcher={async ({ page, pageSize, filters }) => {
          const res = await listReviewItems({
            page,
            limit: pageSize,
            category: filters.category?.[0] as ReviewCategory | undefined,
            rating: filters.rating?.[0] ? Number(filters.rating[0]) : undefined,
          });
          return { data: res.data, total: res.meta?.total ?? res.data.length };
        }}
        rowActions={[
          {
            key: 'markSeen',
            label: 'Đánh dấu đã xem',
            icon: <Eye />,
            hidden: (row) => row.status !== 'open',
            onSelect: markSeen,
          },
        ]}
      />
    </AppShell>
  );
}
