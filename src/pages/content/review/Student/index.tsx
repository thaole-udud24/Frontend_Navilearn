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
import { createReviewItem, listReviewItems } from '@/services/review';
import type { ReviewItem, ReviewItemStatus } from '@/services/review/types';

const STATUS_LABEL: Record<ReviewItemStatus, string> = {
  open: 'Mới gửi',
  in_progress: 'Đang xem xét',
  resolved: 'Đã duyệt',
};

export default function ReviewItemsStudentPage() {
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
      toast.error('Vui lòng nhập đầy đủ tiêu đề và nội dung đánh giá');
      return;
    }
    setSubmitting(true);
    try {
      await createReviewItem({ title: title.trim(), content: content.trim() });
      toast.success('Đã gửi đánh giá của bạn');
      setOpen(false);
      setTitle('');
      setContent('');
      setTableKey((k) => k + 1);
    } catch {
      toast.error('Gửi đánh giá thất bại, vui lòng thử lại');
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ColumnDef<ReviewItem>[] = [
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
        const status = getValue<ReviewItemStatus>();
        const variant = status === 'resolved' ? 'success' : status === 'in_progress' ? 'info' : 'neutral';
        return <StatusBadge variant={variant}>{STATUS_LABEL[status]}</StatusBadge>;
      },
    },
  ];

  return (
    <AppShell
      menu={studentMenu}
      title="Đánh giá của tôi"
      breadcrumb={['Trang chủ', 'Đánh giá']}
      userName={user?.fullName ?? ''}
      roleLabel="Sinh viên"
      compactHeader
      onLogout={() => {
        logout();
        navigate(PATHS.login);
      }}
    >
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Đánh giá của tôi</h1>
        <Button type="button" onClick={() => setOpen(true)}>
          Viết đánh giá mới
        </Button>
      </div>

      <DataTablePage<ReviewItem>
        key={tableKey}
        columns={columns}
        getRowId={(r) => r._id}
        searchPlaceholder="Tìm theo tiêu đề…"
        emptyLabel="Bạn chưa gửi đánh giá nào"
        fetcher={async ({ page, pageSize }) => {
          const res = await listReviewItems({ page, limit: pageSize });
          return { data: res.data, total: res.meta?.total ?? res.data.length };
        }}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="tw-scope max-w-md">
          <DialogHeader>
            <DialogTitle>Viết đánh giá mới</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tiêu đề đánh giá" />
            <Input
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Nội dung đánh giá"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button type="button" onClick={submit} disabled={submitting}>
              {submitting ? 'Đang gửi…' : 'Gửi đánh giá'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
