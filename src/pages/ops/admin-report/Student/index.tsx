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
import { assetUrl } from '@/utils/assetUrl';
import { createAdminReportItem, listAdminReportItems } from '@/services/admin-report';
import type { AdminReportIssueType, AdminReportItem, AdminReportItemStatus } from '@/services/admin-report/types';

const STATUS_LABEL: Record<AdminReportItemStatus, string> = {
  open: 'Mới gửi',
  in_progress: 'Đang xử lý',
  resolved: 'Đã xử lý',
};

// N11: "Loại sự cố" — real triage categories.
const ISSUE_TYPE_LABEL: Record<AdminReportIssueType, string> = {
  question_error: 'Câu hỏi sai',
  display_bug: 'Lỗi hiển thị',
  system_error: 'Lỗi hệ thống',
  other: 'Khác',
};

export default function AdminReportItemsStudentPage() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const [tableKey, setTableKey] = useState(0);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [issueType, setIssueType] = useState<AdminReportIssueType>('other');
  const [location, setLocation] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setTitle('');
    setContent('');
    setIssueType('other');
    setLocation('');
    setAttachment(null);
  };

  const submit = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Vui lòng nhập đầy đủ tiêu đề và nội dung');
      return;
    }
    setSubmitting(true);
    try {
      await createAdminReportItem({
        title: title.trim(),
        content: content.trim(),
        issueType,
        location: location.trim() || undefined,
        attachment: attachment ?? undefined,
      });
      toast.success('Đã gửi báo cáo cho quản trị viên');
      setOpen(false);
      resetForm();
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
      accessorKey: 'issueType',
      header: 'Loại sự cố',
      cell: ({ getValue }) => ISSUE_TYPE_LABEL[getValue<AdminReportIssueType>()] ?? '—',
    },
    {
      accessorKey: 'location',
      header: 'Vị trí',
      cell: ({ getValue }) => getValue<string | null>() || <span className="text-muted-foreground">—</span>,
    },
    {
      accessorKey: 'content',
      header: 'Nội dung',
      cell: ({ getValue }) => <ClampLine text={getValue<string>()} />,
    },
    {
      accessorKey: 'attachmentUrl',
      header: 'Ảnh đính kèm',
      cell: ({ getValue }) => {
        const url = assetUrl(getValue<string | null>());
        if (!url) return <span className="text-muted-foreground">—</span>;
        return (
          <a href={url} target="_blank" rel="noreferrer" className="text-primary underline">
            Xem ảnh
          </a>
        );
      },
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
    {
      // B10: the admin's reply (admin-report.service.js respond()) shown back on the student's own report.
      accessorKey: 'adminResponse',
      header: 'Phản hồi từ quản trị',
      cell: ({ getValue }) => {
        const response = getValue<string | null>();
        return response ? <ClampLine text={response} /> : <span className="text-muted-foreground">—</span>;
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
            <select
              value={issueType}
              onChange={(e) => setIssueType(e.target.value as AdminReportIssueType)}
              className="h-9 rounded-control border border-input bg-card px-3 text-sm text-foreground"
            >
              {Object.entries(ISSUE_TYPE_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Vị trí xảy ra (vd: Trang Luyện tập, câu 3)"
            />
            <Input
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Mô tả chi tiết"
            />
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Ảnh chụp màn hình (không bắt buộc)</label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => setAttachment(e.target.files?.[0] ?? null)}
                className="w-full text-sm text-foreground"
              />
            </div>
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
