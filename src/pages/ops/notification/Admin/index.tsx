import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import { Send } from 'lucide-react';

import { AppShell } from '@/layouts/AppShell';
import { useAuthStore } from '@/hooks/useAuth';
import { PATHS } from '@/routes/paths';
import { adminMenu } from '@/config/menu.admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConceptSelect } from '@/components/ConceptSelect';
import { DataTablePage } from '@/components/DataTablePage';
import { createNotificationBroadcast, listNotificationBroadcasts } from '@/services/notification';
import type { NotificationBroadcast, NotificationCategory } from '@/services/notification/types';

const CATEGORY_LABEL: Record<NotificationCategory, string> = { hoc_tap: 'Học tập', he_thong: 'Hệ thống' };

/**
 * B9 — real admin compose tool for the notification module shared with the student-facing
 * Notifications page (see notification.model.js/service.js): "Gửi ngay" fans out one real
 * NotificationItem per targeted student (resolveAudience in notification.service.js), not a
 * preview. "Kênh"/"Hẹn giờ" from the wireframe are skipped — there is no email/job-scheduler
 * infra in this codebase to back them honestly.
 */
export default function AdminNotificationItemsPage() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const [tableKey, setTableKey] = useState(0);

  const [audienceType, setAudienceType] = useState<'all' | 'subject'>('all');
  const [subjectId, setSubjectId] = useState('');
  const [category, setCategory] = useState<NotificationCategory>('he_thong');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Vui lòng nhập đầy đủ tiêu đề và nội dung');
      return;
    }
    if (audienceType === 'subject' && !subjectId) {
      toast.error('Vui lòng chọn môn học cho đối tượng nhận');
      return;
    }
    setSubmitting(true);
    try {
      const result = await createNotificationBroadcast({
        audience: audienceType === 'all' ? { type: 'all' } : { type: 'subject', subjectId },
        category,
        title: title.trim(),
        content: content.trim(),
      });
      toast.success(`Đã gửi thông báo đến ${result.recipientCount} sinh viên (${result.audienceLabel})`);
      setTitle('');
      setContent('');
      setTableKey((k) => k + 1);
    } catch {
      toast.error('Gửi thông báo thất bại, vui lòng thử lại');
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ColumnDef<NotificationBroadcast>[] = [
    {
      accessorKey: 'createdAt',
      header: 'Ngày',
      cell: ({ getValue }) => new Date(getValue<string>()).toLocaleDateString('vi-VN'),
    },
    { accessorKey: 'title', header: 'Tiêu đề', meta: { enableColumnSearch: true } },
    { accessorKey: 'audienceLabel', header: 'Đối tượng' },
    {
      accessorKey: 'total',
      header: 'Số người nhận',
    },
    {
      id: 'readRate',
      header: 'Đã đọc',
      cell: ({ row }) => {
        const { total, readCount } = row.original;
        const pct = total > 0 ? Math.round((readCount / total) * 100) : 0;
        return `${pct}% (${readCount}/${total})`;
      },
    },
  ];

  return (
    <AppShell
      menu={adminMenu}
      title="Thông báo"
      breadcrumb={['Trang chủ', 'Vận hành hệ thống', 'Thông báo']}
      userName={user?.fullName ?? ''}
      roleLabel="Quản trị viên"
      compactHeader
      area="admin"
      onLogout={() => {
        logout();
        navigate(PATHS.login);
      }}
    >
      <h1 className="mb-4 text-xl font-bold text-foreground">Thông báo</h1>

      <div className="mb-6 grid gap-4 rounded-card border border-border bg-card p-4 shadow-card lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <span className="text-sm font-bold text-foreground">Soạn thông báo</span>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-muted-foreground">Đối tượng</span>
            <Select value={audienceType} onValueChange={(v) => setAudienceType(v as 'all' | 'subject')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="tw-scope">
                <SelectItem value="all">Tất cả sinh viên</SelectItem>
                <SelectItem value="subject">Sinh viên theo môn học</SelectItem>
              </SelectContent>
            </Select>
          </label>
          {audienceType === 'subject' && (
            <ConceptSelect
              value={subjectId}
              onChange={setSubjectId}
              parentConcept={null}
              placeholder="Chọn môn học…"
            />
          )}
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-muted-foreground">Danh mục</span>
            <Select value={category} onValueChange={(v) => setCategory(v as NotificationCategory)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="tw-scope">
                <SelectItem value="he_thong">{CATEGORY_LABEL.he_thong}</SelectItem>
                <SelectItem value="hoc_tap">{CATEGORY_LABEL.hoc_tap}</SelectItem>
              </SelectContent>
            </Select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-muted-foreground">Tiêu đề</span>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Cập nhật lộ trình mẫu" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-muted-foreground">Nội dung</span>
            <Input value={content} onChange={(e) => setContent(e.target.value)} placeholder="Nội dung..." />
          </label>
          <Button type="button" onClick={submit} disabled={submitting} className="self-start">
            <Send className="h-4 w-4" /> {submitting ? 'Đang gửi…' : 'Gửi ngay'}
          </Button>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-bold text-foreground">Đã gửi</span>
          <DataTablePage<NotificationBroadcast>
            key={tableKey}
            columns={columns}
            getRowId={(r) => r.broadcastId}
            searchPlaceholder="Tìm theo tiêu đề…"
            emptyLabel="Chưa gửi thông báo nào"
            fetcher={async ({ page, pageSize }) => {
              const res = await listNotificationBroadcasts({ page, limit: pageSize });
              return { data: res.data, total: res.meta?.total ?? res.data.length };
            }}
          />
        </div>
      </div>
    </AppShell>
  );
}
