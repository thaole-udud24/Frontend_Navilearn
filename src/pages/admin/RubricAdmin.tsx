import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import { Ban, Eye, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';

import { AppShell } from '@/layouts/AppShell';
import { useAuthStore } from '@/hooks/useAuth';
import { PATHS } from '@/routes/paths';
import { adminMenu } from '@/config/menu.admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { DetailRow, FormDialogFooter, FormDialogTitle, FormField } from '@/components/DialogForm';
import { DataTablePage } from '@/components/DataTablePage';
import { StatusBadge } from '@/components/StatusBadge';
import { SourceBadge } from '@/components/SourceBadge';
import {
  createRubric,
  exportRubrics,
  importRubrics,
  listRubrics,
  updateRubric,
  updateRubricStatus,
} from '@/services/assessment-config';
import type { Rubric, RubricCriterion } from '@/services/assessment-config/types';

function RubricFormDialog({
  open,
  onClose,
  editing,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  editing: Rubric | null;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState('');
  const [concept, setConcept] = useState('');
  const [criteria, setCriteria] = useState<RubricCriterion[]>([{ name: '', maxPoints: 10 }]);

  const load = (r: Rubric | null) => {
    setTitle(r?.title ?? '');
    setConcept(r?.concept ?? '');
    setCriteria(r?.criteria.length ? r.criteria : [{ name: '', maxPoints: 10 }]);
  };

  const submit = async () => {
    const cleanCriteria = criteria.filter((c) => c.name);
    try {
      if (editing) await updateRubric(editing._id, { title, criteria: cleanCriteria });
      else await createRubric({ title, concept, criteria: cleanCriteria });
      toast(editing ? 'Đã cập nhật rubric' : 'Đã tạo rubric mới');
      onSaved();
      onClose();
    } catch {
      toast('Lưu rubric thất bại.');
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (v) load(editing);
        if (!v) onClose();
      }}
    >
      <DialogContent className="tw-scope max-w-lg">
        <DialogHeader>
          <FormDialogTitle icon={editing ? Pencil : Plus}>
            {editing ? 'Chỉnh sửa Rubric' : 'Thêm mới Rubric'}
          </FormDialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <FormField label="Tên rubric" required>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Rubric tự luận — Chương 1"
            />
          </FormField>
          {!editing && (
            <FormField label="Kiến thức" required>
              <Input
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                placeholder="Mã kiến thức (concept id)"
              />
            </FormField>
          )}
          <p className="text-sm font-medium text-foreground">Tiêu chí chấm</p>
          {criteria.map((c, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={c.name}
                onChange={(e) =>
                  setCriteria(criteria.map((x, idx) => (idx === i ? { ...x, name: e.target.value } : x)))
                }
                placeholder="Tên tiêu chí"
                className="flex-1"
              />
              <Input
                type="number"
                min={1}
                max={100}
                value={c.maxPoints}
                onChange={(e) =>
                  setCriteria(
                    criteria.map((x, idx) => (idx === i ? { ...x, maxPoints: Number(e.target.value) } : x)),
                  )
                }
                placeholder="Điểm tối đa"
                className="w-28"
              />
              <button type="button" onClick={() => setCriteria(criteria.filter((_, idx) => idx !== i))}>
                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-danger" />
              </button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="self-start"
            onClick={() => setCriteria([...criteria, { name: '', maxPoints: 10 }])}
          >
            <Plus className="h-4 w-4" /> Thêm tiêu chí
          </Button>
        </div>
        <FormDialogFooter
          onCancel={onClose}
          submitLabel={editing ? 'Lưu lại' : 'Thêm mới'}
          onSubmit={submit}
        />
      </DialogContent>
    </Dialog>
  );
}

function ViewRubricDialog({ rubric, onClose }: { rubric: Rubric | null; onClose: () => void }) {
  return (
    <Dialog open={!!rubric} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="tw-scope max-w-lg">
        <DialogHeader>
          <FormDialogTitle icon={Eye}>Chi tiết Rubric</FormDialogTitle>
        </DialogHeader>
        {rubric && (
          <div className="flex flex-col">
            <DetailRow label="Tên rubric">{rubric.title}</DetailRow>
            <DetailRow label="Kiến thức">{rubric.concept}</DetailRow>
            <DetailRow label={`Tiêu chí chấm (${rubric.criteria.length})`}>
              <div className="flex flex-col gap-1">
                {rubric.criteria.map((c, i) => (
                  <span key={i}>
                    • {c.name} — <span className="font-medium">{c.maxPoints} điểm</span>
                    {c.description ? ` (${c.description})` : ''}
                  </span>
                ))}
              </div>
            </DetailRow>
            <DetailRow label="Tổng điểm">{rubric.criteria.reduce((s, c) => s + c.maxPoints, 0)}</DetailRow>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function RubricAdmin() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const [tableKey, setTableKey] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Rubric | null>(null);
  const [viewing, setViewing] = useState<Rubric | null>(null);

  const reload = () => setTableKey((k) => k + 1);

  const columns: ColumnDef<Rubric>[] = [
    { accessorKey: 'title', header: 'Tên rubric', meta: { enableColumnSearch: true } },
    { id: 'criteriaCount', header: 'Số tiêu chí', cell: ({ row }) => row.original.criteria.length },
    {
      id: 'totalPoints',
      header: 'Tổng điểm',
      cell: ({ row }) => row.original.criteria.reduce((sum, c) => sum + c.maxPoints, 0),
    },
    {
      accessorKey: 'status',
      header: 'Trạng thái',
      cell: ({ getValue }) =>
        getValue<string>() === 'active' ? (
          <StatusBadge variant="success">Hoạt động</StatusBadge>
        ) : (
          <StatusBadge variant="neutral">Đã ngừng</StatusBadge>
        ),
    },
    {
      accessorKey: 'source',
      header: 'Nguồn',
      cell: ({ getValue }) => <SourceBadge source={getValue<Rubric['source']>()} />,
    },
  ];

  return (
    <AppShell
      menu={adminMenu}
      title="Rubric chấm tự luận"
      breadcrumb={['Trang chủ', 'Cấu hình bài kiểm tra', 'Rubric']}
      userName={user?.fullName ?? ''}
      roleLabel="Quản trị viên"
      compactHeader
      area="admin"
      onLogout={() => {
        logout();
        navigate(PATHS.login);
      }}
    >
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Rubric chấm tự luận</h1>
        <Button
          type="button"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> Thêm mới
        </Button>
      </div>
      <DataTablePage<Rubric>
        key={tableKey}
        columns={columns}
        getRowId={(r) => r._id}
        searchPlaceholder="Tìm rubric…"
        emptyLabel="Chưa có rubric nào"
        fetcher={async ({ page, pageSize, search }) => {
          const res = await listRubrics({ page, limit: pageSize });
          const filtered = search
            ? res.data.filter((r) => r.title.toLowerCase().includes(search.toLowerCase()))
            : res.data;
          return { data: filtered, total: res.meta?.total ?? filtered.length };
        }}
        toolbarActions={[
          {
            key: 'create',
            label: 'Tạo rubric mới',
            onSelect: () => {
              setEditing(null);
              setFormOpen(true);
            },
          },
          {
            key: 'export',
            label: 'Xuất rubric',
            onSelect: async () => {
              const items = await exportRubrics();
              const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'rubric-cham-tu-luan.json';
              a.click();
              URL.revokeObjectURL(url);
            },
          },
          {
            key: 'import',
            label: 'Nhập rubric (dán JSON)',
            onSelect: async () => {
              const raw = window.prompt(
                'Dán danh sách rubric dạng JSON (mảng object title/concept/criteria...)',
              );
              if (!raw) return;
              try {
                const items = JSON.parse(raw);
                const res = await importRubrics(items);
                toast(`Đã nhập ${res.createdCount} rubric, ${res.errorCount} lỗi`);
                reload();
              } catch {
                toast('JSON không hợp lệ');
              }
            },
          },
        ]}
        rowActions={[
          { key: 'view', label: 'Xem chi tiết', icon: <Eye />, onSelect: (row) => setViewing(row) },
          {
            key: 'edit',
            label: 'Chỉnh sửa',
            icon: <Pencil />,
            onSelect: (row) => {
              setEditing(row);
              setFormOpen(true);
            },
          },
          {
            key: 'archive',
            label: 'Ngừng sử dụng',
            icon: <Ban />,
            danger: true,
            hidden: (row) => row.status === 'archived',
            onSelect: async (row) => {
              await updateRubricStatus(row._id, 'archived');
              toast('Đã ngừng sử dụng rubric');
              reload();
            },
          },
          {
            key: 'restore',
            label: 'Khôi phục',
            icon: <RotateCcw />,
            hidden: (row) => row.status === 'active',
            onSelect: async (row) => {
              await updateRubricStatus(row._id, 'active');
              toast('Đã khôi phục rubric');
              reload();
            },
          },
        ]}
      />

      <RubricFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        editing={editing}
        onSaved={reload}
      />
      <ViewRubricDialog rubric={viewing} onClose={() => setViewing(null)} />
    </AppShell>
  );
}
