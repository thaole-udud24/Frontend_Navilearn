import { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { ArchiveRestore, Ban, Pencil, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { DataTablePage } from '@/components/DataTablePage';
import type { RowAction } from '@/components/DataTablePage/types';
import { StatusBadge } from '@/components/StatusBadge';
import { toApiError } from '@/services/apiError';
import {
  createConcept,
  knowledgeKeys,
  listConcepts,
  updateConcept,
  updateConceptStatus,
  type Concept,
  type ConceptStatus,
} from '@/services/knowledge';
import { SubjectFormDialog } from '../shared/SubjectFormDialog';

type StatusFilter = 'all' | ConceptStatus;

const columns: ColumnDef<Concept>[] = [
  {
    accessorKey: 'name',
    header: 'Môn học',
    size: 240,
    cell: ({ row }) => <span className="font-semibold text-foreground">{row.original.name}</span>,
  },
  {
    accessorKey: 'description',
    header: 'Mô tả',
    size: 320,
    cell: ({ getValue }) => (
      <span className="line-clamp-2 text-muted-foreground">{getValue<string>() || '—'}</span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Trạng thái',
    size: 150,
    cell: ({ getValue }) =>
      getValue<string>() === 'active' ? (
        <StatusBadge variant="success">Đang sử dụng</StatusBadge>
      ) : (
        <StatusBadge variant="neutral">Ngừng sử dụng</StatusBadge>
      ),
  },
  {
    accessorKey: 'updatedAt',
    header: 'Cập nhật',
    size: 170,
    cell: ({ getValue }) => new Date(getValue<string>()).toLocaleString('vi-VN'),
  },
];

/** Danh mục môn học chung: now backed by root Concept docs (parentConcept: null), not the
 * retired Subject-catalog module — see knowledge.service.js. Add/edit/stop-using/restore. */
export default function AdminSubjectCatalogPage() {
  const [status, setStatus] = useState<StatusFilter>('all');
  const [tableKey, setTableKey] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Concept | null>(null);
  const [deactivating, setDeactivating] = useState<Concept | null>(null);

  const queryClient = useQueryClient();
  const onDone = () => setTableKey((k) => k + 1);
  const options = (successMessage: string) => ({
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: knowledgeKeys.lists() });
      toast.success(successMessage);
      onDone();
    },
    onError: (error: unknown) => toast.error(toApiError(error).message),
  });
  const actions = {
    create: useMutation({
      mutationFn: (input: { name: string; description?: string }) =>
        createConcept({ ...input, parentConcept: null }),
      ...options('Đã thêm môn học vào danh mục chung'),
    }),
    update: useMutation({
      mutationFn: ({ id, input }: { id: string; input: { name: string; description?: string } }) =>
        updateConcept(id, input),
      ...options('Đã cập nhật môn học'),
    }),
    deactivate: useMutation({
      mutationFn: (id: string) => updateConceptStatus(id, 'archived'),
      ...options('Đã ngừng sử dụng môn học'),
    }),
    restore: useMutation({
      mutationFn: (id: string) => updateConceptStatus(id, 'active'),
      ...options('Đã khôi phục môn học'),
    }),
  };

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const rowActions: RowAction<Concept>[] = [
    {
      key: 'edit',
      label: 'Chỉnh sửa',
      icon: <Pencil />,
      onSelect: (subject) => {
        setEditing(subject);
        setFormOpen(true);
      },
    },
    {
      key: 'deactivate',
      label: 'Ngừng sử dụng',
      icon: <Ban />,
      danger: true,
      hidden: (subject) => subject.status !== 'active',
      onSelect: setDeactivating,
    },
    {
      key: 'restore',
      label: 'Khôi phục',
      icon: <ArchiveRestore />,
      hidden: (subject) => subject.status === 'active',
      onSelect: (subject) => actions.restore.mutate(subject._id),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-xl font-bold text-foreground">Danh mục môn học chung</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Môn học dùng chung để sinh viên chọn vào không gian học tập cá nhân.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={status} onValueChange={(value) => setStatus(value as StatusFilter)}>
            <SelectTrigger className="w-44" aria-label="Lọc theo trạng thái">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="active">Đang sử dụng</SelectItem>
              <SelectItem value="archived">Ngừng sử dụng</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={openCreate}>
            <Plus />
            Thêm môn học
          </Button>
        </div>
      </div>

      <DataTablePage<Concept>
        key={`${tableKey}-${status}`}
        columns={columns}
        getRowId={(subject) => subject._id}
        rowActions={rowActions}
        searchPlaceholder="Tìm theo tên môn học…"
        emptyLabel="Chưa có môn học nào trong danh mục"
        fetcher={async ({ page, pageSize, search }) => {
          const res = await listConcepts({
            parentConcept: 'null',
            page,
            limit: pageSize,
            q: search || undefined,
            status: status === 'all' ? undefined : status,
          });
          return { data: res.data, total: res.meta?.total ?? res.data.length };
        }}
      />

      <SubjectFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        subject={editing}
        noun="môn học chung"
        submitting={actions.create.isPending || actions.update.isPending}
        onSubmit={(input) => {
          const done = { onSuccess: () => setFormOpen(false) };
          if (editing) actions.update.mutate({ id: editing._id, input }, done);
          else actions.create.mutate(input, done);
        }}
      />

      <ConfirmDialog
        open={!!deactivating}
        onOpenChange={(open) => !open && setDeactivating(null)}
        title="Ngừng sử dụng môn học?"
        description={`Môn "${deactivating?.name ?? ''}" sẽ không còn xuất hiện trong danh mục cho sinh viên. Môn học sinh viên đã thêm trước đó được giữ nguyên.`}
        confirmLabel="Ngừng sử dụng"
        onConfirm={() => deactivating && actions.deactivate.mutate(deactivating._id)}
      />
    </div>
  );
}
