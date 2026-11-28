import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';

import { AppShell } from '@/layouts/AppShell';
import { useAuthStore } from '@/hooks/useAuth';
import { PATHS } from '@/routes/paths';
import { studentMenu } from '@/config/menu.student';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ClampLine, DataTablePage } from '@/components/DataTablePage';
import { StatusBadge } from '@/components/StatusBadge';
import { cn } from '@/lib/utils';
import { createReviewItem, listReviewItems } from '@/services/review';
import type { ReviewCategory, ReviewItem, ReviewItemStatus } from '@/services/review/types';

const STATUS_LABEL: Record<ReviewItemStatus, string> = {
  open: 'Mới gửi',
  in_progress: 'Đang xem xét',
  resolved: 'Đã duyệt',
};

// B11: "Về" — what the feedback is about.
const CATEGORY_LABEL: Record<ReviewCategory, string> = {
  lo_trinh: 'Lộ trình',
  luyen_tap: 'Luyện tập',
  noi_dung: 'Nội dung',
  he_thong: 'Hệ thống',
  khac: 'Khác',
};

export default function ReviewItemsStudentPage() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const [tableKey, setTableKey] = useState(0);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(5);
  const [category, setCategory] = useState<ReviewCategory>('khac');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Vui lòng nhập đầy đủ tiêu đề và nội dung đánh giá');
      return;
    }
    setSubmitting(true);
    try {
      await createReviewItem({ title: title.trim(), content: content.trim(), rating, category });
      toast.success('Đã gửi đánh giá của bạn');
      setOpen(false);
      setTitle('');
      setContent('');
      setRating(5);
      setCategory('khac');
      setTableKey((k) => k + 1);
    } catch {
      toast.error('Gửi đánh giá thất bại, vui lòng thử lại');
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ColumnDef<ReviewItem>[] = [
    { accessorKey: 'title', header: 'Tiêu đề', meta: { enableColumnSearch: true } },
    { accessorKey: 'category', header: 'Về', cell: ({ getValue }) => CATEGORY_LABEL[getValue<ReviewCategory>()] },
    { accessorKey: 'rating', header: 'Điểm', cell: ({ getValue }) => `${getValue<number>()}★` },
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
        <DialogContent size="md" className="tw-scope">
          <DialogHeader>
            <DialogTitle>Viết đánh giá mới</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tiêu đề đánh giá" />
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-muted-foreground">Về</span>
              <Select value={category} onValueChange={(v) => setCategory(v as ReviewCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="tw-scope">
                  {Object.entries(CATEGORY_LABEL).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-muted-foreground">Điểm</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" aria-label={`${n} sao`} onClick={() => setRating(n)}>
                    <Star className={cn('h-5 w-5', n <= rating ? 'fill-warning text-warning' : 'text-muted-foreground')} />
                  </button>
                ))}
              </div>
            </div>
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
