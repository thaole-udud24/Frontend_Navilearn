import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';

import { AppShell } from '@/layouts/AppShell';
import { useAuthStore } from '@/hooks/useAuth';
import { PATHS } from '@/routes/paths';
import { studentMenu } from '@/config/menu.student';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ClampLine, DataTablePage } from '@/components/DataTablePage';
import { StatusBadge } from '@/components/StatusBadge';
import { createAdminReportItem, listAdminReportItems } from '@/services/admin-report';
import type { AdminReportItem, AdminReportItemStatus } from '@/services/admin-report/types';

const STATUS_LABEL: Record<AdminReportItemStatus, string> = {
  open: 'Mới gửi',
  in_progress: 'Đang xử lý',
  resolved: 'Đã xử lý',
};

export default function AdminReportItemsStudentPage() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const [tableKey, setTableKey] = useState(0);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Vui lòng nhập đầy đủ tiêu đề và nội dung');
      return;
    }
    setSubmitting(true);
    try {
      await createAdminReportItem({ title: title.trim(), content: content.trim() });
      toast.success('Đã gửi báo cáo cho quản trị viên');
      setOpen(false);
      setTitle('');
      setContent('');
      setTableKey((k) => k + 1);
    } catch {
      toast.error('Gửi báo cáo thất bại, vui lòng thử lại');
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ColumnDef<AdminReportItem>[] = [
    { accessorKey: 'title', header: 'Tiêu đề', meta: { enableColumnSearch: true } },
    {
      accessorKey: 'content',
      header: 'Nội dung',
      cell: ({ getValue }) => <ClampLine text={getValue<string>()} />,
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
      menu={studentMenu}
      title="Báo cáo sự cố"
      breadcrumb={['Trang chủ', 'Báo cáo sự cố']}
      userName={user?.fullName ?? ''}
      roleLabel="Sinh viên"
      compactHeader
      onLogout={() => {
        logout();
        navigate(PATHS.login);
      }}
    >
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Báo cáo sự cố</h1>
        <Button type="button" onClick={() => setOpen(true)}>
          Gửi báo cáo mới
        </Button>
      </div>

      <DataTablePage<AdminReportItem>
        key={tableKey}
        columns={columns}
        getRowId={(r) => r._id}
        searchPlaceholder="Tìm theo tiêu đề…"
        emptyLabel="Bạn chưa gửi báo cáo nào"
        fetcher={async ({ page, pageSize }) => {
          const res = await listAdminReportItems({ page, limit: pageSize });
          return { data: res.data, total: res.meta?.total ?? res.data.length };
        }}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent size="md" className="tw-scope">
          <DialogHeader>
            <DialogTitle>Gửi báo cáo sự cố mới</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tiêu đề sự cố" />
            <Input
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Mô tả chi tiết"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button type="button" onClick={submit} disabled={submitting}>
              {submitting ? 'Đang gửi…' : 'Gửi báo cáo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
