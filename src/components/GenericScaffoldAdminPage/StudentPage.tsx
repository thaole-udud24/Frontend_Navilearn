import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import { Plus } from 'lucide-react';

import { AppShell } from '@/layouts/AppShell';
import { useAuthStore } from '@/hooks/useAuth';
import { PATHS } from '@/routes/paths';
import { studentMenu } from '@/config/menu.student';
import { AddButton } from '@/components/ui/add-button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { FormDialogFooter, FormDialogTitle, FormField } from '@/components/DialogForm';
import { ClampLine, DataTablePage } from '@/components/DataTablePage';
import { StatusBadge } from '@/components/StatusBadge';
import type { ApiSuccess } from '@/types/api.d';
import { STATUS_LABEL, type ScaffoldItem, type ScaffoldItemStatus } from './index';

interface GenericScaffoldStudentPageProps<T extends ScaffoldItem> {
  pageTitle: string;
  breadcrumb: string[];
  searchPlaceholder?: string;
  emptyLabel?: string;
  createLabel?: string;
  titleFieldLabel: string;
  titlePlaceholder?: string;
  contentFieldLabel: string;
  contentPlaceholder?: string;
  list: (filters: { page: number; limit: number; search?: string }) => Promise<ApiSuccess<T[]>>;
  create: (input: { title: string; content: string }) => Promise<T>;
}

/**
 * Shared "own items" page for the student side of the still-pending generic modules (risk,
 * subject, support): student submits title+content, sees their own submissions and status —
 * mirrors GenericScaffoldAdminPage so both sides of the same identical shape stay on one
 * component instead of three near-duplicate pages.
 */
export function GenericScaffoldStudentPage<T extends ScaffoldItem>({
  pageTitle,
  breadcrumb,
  searchPlaceholder = 'Tìm theo tiêu đề…',
  emptyLabel = 'Bạn chưa gửi yêu cầu nào',
  createLabel = 'Tạo mới',
  titleFieldLabel,
  titlePlaceholder,
  contentFieldLabel,
  contentPlaceholder,
  list,
  create,
}: GenericScaffoldStudentPageProps<T>) {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const [tableKey, setTableKey] = useState(0);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reload = () => setTableKey((k) => k + 1);

  const submit = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Vui lòng nhập đầy đủ thông tin');
      return;
    }
    setSubmitting(true);
    try {
      await create({ title: title.trim(), content: content.trim() });
      toast.success('Đã gửi yêu cầu thành công');
      setOpen(false);
      setTitle('');
      setContent('');
      reload();
    } catch {
      toast.error('Gửi yêu cầu thất bại, vui lòng thử lại');
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ColumnDef<T>[] = [
    { accessorKey: 'title', header: 'Tiêu đề', meta: { enableColumnSearch: true } },
    {
      accessorKey: 'content',
      header: 'Nội dung',
      cell: ({ getValue }) => <ClampLine text={getValue<string>()} />,
    },
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
      menu={studentMenu}
      title={pageTitle}
      breadcrumb={breadcrumb}
      userName={user?.fullName ?? ''}
      roleLabel="Sinh viên"
      compactHeader
      onLogout={() => {
        logout();
        navigate(PATHS.login);
      }}
    >
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">{pageTitle}</h1>
        <AddButton onClick={() => setOpen(true)}>{createLabel}</AddButton>
      </div>
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
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent size="md" className="tw-scope">
          <DialogHeader>
            <FormDialogTitle icon={Plus}>{createLabel}</FormDialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <FormField label={titleFieldLabel} required>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={titlePlaceholder}
                maxLength={200}
              />
            </FormField>
            <FormField label={contentFieldLabel} required>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={contentPlaceholder}
                maxLength={2000}
                rows={4}
                className="flex w-full rounded-control border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </FormField>
          </div>
          <FormDialogFooter
            onCancel={() => setOpen(false)}
            submitLabel="Gửi"
            onSubmit={submit}
            submitting={submitting}
          />
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
