import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import { Eye } from 'lucide-react';

import { AppShell } from '@/layouts/AppShell';
import { useAuthStore } from '@/hooks/useAuth';
import { PATHS } from '@/routes/paths';
import { adminMenu } from '@/config/menu.admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ClampLine, DataTablePage } from '@/components/DataTablePage';
import { StatusBadge } from '@/components/StatusBadge';
import { cn } from '@/lib/utils';
import {
  listAdminReportItems,
  respondAdminReportItem,
  updateAdminReportItemStatus,
} from '@/services/admin-report';
import type { AdminReportIssueType, AdminReportItem, AdminReportItemStatus } from '@/services/admin-report/types';
import { assetUrl } from '@/utils/assetUrl';

const STATUS_LABEL: Record<AdminReportItemStatus, string> = {
  open: 'Mới',
  in_progress: 'Đang xử lý',
  resolved: 'Đã xong',
};

// N11: "Loại sự cố" — mirrors the student-side submission form (Student/index.tsx).
const ISSUE_TYPE_LABEL: Record<AdminReportIssueType, string> = {
  question_error: 'Câu hỏi sai',
  display_bug: 'Lỗi hiển thị',
  system_error: 'Lỗi hệ thống',
  other: 'Khác',
};

const FILTERS: { key: AdminReportItemStatus | 'all'; label: string }[] = [
  { key: 'open', label: 'Mới' },
  { key: 'in_progress', label: 'Đang xử lý' },
  { key: 'resolved', label: 'Đã xong' },
  { key: 'all', label: 'Tất cả' },
];

function ownerEmail(owner: AdminReportItem['owner']): string {
  return typeof owner === 'string' ? owner : owner.email;
}

/**
 * B10 — real admin triage for AdminReportItem ("Sự cố từ sinh viên"), the same module students
 * submit to via "Báo cáo sự cố" (admin-report.model.js). Reply + status change both hit real
 * endpoints: respond() writes adminResponse/respondedBy/respondedAt, and the student sees the
 * reply back on their own report (no separate thread).
 */
export default function AdminReportItemsAdminPage() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const [statusFilter, setStatusFilter] = useState<AdminReportItemStatus | 'all'>('open');
  const [tableKey, setTableKey] = useState(0);
  const [selected, setSelected] = useState<AdminReportItem | null>(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const reload = () => setTableKey((k) => k + 1);

  const sendReply = async () => {
    if (!selected || !reply.trim()) return;
    setSending(true);
    try {
      const updated = await respondAdminReportItem(selected._id, reply.trim());
      toast.success('Đã gửi phản hồi cho sinh viên');
      setSelected(updated);
      setReply('');
      reload();
    } catch {
      toast.error('Gửi phản hồi thất bại, vui lòng thử lại');
    } finally {
      setSending(false);
    }
  };

  const closeTicket = async () => {
    if (!selected) return;
    const updated = await updateAdminReportItemStatus(selected._id, 'resolved');
    toast.success('Đã đóng yêu cầu');
    setSelected(updated);
    reload();
  };

  const columns: ColumnDef<AdminReportItem>[] = [
    {
      id: 'code',
      header: 'Mã',
      cell: ({ row }) => row.original._id.slice(-6).toUpperCase(),
      size: 90,
    },
    {
      accessorKey: 'title',
      header: 'Tiêu đề',
      meta: { enableColumnSearch: true },
      cell: ({ getValue }) => <ClampLine text={getValue<string>()} />,
    },
    {
      id: 'owner',
      header: 'SV',
      cell: ({ row }) => ownerEmail(row.original.owner),
    },
    {
      accessorKey: 'issueType',
      header: 'Loại sự cố',
      cell: ({ getValue }) => ISSUE_TYPE_LABEL[getValue<AdminReportIssueType>()] ?? '—',
    },
    {
      accessorKey: 'status',
      header: 'Trạng thái',
      cell: ({ getValue }) => {
        const status = getValue<AdminReportItemStatus>();
        const variant = status === 'resolved' ? 'success' : status === 'in_progress' ? 'info' : 'neutral';
        return <StatusBadge variant={variant}>{STATUS_LABEL[status]}</StatusBadge>;
      },
    },
  ];

  return (
    <AppShell
      menu={adminMenu}
      title="Sự cố từ sinh viên"
      breadcrumb={['Trang chủ', 'Hỗ trợ', 'Sự cố từ sinh viên']}
      userName={user?.fullName ?? ''}
      roleLabel="Quản trị viên"
      compactHeader
      area="admin"
      onLogout={() => {
        logout();
        navigate(PATHS.login);
      }}
    >
      <h1 className="mb-4 text-xl font-bold text-foreground">Hỗ trợ › Sự cố từ sinh viên</h1>

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => {
              setStatusFilter(f.key);
              reload();
            }}
            className={cn(
              'rounded-full border px-3 py-1 text-sm font-medium transition-colors',
              statusFilter === f.key
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-muted-foreground hover:bg-muted',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <DataTablePage<AdminReportItem>
          key={tableKey}
          columns={columns}
          getRowId={(r) => r._id}
          searchPlaceholder="Tìm theo tiêu đề…"
          emptyLabel="Chưa có báo cáo nào"
          fetcher={async ({ page, pageSize }) => {
            const res = await listAdminReportItems({
              page,
              limit: pageSize,
              status: statusFilter === 'all' ? undefined : statusFilter,
            });
            return { data: res.data, total: res.meta?.total ?? res.data.length };
          }}
          rowActions={[
            {
              key: 'view',
              label: 'Xem chi tiết',
              icon: <Eye />,
              onSelect: (row: AdminReportItem) => {
                setSelected(row);
                setReply(row.adminResponse ?? '');
              },
            },
          ]}
        />

        <div className="flex flex-col gap-3 rounded-card border border-border bg-card p-4 shadow-card">
          {!selected ? (
            <p className="text-sm text-muted-foreground">Chọn "Xem chi tiết" ở một báo cáo để phản hồi.</p>
          ) : (
            <>
              <div>
                <span className="font-bold text-foreground">
                  {selected._id.slice(-6).toUpperCase()} · {selected.title}
                </span>
                <p className="text-xs text-muted-foreground">
                  SV: {ownerEmail(selected.owner)} · {new Date(selected.createdAt).toLocaleDateString('vi-VN')}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {ISSUE_TYPE_LABEL[selected.issueType]}
                  {selected.location ? ` · Vị trí: ${selected.location}` : ''}
                </p>
              </div>
              <p className="rounded-control bg-muted p-2 text-sm text-foreground">{selected.content}</p>
              {selected.attachmentUrl && (
                <a
                  href={assetUrl(selected.attachmentUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-primary underline"
                >
                  Xem ảnh đính kèm
                </a>
              )}
              {selected.adminResponse && (
                <div className="rounded-control border border-primary/30 bg-primary-soft/40 p-2 text-sm">
                  <span className="font-semibold">Phản hồi đã gửi:</span> {selected.adminResponse}
                </div>
              )}
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-muted-foreground">Phản hồi</span>
                <Input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Nhập phản hồi..." />
              </label>
              <div className="flex gap-2">
                <Button type="button" size="sm" onClick={sendReply} disabled={sending || !reply.trim()}>
                  Gửi phản hồi
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={closeTicket}
                  disabled={selected.status === 'resolved'}
                >
                  Đóng yêu cầu
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
